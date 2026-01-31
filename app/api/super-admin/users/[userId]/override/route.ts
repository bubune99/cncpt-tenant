/**
 * Super Admin User Override API
 *
 * Allows super admins to grant special permissions to users:
 * - Unlimited subdomains
 * - Unlimited AI credits
 * - Payment bypass
 * - Custom subdomain limits
 * - Monthly credit allocations
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import {
  getUserOverride,
  createUserOverride,
  revokeUserOverride,
  type CreateOverrideInput,
} from "@/lib/user-overrides"

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ userId: string }>
}

/**
 * GET - Get current override for a user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params

    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const override = await getUserOverride(userId)

    return NextResponse.json({
      override,
      hasOverride: override !== null,
    })
  } catch (error) {
    console.error("[super-admin/override] Error getting override:", error)
    return NextResponse.json(
      { error: "Failed to get user override" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update user override
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
    const input: CreateOverrideInput = {
      userId,
      userEmail: body.userEmail,
      unlimitedSubdomains: body.unlimitedSubdomains === true,
      unlimitedAiCredits: body.unlimitedAiCredits === true,
      bypassPayment: body.bypassPayment === true,
      subdomainLimitOverride: body.subdomainLimitOverride,
      monthlyCreditAllocation: body.monthlyCreditAllocation,
      grantReason: body.grantReason,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      notes: body.notes,
    }

    const override = await createUserOverride(
      input,
      currentUser.id,
      currentUser.primaryEmail || undefined
    )

    // Log activity
    await logPlatformActivity(
      "create_user_override",
      {
        unlimitedSubdomains: input.unlimitedSubdomains,
        unlimitedAiCredits: input.unlimitedAiCredits,
        bypassPayment: input.bypassPayment,
        subdomainLimitOverride: input.subdomainLimitOverride,
        monthlyCreditAllocation: input.monthlyCreditAllocation,
        reason: input.grantReason,
      },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "user",
        targetId: userId,
      }
    )

    return NextResponse.json({
      success: true,
      override,
    })
  } catch (error) {
    console.error("[super-admin/override] Error creating override:", error)
    return NextResponse.json(
      { error: "Failed to create user override" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke user override
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params

    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const revokeReason = body.reason || "Revoked by super admin"

    await revokeUserOverride(userId, currentUser.id, revokeReason)

    // Log activity
    await logPlatformActivity(
      "revoke_user_override",
      { reason: revokeReason },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "user",
        targetId: userId,
      }
    )

    return NextResponse.json({
      success: true,
      message: "User override revoked",
    })
  } catch (error) {
    console.error("[super-admin/override] Error revoking override:", error)
    return NextResponse.json(
      { error: "Failed to revoke user override" },
      { status: 500 }
    )
  }
}
