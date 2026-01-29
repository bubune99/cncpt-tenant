/**
 * Dashboard AI Tools - Team Management
 *
 * Tools for listing teams, members, and checking access.
 */

import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/neon"

/**
 * List user's teams (owned and member of)
 */
export const listTeams = tool({
  description:
    "List all teams the user owns or is a member of. Returns team names, member counts, and user's role.",
  parameters: z.object({
    role: z
      .enum(["owner", "member", "all"])
      .optional()
      .default("all")
      .describe("Filter by role: 'owner' for owned teams, 'member' for teams user joined, 'all' for both"),
  }),
  execute: async ({ role }, { userId }) => {
    if (!userId) {
      return { error: "User not authenticated" }
    }

    try {
      let teams

      if (role === "owner") {
        teams = await sql`
          SELECT
            t.id,
            t.name,
            t.slug,
            t.description,
            t.logo_url,
            t.created_at,
            'owner' as user_role,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
            (SELECT COUNT(*) FROM team_subdomains WHERE team_id = t.id) as subdomain_count
          FROM teams t
          WHERE t.owner_id = ${userId} AND t.deleted_at IS NULL
          ORDER BY t.created_at DESC
        `
      } else if (role === "member") {
        teams = await sql`
          SELECT
            t.id,
            t.name,
            t.slug,
            t.description,
            t.logo_url,
            t.created_at,
            tm.role as user_role,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
            (SELECT COUNT(*) FROM team_subdomains WHERE team_id = t.id) as subdomain_count
          FROM teams t
          JOIN team_members tm ON t.id = tm.team_id
          WHERE tm.user_id = ${userId}
          AND t.owner_id != ${userId}
          AND t.deleted_at IS NULL
          ORDER BY t.created_at DESC
        `
      } else {
        teams = await sql`
          SELECT
            t.id,
            t.name,
            t.slug,
            t.description,
            t.logo_url,
            t.created_at,
            CASE WHEN t.owner_id = ${userId} THEN 'owner' ELSE tm.role END as user_role,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
            (SELECT COUNT(*) FROM team_subdomains WHERE team_id = t.id) as subdomain_count
          FROM teams t
          LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ${userId}
          WHERE (t.owner_id = ${userId} OR tm.user_id = ${userId})
          AND t.deleted_at IS NULL
          ORDER BY t.created_at DESC
        `
      }

      return {
        count: teams.length,
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description,
          logoUrl: t.logo_url,
          createdAt: t.created_at,
          userRole: t.user_role,
          memberCount: parseInt(t.member_count || "0"),
          subdomainCount: parseInt(t.subdomain_count || "0"),
        })),
      }
    } catch (error) {
      console.error("[team-tools] listTeams error:", error)
      return { error: "Failed to fetch teams" }
    }
  },
})

/**
 * Get detailed team information
 */
export const getTeamDetails = tool({
  description:
    "Get detailed information about a specific team including members and shared subdomains.",
  parameters: z.object({
    teamId: z.string().describe("The team ID to get details for"),
  }),
  execute: async ({ teamId }, { userId }) => {
    if (!userId) {
      return { error: "User not authenticated" }
    }

    try {
      // Check user has access to team
      const membership = await sql`
        SELECT tm.role, t.owner_id, t.name, t.slug, t.description, t.logo_url, t.created_at, t.billing_email
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ${userId}
        WHERE t.id = ${teamId} AND t.deleted_at IS NULL
        AND (t.owner_id = ${userId} OR tm.user_id = ${userId})
      `

      if (membership.length === 0) {
        return { error: "Team not found or no access" }
      }

      const team = membership[0]
      const isOwner = team.owner_id === userId
      const userRole = isOwner ? "owner" : team.role

      // Get member count and list
      const members = await sql`
        SELECT tm.user_id, tm.role, tm.invited_at, tm.accepted_at
        FROM team_members tm
        WHERE tm.team_id = ${teamId}
        ORDER BY tm.role ASC, tm.created_at ASC
      `

      // Get shared subdomains
      const subdomains = await sql`
        SELECT ts.subdomain, ts.access_level, s.emoji
        FROM team_subdomains ts
        JOIN subdomains s ON ts.subdomain = s.subdomain
        WHERE ts.team_id = ${teamId}
      `

      // Get pending invitations (only if user can see them)
      let pendingInvitations: unknown[] = []
      if (isOwner || userRole === "admin") {
        pendingInvitations = await sql`
          SELECT id, email, role, created_at, expires_at
          FROM team_invitations
          WHERE team_id = ${teamId} AND status = 'pending'
        `
      }

      return {
        id: teamId,
        name: team.name,
        slug: team.slug,
        description: team.description,
        logoUrl: team.logo_url,
        billingEmail: team.billing_email,
        createdAt: team.created_at,
        userRole,
        isOwner,
        members: {
          count: members.length,
          list: members,
        },
        subdomains: {
          count: subdomains.length,
          list: subdomains,
        },
        pendingInvitations: {
          count: pendingInvitations.length,
          list: pendingInvitations,
        },
      }
    } catch (error) {
      console.error("[team-tools] getTeamDetails error:", error)
      return { error: "Failed to fetch team details" }
    }
  },
})

