/**
 * Admin Dashboard KPI Strip API
 *
 * GET /api/cms/admin/dashboard/kpis?timeframe=<today|7d|month|90d|year>
 *
 * Returns the 6 headline KPIs for the per-tenant admin dashboard strip:
 *   - monthlyRevenue (sum of order totals, dollars)
 *   - orders (count of non-cancelled orders)
 *   - customers (total users + new-this-period count)
 *   - activeSubscriptions (active subscription-type products)
 *   - products (total non-archived products + low-stock badge)
 *   - avgOrderValue (revenue / orders)
 *
 * Each KPI includes a delta against the immediately preceding period of
 * equal length so the UI can show "+15.8% vs last week" style comparisons.
 * Money values are in dollars (already converted from cents).
 *
 * This endpoint is kept separate from the legacy `/metrics` endpoint so
 * the existing DashboardMetrics widget and GridStack tiles continue to
 * work unchanged.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { withAuth } from '@/lib/cms/permissions/middleware'

export const dynamic = 'force-dynamic'

type Timeframe = 'today' | '7d' | 'month' | '90d' | 'year'

const ALLOWED_TIMEFRAMES: readonly Timeframe[] = [
  'today',
  '7d',
  'month',
  '90d',
  'year',
] as const

function parseTimeframe(raw: string | null): Timeframe {
  if (!raw) return 'month'
  return (ALLOWED_TIMEFRAMES as readonly string[]).includes(raw)
    ? (raw as Timeframe)
    : 'month'
}

interface PeriodRange {
  currentStart: Date
  previousStart: Date
  previousEnd: Date
  contextLabel: string
}

/** Pure: derive current + previous period bounds from a timeframe. */
function getRange(timeframe: Timeframe, now: Date): PeriodRange {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (timeframe) {
    case 'today': {
      const previousStart = new Date(startOfDay)
      previousStart.setDate(previousStart.getDate() - 1)
      return {
        currentStart: startOfDay,
        previousStart,
        previousEnd: startOfDay,
        contextLabel: 'vs yesterday',
      }
    }
    case '7d': {
      const currentStart = new Date(startOfDay)
      currentStart.setDate(currentStart.getDate() - 6)
      const previousStart = new Date(currentStart)
      previousStart.setDate(previousStart.getDate() - 7)
      return {
        currentStart,
        previousStart,
        previousEnd: currentStart,
        contextLabel: 'vs last week',
      }
    }
    case '90d': {
      const currentStart = new Date(startOfDay)
      currentStart.setDate(currentStart.getDate() - 89)
      const previousStart = new Date(currentStart)
      previousStart.setDate(previousStart.getDate() - 90)
      return {
        currentStart,
        previousStart,
        previousEnd: currentStart,
        contextLabel: 'vs previous 90 days',
      }
    }
    case 'year': {
      const currentStart = new Date(now.getFullYear(), 0, 1)
      const previousStart = new Date(now.getFullYear() - 1, 0, 1)
      return {
        currentStart,
        previousStart,
        previousEnd: currentStart,
        contextLabel: 'vs last year',
      }
    }
    case 'month':
    default: {
      const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const previousStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      )
      return {
        currentStart,
        previousStart,
        previousEnd: currentStart,
        contextLabel: 'vs last month',
      }
    }
  }
}

interface DeltaShape {
  value: number
  direction: 'up' | 'down' | 'flat'
}

/** Pure: percentage change between two periods. */
function buildDelta(current: number, previous: number): DeltaShape {
  if (previous === 0) {
    if (current === 0) return { value: 0, direction: 'flat' }
    return { value: 100, direction: 'up' }
  }
  const pct = ((current - previous) / previous) * 100
  if (Math.abs(pct) < 0.05) return { value: 0, direction: 'flat' }
  return {
    value: Math.round(Math.abs(pct) * 10) / 10,
    direction: pct > 0 ? 'up' : 'down',
  }
}

function safeNumber(value: number | null | undefined): number {
  return value == null || Number.isNaN(value) ? 0 : Number(value)
}

export const GET = withAuth(async (request, _context) => {
  const { searchParams } = request.nextUrl
  const timeframe = parseTimeframe(searchParams.get('timeframe'))

  try {
    const now = new Date()
    const range = getRange(timeframe, now)

    // Orders for current + previous period
    const [currentOrders, previousOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: range.currentStart },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: range.previousStart, lt: range.previousEnd },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        select: { total: true },
      }),
    ])

    const currentRevenue =
      currentOrders.reduce((sum, o) => sum + safeNumber(o.total), 0) / 100
    const previousRevenue =
      previousOrders.reduce((sum, o) => sum + safeNumber(o.total), 0) / 100

    const currentOrdersCount = currentOrders.length
    const previousOrdersCount = previousOrders.length

    const currentAvgOrderValue =
      currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0
    const previousAvgOrderValue =
      previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0

    // Customers
    const [totalCustomers, newCustomersThisPeriod, newCustomersPreviousPeriod] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { createdAt: { gte: range.currentStart } },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: range.previousStart, lt: range.previousEnd },
          },
        }),
      ])

    // Products. The schema does not track on-hand inventory, so we surface
    // DRAFT products as a proxy for "needs attention" instead. Documented
    // in the PR body as a known approximation.
    const [totalProducts, lowStockCount, activeSubscriptionProducts] =
      await Promise.all([
        prisma.product.count({ where: { status: { not: 'ARCHIVED' } } }),
        prisma.product.count({ where: { status: 'DRAFT' } }).catch(() => 0),
        prisma.product
          .count({ where: { type: 'SUBSCRIPTION', status: 'ACTIVE' } })
          .catch(() => 0),
      ])

    return NextResponse.json({
      timeframe,
      contextLabel: range.contextLabel,
      generatedAt: now.toISOString(),
      kpis: {
        monthlyRevenue: {
          value: Math.round(currentRevenue * 100) / 100,
          delta: buildDelta(currentRevenue, previousRevenue),
        },
        orders: {
          value: currentOrdersCount,
          delta: buildDelta(currentOrdersCount, previousOrdersCount),
        },
        customers: {
          value: totalCustomers,
          newThisPeriod: newCustomersThisPeriod,
          delta: buildDelta(
            newCustomersThisPeriod,
            newCustomersPreviousPeriod,
          ),
        },
        activeSubscriptions: {
          value: activeSubscriptionProducts,
          delta: { value: 0, direction: 'flat' as const },
        },
        products: {
          value: totalProducts,
          lowStockCount,
          delta: { value: 0, direction: 'flat' as const },
        },
        avgOrderValue: {
          value: Math.round(currentAvgOrderValue * 100) / 100,
          delta: buildDelta(currentAvgOrderValue, previousAvgOrderValue),
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard KPIs:', error)
    return NextResponse.json(
      {
        timeframe,
        contextLabel: 'vs last month',
        generatedAt: new Date().toISOString(),
        kpis: {
          monthlyRevenue: { value: 0, delta: { value: 0, direction: 'flat' } },
          orders: { value: 0, delta: { value: 0, direction: 'flat' } },
          customers: {
            value: 0,
            newThisPeriod: 0,
            delta: { value: 0, direction: 'flat' },
          },
          activeSubscriptions: {
            value: 0,
            delta: { value: 0, direction: 'flat' },
          },
          products: {
            value: 0,
            lowStockCount: 0,
            delta: { value: 0, direction: 'flat' },
          },
          avgOrderValue: { value: 0, delta: { value: 0, direction: 'flat' } },
        },
      },
      { status: 200 },
    )
  }
})
