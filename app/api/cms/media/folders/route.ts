/**
 * Media Folders API
 *
 * GET /api/cms/media/folders - List folders (tree or flat, tenant-scoped)
 * POST /api/cms/media/folders - Create new folder (tenant-scoped)
 *
 * All endpoints require authentication and tenant context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listFolders, getFolderTree, createFolder } from '@/lib/cms/media/folders'
import type { FolderCreateInput } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import {
  resolveTenantContext,
  tenantRequiredResponse,
} from '@/lib/cms/media/tenant'

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

    // Resolve tenant context
    const tenant = await resolveTenantContext(request, user.id)
    if (!tenant) return tenantRequiredResponse()

    const { searchParams } = new URL(request.url)
    const tree = searchParams.get('tree') === 'true'
    const parentId = searchParams.get('parentId')

    if (tree) {
      const folderTree = await getFolderTree(tenant.tenantId)
      return NextResponse.json(folderTree)
    }

    // Handle "null" for root level
    const normalizedParentId =
      parentId === 'null' ? null : parentId === undefined ? undefined : parentId

    const folders = await listFolders(normalizedParentId, tenant.tenantId)

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

    const body = await request.json()

    const input: FolderCreateInput = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      color: body.color,
      icon: body.icon,
      parentId: body.parentId || null,
      isPublic: body.isPublic ?? true,
      tenantId: tenant.tenantId,
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
