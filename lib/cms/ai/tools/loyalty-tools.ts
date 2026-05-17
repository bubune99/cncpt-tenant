/**
 * Loyalty Tools — Atlas Redesign (Coordinator scope)
 *
 * Agent tools for customer loyalty points and account summary.
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

export const getAccountSummary = tool({
  description: 'Get account summary for a customer: store credit, loyalty points, open orders, lifecycle stage.',
  inputSchema: z.object({
    customerId: z.string(),
  }),
  execute: async ({ customerId }) => {
    try {
      const prisma = await getDb()

      const [customer, activeSubs, openOrders] = await withTimeout(
        Promise.all([
          prisma.customer.findUnique({
            where: { id: customerId },
            select: { id: true, storeCredit: true, loyaltyPoints: true, lifecycleStage: true },
          }),
          prisma.order.count({ where: { customerId, status: 'PROCESSING' } }),
          prisma.order.count({ where: { customerId, status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
        ]),
        5000,
        'Get account summary timed out'
      )

      if (!customer) return { success: false, error: 'Customer not found' }

      return {
        success: true,
        customerId,
        storeCredit: customer.storeCredit,
        loyaltyPoints: customer.loyaltyPoints,
        lifecycleStage: customer.lifecycleStage,
        activeSubs,
        openOrders,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get account summary' }
    }
  },
})

export const getCustomerLoyalty = tool({
  description: 'Get loyalty tier, points, and recent activity for a customer.',
  inputSchema: z.object({
    customerId: z.string(),
    limit: z.number().int().optional(),
  }),
  execute: async ({ customerId, limit }) => {
    try {
      const prisma = await getDb()
      const take = Math.min(limit ?? 20, 100)

      const customer = await withTimeout(
        prisma.customer.findUnique({
          where: { id: customerId },
          select: {
            loyaltyPoints: true,
            loyaltyActivities: {
              orderBy: { createdAt: 'desc' },
              take,
              select: { id: true, type: true, points: true, description: true, referenceId: true, createdAt: true },
            },
          },
        }),
        5000,
        'Get customer loyalty timed out'
      )

      if (!customer) return { success: false, error: 'Customer not found' }

      const { tier, nextTierPts } = getTier(customer.loyaltyPoints)

      return {
        success: true,
        customerId,
        tier,
        points: customer.loyaltyPoints,
        nextTierPts,
        activityLog: customer.loyaltyActivities,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get loyalty data' }
    }
  },
})

export const addLoyaltyActivity = tool({
  description: 'Add a loyalty point credit or debit to a customer account.',
  inputSchema: z.object({
    customerId: z.string(),
    type: z.enum(['EARNED_PURCHASE', 'EARNED_REFERRAL', 'EARNED_REVIEW', 'REDEEMED', 'ADJUSTED', 'EXPIRED']),
    points: z.number().int().describe('Positive to add, negative to deduct'),
    description: z.string().optional(),
    referenceId: z.string().optional(),
  }),
  execute: async ({ customerId, type, points, description, referenceId }) => {
    try {
      const prisma = await getDb()

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, tenantId: true },
      })
      if (!customer) return { success: false, error: 'Customer not found' }

      const [activity, updated] = await withTimeout(
        prisma.$transaction([
          prisma.loyaltyActivity.create({
            data: {
              customerId,
              tenantId: customer.tenantId,
              type,
              points,
              description,
              referenceId,
            },
          }),
          prisma.customer.update({
            where: { id: customerId },
            data: { loyaltyPoints: { increment: points } },
            select: { loyaltyPoints: true },
          }),
        ]),
        5000,
        'Add loyalty activity timed out'
      )

      return {
        success: true,
        activityId: activity.id,
        type,
        points,
        newBalance: updated.loyaltyPoints,
        message: `${points > 0 ? 'Added' : 'Deducted'} ${Math.abs(points)} points (${type})`,
      }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add loyalty activity' }
    }
  },
})

export const loyaltyTools = { getAccountSummary, getCustomerLoyalty, addLoyaltyActivity }
