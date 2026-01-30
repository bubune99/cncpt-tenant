import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { prisma } from "@cncpt/cms/lib"

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
    const result = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId },
      },
    })

    if (!result) return null

    return {
      id: result.id,
      teamId: result.teamId,
      userId: result.userId,
      role: result.role as TeamRole,
      customPermissions: Array.isArray(result.customPermissions)
        ? (result.customPermissions as string[])
        : [],
      invitedBy: result.invitedBy,
      invitedAt: result.invitedAt,
      acceptedAt: result.acceptedAt,
      createdAt: result.createdAt,
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
    // First check if user owns the subdomain using Prisma
    const ownerCheck = await prisma.subdomain.findFirst({
      where: {
        subdomain,
        userId,
      },
      select: { id: true },
    })

    if (ownerCheck) {
      return { hasAccess: true, accessType: "owner", accessLevel: "admin" }
    }

    // Check team access using Prisma
    const teamAccess = await prisma.teamSubdomain.findFirst({
      where: {
        subdomain,
        team: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        team: {
          include: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    })

    if (!teamAccess) {
      return { hasAccess: false, accessType: null }
    }

    const teamAccessLevel = teamAccess.accessLevel
    const userRole = teamAccess.team.members[0]?.role as TeamRole

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
        teamId: teamAccess.teamId,
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
    // Get owned subdomains using Prisma
    const ownedResult = await prisma.subdomain.findMany({
      where: { userId },
      select: { subdomain: true },
    })

    const owned = ownedResult.map((row) => ({
      subdomain: row.subdomain,
      accessType: "owner" as const,
    }))

    // Get team-shared subdomains using Prisma
    const teamResult = await prisma.teamSubdomain.findMany({
      where: {
        team: {
          deletedAt: null,
          members: {
            some: { userId },
          },
        },
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    })

    const teamShared = teamResult.map((row) => ({
      subdomain: row.subdomain,
      accessType: "team" as const,
      teamId: row.team.id,
      teamName: row.team.name,
      accessLevel: row.accessLevel,
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
