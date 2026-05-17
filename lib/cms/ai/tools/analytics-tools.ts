/**
 * Analytics Tools — Atlas Redesign G02
 *
 * Agent tools for analytics dashboards, widgets, and query execution.
 */

import { tool } from 'ai'
import { z } from 'zod'

async function getDb() {
  const { prisma } = await import('../../db')
  return prisma
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId!)
    throw error
  }
}

export const listAnalyticsDashboards = tool({
  description: 'List all analytics dashboards for the current tenant.',
  inputSchema: z.object({
    tenantId: z.number().int().describe('Tenant (subdomain) ID'),
  }),
  execute: async ({ tenantId }) => {
    try {
      const prisma = await getDb()

      const dashboards = await withTimeout(
        prisma.analyticsDashboard.findMany({
          where: { tenantId },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          include: { _count: { select: { widgets: true } } },
        }),
        5000,
        'List dashboards timed out'
      )

      return { success: true, dashboards, count: dashboards.length }
    } catch (error: unknown) {
      return { success: false, dashboards: [], count: 0, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const getAnalyticsDashboard = tool({
  description: 'Get an analytics dashboard with all its widgets.',
  inputSchema: z.object({
    id: z.string().describe('Dashboard ID'),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb()

      const dashboard = await withTimeout(
        prisma.analyticsDashboard.findUnique({
          where: { id },
          include: { widgets: { orderBy: { createdAt: 'asc' } } },
        }),
        5000,
        'Get dashboard timed out'
      )

      if (!dashboard) return { success: false, error: 'Dashboard not found' }

      return { success: true, dashboard }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const createAnalyticsDashboard = tool({
  description: 'Create a new analytics dashboard for a tenant.',
  inputSchema: z.object({
    tenantId: z.number().int(),
    name: z.string(),
    slug: z.string(),
    isDefault: z.boolean().optional(),
  }),
  execute: async ({ tenantId, name, slug, isDefault }) => {
    try {
      const prisma = await getDb()

      const dashboard = await withTimeout(
        prisma.analyticsDashboard.create({
          data: { tenantId, name, slug, isDefault: isDefault ?? false },
        }),
        5000,
        'Create dashboard timed out'
      )

      return { success: true, dashboard }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create dashboard' }
    }
  },
})

export const createAnalyticsWidget = tool({
  description: 'Add a widget to an analytics dashboard.',
  inputSchema: z.object({
    dashboardId: z.string(),
    title: z.string(),
    vizType: z.enum(['line', 'bar', 'donut', 'kpi', 'table', 'funnel']),
    query: z.object({
      metric: z.string(),
      dimension: z.string().optional(),
      groupBy: z.string().optional(),
      dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
      filters: z.array(z.object({ field: z.string(), op: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
      comparison: z.enum(['previous_period', 'previous_year']).optional(),
    }),
    position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
    templateId: z.string().optional(),
  }),
  execute: async ({ dashboardId, title, vizType, query, position, templateId }) => {
    try {
      const prisma = await getDb()

      const widget = await withTimeout(
        prisma.analyticsWidget.create({
          data: { dashboardId, title, vizType, query, position, ...(templateId ? { templateId } : {}) },
        }),
        5000,
        'Create widget timed out'
      )

      return { success: true, widget }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create widget' }
    }
  },
})

export const runAnalyticsQuery = tool({
  description: 'Execute an analytics query against order/customer/product data and return aggregated results.',
  inputSchema: z.object({
    tenantId: z.number().int(),
    metric: z.enum(['revenue', 'orders', 'customers', 'products']),
    dimension: z.string().optional(),
    dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
    limit: z.number().optional(),
  }),
  execute: async ({ tenantId, metric, dimension, dateRange, limit }) => {
    try {
      const prisma = await getDb()
      const from = dateRange ? new Date(dateRange.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateRange ? new Date(dateRange.to) : new Date()
      const take = Math.min(limit ?? 50, 200)

      let result: unknown

      if (metric === 'revenue' || metric === 'orders') {
        const orders = await withTimeout(
          prisma.order.findMany({
            where: { tenantId, createdAt: { gte: from, lte: to } },
            select: { total: true, createdAt: true, status: true },
            take,
          }),
          5000,
          'Analytics query timed out'
        )
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
        result = {
          metric,
          totalOrders: orders.length,
          totalRevenueCents: totalRevenue,
          totalRevenueDollars: (totalRevenue / 100).toFixed(2),
          from: from.toISOString(),
          to: to.toISOString(),
          dimension,
        }
      } else if (metric === 'customers') {
        const count = await withTimeout(
          prisma.customer.count({ where: { tenantId, createdAt: { gte: from, lte: to } } }),
          5000,
          'Customer count timed out'
        )
        result = { metric, newCustomers: count, from: from.toISOString(), to: to.toISOString() }
      } else if (metric === 'products') {
        const count = await withTimeout(
          prisma.product.count({ where: { tenantId, status: 'ACTIVE' } }),
          5000,
          'Product count timed out'
        )
        result = { metric, activeProducts: count }
      }

      return { success: true, query: { metric, dimension, dateRange }, result }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Analytics query failed' }
    }
  },
})

export const analyticsTools = {
  listAnalyticsDashboards,
  getAnalyticsDashboard,
  createAnalyticsDashboard,
  createAnalyticsWidget,
  runAnalyticsQuery,
}
