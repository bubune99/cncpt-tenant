/**
 * Analytics Dashboard [id] API — Atlas Redesign G02
 *
 * GET    /api/cms/analytics/dashboards/[id] — get dashboard + widgets
 * PUT    /api/cms/analytics/dashboards/[id] — update dashboard
 * DELETE /api/cms/analytics/dashboards/[id] — delete dashboard
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

const updateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  layout: z.unknown().optional(),
  pinnedBy: z.array(z.string()).optional(),
  sharedWith: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  return withTenant(request, async (tenant) => {
    try {
      const { id } = await context.params

      const dashboard = await prisma.analyticsDashboard.findFirst({
        where: { id, tenantId: tenant.tenantId },
        include: { widgets: { orderBy: { createdAt: 'asc' } } },
      })

      if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: dashboard })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get dashboard' },
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

      const parsed = updateDashboardSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const { name, slug, isDefault, layout, pinnedBy, sharedWith } = parsed.data

      const dashboard = await prisma.analyticsDashboard.updateMany({
        where: { id, tenantId: tenant.tenantId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(isDefault !== undefined ? { isDefault } : {}),
          ...(layout !== undefined ? { layout: layout as Prisma.InputJsonValue } : {}),
          ...(pinnedBy !== undefined ? { pinnedBy } : {}),
          ...(sharedWith !== undefined ? { sharedWith } : {}),
        },
      })

      if (dashboard.count === 0) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
      }

      const updated = await prisma.analyticsDashboard.findUnique({
        where: { id },
        include: { _count: { select: { widgets: true } } },
      })

      return NextResponse.json({ success: true, data: updated })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update dashboard' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const { id } = await context.params

      const result = await prisma.analyticsDashboard.deleteMany({
        where: { id, tenantId: tenant.tenantId },
      })

      if (result.count === 0) {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: { deleted: true, id } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to delete dashboard' },
        { status: 500 }
      )
    }
  })
}
