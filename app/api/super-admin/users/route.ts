import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"

export async function GET(request: NextRequest) {
  try {
    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Get users from Stack Auth
    // Note: Stack Auth may have pagination limits, adjust as needed
    const users = await stackServerApp.listUsers()

    // Filter by search if provided
    let filteredUsers = users
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = users.filter(
        (u) =>
          u.primaryEmail?.toLowerCase().includes(searchLower) ||
          u.displayName?.toLowerCase().includes(searchLower)
      )
    }

    // Get additional data from our database
    const userIds = filteredUsers.map((u) => u.id)

    // Get subdomain counts for each user
    const subdomainCounts = await sql`
      SELECT user_id, COUNT(*) as count
      FROM subdomains
      WHERE user_id = ANY(${userIds})
      GROUP BY user_id
    `

    const subdomainCountMap = new Map(
      subdomainCounts.map((r) => [r.user_id as string, parseInt(r.count as string)])
    )

    // Get admin status
    const adminUsers = await sql`
      SELECT user_id FROM admin_users WHERE user_id = ANY(${userIds})
    `
    const adminUserIds = new Set(adminUsers.map((r) => r.user_id as string))

    // Get super admin status
    const superAdmins = await sql`
      SELECT user_id FROM super_admins WHERE user_id = ANY(${userIds}) AND revoked_at IS NULL
    `
    const superAdminIds = new Set(superAdmins.map((r) => r.user_id as string))

    // Paginate
    const total = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    const enrichedUsers = paginatedUsers.map((u) => ({
      id: u.id,
      email: u.primaryEmail || "",
      displayName: u.displayName || null,
      createdAt: u.signedUpAt,
      isAdmin: adminUserIds.has(u.id),
      isSuperAdmin: superAdminIds.has(u.id),
      subdomainCount: subdomainCountMap.get(u.id) || 0,
    }))

    return NextResponse.json({
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[super-admin/users] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
