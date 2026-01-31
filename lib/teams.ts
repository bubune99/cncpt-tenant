import { prisma } from "@/lib/cms/db"
import { stackServerApp } from "@/stack"
import { randomBytes } from "crypto"
import type { TeamRole, TeamMembership } from "./team-auth"
import { Prisma } from "@prisma/client"

// Generate a secure random token
function generateToken(length: number = 32): string {
  return randomBytes(length).toString("base64url").slice(0, length)
}

// =============================================================================
// TYPES
// =============================================================================

export interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  ownerId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  billingEmail: string | null
  tierId: string | null
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface TeamWithMembers extends Team {
  members: TeamMember[]
  memberCount: number
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  email: string
  displayName: string | null
  role: TeamRole
  customPermissions: string[]
  invitedBy: string | null
  invitedAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

export interface TeamInvitation {
  id: string
  teamId: string
  email: string
  role: TeamRole
  token: string
  expiresAt: Date
  invitedBy: string
  acceptedAt: Date | null
  declinedAt: Date | null
  createdAt: Date
  team?: Team
}

export interface TeamSubdomain {
  id: string
  teamId: string
  subdomain: string
  accessLevel: string
  addedBy: string | null
  addedAt: Date
}

// =============================================================================
// TEAM CRUD
// =============================================================================

/**
 * Create a new team
 */
export async function createTeam(
  name: string,
  ownerId: string,
  options: {
    description?: string
    logoUrl?: string
    billingEmail?: string
  } = {}
): Promise<Team | null> {
  try {
    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Check for slug conflicts and add suffix if needed
    let slug = baseSlug
    let suffix = 0
    let isUnique = false

    while (!isUnique) {
      const existing = await prisma.team.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (!existing) {
        isUnique = true
      } else {
        suffix++
        slug = `${baseSlug}-${suffix}`
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        slug,
        description: options.description || null,
        logoUrl: options.logoUrl || null,
        ownerId,
        billingEmail: options.billingEmail || null,
        settings: {},
      },
    })

    // Add owner as team member
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: ownerId,
        role: 'owner',
        acceptedAt: new Date(),
      },
    })

    return mapTeamToInterface(team)
  } catch (error) {
    console.error("[teams] Error creating team:", error)
    return null
  }
}

/**
 * Get a team by ID
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        deletedAt: null,
      },
    })

    if (!team) return null

    return mapTeamToInterface(team)
  } catch (error) {
    console.error("[teams] Error getting team:", error)
    return null
  }
}

/**
 * Get a team by slug
 */
export async function getTeamBySlug(slug: string): Promise<Team | null> {
  try {
    const team = await prisma.team.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    })

    if (!team) return null

    return mapTeamToInterface(team)
  } catch (error) {
    console.error("[teams] Error getting team by slug:", error)
    return null
  }
}

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: string): Promise<TeamWithMembers[]> {
  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    })

    return memberships
      .filter((m) => m.team.deletedAt === null)
      .map((m) => ({
        ...mapTeamToInterface(m.team),
        members: [],
        memberCount: m.team._count.members,
      }))
  } catch (error) {
    console.error("[teams] Error getting user teams:", error)
    return []
  }
}

/**
 * Update a team
 */
export async function updateTeam(
  teamId: string,
  updates: {
    name?: string
    description?: string
    logoUrl?: string
    billingEmail?: string
    settings?: Record<string, unknown>
  }
): Promise<Team | null> {
  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
        ...(updates.billingEmail !== undefined && { billingEmail: updates.billingEmail }),
        ...(updates.settings !== undefined && { settings: updates.settings as Prisma.InputJsonValue }),
      },
    })

    return mapTeamToInterface(team)
  } catch (error) {
    console.error("[teams] Error updating team:", error)
    return null
  }
}

/**
 * Soft delete a team
 */
export async function deleteTeam(teamId: string): Promise<boolean> {
  try {
    await prisma.team.update({
      where: { id: teamId },
      data: { deletedAt: new Date() },
    })

    return true
  } catch (error) {
    console.error("[teams] Error deleting team:", error)
    return false
  }
}

// =============================================================================
// TEAM MEMBERS
// =============================================================================

