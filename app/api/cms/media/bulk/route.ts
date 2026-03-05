/**
 * Bulk Operations API
 *
 * POST /api/cms/media/bulk - Execute bulk operations on media
 *
 * Requires authentication and tenant context. All operations are tenant-scoped.
 * Rate-limited for destructive operations.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  bulkDeleteMedia,
  bulkMoveMedia,
  bulkTagMedia,
  bulkUntagMedia,
  bulkRestoreMedia,
} from '@/lib/cms/media'
import type { BulkOperationInput } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit'
import {
  resolveTenantContext,
  tenantRequiredResponse,
} from '@/lib/cms/media/tenant'

export const dynamic = 'force-dynamic'

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

    // Resolve tenant context
    const tenant = await resolveTenantContext(request, user.id)
    if (!tenant) return tenantRequiredResponse()

    // Rate limit bulk operations (same as upload limit)
    const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.upload)
    if (limited) return limited

    const body = await request.json()
    const { operation, mediaIds, folderId, tagIds, hard } = body as BulkOperationInput & {
      hard?: boolean
    }

    if (!operation) {
      return NextResponse.json({ error: 'Operation is required' }, { status: 400 })
    }

    if (!mediaIds || mediaIds.length === 0) {
      return NextResponse.json({ error: 'Media IDs are required' }, { status: 400 })
    }

    let count: number

    switch (operation) {
      case 'delete':
        // Tenant-scoped: only deletes media belonging to this tenant
        count = await bulkDeleteMedia(mediaIds, hard ?? false, tenant.tenantId)
        break

      case 'move':
        if (folderId === undefined) {
          return NextResponse.json(
            { error: 'Folder ID is required for move operation' },
            { status: 400 }
          )
        }
        // Tenant-scoped: only moves media belonging to this tenant
        count = await bulkMoveMedia(mediaIds, folderId, tenant.tenantId)
        break

      case 'tag':
        if (!tagIds || tagIds.length === 0) {
          return NextResponse.json(
            { error: 'Tag IDs are required for tag operation' },
            { status: 400 }
          )
        }
        count = await bulkTagMedia(mediaIds, tagIds)
        break

      case 'untag':
        if (!tagIds || tagIds.length === 0) {
          return NextResponse.json(
            { error: 'Tag IDs are required for untag operation' },
            { status: 400 }
          )
        }
        count = await bulkUntagMedia(mediaIds, tagIds)
        break

      case 'restore':
        // Tenant-scoped: only restores media belonging to this tenant
        count = await bulkRestoreMedia(mediaIds, tenant.tenantId)
        break

      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 })
    }

    return NextResponse.json({
      operation,
      success: count,
      failed: mediaIds.length - count,
      total: mediaIds.length,
    })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute bulk operation' },
      { status: 500 }
    )
  }
}
