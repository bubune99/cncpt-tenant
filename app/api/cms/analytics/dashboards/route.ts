/**
 * Analytics Dashboards API — Atlas Redesign G02
 *
 * GET  /api/cms/analytics/dashboards — list dashboards
 * POST /api/cms/analytics/dashboards — create dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant, withTenantAuth } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

const createDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
  layout: z.unknown().optional(),
})

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const dashboards = await prisma.analyticsDashboard.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        include: { _count: { select: { widgets: true } } },
      })

      return NextResponse.json({ success: true, data: dashboards })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to list dashboards' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenantAuth(request, 'edit', async (tenant) => {
    try {
      const body: unknown = await request.json()
      const parsed = createDashboardSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
      }

      const { name, slug, isDefault, layout } = parsed.data

      const dashboard = await prisma.analyticsDashboard.create({
        data: {
          tenantId: tenant.tenantId,
          name,
          slug,
          isDefault: isDefault ?? false,
          ...(layout !== undefined ? { layout: layout as Prisma.InputJsonValue } : {}),
        },
      })

      return NextResponse.json({ success: true, data: dashboard }, { status: 201 })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create dashboard' },
        { status: 500 }
      )
    }
  })
}
