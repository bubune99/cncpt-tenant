import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"

// =============================================================================
// TYPES
// =============================================================================

export interface SuperAdmin {
  id: string
  userId: string
  email: string
  grantedBy: string | null
  grantedAt: Date
  revokedAt: Date | null
  permissions: string[]
}

export interface SuperAdminContext {
  user: {
    id: string
    email: string
    displayName: string | null
  }
  permissions: string[]
  isSuperAdmin: true
}

export interface PlatformActivityLog {
  id: string
  actorId: string | null
  actorEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Require super admin access for a route
 * Redirects to /dashboard if user is not a super admin
 */
export async function requireSuperAdmin(): Promise<SuperAdminContext> {
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await sql`
    SELECT id, user_id, email, granted_by, granted_at, revoked_at, permissions
    FROM super_admins
    WHERE user_id = ${user.id} AND revoked_at IS NULL
  `

  if (result.length === 0) {
    // Check SUPER_ADMIN_EMAILS env var as fallback
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(",") || []
    const userEmail = user.primaryEmail || ""

    if (superAdminEmails.includes(userEmail)) {
      // Auto-provision super admin from env var
      await sql`
        INSERT INTO super_admins (user_id, email, granted_by, permissions)
        VALUES (${user.id}, ${userEmail}, 'system', '["*"]')
        ON CONFLICT (user_id) DO UPDATE SET revoked_at = NULL
      `

      return {
        user: {
          id: user.id,
          email: userEmail,
          displayName: user.displayName,
        },
        permissions: ["*"],
        isSuperAdmin: true,
      }
    }

    redirect("/dashboard")
  }

  const superAdmin = result[0]
  const permissions = Array.isArray(superAdmin.permissions)
    ? superAdmin.permissions
    : JSON.parse(superAdmin.permissions as string)

  return {
    user: {
      id: user.id,
      email: user.primaryEmail || superAdmin.email,
      displayName: user.displayName,
    },
    permissions,
    isSuperAdmin: true,
  }
}

/**
 * Check if a user is a super admin (non-blocking)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM super_admins
      WHERE user_id = ${userId} AND revoked_at IS NULL
      LIMIT 1
    `

    if (result.length > 0) {
      return true
    }

    // Check SUPER_ADMIN_EMAILS env var as fallback
    const user = await stackServerApp.getUser({ userId })
    if (!user) return false

    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(",") || []
    return superAdminEmails.includes(user.primaryEmail || "")
  } catch (error) {
    console.error("[super-admin] Error checking super admin status:", error)
    return false
  }
}

/**
 * Get super admin record by user ID
 */
export async function getSuperAdmin(userId: string): Promise<SuperAdmin | null> {
  try {
    const result = await sql`
      SELECT id, user_id, email, granted_by, granted_at, revoked_at, permissions
      FROM super_admins
      WHERE user_id = ${userId} AND revoked_at IS NULL
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id as string,
      userId: row.user_id as string,
      email: row.email as string,
      grantedBy: row.granted_by as string | null,
      grantedAt: new Date(row.granted_at as string),
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
      permissions: Array.isArray(row.permissions)
        ? row.permissions
        : JSON.parse(row.permissions as string),
    }
  } catch (error) {
    console.error("[super-admin] Error getting super admin:", error)
    return null
  }
}

/**
 * Get all super admins
 */
export async function getAllSuperAdmins(): Promise<SuperAdmin[]> {
  try {
    const result = await sql`
      SELECT id, user_id, email, granted_by, granted_at, revoked_at, permissions
      FROM super_admins
      WHERE revoked_at IS NULL
      ORDER BY granted_at ASC
    `

    return result.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      email: row.email as string,
      grantedBy: row.granted_by as string | null,
      grantedAt: new Date(row.granted_at as string),
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
      permissions: Array.isArray(row.permissions)
        ? row.permissions
        : JSON.parse(row.permissions as string),
    }))
  } catch (error) {
    console.error("[super-admin] Error getting all super admins:", error)
    return []
  }
}

/**
 * Grant super admin privileges to a user
 */
export async function grantSuperAdmin(
  userId: string,
  email: string,
  grantedBy: string,
  permissions: string[] = ["*"]
): Promise<SuperAdmin | null> {
  try {
    const result = await sql`
      INSERT INTO super_admins (user_id, email, granted_by, permissions)
      VALUES (${userId}, ${email}, ${grantedBy}, ${JSON.stringify(permissions)})
      ON CONFLICT (user_id) DO UPDATE SET
        revoked_at = NULL,
        granted_by = ${grantedBy},
        granted_at = NOW(),
        permissions = ${JSON.stringify(permissions)}
      RETURNING id, user_id, email, granted_by, granted_at, revoked_at, permissions
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id as string,
      userId: row.user_id as string,
      email: row.email as string,
      grantedBy: row.granted_by as string | null,
      grantedAt: new Date(row.granted_at as string),
      revokedAt: null,
      permissions: Array.isArray(row.permissions)
        ? row.permissions
        : JSON.parse(row.permissions as string),
    }
  } catch (error) {
    console.error("[super-admin] Error granting super admin:", error)
    return null
  }
}

/**
 * Revoke super admin privileges from a user
 */
