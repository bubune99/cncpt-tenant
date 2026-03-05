/**
 * AI Image Generation API
 *
 * POST /api/cms/media/generate
 *
 * Generates images via AI, uploads to Cloudflare R2 (tenant-scoped),
 * creates Media records in the database, and returns the image URLs.
 *
 * Request body:
 *   { prompt: string, style?: ImageStyle, size?: ImageSize, count?: number }
 *
 * Response:
 *   { images: Array<{ id: string, url: string, revisedPrompt?: string }> }
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { stackServerApp } from '@/lib/cms/stack'
import {
  generateImages,
  isImageGenerationAvailable,
  getAvailableImageProviders,
  type ImageStyle,
  type ImageSize,
} from '@/lib/cms/ai/image-generation'
import {
  uploadTenantMedia,
  getStorageConfig,
  getS3Client,
} from '@/lib/cms/r2/client'
import { createMedia } from '@/lib/cms/media'
import { rateLimitCheck } from '@/lib/cms/rate-limit'
import type { RateLimitConfig } from '@/lib/cms/rate-limit'
import { getTenantIdBySubdomain } from '@/lib/cms/media/tenant'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Image generation can take 30-60s

// Rate limit: 10 image generation requests per 5 minutes
const IMAGE_GEN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 300_000, // 5 minutes
  keyPrefix: 'image-gen',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSubdomain(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-subdomain')
}

function sanitizeFilename(prompt: string): string {
  // Create a filename from the first ~40 chars of the prompt
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Rate limit check
    const limited = await rateLimitCheck(request, IMAGE_GEN_RATE_LIMIT)
    if (limited) return limited

    // 3. Check if image generation is available
    if (!isImageGenerationAvailable()) {
      return NextResponse.json(
        {
          error:
            'AI image generation is not configured. Set OPENAI_API_KEY, ' +
            'GOOGLE_GENERATIVE_AI_API_KEY, or deploy on Vercel with AI Gateway enabled.',
        },
        { status: 503 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const {
      prompt,
      style,
      size,
      count = 1,
    }: {
      prompt?: string
      style?: ImageStyle
      size?: ImageSize
      count?: number
    } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt must be 4000 characters or less' },
        { status: 400 }
      )
    }

    const validStyles: ImageStyle[] = [
      'photorealistic',
      'illustration',
      '3d-render',
      'flat-design',
      'watercolor',
      'oil-painting',
      'pixel-art',
      'anime',
      'sketch',
      'cinematic',
    ]
    if (style && !validStyles.includes(style)) {
      return NextResponse.json(
        { error: `Invalid style. Must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      )
    }

    const validSizes: ImageSize[] = ['square', 'landscape', 'portrait']
    if (size && !validSizes.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Must be one of: ${validSizes.join(', ')}` },
        { status: 400 }
      )
    }

    const imageCount = Math.max(1, Math.min(count, 4))

    // 5. Generate images
    const result = await generateImages({
      prompt: prompt.trim(),
      style,
      size,
      count: imageCount,
    })

    // 6. Get tenant subdomain for scoped storage
    const subdomain = await getSubdomain()
    const tenantId = subdomain ? await getTenantIdBySubdomain(subdomain) : null

    // 7. Upload each generated image to storage and create Media records
    const uploadedImages: Array<{
      id: string
      url: string
      revisedPrompt?: string
    }> = []

    for (const generatedImage of result.images) {
      const imageBuffer = Buffer.from(generatedImage.b64Data, 'base64')
      // Derive file extension from mimeType (image/png -> png, image/webp -> webp)
      const ext = generatedImage.mimeType?.split('/')[1] || 'png'
      const mimeType = generatedImage.mimeType || 'image/png'
      const filename = `ai-${sanitizeFilename(prompt)}-${uuidv4().slice(0, 8)}.${ext}`
      const fileSize = imageBuffer.length

      let imageUrl: string
      let storageKey: string
      let storageBucket: string
      let storageProvider: 'R2' | 'S3' | 'LOCAL' = 'LOCAL'

      // Get DB-driven storage config
      const storageConf = await getStorageConfig()

      if (subdomain && storageConf.isConfigured) {
        // Tenant-scoped upload to R2/S3
        const r2Result = await uploadTenantMedia(
          subdomain,
          imageBuffer,
          filename,
          'media/images',
          mimeType
        )

        if (!r2Result) {
          console.error('Failed to upload generated image to storage')
          continue
        }

        imageUrl = r2Result.url
        storageKey = r2Result.key
        storageBucket = storageConf.bucketName
        storageProvider = storageConf.provider === 'r2' ? 'R2' : 'S3'
      } else if (storageConf.isConfigured) {
        // Non-tenant upload (global ai-generated prefix)
        const { PutObjectCommand } = await import('@aws-sdk/client-s3')
        const s3Client = await getS3Client()

        storageKey = `ai-generated/${new Date().toISOString().slice(0, 10)}/${filename}`
        storageBucket = storageConf.bucketName

        const command = new PutObjectCommand({
          Bucket: storageBucket,
          Key: storageKey,
          Body: imageBuffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        })

        await s3Client.send(command)
        imageUrl = `${storageConf.publicUrl}/${storageKey}`
        storageProvider = storageConf.provider === 'r2' ? 'R2' : 'S3'
      } else {
        // Fallback: store locally via the upload system
        const fs = await import('fs/promises')
        const path = await import('path')

        storageKey = `ai-generated/${new Date().toISOString().slice(0, 10)}/${filename}`
        const localDir = path.join(process.cwd(), 'public', 'uploads', 'ai-generated', new Date().toISOString().slice(0, 10))
        await fs.mkdir(localDir, { recursive: true })
        await fs.writeFile(path.join(localDir, filename), imageBuffer)

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        imageUrl = `${baseUrl}/uploads/${storageKey}`
        storageBucket = 'local'
        storageProvider = 'LOCAL'
      }

      // Create Media record in database
      const sizeLabel = size || 'square'
      const dimensions: Record<string, { w: number; h: number }> = {
        square: { w: 1024, h: 1024 },
        landscape: { w: 1792, h: 1024 },
        portrait: { w: 1024, h: 1792 },
      }
      const dim = dimensions[sizeLabel]

      try {
        const media = await createMedia({
          filename,
          originalName: filename,
          mimeType,
          size: fileSize,
          url: imageUrl,
          width: dim.w,
          height: dim.h,
          title: `AI Generated: ${prompt.substring(0, 100)}`,
          alt: prompt.substring(0, 200),
          caption: generatedImage.revisedPrompt || prompt,
          description: `Generated by ${result.provider} (${result.model}). Style: ${style || 'default'}. Original prompt: ${prompt}`,
          provider: storageProvider,
          bucket: storageBucket,
          key: storageKey,
          uploadedById: user.id,
          tenantId: tenantId ?? undefined,
        })

        uploadedImages.push({
          id: media.id,
          url: imageUrl,
          revisedPrompt: generatedImage.revisedPrompt,
        })
      } catch (dbError) {
        // If DB insert fails, image is still in storage - log but don't fail
        console.error('Failed to create Media record:', dbError)
        uploadedImages.push({
          id: `temp-${uuidv4()}`,
          url: imageUrl,
          revisedPrompt: generatedImage.revisedPrompt,
        })
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to process generated images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      provider: result.provider,
      model: result.model,
    })
  } catch (error) {
    console.error('Image generation error:', error)

    // Handle known error types
    if (error instanceof Error) {
      // AI SDK NoImageGeneratedError
      if (error.name === 'AI_NoImageGeneratedError') {
        return NextResponse.json(
          {
            error:
              'The AI provider failed to generate an image. Please try again with a different prompt.',
          },
          { status: 502 }
        )
      }

      // OpenAI content policy errors
      if (error.message.includes('content_policy_violation')) {
        return NextResponse.json(
          {
            error:
              'Your prompt was rejected by the content safety filter. Please try a different prompt.',
          },
          { status: 400 }
        )
      }

      // Rate limit from provider
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return NextResponse.json(
          {
            error:
              'AI provider rate limit reached. Please wait a moment and try again.',
          },
          { status: 429 }
        )
      }

      // Billing / quota errors
      if (
        error.message.includes('billing') ||
        error.message.includes('quota') ||
        error.message.includes('insufficient')
      ) {
        return NextResponse.json(
          {
            error:
              'AI provider billing or quota issue. Please check your API key billing status.',
          },
          { status: 402 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during image generation' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// GET - Check image generation availability
// ---------------------------------------------------------------------------

export async function GET() {
  const available = isImageGenerationAvailable()
  const providers = getAvailableImageProviders()
  const primary = providers[0] ?? null

  return NextResponse.json({
    available,
    provider: primary?.id ?? null,
    model: primary?.modelId ?? null,
    providers,
  })
}
