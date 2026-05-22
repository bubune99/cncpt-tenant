/**
 * Analytics Dashboard Widgets API — Atlas Redesign G02
 *
 * GET  /api/cms/analytics/dashboards/[id]/widgets — list widgets
 * POST /api/cms/analytics/dashboards/[id]/widgets — create widget
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const createWidgetSchema = z.object({
  title: z.string().min(1).max(100),
  vizType: z.enum(['line', 'bar', 'donut', 'kpi', 'table', 'funnel']),
  query: z.object({
    metric: z.string(),
    dimension: z.string().optional(),
    groupBy: z.string().optional(),
    dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
    filters: z.array(z.object({
      field: z.string(),
      op: z.enum(['eq', 'gt', 'lt', 'in', 'contains']),
      value: z.union([z.string(), z.number(), z.array(z.string())]),
    })).optional(),
    comparison: z.enum(['previous_period', 'previous_year']).optional(),
  }),
  config: z.unknown().optional(),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  templateId: z.string().optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id: dashboardId } = await context.params

      // Verify dashboard belongs to tenant
      const dashboard = await prisma.analyticsDashboard.findFirst({
        where: { id: dashboardId, tenantId: tenant.tenantId },
        select: { id: true },
      })

      if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
      }

      const widgets = await prisma.analyticsWidget.findMany({
        where: { dashboardId },
        orderBy: { createdAt: 'asc' },
      })

      return NextResponse.json({ success: true, data: widgets })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list widgets' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id: dashboardId } = await context.params
      const body: unknown = await request.json()

      const parsed = createWidgetSchema.safeParse(body)
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

      const { title, vizType, query, config, position, templateId } = parsed.data

      const widget = await prisma.analyticsWidget.create({
        data: {
          dashboardId,
          title,
          vizType,
          query: query as Prisma.InputJsonValue,
          position,
          ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
          ...(templateId ? { templateId } : {}),
        },
      })

      return NextResponse.json({ success: true, data: widget }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create widget' },
        { status: 500 }
      )
    }
  })
}
