/**
 * Analytics Widget Templates API — Atlas Redesign G02
 *
 * GET  /api/cms/analytics/widget-templates — list templates
 * POST /api/cms/analytics/widget-templates — create template
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  vizType: z.enum(['line', 'bar', 'donut', 'kpi', 'table', 'funnel']),
  query: z.unknown(),
  config: z.unknown().optional(),
  thumbnail: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')

      const templates = await prisma.analyticsWidgetTemplate.findMany({
        where: {
          OR: [{ tenantId: tenant.tenantId }, { isSystem: true }],
          ...(category ? { category } : {}),
        },
        orderBy: [{ isSystem: 'asc' }, { name: 'asc' }],
      })

      return NextResponse.json({ success: true, data: templates })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list templates' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const body: unknown = await request.json()
      const parsed = createTemplateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const { name, description, vizType, query, config, thumbnail, category } = parsed.data

      const template = await prisma.analyticsWidgetTemplate.create({
        data: {
          tenantId: tenant.tenantId,
          name,
          vizType,
          query: query as Prisma.InputJsonValue,
          ...(description ? { description } : {}),
          ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
          ...(thumbnail ? { thumbnail } : {}),
          ...(category ? { category } : {}),
        },
      })

      return NextResponse.json({ success: true, data: template }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create template' },
        { status: 500 }
      )
    }
  })
}
