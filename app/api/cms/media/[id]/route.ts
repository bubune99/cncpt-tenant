/**
 * Single Media API
 *
 * GET /api/media/[id] - Get single media with details
 * PUT /api/media/[id] - Update media metadata
 * DELETE /api/media/[id] - Delete media (soft or hard)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMedia, updateMedia, deleteMedia, restoreMedia } from '@/lib/cms/media'
import { deleteFromStorage } from '@/lib/cms/media/upload'
import type { MediaUpdateInput } from '@/lib/cms/media/types'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeUsage = searchParams.get('includeUsage') === 'true'

    const media = await getMedia(id, includeUsage)

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error('Get media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get media' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if this is a restore operation
    if (body.action === 'restore') {
      const media = await restoreMedia(id)
      return NextResponse.json(media)
    }

    // Regular update
    const input: MediaUpdateInput = {}

    if (body.filename !== undefined) input.filename = body.filename
    if (body.title !== undefined) input.title = body.title
    if (body.alt !== undefined) input.alt = body.alt
    if (body.caption !== undefined) input.caption = body.caption
    if (body.description !== undefined) input.description = body.description
    if (body.folderId !== undefined) input.folderId = body.folderId
    if (body.tagIds !== undefined) input.tagIds = body.tagIds

    const media = await updateMedia(id, input)

    return NextResponse.json(media)
  } catch (error) {
    console.error('Update media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update media' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    // Get media first for storage deletion
    const media = await getMedia(id)

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    if (hard) {
      // Hard delete: remove from storage and database
      if (media.key && media.bucket && media.provider) {
        await deleteFromStorage(media.key, media.bucket, media.provider)
      }
      await deleteMedia(id, true)
    } else {
      // Soft delete
      await deleteMedia(id, false)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete media' },
      { status: 500 }
    )
  }
}
