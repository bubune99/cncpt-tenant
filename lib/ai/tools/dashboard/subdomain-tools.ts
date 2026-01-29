/**
 * Dashboard AI Tools - Subdomain Management
 *
 * Tools for listing, searching, and getting subdomain information.
 */

import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/neon"

/**
 * Create subdomain tools with user context
 */
export function createSubdomainTools(userId: string) {
  /**
   * List user's subdomains with optional stats
   */
  const listSubdomains = tool({
    description:
      "List all subdomains owned by the current user. Returns subdomain names, emojis, and creation dates.",
    parameters: z.object({
      includeStats: z
        .boolean()
        .optional()
        .describe("Include additional stats like domain count"),
    }),
    execute: async ({ includeStats }: { includeStats?: boolean }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const subdomains = await sql`
          SELECT
            s.id,
            s.subdomain,
            s.emoji,
            s.created_at,
            ts.site_title
          FROM subdomains s
          LEFT JOIN tenant_settings ts ON ts.tenant_id = s.id
          WHERE s.user_id = ${userId}
          ORDER BY s.created_at DESC
        `

        if (includeStats) {
          const result = await Promise.all(
            subdomains.map(async (sub) => {
              const domains = await sql`
                SELECT COUNT(*) as count FROM custom_domains
                WHERE subdomain = ${sub.subdomain}
              `
              return {
                ...sub,
                domainCount: parseInt(domains[0]?.count || "0"),
              }
            })
          )
          return {
            count: result.length,
            subdomains: result,
          }
        }

        return {
          count: subdomains.length,
          subdomains,
        }
      } catch (error) {
        console.error("[subdomain-tools] listSubdomains error:", error)
        return { error: "Failed to fetch subdomains" }
      }
    },
  })

  /**
   * Get detailed information about a specific subdomain
   */
  const getSubdomainDetails = tool({
    description:
      "Get detailed information about a specific subdomain including settings, domains, and team access.",
    parameters: z.object({
      subdomain: z.string().describe("The subdomain name to get details for"),
    }),
    execute: async ({ subdomain }: { subdomain: string }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const subdomainResult = await sql`
          SELECT s.*, ts.site_title, ts.site_description
          FROM subdomains s
          LEFT JOIN tenant_settings ts ON ts.tenant_id = s.id
          WHERE s.subdomain = ${subdomain} AND s.user_id = ${userId}
        `

        if (subdomainResult.length === 0) {
          const teamAccess = await sql`
            SELECT ts.subdomain, ts.access_level, t.name as team_name
            FROM team_subdomains ts
            JOIN team_members tm ON ts.team_id = tm.team_id
            JOIN teams t ON ts.team_id = t.id
            WHERE ts.subdomain = ${subdomain} AND tm.user_id = ${userId}
          `

          if (teamAccess.length === 0) {
            return { error: "Subdomain not found or no access" }
          }

          return {
            subdomain,
            accessType: "team",
            teamName: teamAccess[0].team_name,
            accessLevel: teamAccess[0].access_level,
          }
        }

        const sub = subdomainResult[0]

        const domains = await sql`
          SELECT domain, is_verified, is_primary, created_at
          FROM custom_domains
          WHERE subdomain = ${subdomain}
          ORDER BY is_primary DESC, created_at DESC
        `

        const teamShares = await sql`
          SELECT ts.access_level, t.name as team_name, t.id as team_id
          FROM team_subdomains ts
          JOIN teams t ON ts.team_id = t.id
          WHERE ts.subdomain = ${subdomain}
        `

        return {
          subdomain: sub.subdomain,
          emoji: sub.emoji,
          createdAt: sub.created_at,
          siteTitle: sub.site_title,
          siteDescription: sub.site_description,
          accessType: "owner",
          domains: domains,
          domainCount: domains.length,
          teamShares: teamShares,
          teamShareCount: teamShares.length,
        }
      } catch (error) {
        console.error("[subdomain-tools] getSubdomainDetails error:", error)
        return { error: "Failed to fetch subdomain details" }
      }
    },
  })

  /**
   * Search subdomains by name or settings
   */
  const searchSubdomains = tool({
    description: "Search for subdomains by name, title, or description.",
    parameters: z.object({
      query: z.string().describe("Search query to match against subdomain names and settings"),
    }),
    execute: async ({ query }: { query: string }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const searchPattern = `%${query.toLowerCase()}%`

        const owned = await sql`
          SELECT s.subdomain, s.emoji, s.created_at, ts.site_title, 'owner' as access_type
          FROM subdomains s
          LEFT JOIN tenant_settings ts ON ts.tenant_id = s.id
          WHERE s.user_id = ${userId}
          AND (
            LOWER(s.subdomain) LIKE ${searchPattern}
            OR LOWER(COALESCE(ts.site_title, '')) LIKE ${searchPattern}
            OR LOWER(COALESCE(ts.site_description, '')) LIKE ${searchPattern}
          )
        `

        const teamAccessible = await sql`
          SELECT DISTINCT ON (s.subdomain)
            s.subdomain, s.emoji, s.created_at, ts.site_title, 'team' as access_type
          FROM subdomains s
          LEFT JOIN tenant_settings ts ON ts.tenant_id = s.id
          JOIN team_subdomains tsd ON tsd.subdomain = s.subdomain
          JOIN team_members tm ON tm.team_id = tsd.team_id
          WHERE tm.user_id = ${userId}
          AND s.user_id != ${userId}
          AND (
            LOWER(s.subdomain) LIKE ${searchPattern}
            OR LOWER(COALESCE(ts.site_title, '')) LIKE ${searchPattern}
          )
        `

        const results = [...owned, ...teamAccessible]

        return {
          query,
          count: results.length,
          results,
        }
      } catch (error) {
        console.error("[subdomain-tools] searchSubdomains error:", error)
        return { error: "Failed to search subdomains" }
      }
    },
  })

  /**
   * Get subdomain statistics
   */
  const getSubdomainStats = tool({
    description: "Get usage statistics for user's subdomains.",
    parameters: z.object({}),
    execute: async () => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const ownedCount = await sql`
          SELECT COUNT(*) as count FROM subdomains WHERE user_id = ${userId}
        `

        const teamCount = await sql`
          SELECT COUNT(DISTINCT ts.subdomain) as count
          FROM team_subdomains ts
          JOIN team_members tm ON ts.team_id = tm.team_id
          JOIN subdomains s ON s.subdomain = ts.subdomain
          WHERE tm.user_id = ${userId} AND s.user_id != ${userId}
        `

        const domainCount = await sql`
          SELECT COUNT(*) as count
          FROM custom_domains cd
          JOIN subdomains s ON cd.subdomain = s.subdomain
          WHERE s.user_id = ${userId}
        `

        const verifiedDomainCount = await sql`
          SELECT COUNT(*) as count
          FROM custom_domains cd
          JOIN subdomains s ON cd.subdomain = s.subdomain
          WHERE s.user_id = ${userId} AND cd.is_verified = true
        `

        return {
          ownedSubdomains: parseInt(ownedCount[0]?.count || "0"),
          teamAccessibleSubdomains: parseInt(teamCount[0]?.count || "0"),
          totalSubdomains:
            parseInt(ownedCount[0]?.count || "0") +
            parseInt(teamCount[0]?.count || "0"),
          customDomains: parseInt(domainCount[0]?.count || "0"),
          verifiedDomains: parseInt(verifiedDomainCount[0]?.count || "0"),
        }
      } catch (error) {
        console.error("[subdomain-tools] getSubdomainStats error:", error)
        return { error: "Failed to fetch subdomain stats" }
      }
    },
  })

  return {
    listSubdomains,
    getSubdomainDetails,
    searchSubdomains,
    getSubdomainStats,
  }
}
