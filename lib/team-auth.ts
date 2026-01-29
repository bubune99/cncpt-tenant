import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"

// Re-export client-safe utilities for backward compatibility
export {
  type TeamRole,
  TEAM_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  getEffectivePermissions,
  hasTeamPermission,
  canManageRole,
  getAssignableRoles,
  getRoleLabel,
  getRoleDescription,
} from "./team-utils"

import type { TeamRole } from "./team-utils"
import { getEffectivePermissions, hasTeamPermission } from "./team-utils"

// =============================================================================
// TYPES (Server-only additions)
// =============================================================================

export interface TeamMembership {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  customPermissions: string[]
  invitedBy: string | null
  invitedAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

export interface TeamAccessContext {
  user: {
    id: string
    email: string
    displayName: string | null
  }
  membership: TeamMembership
  permissions: string[]
}

// =============================================================================
// CORE FUNCTIONS (Server-only)
// =============================================================================

/**
 * Get a user's membership in a team
 */
export async function getTeamMembership(
  userId: string,
  teamId: string
): Promise<TeamMembership | null> {
  try {
    const result = await sql`
      SELECT
        id, team_id, user_id, role, custom_permissions,
        invited_by, invited_at, accepted_at, created_at
      FROM team_members
      WHERE user_id = ${userId} AND team_id = ${teamId}
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id as string,
      teamId: row.team_id as string,
      userId: row.user_id as string,
      role: row.role as TeamRole,
      customPermissions: Array.isArray(row.custom_permissions)
        ? (row.custom_permissions as string[])
        : JSON.parse((row.custom_permissions as string) || "[]"),
      invitedBy: row.invited_by as string | null,
      invitedAt: new Date(row.invited_at as string),
      acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
      createdAt: new Date(row.created_at as string),
    }
  } catch (error) {
    console.error("[team-auth] Error getting team membership:", error)
    return null
  }
}

/**
 * Require access to a team, optionally with a specific permission
 * Redirects to /dashboard if access is denied
 */
export async function requireTeamAccess(
  teamId: string,
  permission?: string
): Promise<TeamAccessContext> {
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/login")
  }

  const membership = await getTeamMembership(user.id, teamId)

  if (!membership) {
    redirect("/dashboard/teams")
  }

  const permissions = getEffectivePermissions(
    membership.role,
    membership.customPermissions
  )

  if (permission && !hasTeamPermission(permissions, permission)) {
    redirect(`/dashboard/teams/${teamId}`)
  }

  return {
    user: {
      id: user.id,
      email: user.primaryEmail || "",
      displayName: user.displayName,
    },
    membership,
    permissions,
  }
}

/**
 * Check if user has access to a team (non-blocking)
 */
export async function hasTeamAccess(
  userId: string,
  teamId: string,
  permission?: string
): Promise<boolean> {
  try {
    const membership = await getTeamMembership(userId, teamId)

    if (!membership) return false

    if (permission) {
      const permissions = getEffectivePermissions(
        membership.role,
        membership.customPermissions
      )
      return hasTeamPermission(permissions, permission)
    }

    return true
  } catch (error) {
    console.error("[team-auth] Error checking team access:", error)
    return false
  }
}

// =============================================================================
// SUBDOMAIN ACCESS
// =============================================================================

/**
 * Check if a user can access a subdomain (either as owner or via team)
 */
export async function canAccessSubdomain(
  userId: string,
  subdomain: string,
  requiredAccessLevel: "view" | "edit" | "admin" = "view"
): Promise<{
  hasAccess: boolean
  accessType: "owner" | "team" | null
  teamId?: string
  accessLevel?: string
}> {
  try {
    // First check if user owns the subdomain
    const ownerCheck = await sql`
      SELECT user_id FROM subdomains WHERE subdomain = ${subdomain} AND user_id = ${userId}
    `

    if (ownerCheck.length > 0) {
      return { hasAccess: true, accessType: "owner" }
    }

    // Check team access
    const teamAccess = await sql`
      SELECT ts.team_id, ts.access_level, tm.role
      FROM team_subdomains ts
      JOIN team_members tm ON ts.team_id = tm.team_id
      WHERE ts.subdomain = ${subdomain} AND tm.user_id = ${userId}
    `

    if (teamAccess.length === 0) {
      return { hasAccess: false, accessType: null }
    }

    const row = teamAccess[0]
    const teamAccessLevel = row.access_level as string
    const userRole = row.role as TeamRole

    // Check if user's team membership + subdomain access level permits the action
    const accessLevelHierarchy = { view: 0, edit: 1, admin: 2 }
    const hasRequiredLevel =
      accessLevelHierarchy[teamAccessLevel as keyof typeof accessLevelHierarchy] >=
      accessLevelHierarchy[requiredAccessLevel]

    // Owners and admins always have full access regardless of subdomain access level
    const hasRoleOverride = userRole === "owner" || userRole === "admin"

    if (hasRequiredLevel || hasRoleOverride) {
      return {
        hasAccess: true,
        accessType: "team",
        teamId: row.team_id as string,
        accessLevel: teamAccessLevel,
      }
    }

    return { hasAccess: false, accessType: null }
  } catch (error) {
    console.error("[team-auth] Error checking subdomain access:", error)
    return { hasAccess: false, accessType: null }
  }
}

/**
 * Get all subdomains a user can access (owned + team shared)
 */
export async function getUserAccessibleSubdomains(userId: string): Promise<
  Array<{
    subdomain: string
    accessType: "owner" | "team"
    teamId?: string
    teamName?: string
    accessLevel?: string
  }>
> {
  try {
    // Get owned subdomains
    const ownedResult = await sql`
      SELECT subdomain FROM subdomains WHERE user_id = ${userId}
    `

    const owned = ownedResult.map((row) => ({
      subdomain: row.subdomain as string,
      accessType: "owner" as const,
    }))

    // Get team-shared subdomains
    const teamResult = await sql`
      SELECT ts.subdomain, ts.team_id, ts.access_level, t.name as team_name
      FROM team_subdomains ts
      JOIN team_members tm ON ts.team_id = tm.team_id
      JOIN teams t ON ts.team_id = t.id
      WHERE tm.user_id = ${userId} AND t.deleted_at IS NULL
    `

    const teamShared = teamResult.map((row) => ({
      subdomain: row.subdomain as string,
      accessType: "team" as const,
      teamId: row.team_id as string,
      teamName: row.team_name as string,
      accessLevel: row.access_level as string,
    }))

    // Combine and deduplicate (owned takes precedence)
    const ownedSubdomains = new Set(owned.map((o) => o.subdomain))
    const uniqueTeamShared = teamShared.filter(
      (t) => !ownedSubdomains.has(t.subdomain)
    )

    return [...owned, ...uniqueTeamShared]
  } catch (error) {
    console.error("[team-auth] Error getting accessible subdomains:", error)
    return []
  }
}
