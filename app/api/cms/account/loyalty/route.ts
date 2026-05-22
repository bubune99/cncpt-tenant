/**
 * Account Loyalty API — Atlas Redesign (Coordinator scope)
 *
 * GET /api/cms/account/loyalty — tier, points, nextTierPts, rewards[], activityLog[]
 *
 * Requires Stack Auth session + tenant context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/lib/cms/stack'
import { prisma } from '@/lib/cms/db'
import { withTenant } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic'

/** Simple tier thresholds — configurable in future via admin */
const TIERS = [
  { tier: 'Bronze', min: 0, next: 500 },
  { tier: 'Silver', min: 500, next: 1500 },
  { tier: 'Gold', min: 1500, next: 5000 },
  { tier: 'Platinum', min: 5000, next: null },
]

function getTier(points: number): { tier: string; nextTierPts: number | null } {
  let current = TIERS[0]
  for (const t of TIERS) {
    if (points >= t.min) current = t
  }
  return { tier: current.tier, nextTierPts: current.next !== null ? current.next - points : null }
}

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
          loyaltyPoints: true,
          loyaltyActivities: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
              id: true,
              type: true,
              points: true,
              description: true,
              referenceId: true,
              createdAt: true,
            },
          },
        },
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const { tier, nextTierPts } = getTier(customer.loyaltyPoints)

      return NextResponse.json({
        success: true,
        data: {
          tier,
          points: customer.loyaltyPoints,
          nextTierPts,
          rewards: [], // Placeholder — rewards catalog is a future phase
          activityLog: customer.loyaltyActivities,
        },
      })
    } catch (error: unknown) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to get loyalty data' },
        { status: 500 }
      )
    }
  })
}