/**
 * Get all members of a team
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      orderBy: [
        { role: 'asc' }, // owner first, then admin, member, viewer
        { createdAt: 'asc' },
      ],
    })

    // Fetch user details from Stack Auth for each member
    const membersWithDetails = await Promise.all(
      members.map(async (m) => {
        let email = ""
        let displayName: string | null = null

        try {
          const user = await stackServerApp.getUser({ userId: m.userId })
          if (user) {
            email = user.primaryEmail || ""
            displayName = user.displayName
          }
        } catch {
          // User may have been deleted
        }

        const customPermissions = Array.isArray(m.customPermissions)
          ? (m.customPermissions as string[])
          : []

        return {
          id: m.id,
          teamId: m.teamId,
          userId: m.userId,
          email,
          displayName,
          role: m.role as TeamRole,
          customPermissions,
          invitedBy: m.invitedBy,
          invitedAt: m.invitedAt,
          acceptedAt: m.acceptedAt,
          createdAt: m.createdAt,
        }
      })
    )

    return membersWithDetails
  } catch (error) {
    console.error("[teams] Error getting team members:", error)
    return []
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole,
  invitedBy?: string
): Promise<TeamMembership | null> {
  try {
    const member = await prisma.teamMember.upsert({
      where: {
        teamId_userId: { teamId, userId },
      },
      update: {
        role: role,
      },
      create: {
        teamId,
        userId,
        role: role,
        invitedBy: invitedBy || null,
        acceptedAt: new Date(),
      },
    })

    const customPermissions = Array.isArray(member.customPermissions)
      ? (member.customPermissions as string[])
      : []

    return {
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role as TeamRole,
      customPermissions,
      invitedBy: member.invitedBy,
      invitedAt: member.invitedAt,
      acceptedAt: member.acceptedAt,
      createdAt: member.createdAt,
    }
  } catch (error) {
    console.error("[teams] Error adding team member:", error)
    return null
  }
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(
  memberId: string,
  role: TeamRole
): Promise<boolean> {
  try {
    await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role },
    })

    return true
  } catch (error) {
    console.error("[teams] Error updating team member role:", error)
    return false
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(memberId: string): Promise<boolean> {
  try {
    await prisma.teamMember.delete({
      where: { id: memberId },
    })

    return true
  } catch (error) {
    console.error("[teams] Error removing team member:", error)
    return false
  }
}

// =============================================================================
// INVITATIONS
// =============================================================================

/**
 * Create a team invitation
 */
export async function createInvitation(
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string
): Promise<TeamInvitation | null> {
  try {
    const token = generateToken(32)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitation = await prisma.teamInvitation.upsert({
      where: {
        teamId_email: { teamId, email: email.toLowerCase() },
      },
      update: {
        role: role,
        token,
        expiresAt,
        invitedBy,
        acceptedAt: null,
        declinedAt: null,
      },
      create: {
        teamId,
        email: email.toLowerCase(),
        role: role,
        token,
        expiresAt,
        invitedBy,
      },
    })

    return mapInvitationToInterface(invitation)
  } catch (error) {
    console.error("[teams] Error creating invitation:", error)
    return null
  }
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  token: string
): Promise<TeamInvitation | null> {
  try {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: true,
      },
    })

    if (!invitation || invitation.team.deletedAt !== null) return null

    const result = mapInvitationToInterface(invitation)
    result.team = mapTeamToInterface(invitation.team)

    return result
  } catch (error) {
    console.error("[teams] Error getting invitation by token:", error)
    return null
  }
}

/**
 * Get all invitations for a team
 */
export async function getTeamInvitations(
  teamId: string
): Promise<TeamInvitation[]> {
  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        acceptedAt: null,
        declinedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    return invitations.map(mapInvitationToInterface)
  } catch (error) {
    console.error("[teams] Error getting team invitations:", error)
    return []
  }
}

/**
 * Get pending invitations for an email
 */
export async function getPendingInvitationsForEmail(
  email: string
): Promise<TeamInvitation[]> {
  try {
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        email: email.toLowerCase(),
        acceptedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
        team: { deletedAt: null },
      },
      include: { team: true },
      orderBy: { createdAt: 'desc' },
    })

    return invitations.map((inv) => {
      const result = mapInvitationToInterface(inv)
      result.team = mapTeamToInterface(inv.team)
      return result
    })
  } catch (error) {
    console.error("[teams] Error getting pending invitations:", error)
    return []
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; teamId?: string; error?: string }> {
  try {
    // Get invitation
    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return { success: false, error: "Invitation not found" }
    }

    if (invitation.acceptedAt) {
      return { success: false, error: "Invitation already accepted" }
    }

    if (invitation.declinedAt) {
      return { success: false, error: "Invitation was declined" }
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return { success: false, error: "Invitation has expired" }
    }

    // Add user as team member
    const member = await addTeamMember(
      invitation.teamId,
      userId,
      invitation.role,
      invitation.invitedBy
    )

    if (!member) {
      return { success: false, error: "Failed to add member" }
    }

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    })

    return { success: true, teamId: invitation.teamId }
  } catch (error) {
    console.error("[teams] Error accepting invitation:", error)
    return { success: false, error: "An error occurred" }
  }
}

/**
 * Decline an invitation
 */
export async function declineInvitation(token: string): Promise<boolean> {
  try {
    await prisma.teamInvitation.update({
      where: { token },
      data: { declinedAt: new Date() },
    })

    return true
  } catch (error) {
    console.error("[teams] Error declining invitation:", error)
    return false
  }
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<boolean> {
  try {
    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    })

    return true
  } catch (error) {
    console.error("[teams] Error canceling invitation:", error)
    return false
  }
}

