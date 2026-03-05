/**
 * Multipart Upload API
 *
 * POST /api/cms/media/multipart
 *
 * Action-based routing for chunked/multipart uploads of large files (100MB+ videos).
 *
 * Actions:
 * - initiate   -- Start a multipart upload, returns { uploadId, key }
 * - presign-part -- Generate presigned URL for a single chunk
 * - complete   -- Finalize the upload, assemble parts, create Media record
 * - abort      -- Cancel and clean up a failed upload
 *
 * Authentication: Stack Auth (required)
 * Rate limiting: Upstash Redis sliding window
 * Tenant isolation: all keys scoped to tenants/{subdomain}/
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { rateLimitCheck } from '@/lib/cms/rate-limit'
import { buildTenantPath, getStorageConfig, parseTenantPath } from '@/lib/cms/r2/client'
import type { MediaCategory } from '@/lib/cms/r2/client'
import {
  initiateMultipartUpload,
  generatePartPresignedUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  DEFAULT_CHUNK_SIZE,
} from '@/lib/cms/r2/multipart'
import type { CompletedPart } from '@/lib/cms/r2/multipart'
import { createMedia } from '@/lib/cms/media'
import { DEFAULT_ALLOWED_TYPES, isAllowedFileType } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import { sql } from '@/lib/neon'
import { getTenantIdBySubdomain } from '@/lib/cms/media/tenant'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// File size limits (in bytes)
// ---------------------------------------------------------------------------

/** Max file size for images: 50MB */
const MAX_IMAGE_SIZE = 50 * 1024 * 1024

/** Max file size for video: 2GB */
const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024

/** Max file size for audio: 500MB */
const MAX_AUDIO_SIZE = 500 * 1024 * 1024

/** Max file size for documents and other: 500MB */
const MAX_OTHER_SIZE = 500 * 1024 * 1024

/**
 * Get the maximum allowed file size based on MIME type
 */
function getMaxFileSize(mimeType: string): number {
  if (mimeType.startsWith('image/')) return MAX_IMAGE_SIZE
  if (mimeType.startsWith('video/')) return MAX_VIDEO_SIZE
  if (mimeType.startsWith('audio/')) return MAX_AUDIO_SIZE
  return MAX_OTHER_SIZE
}

// ---------------------------------------------------------------------------
// Rate limit config: 30 requests per 60 seconds for multipart operations
// ---------------------------------------------------------------------------

const MULTIPART_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60_000,
  keyPrefix: 'multipart-upload',
}

// ---------------------------------------------------------------------------
// Auth helper: get subdomain from headers (same pattern as admin media route)
// ---------------------------------------------------------------------------

// SECURITY: Only reads from x-subdomain header, not query params,
// to prevent cross-tenant access via ?subdomain= spoofing.
async function getSubdomain(_req: NextRequest): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-subdomain')
}

/**
 * Validate that the authenticated user owns the given subdomain.
 */
async function validateTenantOwnership(
  userId: string,
  subdomain: string
): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM subdomains
      WHERE subdomain = ${subdomain} AND user_id = ${userId}
      LIMIT 1
    `
    return result.length > 0
  } catch (error) {
    console.error('Tenant ownership validation error:', error)
    return false
  }
}

// ---------------------------------------------------------------------------
// Determine media category from MIME type
// ---------------------------------------------------------------------------

function getCategoryFromMimeType(mimeType: string): MediaCategory {
  if (mimeType.startsWith('video/')) return 'media/videos'
  if (mimeType.startsWith('image/')) return 'media/images'
  if (mimeType.startsWith('audio/')) return 'media/documents'
  return 'media/documents'
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate limit check
    const limited = await rateLimitCheck(request, MULTIPART_RATE_LIMIT)
    if (limited) return limited

    // Check storage configuration (DB-driven with env var fallback)
    const storageConfig = await getStorageConfig()
    if (!storageConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Storage is not configured. Configure via Admin > Settings > Storage or set env vars.' },
        { status: 503 }
      )
    }

    // Require subdomain for tenant scoping
    const subdomain = await getSubdomain(request)
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain required for tenant-scoped uploads' },
        { status: 400 }
      )
    }

    // Validate tenant ownership -- prevent cross-tenant uploads
    const ownsSubdomain = await validateTenantOwnership(user.id, subdomain)
    if (!ownsSubdomain) {
      return NextResponse.json(
        { error: 'Access denied: you do not own this subdomain' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Resolve numeric tenantId for DB record creation
    const tenantId = await getTenantIdBySubdomain(subdomain)

    switch (action) {
      case 'initiate':
        return handleInitiate(subdomain, body)

      case 'presign-part':
        return handlePresignPart(subdomain, body)

      case 'complete':
        return handleComplete(subdomain, body, user.id, tenantId ?? undefined)

      case 'abort':
        return handleAbort(subdomain, body)

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: initiate, presign-part, complete, abort` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Multipart upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Multipart upload failed' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Action: initiate
// ---------------------------------------------------------------------------

