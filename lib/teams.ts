import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { randomBytes } from "crypto"
import type { TeamRole, TeamMembership } from "./team-auth"

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
      const existing = await sql`
        SELECT id FROM teams WHERE slug = ${slug}
      `
      if (existing.length === 0) {
        isUnique = true
      } else {
        suffix++
        slug = `${baseSlug}-${suffix}`
      }
    }

    const result = await sql`
      INSERT INTO teams (name, slug, description, logo_url, owner_id, billing_email)
      VALUES (${name}, ${slug}, ${options.description || null}, ${options.logoUrl || null}, ${ownerId}, ${options.billingEmail || null})
      RETURNING id, name, slug, description, logo_url, owner_id, stripe_customer_id, stripe_subscription_id, billing_email, tier_id, settings, created_at, updated_at, deleted_at
    `

    if (result.length === 0) return null

    const team = mapRowToTeam(result[0])

    // Add owner as team member
    await sql`
      INSERT INTO team_members (team_id, user_id, role, accepted_at)
      VALUES (${team.id}, ${ownerId}, 'owner', NOW())
    `

    return team
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
    const result = await sql`
      SELECT id, name, slug, description, logo_url, owner_id, stripe_customer_id, stripe_subscription_id, billing_email, tier_id, settings, created_at, updated_at, deleted_at
      FROM teams
      WHERE id = ${teamId} AND deleted_at IS NULL
    `

    if (result.length === 0) return null

    return mapRowToTeam(result[0])
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
    const result = await sql`
      SELECT id, name, slug, description, logo_url, owner_id, stripe_customer_id, stripe_subscription_id, billing_email, tier_id, settings, created_at, updated_at, deleted_at
      FROM teams
      WHERE slug = ${slug} AND deleted_at IS NULL
    `

    if (result.length === 0) return null

    return mapRowToTeam(result[0])
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
    const result = await sql`
      SELECT t.id, t.name, t.slug, t.description, t.logo_url, t.owner_id, t.stripe_customer_id, t.stripe_subscription_id, t.billing_email, t.tier_id, t.settings, t.created_at, t.updated_at, t.deleted_at,
             tm.role as user_role,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ${userId} AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `

    return result.map((row) => ({
      ...mapRowToTeam(row),
      members: [],
      memberCount: parseInt(row.member_count as string) || 0,
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
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`)
      values.push(updates.name)
      paramIndex++
    }

    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex}`)
      values.push(updates.description)
      paramIndex++
    }

    if (updates.logoUrl !== undefined) {
      setClauses.push(`logo_url = $${paramIndex}`)
      values.push(updates.logoUrl)
      paramIndex++
    }

    if (updates.billingEmail !== undefined) {
      setClauses.push(`billing_email = $${paramIndex}`)
      values.push(updates.billingEmail)
      paramIndex++
    }

    if (updates.settings !== undefined) {
      setClauses.push(`settings = $${paramIndex}`)
      values.push(JSON.stringify(updates.settings))
      paramIndex++
    }

    if (setClauses.length === 0) {
      return await getTeam(teamId)
    }

    const result = await sql`
      UPDATE teams
      SET ${sql.unsafe(setClauses.join(", "))}, updated_at = NOW()
      WHERE id = ${teamId} AND deleted_at IS NULL
      RETURNING id, name, slug, description, logo_url, owner_id, stripe_customer_id, stripe_subscription_id, billing_email, tier_id, settings, created_at, updated_at, deleted_at
    `

    if (result.length === 0) return null

    return mapRowToTeam(result[0])
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
    const result = await sql`
      UPDATE teams
      SET deleted_at = NOW()
      WHERE id = ${teamId} AND deleted_at IS NULL
      RETURNING id
    `

    return result.length > 0
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
    const result = await sql`
      SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.custom_permissions,
             tm.invited_by, tm.invited_at, tm.accepted_at, tm.created_at
      FROM team_members tm
      WHERE tm.team_id = ${teamId}
      ORDER BY
        CASE tm.role
          WHEN 'owner' THEN 0
          WHEN 'admin' THEN 1
          WHEN 'member' THEN 2
          WHEN 'viewer' THEN 3
        END,
        tm.created_at ASC
    `

    // Fetch user details from Stack Auth for each member
    const members = await Promise.all(
      result.map(async (row) => {
        let email = ""
        let displayName: string | null = null

        try {
          const user = await stackServerApp.getUser({ userId: row.user_id as string })
          if (user) {
            email = user.primaryEmail || ""
            displayName = user.displayName
          }
        } catch {
          // User may have been deleted
        }

        return {
          id: row.id as string,
          teamId: row.team_id as string,
          userId: row.user_id as string,
          email,
          displayName,
          role: row.role as TeamRole,
          customPermissions: Array.isArray(row.custom_permissions)
            ? (row.custom_permissions as string[])
            : JSON.parse((row.custom_permissions as string) || "[]"),
          invitedBy: row.invited_by as string | null,
          invitedAt: new Date(row.invited_at as string),
          acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
          createdAt: new Date(row.created_at as string),
        }
      })
    )

    return members
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
    const result = await sql`
      INSERT INTO team_members (team_id, user_id, role, invited_by, accepted_at)
      VALUES (${teamId}, ${userId}, ${role}, ${invitedBy || null}, NOW())
      ON CONFLICT (team_id, user_id) DO UPDATE SET
        role = EXCLUDED.role
      RETURNING id, team_id, user_id, role, custom_permissions, invited_by, invited_at, accepted_at, created_at
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
    const result = await sql`
      UPDATE team_members
      SET role = ${role}
      WHERE id = ${memberId}
      RETURNING id
    `

    return result.length > 0
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
    const result = await sql`
      DELETE FROM team_members
      WHERE id = ${memberId}
      RETURNING id
    `

    return result.length > 0
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

    const result = await sql`
      INSERT INTO team_invitations (team_id, email, role, token, expires_at, invited_by)
      VALUES (${teamId}, ${email.toLowerCase()}, ${role}, ${token}, ${expiresAt.toISOString()}, ${invitedBy})
      ON CONFLICT (team_id, email) DO UPDATE SET
        role = EXCLUDED.role,
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        invited_by = EXCLUDED.invited_by,
        accepted_at = NULL,
        declined_at = NULL
      RETURNING id, team_id, email, role, token, expires_at, invited_by, accepted_at, declined_at, created_at
    `

    if (result.length === 0) return null

    return mapRowToInvitation(result[0])
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
    const result = await sql`
      SELECT ti.id, ti.team_id, ti.email, ti.role, ti.token, ti.expires_at, ti.invited_by, ti.accepted_at, ti.declined_at, ti.created_at,
             t.id as t_id, t.name as t_name, t.slug as t_slug, t.description as t_description, t.logo_url as t_logo_url
      FROM team_invitations ti
      JOIN teams t ON ti.team_id = t.id
      WHERE ti.token = ${token} AND t.deleted_at IS NULL
    `

    if (result.length === 0) return null

    const row = result[0]
    const invitation = mapRowToInvitation(row)

    invitation.team = {
      id: row.t_id as string,
      name: row.t_name as string,
      slug: row.t_slug as string,
      description: row.t_description as string | null,
      logoUrl: row.t_logo_url as string | null,
      ownerId: "",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      billingEmail: null,
      tierId: null,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    return invitation
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
    const result = await sql`
      SELECT id, team_id, email, role, token, expires_at, invited_by, accepted_at, declined_at, created_at
      FROM team_invitations
      WHERE team_id = ${teamId} AND accepted_at IS NULL AND declined_at IS NULL
      ORDER BY created_at DESC
    `

    return result.map(mapRowToInvitation)
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
    const result = await sql`
      SELECT ti.id, ti.team_id, ti.email, ti.role, ti.token, ti.expires_at, ti.invited_by, ti.accepted_at, ti.declined_at, ti.created_at,
             t.id as t_id, t.name as t_name, t.slug as t_slug, t.description as t_description, t.logo_url as t_logo_url
      FROM team_invitations ti
      JOIN teams t ON ti.team_id = t.id
      WHERE ti.email = ${email.toLowerCase()}
        AND ti.accepted_at IS NULL
        AND ti.declined_at IS NULL
        AND ti.expires_at > NOW()
        AND t.deleted_at IS NULL
      ORDER BY ti.created_at DESC
    `

    return result.map((row) => {
      const invitation = mapRowToInvitation(row)
      invitation.team = {
        id: row.t_id as string,
        name: row.t_name as string,
        slug: row.t_slug as string,
        description: row.t_description as string | null,
        logoUrl: row.t_logo_url as string | null,
        ownerId: "",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        billingEmail: null,
        tierId: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }
      return invitation
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
    await sql`
      UPDATE team_invitations
      SET accepted_at = NOW()
      WHERE token = ${token}
    `

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
    const result = await sql`
      UPDATE team_invitations
      SET declined_at = NOW()
      WHERE token = ${token}
      RETURNING id
    `

    return result.length > 0
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
    const result = await sql`
      DELETE FROM team_invitations
      WHERE id = ${invitationId}
      RETURNING id
    `

    return result.length > 0
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
    const result = await sql`
      INSERT INTO team_subdomains (team_id, subdomain, access_level, added_by)
      VALUES (${teamId}, ${subdomain}, ${accessLevel}, ${addedBy || null})
      ON CONFLICT (team_id, subdomain) DO UPDATE SET
        access_level = EXCLUDED.access_level
      RETURNING id, team_id, subdomain, access_level, added_by, added_at
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id as string,
      teamId: row.team_id as string,
      subdomain: row.subdomain as string,
      accessLevel: row.access_level as string,
      addedBy: row.added_by as string | null,
      addedAt: new Date(row.added_at as string),
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
    const result = await sql`
      SELECT id, team_id, subdomain, access_level, added_by, added_at
      FROM team_subdomains
      WHERE team_id = ${teamId}
      ORDER BY added_at DESC
    `

    return result.map((row) => ({
      id: row.id as string,
      teamId: row.team_id as string,
      subdomain: row.subdomain as string,
      accessLevel: row.access_level as string,
      addedBy: row.added_by as string | null,
      addedAt: new Date(row.added_at as string),
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
    const result = await sql`
      DELETE FROM team_subdomains
      WHERE team_id = ${teamId} AND subdomain = ${subdomain}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("[teams] Error removing subdomain from team:", error)
    return false
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapRowToTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    logoUrl: row.logo_url as string | null,
    ownerId: row.owner_id as string,
    stripeCustomerId: row.stripe_customer_id as string | null,
    stripeSubscriptionId: row.stripe_subscription_id as string | null,
    billingEmail: row.billing_email as string | null,
    tierId: row.tier_id as string | null,
    settings:
      typeof row.settings === "string"
        ? JSON.parse(row.settings)
        : (row.settings as Record<string, unknown>) || {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
  }
}

function mapRowToInvitation(row: Record<string, unknown>): TeamInvitation {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    email: row.email as string,
    role: row.role as TeamRole,
    token: row.token as string,
    expiresAt: new Date(row.expires_at as string),
    invitedBy: row.invited_by as string,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
    declinedAt: row.declined_at ? new Date(row.declined_at as string) : null,
    createdAt: new Date(row.created_at as string),
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
    const result = await sql`
      SELECT
        (SELECT COUNT(*) FROM team_members WHERE team_id = ${teamId}) as member_count,
        (SELECT COUNT(*) FROM team_subdomains WHERE team_id = ${teamId}) as subdomain_count,
        (SELECT COUNT(*) FROM team_invitations WHERE team_id = ${teamId} AND accepted_at IS NULL AND declined_at IS NULL AND expires_at > NOW()) as pending_invitations
    `

    const row = result[0]
    return {
      memberCount: parseInt(row.member_count as string) || 0,
      subdomainCount: parseInt(row.subdomain_count as string) || 0,
      pendingInvitations: parseInt(row.pending_invitations as string) || 0,
    }
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
  const offset = (page - 1) * limit

  try {
    let whereClause = "WHERE deleted_at IS NULL"
    if (search) {
      whereClause += ` AND (name ILIKE '%${search.replace(/'/g, "''")}%' OR slug ILIKE '%${search.replace(/'/g, "''")}%')`
    }

    const teamsResult = await sql`
      SELECT id, name, slug, description, logo_url, owner_id, stripe_customer_id, stripe_subscription_id, billing_email, tier_id, settings, created_at, updated_at, deleted_at,
             (SELECT COUNT(*) FROM team_members WHERE team_id = teams.id) as member_count
      FROM teams
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM teams ${sql.unsafe(whereClause)}
    `

    const teams = teamsResult.map((row) => ({
      ...mapRowToTeam(row),
      members: [],
      memberCount: parseInt(row.member_count as string) || 0,
    }))

    return {
      teams,
      total: parseInt(countResult[0]?.total as string) || 0,
    }
  } catch (error) {
    console.error("[teams] Error getting all teams:", error)
    return { teams: [], total: 0 }
  }
}
