import { NextRequest, NextResponse } from "next/server"
import { syncUserToDb, recordSignIn } from "@/lib/auth-sync"

export const dynamic = "force-dynamic"

/**
 * POST /api/auth/sync-platform
 *
 * Called by the useAuth() hook to sync a Stack Auth user to the platform
 * users table (raw SQL). This ensures the platform DB has a record for
 * every authenticated user, enabling features like:
 * - Subscription/tier management
 * - AI credit balances
 * - Subdomain ownership tracking
 * - Super admin role checks
 *
 * This is a JIT (Just-In-Time) provisioning endpoint — it creates the
 * user record on first login and updates it on subsequent logins.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stackAuthId, email, name, avatar } = body

    if (!stackAuthId || !email) {
      return NextResponse.json(
        { error: "stackAuthId and email are required" },
        { status: 400 }
      )
    }

    // Upsert user into platform users table
    const user = await syncUserToDb({
      id: stackAuthId,
      primaryEmail: email,
      displayName: name || null,
      profileImageUrl: avatar || null,
    })

    // Record the sign-in (updates last_login_at, increments login_count)
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined
    await recordSignIn(stackAuthId, ipAddress)

    // Apply any pending credit grants (non-blocking)
    try {
      const { applyPendingCreditGrants } = await import("@/lib/ai-credits")
      await applyPendingCreditGrants(stackAuthId)
    } catch {
      // Credit system may not be set up yet — not critical
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        tier_id: user.tier_id,
      },
    })
  } catch (error) {
    console.error("[auth/sync-platform] Error:", error)

    // Don't fail the login flow if platform sync fails
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync user",
      },
      { status: 500 }
    )
  }
}