async function handleInitiate(
  subdomain: string,
  body: { filename?: string; mimeType?: string; size?: number }
) {
  const { filename, mimeType, size } = body

  if (!filename || !mimeType || !size) {
    return NextResponse.json(
      { error: 'Missing required fields: filename, mimeType, size' },
      { status: 400 }
    )
  }

  // Validate file type
  if (!isAllowedFileType(mimeType, DEFAULT_ALLOWED_TYPES)) {
    return NextResponse.json(
      { error: `File type ${mimeType} is not allowed` },
      { status: 400 }
    )
  }

  // Validate file size (type-specific limits)
  const maxSize = getMaxFileSize(mimeType)
  if (size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    return NextResponse.json(
      { error: `File size exceeds maximum of ${maxMB}MB for ${mimeType.split('/')[0]} files` },
      { status: 400 }
    )
  }

  // Build tenant-scoped key
  const category = getCategoryFromMimeType(mimeType)
  const key = buildTenantPath(subdomain, category, filename)

  // Calculate chunk info for the client
  const chunkSize = DEFAULT_CHUNK_SIZE
  const totalParts = Math.ceil(size / chunkSize)

  // Initiate the multipart upload
  const result = await initiateMultipartUpload(key, mimeType)

  // Resolve public URL from DB-driven config
  const config = await getStorageConfig()

  return NextResponse.json({
    uploadId: result.uploadId,
    key: result.key,
    bucket: result.bucket,
    chunkSize,
    totalParts,
    publicUrl: `${config.publicUrl}/${key}`,
  })
}

// ---------------------------------------------------------------------------
// Action: presign-part
// ---------------------------------------------------------------------------

async function handlePresignPart(
  subdomain: string,
  body: { uploadId?: string; key?: string; partNumber?: number }
) {
  const { uploadId, key, partNumber } = body

  if (!uploadId || !key || !partNumber) {
    return NextResponse.json(
      { error: 'Missing required fields: uploadId, key, partNumber' },
      { status: 400 }
    )
  }

  // Verify key belongs to this tenant
  const parsed = parseTenantPath(key)
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!parsed || parsed.subdomain !== sanitizedSubdomain) {
    return NextResponse.json(
      { error: 'Access denied: key does not belong to this tenant' },
      { status: 403 }
    )
  }

  if (typeof partNumber !== 'number' || partNumber < 1) {
    return NextResponse.json(
      { error: 'partNumber must be a positive integer' },
      { status: 400 }
    )
  }

  const result = await generatePartPresignedUrl(key, uploadId, partNumber)

  return NextResponse.json({
    url: result.url,
    partNumber: result.partNumber,
  })
}

// ---------------------------------------------------------------------------
// Action: complete
// ---------------------------------------------------------------------------

async function handleComplete(
  subdomain: string,
  body: {
    uploadId?: string
    key?: string
    parts?: CompletedPart[]
    filename?: string
    mimeType?: string
    size?: number
    folderId?: string
    alt?: string
    caption?: string
    title?: string
    tagIds?: string[]
  },
  authenticatedUserId: string,
  tenantId?: number
) {
  const { uploadId, key, parts, filename, mimeType, size } = body

  if (!uploadId || !key || !parts || !Array.isArray(parts)) {
    return NextResponse.json(
      { error: 'Missing required fields: uploadId, key, parts' },
      { status: 400 }
    )
  }

  // Verify key belongs to this tenant
  const parsed = parseTenantPath(key)
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!parsed || parsed.subdomain !== sanitizedSubdomain) {
    return NextResponse.json(
      { error: 'Access denied: key does not belong to this tenant' },
      { status: 403 }
    )
  }

  // Validate parts array
  if (parts.length === 0) {
    return NextResponse.json(
      { error: 'At least one part is required' },
      { status: 400 }
    )
  }

  for (const part of parts) {
    if (!part.partNumber || !part.etag) {
      return NextResponse.json(
        { error: 'Each part must have partNumber and etag' },
        { status: 400 }
      )
    }
  }

  // Complete the multipart upload in S3/R2
  const result = await completeMultipartUpload(key, uploadId, parts)

  // Create Media database record if we have file metadata
  let media = null
  if (filename && mimeType && size) {
    try {
      media = await createMedia({
        filename: key.split('/').pop() || filename,
        originalName: filename,
        mimeType,
        size,
        url: result.url,
        key: result.key,
        bucket: result.bucket,
        provider: 'R2',
        folderId: body.folderId,
        alt: body.alt,
        caption: body.caption,
        title: body.title || filename,
        tagIds: body.tagIds,
        uploadedById: authenticatedUserId,
        tenantId,
      })
    } catch (mediaError) {
      // Log but don't fail -- the file is already uploaded to storage
      console.error('Failed to create media record after multipart upload:', mediaError)
    }
  }

  return NextResponse.json({
    success: true,
    url: result.url,
    key: result.key,
    bucket: result.bucket,
    media,
  })
}

// ---------------------------------------------------------------------------
// Action: abort
// ---------------------------------------------------------------------------

async function handleAbort(
  subdomain: string,
  body: { uploadId?: string; key?: string }
) {
  const { uploadId, key } = body

  if (!uploadId || !key) {
    return NextResponse.json(
      { error: 'Missing required fields: uploadId, key' },
      { status: 400 }
    )
  }

  // Verify key belongs to this tenant
  const parsed = parseTenantPath(key)
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!parsed || parsed.subdomain !== sanitizedSubdomain) {
    return NextResponse.json(
      { error: 'Access denied: key does not belong to this tenant' },
      { status: 403 }
    )
  }

  await abortMultipartUpload(key, uploadId)

  return NextResponse.json({
    success: true,
    message: 'Multipart upload aborted and parts cleaned up',
  })
}
