import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"
import { syncAllUsers } from "@/lib/auth-sync"

export const dynamic = "force-dynamic"

/**
 * POST /api/super-admin/users/sync
 *
 * Trigger a full sync of all Stack Auth users to the local database.
 * Fetches all users from Stack Auth and upserts them into both:
 * - Platform `users` table (raw SQL)
 * - CMS `User` model (Prisma)
 *
 * Protected by super admin auth.
 *
 * Returns: { synced, created, updated, errors, durationMs }
 */
export async function POST(request: NextRequest) {
  try {
    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log(
      `[super-admin/sync] Full user sync initiated by ${currentUser.primaryEmail}`
    )

    // Run the sync
    const report = await syncAllUsers()

    // Log the activity
    await logPlatformActivity(
      "users.sync",
      {
        total: report.total,
        created: report.created,
        updated: report.updated,
        errorCount: report.errors.length,
        durationMs: report.durationMs,
      },
      {
        actorId: currentUser.id,
        actorEmail: currentUser.primaryEmail || undefined,
        targetType: "system",
        targetId: "user-sync",
      }
    )

    console.log(
      `[super-admin/sync] Sync complete: ${report.created} created, ${report.updated} updated, ${report.errors.length} errors (${report.durationMs}ms)`
    )

    return NextResponse.json({
      success: true,
      synced: report.created + report.updated,
      created: report.created,
      updated: report.updated,
      errors: report.errors,
      durationMs: report.durationMs,
    })
  } catch (error) {
    console.error("[super-admin/sync] Error:", error)
    return NextResponse.json(
      { error: "Failed to sync users" },
      { status: 500 }
    )
  }
}
