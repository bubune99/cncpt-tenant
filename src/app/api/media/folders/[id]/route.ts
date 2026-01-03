/**
 * Single Folder API
 *
 * GET /api/media/folders/[id] - Get single folder
 * PUT /api/media/folders/[id] - Update folder
 * DELETE /api/media/folders/[id] - Delete folder
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFolder, updateFolder, deleteFolder, reorderFolders } from '@/lib/media/folders'
import type { FolderUpdateInput } from '@/lib/media/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const folder = await getFolder(id)

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Get folder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get folder' },
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

    // Handle reorder action
    if (body.action === 'reorder') {
      await reorderFolders(id, body.position, body.parentId ?? null)
      return NextResponse.json({ success: true })
    }

    // Regular update
    const input: FolderUpdateInput = {}

    if (body.name !== undefined) input.name = body.name
    if (body.slug !== undefined) input.slug = body.slug
    if (body.description !== undefined) input.description = body.description
    if (body.color !== undefined) input.color = body.color
    if (body.icon !== undefined) input.icon = body.icon
    if (body.parentId !== undefined) input.parentId = body.parentId
    if (body.isPublic !== undefined) input.isPublic = body.isPublic

    const folder = await updateFolder(id, input)

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Update folder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update folder' },
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

    const moveMediaTo = searchParams.get('moveMediaTo')
    const deleteChildren = searchParams.get('deleteChildren') === 'true'

    await deleteFolder(id, {
      moveMediaTo: moveMediaTo === 'null' ? null : moveMediaTo ?? undefined,
      deleteChildren,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete folder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
