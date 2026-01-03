/**
 * Media Folders API
 *
 * GET /api/media/folders - List folders (tree or flat)
 * POST /api/media/folders - Create new folder
 */

import { NextRequest, NextResponse } from 'next/server'
import { listFolders, getFolderTree, createFolder } from '@/lib/media/folders'
import type { FolderCreateInput } from '@/lib/media/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tree = searchParams.get('tree') === 'true'
    const parentId = searchParams.get('parentId')

    if (tree) {
      const folderTree = await getFolderTree()
      return NextResponse.json(folderTree)
    }

    // Handle "null" for root level
    const normalizedParentId =
      parentId === 'null' ? null : parentId === undefined ? undefined : parentId

    const folders = await listFolders(normalizedParentId)

    return NextResponse.json(folders)
  } catch (error) {
    console.error('List folders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const input: FolderCreateInput = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      color: body.color,
      icon: body.icon,
      parentId: body.parentId || null,
      isPublic: body.isPublic ?? true,
    }

    if (!input.name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const folder = await createFolder(input)

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create folder' },
      { status: 500 }
    )
  }
}
