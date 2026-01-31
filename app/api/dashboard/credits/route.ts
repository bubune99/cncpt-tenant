/**
 * AI Credits Balance API
 * GET: Get user's credit balance and usage stats
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import {
  getCombinedBalance,
  getCreditHistory,
  getAllFeatureCosts,
  getModelTiers,
  allocateMonthlyCredits,
} from "@/lib/ai-credits"
import { getUserSubscription } from "@/lib/subscription"

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/credits
 * Get user's credit balance, team pool, and usage stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get subdomain from query param (optional)
    const { searchParams } = new URL(request.url)
    const subdomainId = searchParams.get("subdomain_id") || undefined
    const includeHistory = searchParams.get("include_history") === "true"
    const includeCosts = searchParams.get("include_costs") === "true"

    // Get user's subscription to check monthly allocation
    const subscription = await getUserSubscription(user.id)

    // Check if we need to allocate monthly credits
    const monthlyAllocation = (subscription?.limits as { ai_credits_monthly?: number })?.ai_credits_monthly || 0
    const rolloverCap = (subscription?.limits as { ai_credits_rollover_cap?: number })?.ai_credits_rollover_cap || 0

    if (monthlyAllocation > 0) {
      await allocateMonthlyCredits(user.id, monthlyAllocation, rolloverCap)
    }

    // Get balances
    const { user: userBalance, team, totalAvailable } = await getCombinedBalance(
      user.id,
      subdomainId
    )

    // Build response
    const response: Record<string, unknown> = {
      balance: {
        monthly: userBalance.monthlyBalance,
        purchased: userBalance.purchasedBalance,
        total: userBalance.totalBalance,
        teamPool: team?.purchasedBalance || 0,
        totalAvailable,
      },
      stats: {
        lifetimeAllocated: userBalance.lifetimeAllocated,
        lifetimePurchased: userBalance.lifetimePurchased,
        lifetimeUsed: userBalance.lifetimeUsed,
      },
      allocation: {
        monthlyAmount: monthlyAllocation,
        rolloverCap,
        lastAllocationDate: userBalance.lastAllocationDate,
      },
      tier: {
        name: subscription?.tierName || "free",
        displayName: subscription?.tierDisplayName || "Free",
        aiFeatures: (subscription?.limits as { ai_features?: string[] | string })?.ai_features || [],
      },
    }

    // Include history if requested
    if (includeHistory) {
      const history = await getCreditHistory(user.id, { limit: 20 })
      response.history = history.transactions
    }

    // Include feature costs if requested
    if (includeCosts) {
      response.featureCosts = await getAllFeatureCosts()
      response.modelTiers = await getModelTiers()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[credits-api] Error getting credits:", error)
    return NextResponse.json(
      { error: "Failed to get credit balance" },
      { status: 500 }
    )
  }
}
