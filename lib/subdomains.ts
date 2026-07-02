import { sql } from "@/lib/neon"
import { canAccessSubdomain as checkTeamSubdomainAccess } from "@/lib/team-auth"

type SubdomainData = {
  createdAt: number
}

export async function getSubdomainData(subdomain: string): Promise<SubdomainData | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
  const rows = await sql`
    SELECT subdomain, created_at FROM subdomains WHERE subdomain = ${sanitizedSubdomain}
  `
  if (rows.length === 0) {
    return null
  }
  return {
    createdAt: new Date(rows[0].created_at as string).getTime(),
  }
}

export async function getAllSubdomains() {
  const rows = await sql`
    SELECT subdomain, created_at FROM subdomains ORDER BY created_at DESC
  `
  return rows.map((row) => ({
    subdomain: row.subdomain as string,
    createdAt: new Date(row.created_at as string).getTime(),
  }))
}

/**
 * Check if a user can access a subdomain (as owner or via team membership)
 * @param userId - The user ID to check
 * @param subdomain - The subdomain to check access for
 * @param requiredAccessLevel - The minimum access level required ('view', 'edit', 'admin')
 * @returns Object with access information
 */
export async function checkUserSubdomainAccess(
  userId: string,
  subdomain: string,
  requiredAccessLevel: "view" | "edit" | "admin" = "view"
): Promise<{
  hasAccess: boolean
  accessType: "owner" | "team" | null
  teamId?: string
  accessLevel?: string
}> {
  return checkTeamSubdomainAccess(userId, subdomain, requiredAccessLevel)
}
