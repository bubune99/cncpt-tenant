/**
 * Single Media API
 *
 * GET /api/cms/media/[id] - Get single media with details
 * PUT /api/cms/media/[id] - Update media metadata
 * DELETE /api/cms/media/[id] - Delete media (soft or hard)
 *
 * All endpoints require authentication and tenant context.
 * Tenant ownership is verified before any operation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMedia, updateMedia, deleteMedia, restoreMedia } from '@/lib/cms/media'
import { deleteFromStorage } from '@/lib/cms/media/upload'
import type { MediaUpdateInput } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import {
  resolveTenantContext,
  tenantRequiredResponse,
} from '@/lib/cms/media/tenant'

export const dynamic = 'force-dynamic'

/**
 * Verify that a media record belongs to the given tenant.
 */
function verifyMediaTenant(media: any, tenantId: number): boolean {
  return media.tenantId === tenantId
}

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

    // Resolve tenant context
    const tenant = await resolveTenantContext(request, user.id)
    if (!tenant) return tenantRequiredResponse()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeUsage = searchParams.get('includeUsage') === 'true'

    const media = await getMedia(id, includeUsage)

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Verify tenant ownership of the media record
    if (!verifyMediaTenant(media, tenant.tenantId)) {
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
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Resolve tenant context
    const tenant = await resolveTenantContext(request, user.id)
    if (!tenant) return tenantRequiredResponse()

    const { id } = await params

    // Verify the media belongs to this tenant before updating
    const existing = await getMedia(id, false)
    if (!existing || !verifyMediaTenant(existing, tenant.tenantId)) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

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
    // Auth check
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Resolve tenant context
    const tenant = await resolveTenantContext(request, user.id)
    if (!tenant) return tenantRequiredResponse()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    // Get media first for storage deletion and tenant verification
    const media = await getMedia(id)

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Verify tenant ownership
    if (!verifyMediaTenant(media, tenant.tenantId)) {
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
