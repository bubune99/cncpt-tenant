/**
 * Super Admin AI Credits Management API
 * GET: List all user credit balances
 * POST: Grant credits to a user
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { grantCredits } from "@/lib/user-overrides"

// Super admin check
async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const rows = await sql`
      SELECT is_super_admin FROM users WHERE id = ${userId}
    `
    return rows.length > 0 && rows[0].is_super_admin === true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await isSuperAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get all credit balances with user info
    let balances
    let total

    if (search) {
      balances = await sql`
        SELECT
          acb.*,
          u.email as user_email,
          u.display_name as user_display_name
        FROM ai_credit_balances acb
        LEFT JOIN users u ON acb.user_id = u.id
        WHERE acb.user_id IS NOT NULL
          AND (u.email ILIKE ${`%${search}%`} OR u.display_name ILIKE ${`%${search}%`})
        ORDER BY acb.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      const countResult = await sql`
        SELECT COUNT(*) as total
        FROM ai_credit_balances acb
        LEFT JOIN users u ON acb.user_id = u.id
        WHERE acb.user_id IS NOT NULL
          AND (u.email ILIKE ${`%${search}%`} OR u.display_name ILIKE ${`%${search}%`})
      `
      total = parseInt(countResult[0]?.total as string || "0")
    } else {
      balances = await sql`
        SELECT
          acb.*,
          u.email as user_email,
          u.display_name as user_display_name
        FROM ai_credit_balances acb
        LEFT JOIN users u ON acb.user_id = u.id
        WHERE acb.user_id IS NOT NULL
        ORDER BY acb.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      const countResult = await sql`
        SELECT COUNT(*) as total FROM ai_credit_balances WHERE user_id IS NOT NULL
      `
      total = parseInt(countResult[0]?.total as string || "0")
    }

    // Get summary stats
    const stats = await sql`
      SELECT
        COUNT(*) as total_users,
        SUM(monthly_balance) as total_monthly,
        SUM(purchased_balance) as total_purchased,
        SUM(lifetime_used) as total_used,
        AVG(monthly_balance + purchased_balance) as avg_balance
      FROM ai_credit_balances
      WHERE user_id IS NOT NULL
    `

    return NextResponse.json({
      balances: balances.map(row => ({
        userId: row.user_id,
        userEmail: row.user_email,
        userDisplayName: row.user_display_name,
        monthlyBalance: row.monthly_balance || 0,
        purchasedBalance: row.purchased_balance || 0,
        totalBalance: (row.monthly_balance || 0) + (row.purchased_balance || 0),
        lifetimeAllocated: row.lifetime_allocated || 0,
        lifetimePurchased: row.lifetime_purchased || 0,
        lifetimeUsed: row.lifetime_used || 0,
        lastAllocationDate: row.last_allocation_date,
        updatedAt: row.updated_at,
      })),
      stats: {
        totalUsers: parseInt(stats[0]?.total_users as string || "0"),
        totalMonthlyCredits: parseInt(stats[0]?.total_monthly as string || "0"),
        totalPurchasedCredits: parseInt(stats[0]?.total_purchased as string || "0"),
        totalUsedCredits: parseInt(stats[0]?.total_used as string || "0"),
        avgBalance: parseFloat(stats[0]?.avg_balance as string || "0").toFixed(1),
      },
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[super-admin/ai-credits] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await isSuperAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, userEmail, amount, creditType, reason, notes } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const grant = await grantCredits(
      {
        userId,
        userEmail,
        creditsAmount: amount,
        creditType: creditType || "purchased",
        grantReason: reason,
        notes,
      },
      user.id,
      user.primaryEmail || undefined
    )

    return NextResponse.json({ success: true, grant })
  } catch (error) {
    console.error("[super-admin/ai-credits] Error granting credits:", error)
    return NextResponse.json({ error: "Failed to grant credits" }, { status: 500 })
  }
}
