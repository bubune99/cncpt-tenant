import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { getSyncStatus } from "@/lib/auth-sync"

export const dynamic = "force-dynamic"

/**
 * GET /api/super-admin/sync-status
 *
 * Returns sync health information:
 * - Count of users in Stack Auth vs local DB vs CMS
 * - Orphaned records (in local DB but not Stack Auth)
 * - Missing records (in Stack Auth but not local DB)
 * - Last sync timestamp
 *
 * Protected by super admin auth.
 */
export async function GET(request: NextRequest) {
  try {
    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const status = await getSyncStatus()

    const inSync =
      status.orphanedLocal.length === 0 && status.missingLocal.length === 0

    return NextResponse.json({
      healthy: inSync,
      stackAuthCount: status.stackAuthCount,
      localDbCount: status.localDbCount,
      cmsUserCount: status.cmsUserCount,
      orphanedLocal: status.orphanedLocal,
      orphanedLocalCount: status.orphanedLocal.length,
      missingLocal: status.missingLocal,
      missingLocalCount: status.missingLocal.length,
      lastSyncAt: status.lastSyncAt,
      message: inSync
        ? "All users are in sync"
        : `${status.missingLocal.length} users missing locally, ${status.orphanedLocal.length} orphaned locally`,
    })
  } catch (error) {
    console.error("[super-admin/sync-status] Error:", error)
    return NextResponse.json(
      { error: "Failed to check sync status" },
      { status: 500 }
    )
  }
}
