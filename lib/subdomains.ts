import { redis } from "@/lib/redis"
import { canAccessSubdomain as checkTeamSubdomainAccess } from "@/lib/team-auth"

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false
  }

  try {
    // Primary validation: Check if the string contains at least one emoji character
    // This regex pattern matches most emoji Unicode ranges
    const emojiPattern = /[\p{Emoji}]/u
    if (emojiPattern.test(str)) {
      return true
    }
  } catch (error) {
    // If the regex fails (e.g., in environments that don't support Unicode property escapes),
    // fall back to a simpler validation
    console.warn("Emoji regex validation failed, using fallback validation", error)
  }

  // Fallback validation: Check if the string is within a reasonable length
  // This is less secure but better than no validation
  return str.length >= 1 && str.length <= 10
}

type SubdomainData = {
  emoji: string
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
      emoji: data?.emoji || "❓",
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
