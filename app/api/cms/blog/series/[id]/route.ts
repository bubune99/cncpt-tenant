/**
 * Blog Series [id] API — Atlas Redesign G03
 *
 * GET    /api/cms/blog/series/[id]
 * PUT    /api/cms/blog/series/[id]
 * DELETE /api/cms/blog/series/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const updateSeriesSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  coverImageId: z.string().optional(),
  position: z.number().int().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id } = await context.params

      const series = await prisma.blogSeries.findFirst({
        where: { id, tenantId: tenant.tenantId },
        include: {
          posts: {
            include: { post: { select: { id: true, title: true, slug: true, status: true, publishedAt: true } } },
            orderBy: { position: 'asc' },
          },
        },
      })

      if (!series) {
        return NextResponse.json({ error: 'Series not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: series })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get series' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await context.params
      const body: unknown = await request.json()

      const parsed = updateSeriesSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const result = await prisma.blogSeries.updateMany({
        where: { id, tenantId: tenant.tenantId },
        data: {
          ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
          ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
          ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
          ...(parsed.data.coverImageId !== undefined ? { coverImageId: parsed.data.coverImageId } : {}),
          ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
        },
      })

      if (result.count === 0) {
        return NextResponse.json({ error: 'Series not found' }, { status: 404 })
      }

      const updated = await prisma.blogSeries.findUnique({ where: { id } })
      return NextResponse.json({ success: true, data: updated })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update series' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await context.params

      const result = await prisma.blogSeries.deleteMany({ where: { id, tenantId: tenant.tenantId } })

      if (result.count === 0) {
        return NextResponse.json({ error: 'Series not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: { deleted: true, id } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete series' },
        { status: 500 }
      )
    }
  })
}