export async function revokeSuperAdmin(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE super_admins
      SET revoked_at = NOW()
      WHERE user_id = ${userId} AND revoked_at IS NULL
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("[super-admin] Error revoking super admin:", error)
    return false
  }
}

// =============================================================================
// ACTIVITY LOGGING
// =============================================================================

/**
 * Log a platform activity for audit purposes
 */
export async function logPlatformActivity(
  action: string,
  details: Record<string, unknown> = {},
  options: {
    actorId?: string
    actorEmail?: string
    targetType?: string
    targetId?: string
  } = {}
): Promise<void> {
  try {
    // Try to get IP and user agent from headers
    let ipAddress: string | null = null
    let userAgent: string | null = null

    try {
      const headersList = await headers()
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        null
      userAgent = headersList.get("user-agent") || null
    } catch {
      // Headers not available in this context
    }

    // If no actor provided, try to get current user
    let actorId = options.actorId
    let actorEmail = options.actorEmail

    if (!actorId) {
      try {
        const user = await stackServerApp.getUser()
        if (user) {
          actorId = user.id
          actorEmail = user.primaryEmail || undefined
        }
      } catch {
        // User not available
      }
    }

    await sql`
      INSERT INTO platform_activity_log (
        actor_id, actor_email, action, target_type, target_id, details, ip_address, user_agent
      ) VALUES (
        ${actorId || null},
        ${actorEmail || null},
        ${action},
        ${options.targetType || null},
        ${options.targetId || null},
        ${JSON.stringify(details)},
        ${ipAddress},
        ${userAgent}
      )
    `
  } catch (error) {
    // Don't throw - logging should not break the main flow
    console.error("[super-admin] Error logging activity:", error)
  }
}

/**
 * Get platform activity logs with pagination and filters
 */
export async function getPlatformActivityLogs(options: {
  page?: number
  limit?: number
  action?: string
  actorId?: string
  targetType?: string
  targetId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{ logs: PlatformActivityLog[]; total: number }> {
  const {
    page = 1,
    limit = 50,
    action,
    actorId,
    targetType,
    targetId,
    startDate,
    endDate,
  } = options

  const offset = (page - 1) * limit

  try {
    // Build dynamic WHERE conditions
    const conditions: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (action) {
      conditions.push(`action = $${paramIndex}`)
      values.push(action)
      paramIndex++
    }

    if (actorId) {
      conditions.push(`actor_id = $${paramIndex}`)
      values.push(actorId)
      paramIndex++
    }

    if (targetType) {
      conditions.push(`target_type = $${paramIndex}`)
      values.push(targetType)
      paramIndex++
    }

    if (targetId) {
      conditions.push(`target_id = $${paramIndex}`)
      values.push(targetId)
      paramIndex++
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`)
      values.push(startDate.toISOString())
      paramIndex++
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`)
      values.push(endDate.toISOString())
      paramIndex++
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Use raw query for dynamic WHERE clause
    const logsResult = await sql`
      SELECT id, actor_id, actor_email, action, target_type, target_id, details, ip_address, user_agent, created_at
      FROM platform_activity_log
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM platform_activity_log
      ${sql.unsafe(whereClause)}
    `

    const logs = logsResult.map((row) => ({
      id: row.id as string,
      actorId: row.actor_id as string | null,
      actorEmail: row.actor_email as string | null,
      action: row.action as string,
      targetType: row.target_type as string | null,
      targetId: row.target_id as string | null,
      details: (row.details as Record<string, unknown>) || {},
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null,
      createdAt: new Date(row.created_at as string),
    }))

    return {
      logs,
      total: parseInt(countResult[0]?.total as string) || 0,
    }
  } catch (error) {
    console.error("[super-admin] Error getting activity logs:", error)
    return { logs: [], total: 0 }
  }
}

// =============================================================================
// PERMISSION HELPERS
// =============================================================================

/**
 * Check if a super admin has a specific permission
 */
export function hasPermission(
  permissions: string[],
  requiredPermission: string
): boolean {
  // Wildcard grants all permissions
  if (permissions.includes("*")) return true

  // Check exact match
  if (permissions.includes(requiredPermission)) return true

  // Check wildcard patterns (e.g., "users.*" matches "users.view")
  for (const perm of permissions) {
    if (perm.endsWith(".*")) {
      const prefix = perm.slice(0, -2)
      if (requiredPermission.startsWith(prefix + ".")) return true
    }
  }

  return false
}

/**
 * Super admin permission constants
 */
export const SUPER_ADMIN_PERMISSIONS = {
  ALL: "*",
  // User management
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  USERS_IMPERSONATE: "users.impersonate",
  // Team management
  TEAMS_VIEW: "teams.view",
  TEAMS_EDIT: "teams.edit",
  TEAMS_DELETE: "teams.delete",
  // Subdomain management
  SUBDOMAINS_VIEW: "subdomains.view",
  SUBDOMAINS_TRANSFER: "subdomains.transfer",
  SUBDOMAINS_DELETE: "subdomains.delete",
  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  // Activity log
  ACTIVITY_VIEW: "activity.view",
  // Platform settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",
  // Super admin management
  ADMINS_MANAGE: "admins.manage",
} as const
