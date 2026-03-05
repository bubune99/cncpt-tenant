import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { isSuperAdmin, logPlatformActivity } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check super admin access
    const currentUser = await stackServerApp.getUser()
    if (!currentUser || !(await isSuperAdmin(currentUser.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all" // all, active, suspended, deactivated
    const role = searchParams.get("role") || "all" // all, admin, super_admin, user
    const sortBy = searchParams.get("sortBy") || "createdAt" // name, email, createdAt, lastLogin
    const sortOrder = searchParams.get("sortOrder") || "desc" // asc, desc
    const offset = (page - 1) * limit

    // Get users from Stack Auth
    const users = await stackServerApp.listUsers()

    // Get additional data from our database — batch queries for all users
    const allUserIds = users.map((u) => u.id)

    // Get subdomain counts for each user
    let subdomainCountMap = new Map<string, number>()
    try {
      const subdomainCounts = await sql`
        SELECT user_id, COUNT(*) as count
        FROM subdomains
        WHERE user_id = ANY(${allUserIds})
        GROUP BY user_id
      `
      subdomainCountMap = new Map(
        subdomainCounts.map((r) => [r.user_id as string, parseInt(r.count as string)])
      )
    } catch {
      // Table might not exist
    }

    // Get admin status
    let adminUserIds = new Set<string>()
    try {
      const adminUsers = await sql`
        SELECT user_id FROM admin_users WHERE user_id = ANY(${allUserIds})
      `
      adminUserIds = new Set(adminUsers.map((r) => r.user_id as string))
    } catch {
      // Table might not exist
    }

    // Get super admin status
    let superAdminIds = new Set<string>()
    try {
      const superAdmins = await sql`
        SELECT user_id FROM super_admins WHERE user_id = ANY(${allUserIds}) AND revoked_at IS NULL
      `
      superAdminIds = new Set(superAdmins.map((r) => r.user_id as string))
    } catch {
      // Table might not exist
    }

    // Get user metadata (suspension, deletion, notes, tier override)
    let metadataMap = new Map<string, {
      suspendedAt: string | null
      suspensionReason: string | null
      deletedAt: string | null
      adminNotes: string | null
      tierOverride: string | null
    }>()
    try {
      const metadata = await sql`
        SELECT user_id, suspended_at, suspension_reason, deleted_at, admin_notes, tier_override
        FROM platform_user_metadata
        WHERE user_id = ANY(${allUserIds})
      `
      metadataMap = new Map(
        metadata.map((r) => [r.user_id as string, {
          suspendedAt: r.suspended_at as string | null,
          suspensionReason: r.suspension_reason as string | null,
          deletedAt: r.deleted_at as string | null,
          adminNotes: r.admin_notes as string | null,
          tierOverride: r.tier_override as string | null,
        }])
      )
    } catch {
      // Table might not exist yet
    }

    // Get AI credit balances
    let creditMap = new Map<string, number>()
    try {
      const credits = await sql`
        SELECT user_id, COALESCE(monthly_balance, 0) + COALESCE(purchased_balance, 0) as total_balance
        FROM ai_credit_balances
        WHERE user_id = ANY(${allUserIds})
      `
      creditMap = new Map(
        credits.map((r) => [r.user_id as string, parseInt(r.total_balance as string)])
      )
    } catch {
      // Table might not exist
    }

    // Get tier info from platform_clients
    let tierMap = new Map<string, string>()
    try {
      const clientTiers = await sql`
        SELECT pc.user_id, st.display_name as tier_name
        FROM platform_clients pc
        LEFT JOIN subscription_tiers st ON pc.tier_id = st.id
        WHERE pc.user_id = ANY(${allUserIds})
      `
      tierMap = new Map(
        clientTiers.map((r) => [r.user_id as string, r.tier_name as string || ""])
      )
    } catch {
      // Tables might not exist
    }

    // Enrich all users first, then filter/sort
    const enrichedUsers = users.map((u) => {
      const meta = metadataMap.get(u.id)
      const isSuspended = !!meta?.suspendedAt
      const isDeleted = !!meta?.deletedAt
      let userStatus: "active" | "suspended" | "deactivated" = "active"
      if (isDeleted) userStatus = "deactivated"
      else if (isSuspended) userStatus = "suspended"

      return {
        id: u.id,
        email: u.primaryEmail || "",
        displayName: u.displayName || null,
        profileImageUrl: u.profileImageUrl || null,
        createdAt: u.signedUpAt?.toISOString() || null,
        lastActiveAt: u.lastActiveAt?.toISOString() || null,
        isAdmin: adminUserIds.has(u.id),
        isSuperAdmin: superAdminIds.has(u.id),
        subdomainCount: subdomainCountMap.get(u.id) || 0,
        status: userStatus,
        suspendedAt: meta?.suspendedAt || null,
        suspensionReason: meta?.suspensionReason || null,
        deletedAt: meta?.deletedAt || null,
        adminNotes: meta?.adminNotes || null,
        tierOverride: meta?.tierOverride || null,
        tierName: tierMap.get(u.id) || meta?.tierOverride || null,
        creditBalance: creditMap.get(u.id) || 0,
      }
    })

    // Filter by search
    let filteredUsers = enrichedUsers
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          u.displayName?.toLowerCase().includes(searchLower)
      )
    }

    // Filter by status
    if (status !== "all") {
      filteredUsers = filteredUsers.filter((u) => u.status === status)
    }

    // Filter by role
    if (role === "admin") {
      filteredUsers = filteredUsers.filter((u) => u.isAdmin && !u.isSuperAdmin)
    } else if (role === "super_admin") {
      filteredUsers = filteredUsers.filter((u) => u.isSuperAdmin)
    } else if (role === "user") {
      filteredUsers = filteredUsers.filter((u) => !u.isAdmin && !u.isSuperAdmin)
    }

    // Sort
    filteredUsers.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = (a.displayName || a.email).localeCompare(b.displayName || b.email)
          break
        case "email":
          comparison = a.email.localeCompare(b.email)
          break
        case "lastLogin":
          comparison = (a.lastActiveAt || "").localeCompare(b.lastActiveAt || "")
          break
        case "createdAt":
        default:
          comparison = (a.createdAt || "").localeCompare(b.createdAt || "")
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    // Paginate
    const total = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // Get status counts for filter badges
    const statusCounts = {
      all: enrichedUsers.length,
      active: enrichedUsers.filter((u) => u.status === "active").length,
      suspended: enrichedUsers.filter((u) => u.status === "suspended").length,
      deactivated: enrichedUsers.filter((u) => u.status === "deactivated").length,
    }

    return NextResponse.json({
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts,
    })
  } catch (error) {
    console.error("[super-admin/users] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
