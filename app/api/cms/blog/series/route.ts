/**
 * Blog Series API — Atlas Redesign G03
 *
 * GET  /api/cms/blog/series — list series
 * POST /api/cms/blog/series — create series
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

const createSeriesSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  coverImageId: z.string().optional(),
  position: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const series = await prisma.blogSeries.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: { position: 'asc' },
        include: { _count: { select: { posts: true } } },
      })

      return NextResponse.json({ success: true, data: series })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list series' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const body: unknown = await request.json()
      const parsed = createSeriesSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const { title, slug, description, coverImageId, position } = parsed.data

      const series = await prisma.blogSeries.create({
        data: {
          tenantId: tenant.tenantId,
          title,
          slug,
          ...(description ? { description } : {}),
          ...(coverImageId ? { coverImageId } : {}),
          position: position ?? 0,
        },
      })

      return NextResponse.json({ success: true, data: series }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create series' },
        { status: 500 }
      )
    }
  })
}
