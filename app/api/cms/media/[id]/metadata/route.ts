/**
 * Video Metadata API
 *
 * PATCH /api/cms/media/[id]/metadata
 *   Update a media record with video metadata extracted by the client.
 *   Called after the client extracts duration, dimensions, and optionally
 *   uploads a thumbnail to R2.
 *
 * GET /api/cms/media/[id]/metadata
 *   Get the video metadata for a media record.
 *
 * All endpoints require authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { isVideoMimeType } from '@/lib/cms/media/video-utils'
import { stackServerApp } from '@/lib/cms/stack'

export const dynamic = 'force-dynamic'

// Type augmentation for Prisma client
type PrismaWithMedia = typeof prisma & {
  media: {
    findUnique: (args: any) => Promise<any | null>
    update: (args: any) => Promise<any>
  }
}

const db = prisma as PrismaWithMedia

// =============================================================================
// GET -- Retrieve video metadata for a media record
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    const media = await db.media.findUnique({
      where: { id },
      select: {
        id: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        thumbnailUrl: true,
        metadata: true,
      },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    if (!isVideoMimeType(media.mimeType)) {
      return NextResponse.json(
        { error: 'Media is not a video file' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: media.id,
      width: media.width,
      height: media.height,
      duration: media.duration,
      thumbnailUrl: media.thumbnailUrl,
      metadata: media.metadata,
    })
  } catch (error) {
    console.error('Get video metadata error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get video metadata' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH -- Update media record with video metadata
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate the media record exists
    const media = await db.media.findUnique({
      where: { id },
      select: {
        id: true,
        mimeType: true,
        tenantId: true,
      },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Verify this is a video file
    if (!isVideoMimeType(media.mimeType)) {
      return NextResponse.json(
        { error: 'Media is not a video file. Video metadata can only be set on video files.' },
        { status: 400 }
      )
    }

    // Build update data from the request body
    const updateData: Record<string, any> = {}

    // Duration in seconds (stored as Int -- rounded to nearest second)
    if (body.duration !== undefined && body.duration !== null) {
      const duration = Number(body.duration)
      if (isNaN(duration) || duration < 0) {
        return NextResponse.json(
          { error: 'Invalid duration: must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.duration = Math.round(duration)
    }

    // Video dimensions -- reuse existing width/height fields
    if (body.width !== undefined && body.width !== null) {
      const width = Number(body.width)
      if (isNaN(width) || width <= 0) {
        return NextResponse.json(
          { error: 'Invalid width: must be a positive number' },
          { status: 400 }
        )
      }
      updateData.width = Math.round(width)
    }

    if (body.height !== undefined && body.height !== null) {
      const height = Number(body.height)
      if (isNaN(height) || height <= 0) {
        return NextResponse.json(
          { error: 'Invalid height: must be a positive number' },
          { status: 400 }
        )
      }
      updateData.height = Math.round(height)
    }

    // Thumbnail URL -- URL of the thumbnail stored in R2
    if (body.thumbnailUrl !== undefined) {
      if (body.thumbnailUrl !== null && typeof body.thumbnailUrl !== 'string') {
        return NextResponse.json(
          { error: 'Invalid thumbnailUrl: must be a string or null' },
          { status: 400 }
        )
      }
      updateData.thumbnailUrl = body.thumbnailUrl
    }

    // Extended metadata as JSON (codec, bitrate, format, etc.)
    if (body.metadata !== undefined) {
      if (body.metadata !== null && typeof body.metadata !== 'object') {
        return NextResponse.json(
          { error: 'Invalid metadata: must be an object or null' },
          { status: 400 }
        )
      }
      updateData.metadata = body.metadata
    }

    // Ensure there is something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Provide at least one of: duration, width, height, thumbnailUrl, metadata' },
        { status: 400 }
      )
    }

    // Perform the update
    const updated = await db.media.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        url: true,
        width: true,
        height: true,
        duration: true,
        thumbnailUrl: true,
        metadata: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update video metadata error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update video metadata' },
      { status: 500 }
    )
  }
}
