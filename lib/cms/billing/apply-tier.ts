/**
 * Apply a tier to a tenant based on a Stripe price id + a tenant identifier.
 *
 * Used by the platform billing webhook. Pure DB writes against existing tables;
 * no Stripe API calls, no key handling here.
 */

import { sql } from "@/lib/neon"
import { invalidateTenantTier } from "./tenant-tier"

/** Find the tier whose monthly or yearly price id matches the Stripe price. */
export async function findTierByPriceId(priceId: string): Promise<{ id: string; name: string } | null> {
  if (!priceId) return null
  const rows = await sql`
    SELECT id, name FROM subscription_tiers
    WHERE stripe_price_id_monthly = ${priceId} OR stripe_price_id_yearly = ${priceId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return { id: String(rows[0].id), name: String(rows[0].name) }
}

/** Resolve a tenant (subdomain) from a Stripe customer/subscription metadata. */
export function resolveSubdomainFromMetadata(
  meta: Record<string, string | undefined> | null | undefined,
): string | null {
  if (!meta) return null
  const raw = meta.subdomain || meta.tenant || meta.tenantSubdomain
  if (!raw) return null
  return String(raw).toLowerCase().replace(/[^a-z0-9-]/g, "") || null
}

/**
 * Assign a tier + subscription status to a tenant. Returns true if a row updated.
 * tierId=null clears the tier (e.g. on cancellation, revert to default/free).
 */
export async function applyTenantTier(params: {
  subdomain: string
  tierId: string | null
  status: string | null
}): Promise<boolean> {
  const subdomain = params.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")
  if (!subdomain) return false

  let result
  if (params.tierId) {
    result = await sql`
      UPDATE subdomains
      SET subscription_tier_id = ${params.tierId}::uuid,
          subscription_status = ${params.status},
          updated_at = NOW()
      WHERE subdomain = ${subdomain}
      RETURNING id
    `
  } else {
    result = await sql`
      UPDATE subdomains
      SET subscription_tier_id = NULL,
          subscription_status = ${params.status},
          updated_at = NOW()
      WHERE subdomain = ${subdomain}
      RETURNING id
    `
  }

  if (result.length > 0) invalidateTenantTier(subdomain)
  return result.length > 0
}
