import { NextRequest, NextResponse } from "next/server"
import { syncUserToCms, recordSignIn } from "@/lib/auth-sync"

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

    // Upsert into the `users` table via the Prisma User model. (The `users`
    // table is owned by the CMS User model — keyed on a cuid `id` + a separate
    // `stack_auth_id`. The old raw-SQL path here wrote platform columns
    // (avatar_url/status/tier_id) and used the Stack Auth id AS `users.id`,
    // neither of which match this schema, so it 500'd on every login.)
    const user = await syncUserToCms({
      id: stackAuthId,
      primaryEmail: email,
      displayName: name || null,
      profileImageUrl: avatar || null,
    })

    // Record the sign-in (best-effort — already swallows its own errors).
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
        // tier/status live in the platform billing layer which isn't part of
        // this deployment's `users` schema — return sensible defaults.
        status: "active",
        tier_id: null,
      },
    })
  } catch (error) {
    console.error("[auth/sync-platform] Error:", error)

    // Never fail the login flow if platform sync fails — return 200 with a
    // soft error so the client can proceed (a 500 here blocks the dashboard).
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync user",
    })
  }
}
