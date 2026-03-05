/**
 * Admin Customer Stats API
 *
 * GET /api/cms/admin/customers/stats - Customer statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

export const GET = withPermission(
  PERMISSIONS.CUSTOMERS_VIEW,
  async (_request: NextRequest, _context: AuthContext) => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [totalCustomers, newThisMonth, activeToday] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
        prisma.customer.count({
          where: { lastOrderAt: { gte: twentyFourHoursAgo } },
        }),
      ])

      // Average storage is a placeholder since per-customer storage isn't tracked
      const averageStoragePerCustomer = 0
      const totalStorageUsed = 0

      return NextResponse.json({
        totalCustomers,
        activeToday,
        newThisMonth,
        totalStorageUsed,
        averageStoragePerCustomer,
      })
    } catch (error) {
      console.error('Customer stats error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer stats' },
        { status: 500 }
      )
    }
  }
)
