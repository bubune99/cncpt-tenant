/**
 * Media API
 *
 * GET /api/media - List media with filters
 * POST /api/media - Upload new media
 *
 * All endpoints require authentication. Upload endpoints are rate-limited.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listMedia, createMedia, getMediaStats } from '@/lib/cms/media'
import { processUpload, generatePresignedUrl, validateFile } from '@/lib/cms/media/upload'
import type { MediaFilters, MediaType } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: MediaFilters = {
      folderId: searchParams.get('folderId') || undefined,
      type: (searchParams.get('type') as MediaType) || undefined,
      search: searchParams.get('search') || undefined,
      tagIds: searchParams.get('tagIds')?.split(',').filter(Boolean) || undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      sortBy: (searchParams.get('sortBy') as MediaFilters['sortBy']) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as MediaFilters['sortOrder']) || 'desc',
    }

    // Handle special "recent" filter
    if (searchParams.get('recent') === 'true') {
      filters.sortBy = 'createdAt'
      filters.sortOrder = 'desc'
    }

    // Handle "null" folderId for root level
    if (searchParams.get('folderId') === 'null') {
      filters.folderId = null
    }

    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getMediaStats()
      return NextResponse.json(stats)
    }

    const result = await listMedia(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('List media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list media' },
      { status: 500 }
    )
  }
}

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

    const contentType = request.headers.get('content-type') || ''

    // Handle presigned URL request
    if (contentType.includes('application/json')) {
      const body = await request.json()

      if (body.action === 'presign') {
        // Rate limit presign requests
        const presignLimited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.presign)
        if (presignLimited) return presignLimited

        const { filename, mimeType, size } = body

        if (!filename || !mimeType || !size) {
          return NextResponse.json(
            { error: 'Missing required fields: filename, mimeType, size' },
            { status: 400 }
          )
        }

        // Validate file
        const validation = validateFile({ name: filename, type: mimeType, size })
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        const presignedData = await generatePresignedUrl(filename, mimeType, size)

        return NextResponse.json(presignedData)
      }

      // Handle direct metadata creation (after upload to storage)
      if (body.action === 'complete') {
        // Rate limit upload completion requests
        const uploadLimited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.upload)
        if (uploadLimited) return uploadLimited

        const {
          filename,
          originalName,
          mimeType,
          size,
          url,
          key,
          bucket,
          provider,
          width,
          height,
          folderId,
          alt,
          caption,
          title,
          tagIds,
        } = body

        const media = await createMedia({
          filename,
          originalName,
          mimeType,
          size,
          url,
          key,
          bucket,
          provider,
          width,
          height,
          folderId,
          alt,
          caption,
          title,
          tagIds,
          uploadedById: user.id,
        })

        return NextResponse.json(media, { status: 201 })
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Handle multipart form data upload (for local storage or small files)
    if (contentType.includes('multipart/form-data')) {
      // Rate limit upload requests
      const uploadLimited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.upload)
      if (uploadLimited) return uploadLimited

      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Validate file
      const validation = validateFile({
        name: file.name,
        type: file.type,
        size: file.size,
      })

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      // Get optional metadata from form
      const folderId = formData.get('folderId') as string | null
      const alt = formData.get('alt') as string | null
      const caption = formData.get('caption') as string | null
      const title = formData.get('title') as string | null
      const tagIds = (formData.get('tagIds') as string)?.split(',').filter(Boolean)

      // Generate presigned URL and upload
      const presignedData = await generatePresignedUrl(file.name, file.type, file.size)

      // Upload file to storage
      const arrayBuffer = await file.arrayBuffer()
      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage')
      }

      // Create media record — use authenticated user ID, not client-supplied value
      const media = await processUpload(
        presignedData.key.split('/').pop()!,
        file.name,
        file.type,
        file.size,
        presignedData.publicUrl,
        presignedData.key,
        presignedData.bucket,
        presignedData.provider,
        {
          folderId: folderId || undefined,
          alt: alt || undefined,
          caption: caption || undefined,
          title: title || undefined,
          tagIds,
        },
        user.id
      )

      return NextResponse.json(media, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  } catch (error) {
    console.error('Upload media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media' },
      { status: 500 }
    )
  }
}
