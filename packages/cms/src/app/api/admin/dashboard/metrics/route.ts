/**
 * Admin Dashboard Metrics API
 *
 * GET /api/admin/dashboard/metrics - Get detailed dashboard metrics
 */

import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function GET() {
  try {
    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get counts in parallel
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      monthlyOrders,
      todayEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          createdAt: {
            gte: startOfDay,
          },
        },
      }).catch(() => 0), // Handle case where table doesn't exist
    ])

    // Calculate monthly revenue from orders
    const monthlyRevenue = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
      },
    }).catch(() => ({ _sum: { total: null } }))

    const metrics = {
      totalBusinessOwners: totalUsers,
      activeSubscriptions: 0, // Would need subscription model with active status
      trialsActive: 0, // Would need trial tracking
      totalCustomers: totalUsers,
      monthlyRevenue: monthlyRevenue._sum.total ? Number(monthlyRevenue._sum.total) / 100 : 0,
      totalProducts: totalProducts,
      totalOrders: monthlyOrders,
      apiCallsToday: todayEvents,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error)
    // Return default metrics on error to prevent UI crash
    return NextResponse.json({
      totalBusinessOwners: 0,
      activeSubscriptions: 0,
      trialsActive: 0,
      totalCustomers: 0,
      monthlyRevenue: 0,
      totalProducts: 0,
      totalOrders: 0,
      apiCallsToday: 0,
    })
  }
}
