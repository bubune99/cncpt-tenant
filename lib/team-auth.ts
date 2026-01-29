import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"

// =============================================================================
// TYPES
// =============================================================================

export type TeamRole = "owner" | "admin" | "member" | "viewer"

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
// PERMISSION DEFINITIONS
// =============================================================================

/**
 * Default permissions for each team role
 */
export const TEAM_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ["*"],
  admin: [
    "team.view",
    "team.edit",
    "members.view",
    "members.invite",
    "members.remove",
    "members.edit_role",
    "invitations.view",
    "invitations.create",
    "invitations.cancel",
    "settings.view",
    "settings.edit",
    "subdomains.view",
    "subdomains.add",
    "subdomains.remove",
    "subdomains.edit",
  ],
  member: [
    "team.view",
    "members.view",
    "invitations.view",
    "settings.view",
    "subdomains.view",
    "subdomains.edit",
  ],
  viewer: ["team.view", "members.view", "subdomains.view"],
}

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "*": "Full access to all team features",
  "team.view": "View team information",
  "team.edit": "Edit team details (name, description, logo)",
  "team.delete": "Delete the team",
  "members.view": "View team members",
  "members.invite": "Invite new members",
  "members.remove": "Remove members from team",
  "members.edit_role": "Change member roles",
  "invitations.view": "View pending invitations",
  "invitations.create": "Send invitations",
  "invitations.cancel": "Cancel pending invitations",
  "settings.view": "View team settings",
  "settings.edit": "Edit team settings",
  "subdomains.view": "View shared subdomains",
  "subdomains.add": "Share subdomains with team",
  "subdomains.remove": "Remove subdomains from team",
  "subdomains.edit": "Edit content on shared subdomains",
}

// =============================================================================
// CORE FUNCTIONS
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

/**
 * Get all effective permissions for a role + custom permissions
 */
export function getEffectivePermissions(
  role: TeamRole,
  customPermissions: string[] = []
): string[] {
  const rolePermissions = TEAM_PERMISSIONS[role] || []

  // Combine role permissions with custom permissions
  const allPermissions = new Set([...rolePermissions, ...customPermissions])

  return Array.from(allPermissions)
}

/**
 * Check if a permission set includes a required permission
 */
export function hasTeamPermission(
  permissions: string[],
  requiredPermission: string
): boolean {
  // Wildcard grants all permissions
  if (permissions.includes("*")) return true

  // Check exact match
  if (permissions.includes(requiredPermission)) return true

  // Check wildcard patterns (e.g., "members.*" matches "members.view")
  for (const perm of permissions) {
    if (perm.endsWith(".*")) {
      const prefix = perm.slice(0, -2)
      if (requiredPermission.startsWith(prefix + ".")) return true
    }
  }

  return false
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

// =============================================================================
// ROLE HELPERS
// =============================================================================

/**
 * Check if a role can manage another role
 */
export function canManageRole(
  currentRole: TeamRole,
  targetRole: TeamRole
): boolean {
  const roleHierarchy: Record<TeamRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
    viewer: 0,
  }

  // Can only manage roles lower in hierarchy
  return roleHierarchy[currentRole] > roleHierarchy[targetRole]
}

/**
 * Get available roles that a user can assign based on their role
 */
export function getAssignableRoles(currentRole: TeamRole): TeamRole[] {
  switch (currentRole) {
    case "owner":
      return ["admin", "member", "viewer"]
    case "admin":
      return ["member", "viewer"]
    default:
      return []
  }
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: TeamRole): string {
  switch (role) {
    case "owner":
      return "Owner"
    case "admin":
      return "Admin"
    case "member":
      return "Member"
    case "viewer":
      return "Viewer"
    default:
      return role
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: TeamRole): string {
  switch (role) {
    case "owner":
      return "Full control over the team, including deletion and ownership transfer"
    case "admin":
      return "Can manage members, invitations, and team settings"
    case "member":
      return "Can view and edit shared subdomains"
    case "viewer":
      return "Read-only access to team and shared subdomains"
    default:
      return ""
  }
}
