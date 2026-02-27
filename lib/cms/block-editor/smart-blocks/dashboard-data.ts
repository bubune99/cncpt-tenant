/**
 * Dashboard Data Fetchers
 *
 * Server-side Prisma queries for dashboard smart blocks.
 * Registered as named fetchers in the data resolver.
 */

import { prisma } from '@/lib/cms/db'
import { registerFetcher } from './data-resolver'

// ---------------------------------------------------------------------------
// Types (serializable — passed to client components)
// ---------------------------------------------------------------------------

export interface DashboardStats {
  orderCount: number
  totalSpent: number
  memberSince: string
}

export interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  itemCount: number
}

// ---------------------------------------------------------------------------
// Fetcher Implementations
// ---------------------------------------------------------------------------

async function fetchDashboardStats(args: Record<string, unknown>): Promise<DashboardStats> {
  const userId = args.userId as string | undefined
  const email = args.email as string | undefined

  if (!userId && !email) {
    return { orderCount: 0, totalSpent: 0, memberSince: new Date().toISOString() }
  }

  // Find the customer record
  const customer = await prisma.customer.findFirst({
    where: userId
      ? { userId }
      : { email: email! },
    include: {
      orders: {
        select: { total: true },
      },
      user: {
        select: { createdAt: true },
      },
    },
  })

  if (!customer) {
    // Try user directly
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } })
      : null
    return {
      orderCount: 0,
      totalSpent: 0,
      memberSince: (user?.createdAt ?? new Date()).toISOString(),
    }
  }

  const orderCount = customer.orders.length
  const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0)
  const memberSince = (customer.user?.createdAt ?? new Date()).toISOString()

  return { orderCount, totalSpent, memberSince }
}

async function fetchRecentOrders(args: Record<string, unknown>): Promise<RecentOrder[]> {
  const userId = args.userId as string | undefined
  const email = args.email as string | undefined
  const limit = (args.limit as number) || 5

  if (!userId && !email) return []

  // Find customer
  const customer = await prisma.customer.findFirst({
    where: userId
      ? { userId }
      : { email: email! },
    select: { id: true },
  })

  if (!customer) return []

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      _count: { select: { items: true } },
    },
  })

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    itemCount: o._count.items,
  }))
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerDashboardFetchers(): void {
  registerFetcher('fetchDashboardStats', fetchDashboardStats)
  registerFetcher('fetchRecentOrders', fetchRecentOrders)
}
