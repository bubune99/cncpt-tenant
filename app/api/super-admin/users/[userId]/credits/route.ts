/**
 * Super Admin Credit Grant API
 *
 * Allows super admins to grant free AI credits to users
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import { grantCredits, listCreditGrants, type GrantCreditsInput } from "@/lib/user-overrides"
import { getUserCreditBalance, addUserPurchasedCredits } from "@/lib/ai-credits"

interface RouteParams {
  params: Promise<{ userId: string }>
}

/**
 * GET - Get user's credit balance and grant history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params

    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const [balance, grants] = await Promise.all([
      getUserCreditBalance(userId),
      listCreditGrants({ userId, limit: 50 }),
    ])

    return NextResponse.json({
      balance,
      grants,
    })
  } catch (error) {
    console.error("[super-admin/credits] Error getting credits:", error)
    return NextResponse.json(
      { error: "Failed to get user credits" },
      { status: 500 }
    )
  }
}

/**
 * POST - Grant credits to a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params

    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    if (!body.amount || typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json(
        { error: "Invalid credit amount" },
        { status: 400 }
      )
    }

    const input: GrantCreditsInput = {
      userId,
      userEmail: body.userEmail,
      creditsAmount: body.amount,
      creditType: body.creditType || "purchased", // purchased = never expires
      grantReason: body.reason || "Admin credit grant",
      notes: body.notes,
    }

    // Create the grant record
    const grant = await grantCredits(
      input,
      currentUser.id,
      currentUser.primaryEmail || undefined
    )

    // Immediately apply the credits if requested (default behavior)
    if (body.applyImmediately !== false) {
      const success = await addUserPurchasedCredits(userId, input.creditsAmount)

      if (success) {
        // Mark grant as applied
        const { sql } = await import("@/lib/neon")
        await sql`
          UPDATE credit_grants
          SET status = 'applied', applied_at = NOW()
          WHERE id = ${grant.id}
        `
      }
    }

    // Log activity
    await logPlatformActivity(
      "grant_credits",
      {
        amount: input.creditsAmount,
        creditType: input.creditType,
        reason: input.grantReason,
        grantId: grant.id,
      },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "user",
        targetId: userId,
      }
    )

    // Get updated balance
    const balance = await getUserCreditBalance(userId)

    return NextResponse.json({
      success: true,
      grant,
      balance,
    })
  } catch (error) {
    console.error("[super-admin/credits] Error granting credits:", error)
    return NextResponse.json(
      { error: "Failed to grant credits" },
      { status: 500 }
    )
  }
}
