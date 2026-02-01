/**
 * Credit Balance API
 * Get user's current credit balance and usage stats
 *
 * GET /api/credits/balance
 */

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserCreditBalance, getCreditHistory } from "@/lib/ai-credits"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get balance
    const balance = await getUserCreditBalance(user.id)

    // Get recent transactions
    const { transactions, total } = await getCreditHistory(user.id, { limit: 10 })

    return NextResponse.json({
      balance: {
        monthly: balance.monthlyBalance,
        purchased: balance.purchasedBalance,
        total: balance.totalBalance,
        lifetimeAllocated: balance.lifetimeAllocated,
        lifetimePurchased: balance.lifetimePurchased,
        lifetimeUsed: balance.lifetimeUsed,
        monthlyAllocation: balance.monthlyAllocationAmount,
        rolloverCap: balance.rolloverCap,
        lastAllocationDate: balance.lastAllocationDate,
      },
      recentTransactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.monthlyAmount + t.purchasedAmount,
        feature: t.feature,
        modelTier: t.modelTier,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      totalTransactions: total,
    })
  } catch (error) {
    console.error("[credits-balance] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    )
  }
}
