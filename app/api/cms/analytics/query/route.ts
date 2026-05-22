/**
 * Analytics Query API — Atlas Redesign G02 / G19
 *
 * POST /api/cms/analytics/query — execute an analytics query
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/cms/db'
import { withTenant } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

const analyticsQuerySchema = z.object({
  metric: z.enum(['revenue', 'orders', 'customers', 'products', 'pageviews']),
  dimension: z.enum(['date', 'product', 'status', 'customer']).optional(),
  filters: z.array(z.object({
    field: z.string(),
    op: z.enum(['eq', 'gt', 'lt', 'in', 'contains']),
    value: z.union([z.string(), z.number(), z.array(z.string())]),
  })).optional(),
  groupBy: z.string().optional(),
  dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
  comparison: z.enum(['previous_period', 'previous_year']).optional(),
  limit: z.number().int().min(1).max(200).optional(),
})

export async function POST(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const body: unknown = await request.json()
      const parsed = analyticsQuerySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid query', details: parsed.error.errors }, { status: 400 })
      }

      const { metric, dimension, dateRange, limit } = parsed.data
      const tenantId = tenant.tenantId
      const from = dateRange ? new Date(dateRange.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateRange ? new Date(dateRange.to) : new Date()
      const take = Math.min(limit ?? 50, 200)

      let result: unknown

      if (metric === 'revenue' || metric === 'orders') {
        const orders = await prisma.order.findMany({
          where: { tenantId, createdAt: { gte: from, lte: to } },
          select: { total: true, createdAt: true, status: true },
          take,
          orderBy: { createdAt: 'asc' },
        })

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

        if (dimension === 'date') {
          // Group by day
          const byDay: Record<string, { revenue: number; orders: number }> = {}
          for (const o of orders) {
            const day = o.createdAt.toISOString().split('T')[0]
            if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0 }
            byDay[day].revenue += o.total
            byDay[day].orders += 1
          }
          result = { metric, dimension: 'date', series: byDay, totalRevenue, totalOrders: orders.length }
        } else {
          result = { metric, totalOrders: orders.length, totalRevenueCents: totalRevenue, from: from.toISOString(), to: to.toISOString() }
        }
      } else if (metric === 'customers') {
        const count = await prisma.customer.count({ where: { tenantId, createdAt: { gte: from, lte: to } } })
        result = { metric, newCustomers: count, from: from.toISOString(), to: to.toISOString() }
      } else if (metric === 'products') {
        const count = await prisma.product.count({ where: { tenantId, status: 'ACTIVE' } })
        result = { metric, activeProducts: count }
      } else {
        result = { metric, message: 'Metric aggregation not yet implemented' }
      }

      return NextResponse.json({ success: true, data: { query: parsed.data, result } })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Query failed' },
        { status: 500 }
      )
    }
  })
}
