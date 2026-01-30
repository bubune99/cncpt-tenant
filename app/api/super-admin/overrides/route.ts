/**
 * Super Admin Overrides List API
 *
 * List all active user overrides
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { listAllOverrides, listCreditGrants } from "@/lib/user-overrides"

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
