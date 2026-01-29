/**
 * Edge Config utilities for ultra-low latency domain lookups
 *
 * Edge Config provides <15ms P99 reads (often <1ms) compared to
 * 50-200ms for database lookups in middleware.
 *
 * Data structure in Edge Config:
 * - Key: `domain:{hostname}` (e.g., "domain:acme.com")
 * - Value: subdomain/tenant identifier (e.g., "acme-store")
 */

import { get } from "@vercel/edge-config"

// For writing to Edge Config, we use the Vercel REST API
// Edge Config SDK is read-only by design

const VERCEL_API_URL = "https://api.vercel.com"

interface EdgeConfigItem {
  key: string
  value: string
}

/**
 * Get tenant subdomain from Edge Config by custom domain
 * Used in middleware for ultra-fast domain routing
 *
 * @param hostname - The custom domain (e.g., "acme.com")
 * @returns The tenant subdomain or null if not found
 */
export async function getTenantFromEdgeConfig(
  hostname: string
): Promise<string | null> {
  try {
    // Normalize hostname
    const normalizedHost = hostname.toLowerCase().replace(/\.$/, "")

    // Try exact match first
    const tenant = await get<string>(`domain:${normalizedHost}`)
    if (tenant) return tenant

    // Try without www prefix
    if (normalizedHost.startsWith("www.")) {
      const withoutWww = normalizedHost.replace(/^www\./, "")
      const tenantWithoutWww = await get<string>(`domain:${withoutWww}`)
      if (tenantWithoutWww) return tenantWithoutWww
    }

    // Try with www prefix
    const withWww = `www.${normalizedHost}`
    const tenantWithWww = await get<string>(`domain:${withWww}`)
    if (tenantWithWww) return tenantWithWww

    return null
  } catch (error) {
    // Edge Config might not be configured yet - fail gracefully
    console.error("Edge Config lookup failed:", error)
    return null
  }
}

/**
 * Sync a domain mapping to Edge Config
 * Called when a domain is added and verified
 *
 * @param domain - The custom domain
 * @param subdomain - The tenant subdomain
 */
export async function syncDomainToEdgeConfig(
  domain: string,
  subdomain: string
): Promise<boolean> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID
  const vercelToken = process.env.VERCEL_API_TOKEN

  if (!edgeConfigId || !vercelToken) {
    console.warn("Edge Config not configured - skipping sync")
    return false
  }

  try {
    const response = await fetch(
      `${VERCEL_API_URL}/v1/edge-config/${edgeConfigId}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "upsert",
              key: `domain:${domain.toLowerCase()}`,
              value: subdomain,
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("Failed to sync domain to Edge Config:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Edge Config sync error:", error)
    return false
  }
}

/**
 * Remove a domain mapping from Edge Config
 * Called when a domain is removed or deactivated
 *
 * @param domain - The custom domain to remove
 */
export async function removeDomainFromEdgeConfig(
  domain: string
): Promise<boolean> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID
  const vercelToken = process.env.VERCEL_API_TOKEN

  if (!edgeConfigId || !vercelToken) {
    console.warn("Edge Config not configured - skipping removal")
    return false
  }

  try {
    const response = await fetch(
      `${VERCEL_API_URL}/v1/edge-config/${edgeConfigId}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              operation: "delete",
              key: `domain:${domain.toLowerCase()}`,
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("Failed to remove domain from Edge Config:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Edge Config removal error:", error)
    return false
  }
}

/**
 * Bulk sync all active domains to Edge Config
 * Useful for initial setup or recovery
 *
 * @param domains - Array of domain-to-subdomain mappings
 */
export async function bulkSyncDomainsToEdgeConfig(
  domains: Array<{ domain: string; subdomain: string }>
): Promise<boolean> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID
  const vercelToken = process.env.VERCEL_API_TOKEN

  if (!edgeConfigId || !vercelToken) {
    console.warn("Edge Config not configured - skipping bulk sync")
    return false
  }

  try {
    const items = domains.map((d) => ({
      operation: "upsert" as const,
      key: `domain:${d.domain.toLowerCase()}`,
      value: d.subdomain,
    }))

    const response = await fetch(
      `${VERCEL_API_URL}/v1/edge-config/${edgeConfigId}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("Failed to bulk sync domains to Edge Config:", error)
      return false
    }

    console.log(`Successfully synced ${domains.length} domains to Edge Config`)
    return true
  } catch (error) {
    console.error("Edge Config bulk sync error:", error)
    return false
  }
}
