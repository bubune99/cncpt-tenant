/**
 * Blog Post Detail API
 *
 * GET /api/blog/posts/[id] - Get post details (tenant-scoped)
 * PUT /api/blog/posts/[id] - Update post (tenant-scoped)
 * DELETE /api/blog/posts/[id] - Delete post (tenant-scoped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePost, deletePost } from '@/lib/cms/blog'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant(request, async (tenant) => {
    try {
      const { id } = await params
      const post = await getPost(id, tenant.tenantId)

      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(post)
    } catch (error) {
      console.error('Get post error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get post' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await params
      const body = await request.json()

      const existing = await getPost(id, tenant.tenantId)

      if (!existing) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      const post = await updatePost(id, body)
      return NextResponse.json(post)
    } catch (error) {
      console.error('Update post error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update post' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await params

      const existing = await getPost(id, tenant.tenantId)

      if (!existing) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      await deletePost(id)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete post error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete post' },
        { status: 500 }
      )
    }
  })
}
