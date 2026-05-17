/**
 * Blog Post Series API — Atlas Redesign G03
 *
 * GET    /api/cms/blog/posts/[id]/series   — get series this post belongs to
 * POST   /api/cms/blog/posts/[id]/series   — add post to a series
 * DELETE /api/cms/blog/posts/[id]/series   — remove post from a series
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

      const memberships = await prisma.blogPostSeries.findMany({
        where: { postId },
        include: { series: { select: { id: true, title: true, slug: true, postCount: true } } },
        orderBy: { position: 'asc' },
      })

      return NextResponse.json({ success: true, data: memberships })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get series' },
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
      const { seriesId, position } = z.object({ seriesId: z.string(), position: z.number().int().optional() }).parse(body)

      let pos = position
      if (pos === undefined) {
        const last = await prisma.blogPostSeries.findFirst({ where: { seriesId }, orderBy: { position: 'desc' }, select: { position: true } })
        pos = (last?.position ?? -1) + 1
      }

      const record = await prisma.blogPostSeries.upsert({
        where: { postId_seriesId: { postId, seriesId } },
        create: { postId, seriesId, position: pos },
        update: { position: pos },
      })

      // Update postCount
      await prisma.blogSeries.update({ where: { id: seriesId }, data: { postCount: { increment: 1 } } })

      return NextResponse.json({ success: true, data: record }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to add to series' },
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
      const { seriesId } = z.object({ seriesId: z.string() }).parse(body)

      await prisma.blogPostSeries.delete({ where: { postId_seriesId: { postId, seriesId } } })
      await prisma.blogSeries.update({ where: { id: seriesId }, data: { postCount: { decrement: 1 } } })

      return NextResponse.json({ success: true, data: { deleted: true } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to remove from series' },
        { status: 500 }
      )
    }
  })
}
