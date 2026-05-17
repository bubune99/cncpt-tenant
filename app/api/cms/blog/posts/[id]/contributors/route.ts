/**
 * Blog Post Contributors API — Atlas Redesign G03 (G20)
 *
 * GET    /api/cms/blog/posts/[id]/contributors
 * POST   /api/cms/blog/posts/[id]/contributors  — add contributor
 * DELETE /api/cms/blog/posts/[id]/contributors  — remove contributor (userId in body)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const addContributorSchema = z.object({
  userId: z.string(),
  role: z.enum(['author', 'editor', 'photographer']).default('author'),
  position: z.number().int().optional(),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  return withTenant(_request, async () => {
    try {
      const { id: postId } = await context.params

      const contributors = await prisma.blogContributor.findMany({
        where: { postId },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { position: 'asc' },
      })

      return NextResponse.json({ success: true, data: contributors })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list contributors' },
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

      const parsed = addContributorSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const { userId, role, position } = parsed.data

      let pos = position
      if (pos === undefined) {
        const last = await prisma.blogContributor.findFirst({
          where: { postId },
          orderBy: { position: 'desc' },
          select: { position: true },
        })
        pos = (last?.position ?? -1) + 1
      }

      const record = await prisma.blogContributor.upsert({
        where: { postId_userId: { postId, userId } },
        create: { postId, userId, role, position: pos },
        update: { role, position: pos },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      return NextResponse.json({ success: true, data: record }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to add contributor' },
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

      const { userId } = z.object({ userId: z.string() }).parse(body)

      await prisma.blogContributor.delete({ where: { postId_userId: { postId, userId } } })

      return NextResponse.json({ success: true, data: { deleted: true, postId, userId } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to remove contributor' },
        { status: 500 }
      )
    }
  })
}