// =============================================================================
// TEAM SUBDOMAINS
// =============================================================================

/**
 * Share a subdomain with a team
 */
export async function shareSubdomainWithTeam(
  subdomain: string,
  teamId: string,
  accessLevel: string = "edit",
  addedBy?: string
): Promise<TeamSubdomain | null> {
  try {
    const teamSubdomain = await prisma.teamSubdomain.upsert({
      where: {
        teamId_subdomain: { teamId, subdomain },
      },
      update: {
        accessLevel,
      },
      create: {
        teamId,
        subdomain,
        accessLevel,
        addedBy: addedBy || null,
      },
    })

    return {
      id: teamSubdomain.id,
      teamId: teamSubdomain.teamId,
      subdomain: teamSubdomain.subdomain,
      accessLevel: teamSubdomain.accessLevel,
      addedBy: teamSubdomain.addedBy,
      addedAt: teamSubdomain.addedAt,
    }
  } catch (error) {
    console.error("[teams] Error sharing subdomain with team:", error)
    return null
  }
}

/**
 * Get all subdomains shared with a team
 */
export async function getTeamSubdomains(
  teamId: string
): Promise<TeamSubdomain[]> {
  try {
    const subdomains = await prisma.teamSubdomain.findMany({
      where: { teamId },
      orderBy: { addedAt: 'desc' },
    })

    return subdomains.map((s) => ({
      id: s.id,
      teamId: s.teamId,
      subdomain: s.subdomain,
      accessLevel: s.accessLevel,
      addedBy: s.addedBy,
      addedAt: s.addedAt,
    }))
  } catch (error) {
    console.error("[teams] Error getting team subdomains:", error)
    return []
  }
}

/**
 * Remove a subdomain from a team
 */
export async function removeSubdomainFromTeam(
  teamId: string,
  subdomain: string
): Promise<boolean> {
  try {
    await prisma.teamSubdomain.delete({
      where: {
        teamId_subdomain: { teamId, subdomain },
      },
    })

    return true
  } catch (error) {
    console.error("[teams] Error removing subdomain from team:", error)
    return false
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Type for Prisma Team result
type PrismaTeam = {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  ownerId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  billingEmail: string | null
  tierId: string | null
  settings: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

function mapTeamToInterface(team: PrismaTeam): Team {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    logoUrl: team.logoUrl,
    ownerId: team.ownerId,
    stripeCustomerId: team.stripeCustomerId,
    stripeSubscriptionId: team.stripeSubscriptionId,
    billingEmail: team.billingEmail,
    tierId: team.tierId,
    settings: (team.settings as Record<string, unknown>) || {},
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    deletedAt: team.deletedAt,
  }
}

// Type for Prisma TeamInvitation result
type PrismaInvitation = {
  id: string
  teamId: string
  email: string
  role: string
  token: string
  expiresAt: Date
  invitedBy: string
  acceptedAt: Date | null
  declinedAt: Date | null
  createdAt: Date
}

function mapInvitationToInterface(invitation: PrismaInvitation): TeamInvitation {
  return {
    id: invitation.id,
    teamId: invitation.teamId,
    email: invitation.email,
    role: invitation.role as TeamRole,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    invitedBy: invitation.invitedBy,
    acceptedAt: invitation.acceptedAt,
    declinedAt: invitation.declinedAt,
    createdAt: invitation.createdAt,
  }
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Get team statistics
 */
export async function getTeamStats(teamId: string): Promise<{
  memberCount: number
  subdomainCount: number
  pendingInvitations: number
}> {
  try {
    const [memberCount, subdomainCount, pendingInvitations] = await Promise.all([
      prisma.teamMember.count({ where: { teamId } }),
      prisma.teamSubdomain.count({ where: { teamId } }),
      prisma.teamInvitation.count({
        where: {
          teamId,
          acceptedAt: null,
          declinedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ])

    return { memberCount, subdomainCount, pendingInvitations }
  } catch (error) {
    console.error("[teams] Error getting team stats:", error)
    return { memberCount: 0, subdomainCount: 0, pendingInvitations: 0 }
  }
}

/**
 * Get all teams (for super admin)
 */
export async function getAllTeams(options: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ teams: TeamWithMembers[]; total: number }> {
  const { page = 1, limit = 50, search } = options
  const skip = (page - 1) * limit

  try {
    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.team.count({ where }),
    ])

    return {
      teams: teams.map((team) => ({
        ...mapTeamToInterface(team),
        members: [],
        memberCount: team._count.members,
      })),
      total,
    }
  } catch (error) {
    console.error("[teams] Error getting all teams:", error)
    return { teams: [], total: 0 }
  }
}
