/**
 * Analytics Widget [widgetId] API — Atlas Redesign G02
 *
 * PUT    /api/cms/analytics/dashboards/[id]/widgets/[widgetId]
 * DELETE /api/cms/analytics/dashboards/[id]/widgets/[widgetId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string; widgetId: string }>
}

const updateWidgetSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  vizType: z.enum(['line', 'bar', 'donut', 'kpi', 'table', 'funnel']).optional(),
  query: z.unknown().optional(),
  config: z.unknown().optional(),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
})

export async function PUT(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: dashboardId, widgetId } = await context.params
      const body: unknown = await request.json()

      const parsed = updateWidgetSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      // Verify dashboard belongs to tenant
      const dashboard = await prisma.analyticsDashboard.findFirst({
        where: { id: dashboardId, tenantId: tenant.tenantId },
        select: { id: true },
      })

      if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
      }

      const { title, vizType, query, config, position } = parsed.data

      const widget = await prisma.analyticsWidget.update({
        where: { id: widgetId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(vizType !== undefined ? { vizType } : {}),
          ...(query !== undefined ? { query: query as Prisma.InputJsonValue } : {}),
          ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
          ...(position !== undefined ? { position } : {}),
        },
      })

      return NextResponse.json({ success: true, data: widget })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update widget' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: dashboardId, widgetId } = await context.params

      // Verify dashboard belongs to tenant
      const dashboard = await prisma.analyticsDashboard.findFirst({
        where: { id: dashboardId, tenantId: tenant.tenantId },
        select: { id: true },
      })

      if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
      }

      await prisma.analyticsWidget.delete({ where: { id: widgetId } })

      return NextResponse.json({ success: true, data: { deleted: true, widgetId } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete widget' },
        { status: 500 }
      )
    }
  })
}
