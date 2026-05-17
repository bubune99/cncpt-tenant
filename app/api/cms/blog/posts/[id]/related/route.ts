/**
 * Blog Post Related API — Atlas Redesign G03 (G17)
 *
 * GET    /api/cms/blog/posts/[id]/related
 * POST   /api/cms/blog/posts/[id]/related  — add related post
 * DELETE /api/cms/blog/posts/[id]/related  — remove related post
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  return withTenant(_request, async () => {
    try {
      const { id: postId } = await context.params

      const related = await prisma.blogPostRelated.findMany({
        where: { postId },
        include: { relatedPost: { select: { id: true, title: true, slug: true, status: true } } },
        orderBy: { position: 'asc' },
      })

      return NextResponse.json({ success: true, data: related })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list related posts' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { id: postId } = await context.params
      const body: unknown = await request.json()
      const { relatedPostId, position } = z.object({ relatedPostId: z.string(), position: z.number().int().optional() }).parse(body)

      let pos = position
      if (pos === undefined) {
        const last = await prisma.blogPostRelated.findFirst({ where: { postId }, orderBy: { position: 'desc' }, select: { position: true } })
        pos = (last?.position ?? -1) + 1
      }

      const record = await prisma.blogPostRelated.upsert({
        where: { postId_relatedPostId: { postId, relatedPostId } },
        create: { postId, relatedPostId, position: pos },
        update: { position: pos },
      })

      return NextResponse.json({ success: true, data: record }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to add related post' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async () => {
    try {
      const { id: postId } = await context.params
      const body: unknown = await request.json()
      const { relatedPostId } = z.object({ relatedPostId: z.string() }).parse(body)

      await prisma.blogPostRelated.delete({ where: { postId_relatedPostId: { postId, relatedPostId } } })

      return NextResponse.json({ success: true, data: { deleted: true } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to remove related post' },
        { status: 500 }
      )
    }
  })
}
