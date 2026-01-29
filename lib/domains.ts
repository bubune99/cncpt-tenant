import { sql } from "@/lib/neon"

/**
 * Custom domain lookup for middleware routing
 * Returns the subdomain (tenant identifier) for a custom domain
 */

interface DomainMapping {
  subdomain: string
  domain: string
  is_primary: boolean
  status: string
}

/**
 * Look up which tenant a custom domain belongs to
 * Used by middleware to route custom domain requests
 *
 * @param hostname - The incoming request hostname (e.g., "acme.com" or "www.acme.com")
 * @returns The subdomain/tenant identifier, or null if not found
 */
export async function lookupCustomDomain(hostname: string): Promise<string | null> {
  try {
    // Normalize hostname (lowercase, no trailing dots)
    const normalizedHost = hostname.toLowerCase().replace(/\.$/, "")

    // Query for exact match or www variant
    const result = await sql`
      SELECT subdomain, domain, is_primary, status
      FROM custom_domains
      WHERE (domain = ${normalizedHost} OR domain = ${`www.${normalizedHost}`} OR domain = ${normalizedHost.replace(/^www\./, "")})
        AND status = 'active'
      ORDER BY is_primary DESC
      LIMIT 1
    `

    if (result.length > 0) {
      return result[0].subdomain
    }

    return null
  } catch (error) {
    // Log but don't throw - middleware should gracefully handle failures
    console.error("Failed to lookup custom domain:", error)
    return null
  }
}

/**
 * Check if a hostname is a known custom domain (cached check)
 * This is a lighter check that can be used before full lookup
 */
export async function isCustomDomain(hostname: string): Promise<boolean> {
  const tenant = await lookupCustomDomain(hostname)
  return tenant !== null
}

/**
 * Get all active custom domains for caching/edge config sync
 * Useful for bulk operations or populating edge config
 */
export async function getAllActiveCustomDomains(): Promise<DomainMapping[]> {
  try {
    const result = await sql`
      SELECT subdomain, domain, is_primary, status
      FROM custom_domains
      WHERE status = 'active'
      ORDER BY subdomain, is_primary DESC
    `
    return result as DomainMapping[]
  } catch (error) {
    console.error("Failed to get all custom domains:", error)
    return []
  }
}
