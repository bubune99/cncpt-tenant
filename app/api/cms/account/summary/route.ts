/**
 * Account Summary API — Atlas Redesign (Coordinator scope)
 *
 * GET /api/cms/account/summary — storeCredit, loyaltyPoints, activeSubs, openOrders, lifecycleStage
 *
 * Requires Stack Auth session + tenant context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/lib/cms/stack'
import { prisma } from '@/lib/cms/db'
import { withTenant } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withTenant(request, async (tenant) => {
    try {
      const stackUser = await stackServerApp.getUser()
      if (!stackUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const customer = await prisma.customer.findFirst({
        where: { userId: stackUser.id, tenantId: tenant.tenantId },
        select: {
          id: true,
          storeCredit: true,
          loyaltyPoints: true,
          lifecycleStage: true,
        },
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const [activeSubs, openOrders] = await Promise.all([
        prisma.order.count({
          where: {
            customerId: customer.id,
            status: 'PROCESSING',
          },
        }),
        prisma.order.count({
          where: {
            customerId: customer.id,
            status: { notIn: ['DELIVERED', 'CANCELLED'] },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          storeCredit: customer.storeCredit,
          loyaltyPoints: customer.loyaltyPoints,
          activeSubs,
          openOrders,
          lifecycleStage: customer.lifecycleStage,
        },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get account summary' },
        { status: 500 }
      )
    }
  })
}