/**
 * List team members
 */
export const listTeamMembers = tool({
  description: "List all members of a specific team with their roles.",
  parameters: z.object({
    teamId: z.string().describe("The team ID to list members for"),
  }),
  execute: async ({ teamId }, { userId }) => {
    if (!userId) {
      return { error: "User not authenticated" }
    }

    try {
      // Check user has access
      const access = await sql`
        SELECT 1 FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ${userId}
        WHERE t.id = ${teamId} AND t.deleted_at IS NULL
        AND (t.owner_id = ${userId} OR tm.user_id = ${userId})
      `

      if (access.length === 0) {
        return { error: "Team not found or no access" }
      }

      const members = await sql`
        SELECT
          tm.user_id,
          tm.role,
          tm.invited_at,
          tm.accepted_at,
          tm.created_at
        FROM team_members tm
        WHERE tm.team_id = ${teamId}
        ORDER BY
          CASE tm.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'member' THEN 3
            WHEN 'viewer' THEN 4
          END,
          tm.created_at ASC
      `

      const roleCount = members.reduce(
        (acc, m) => {
          acc[m.role] = (acc[m.role] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        teamId,
        totalMembers: members.length,
        roleBreakdown: roleCount,
        members,
      }
    } catch (error) {
      console.error("[team-tools] listTeamMembers error:", error)
      return { error: "Failed to fetch team members" }
    }
  },
})

/**
 * Get pending invitations
 */
export const getTeamInvitations = tool({
  description: "Get pending team invitations (sent or received).",
  parameters: z.object({
    type: z
      .enum(["sent", "received", "all"])
      .optional()
      .default("all")
      .describe("Filter invitations: 'sent' for invites user sent, 'received' for invites to user"),
  }),
  execute: async ({ type }, { userId }) => {
    if (!userId) {
      return { error: "User not authenticated" }
    }

    try {
      let sent: unknown[] = []
      let received: unknown[] = []

      if (type === "sent" || type === "all") {
        // Get invitations sent by user's teams (where user is owner/admin)
        sent = await sql`
          SELECT
            ti.id,
            ti.email,
            ti.role,
            ti.team_id,
            t.name as team_name,
            ti.created_at,
            ti.expires_at
          FROM team_invitations ti
          JOIN teams t ON ti.team_id = t.id
          LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ${userId}
          WHERE ti.status = 'pending'
          AND (t.owner_id = ${userId} OR (tm.user_id = ${userId} AND tm.role IN ('owner', 'admin')))
          ORDER BY ti.created_at DESC
        `
      }

      if (type === "received" || type === "all") {
        // Note: This would require knowing the user's email
        // For now, we'll return an empty array and note the limitation
        received = []
      }

      return {
        sent: { count: sent.length, invitations: sent },
        received: {
          count: received.length,
          invitations: received,
          note: "Received invitations require email lookup - use the invitations page to see pending invites",
        },
      }
    } catch (error) {
      console.error("[team-tools] getTeamInvitations error:", error)
      return { error: "Failed to fetch invitations" }
    }
  },
})

/**
 * Check team access for a specific subdomain
 */
export const checkTeamAccess = tool({
  description: "Check what access a team has to subdomains, or what subdomains a team can access.",
  parameters: z.object({
    teamId: z.string().describe("The team ID to check access for"),
  }),
  execute: async ({ teamId }, { userId }) => {
    if (!userId) {
      return { error: "User not authenticated" }
    }

    try {
      // Check user has access to team
      const access = await sql`
        SELECT t.name, tm.role FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = ${userId}
        WHERE t.id = ${teamId} AND t.deleted_at IS NULL
        AND (t.owner_id = ${userId} OR tm.user_id = ${userId})
      `

      if (access.length === 0) {
        return { error: "Team not found or no access" }
      }

      // Get all subdomains the team can access
      const subdomains = await sql`
        SELECT
          ts.subdomain,
          ts.access_level,
          s.emoji,
          ts2.site_title
        FROM team_subdomains ts
        JOIN subdomains s ON ts.subdomain = s.subdomain
        LEFT JOIN tenant_settings ts2 ON ts2.tenant_id = s.id
        WHERE ts.team_id = ${teamId}
        ORDER BY ts.access_level DESC, ts.subdomain ASC
      `

      const accessLevelCount = subdomains.reduce(
        (acc, s) => {
          acc[s.access_level] = (acc[s.access_level] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        teamId,
        teamName: access[0].name,
        userRole: access[0].role,
        subdomainCount: subdomains.length,
        accessLevelBreakdown: accessLevelCount,
        subdomains,
      }
    } catch (error) {
      console.error("[team-tools] checkTeamAccess error:", error)
      return { error: "Failed to check team access" }
    }
  },
})

export const teamTools = {
  listTeams,
  getTeamDetails,
  listTeamMembers,
  getTeamInvitations,
  checkTeamAccess,
}
