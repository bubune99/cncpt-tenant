import { redis } from "@/lib/redis"
import { canAccessSubdomain as checkTeamSubdomainAccess } from "@/lib/team-auth"

type SubdomainData = {
  createdAt: number
}

export async function getSubdomainData(subdomain: string) {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
  const data = await redis.get<SubdomainData>(`subdomain:${sanitizedSubdomain}`)
  return data
}

export async function getAllSubdomains() {
  const keys = await redis.keys("subdomain:*")
  if (!keys.length) {
    return []
  }

  const values = await redis.mget<SubdomainData>(...keys)
  return keys.map((key, index) => {
    const subdomain = key.replace("subdomain:", "")
    const data = values[index]
    return {
      subdomain,
      createdAt: data?.createdAt || Date.now(),
    }
  })
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
