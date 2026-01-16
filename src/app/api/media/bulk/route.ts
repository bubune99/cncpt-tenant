/**
 * Bulk Operations API
 *
 * POST /api/media/bulk - Execute bulk operations on media
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  bulkDeleteMedia,
  bulkMoveMedia,
  bulkTagMedia,
  bulkUntagMedia,
  bulkRestoreMedia,
} from '../../../../lib/media'
import type { BulkOperationInput } from '../../../../lib/media/types'

export async function POST(request: NextRequest) {
  try {
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
        count = await bulkDeleteMedia(mediaIds, hard ?? false)
        break

      case 'move':
        if (folderId === undefined) {
          return NextResponse.json(
            { error: 'Folder ID is required for move operation' },
            { status: 400 }
          )
        }
        count = await bulkMoveMedia(mediaIds, folderId)
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
        count = await bulkRestoreMedia(mediaIds)
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
