/**
 * Super Admin Overrides API
 *
 * GET - List all active user overrides
 * POST - Create a new user override
 * DELETE - Revoke an existing override
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { listAllOverrides, createUserOverride, revokeUserOverride } from "@/lib/user-overrides"

export const dynamic = 'force-dynamic'

/**
 * GET - List all user overrides
 */
export async function GET(request: NextRequest) {
  try {
    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const includeRevoked = searchParams.get("includeRevoked") === "true"
    const limit = parseInt(searchParams.get("limit") || "100", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    const overrides = await listAllOverrides({
      includeRevoked,
      limit,
      offset,
    })

    return NextResponse.json({
      overrides,
      count: overrides.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[super-admin/overrides] Error listing overrides:", error)
    return NextResponse.json(
      { error: "Failed to list overrides" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new user override
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      userEmail,
      unlimitedSubdomains,
      unlimitedAiCredits,
      bypassPayment,
      subdomainLimitOverride,
      monthlyCreditAllocation,
      grantReason,
      expiresInDays,
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Calculate expiration date if days provided
    let expiresAt: Date | undefined
    if (expiresInDays && parseInt(expiresInDays) > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays))
    }

    const override = await createUserOverride(
      {
        userId,
        userEmail,
        unlimitedSubdomains: unlimitedSubdomains || false,
        unlimitedAiCredits: unlimitedAiCredits || false,
        bypassPayment: bypassPayment || false,
        subdomainLimitOverride: subdomainLimitOverride || undefined,
        monthlyCreditAllocation: monthlyCreditAllocation || undefined,
        grantReason,
        expiresAt,
      },
      currentUser.id,
      currentUser.primaryEmail || undefined
    )

    return NextResponse.json({ success: true, override })
  } catch (error) {
    console.error("[super-admin/overrides] Error creating override:", error)
    return NextResponse.json(
      { error: "Failed to create override" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke a user override
 */
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await revokeUserOverride(
      userId,
      currentUser.id,
      "Revoked by super admin"
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[super-admin/overrides] Error revoking override:", error)
    return NextResponse.json(
      { error: "Failed to revoke override" },
      { status: 500 }
    )
  }
}
