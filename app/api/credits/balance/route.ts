/**
 * Credit Balance API
 * Get user's current credit balance and recent transactions
 *
 * GET /api/credits/balance
 */

import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getUserCreditBalance } from "@/lib/ai-credits"
import { sql } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get balance (getUserCreditBalance already fails safe to a zero balance)
    const balance = await getUserCreditBalance(user.id)

    // Get recent transactions. The credit ledger table may not be provisioned
    // in every environment (e.g. tenants where the credits feature was never
    // migrated). Isolate this query so a missing table degrades to an empty
    // transaction list instead of failing the whole endpoint with a 500 — the
    // balance above is still useful on its own.
    let rows: Array<Record<string, unknown>> = []
    try {
      rows = await sql`
        SELECT id, type,
          CASE WHEN type = 'usage' THEN -(monthly_amount + purchased_amount)
               ELSE (monthly_amount + purchased_amount) END as amount,
          feature, description, created_at
        FROM ai_credit_transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 20
      `
    } catch (txError) {
      console.warn("[credits-balance] transactions unavailable:", txError)
      rows = []
    }

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
      },
      recentTransactions: rows.map((t) => ({
        id: t.id as string,
        type: t.type as string,
        amount: t.amount as number,
        feature: t.feature as string | null,
        description: t.description as string | null,
        createdAt: new Date(t.created_at as string).toISOString(),
      })),
    })
  } catch (error) {
    console.error("[credits-balance] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    )
  }
}
