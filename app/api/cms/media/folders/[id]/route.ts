/**
 * Single Folder API
 *
 * GET /api/cms/media/folders/[id] - Get single folder
 * PUT /api/cms/media/folders/[id] - Update folder
 * DELETE /api/cms/media/folders/[id] - Delete folder
 *
 * All endpoints require authentication and tenant context.
 * Folder ownership is verified before any operation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFolder, updateFolder, deleteFolder, reorderFolders } from '@/lib/cms/media/folders'
import type { FolderUpdateInput } from '@/lib/cms/media/types'
import { stackServerApp } from '@/lib/cms/stack'
import {
  resolveTenantContext,
  tenantRequiredResponse,
} from '@/lib/cms/media/tenant'

export const dynamic = 'force-dynamic'

/**
 * Verify that a folder record belongs to the given tenant.
 */
function verifyFolderTenant(folder: any, tenantId: number): boolean {
  return folder.tenantId === tenantId
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
    const folder = await getFolder(id)

    if (!folder || !verifyFolderTenant(folder, tenant.tenantId)) {
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

    // Verify folder belongs to this tenant
    const existing = await getFolder(id)
    if (!existing || !verifyFolderTenant(existing, tenant.tenantId)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

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

    // Verify folder belongs to this tenant
    const existing = await getFolder(id)
    if (!existing || !verifyFolderTenant(existing, tenant.tenantId)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

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
