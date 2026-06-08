/**
 * Per-tenant tier + limits resolution.
 *
 * A tenant's plan is assigned via subdomains.subscription_tier_id → a row in
 * subscription_tiers. The tier's `limits` JSON drives quotas (pages, posts,
 * storage, etc.) and feeds the rate-limit config layer.
 *
 * Reads are cached per-subdomain for a short TTL so request-path callers don't
 * hit the DB every time. All reads fail soft (return null/defaults) so a
 * billing-store hiccup never blocks tenant traffic.
 */

import { sql } from "@/lib/neon"

/** Shape of subscription_tiers.limits (all keys optional; -1 = unlimited). */
export interface TierLimits {
  pages?: number
  posts?: number
  storage_gb?: number
  subdomains?: number
  team_members?: number
  custom_domains?: number
  ai_credits_monthly?: number
  ai_credits_rollover_cap?: number
  ai_features?: string[] | "*"
  /** Optional rate-limit overrides the owner can put on a tier. */
  rate_limit_max?: number
  rate_limit_window_ms?: number
  [key: string]: unknown
}

export interface TenantTier {
  subdomain: string
  tierId: string | null
  tierName: string | null
  tierDisplayName: string | null
  limits: TierLimits
  disabled: boolean
  subscriptionStatus: string | null
}

const CACHE_TTL_MS = 30_000
const cache = new Map<string, { value: TenantTier | null; at: number }>()

function sanitizeSubdomain(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "")
}

/**
 * Resolve a tenant's tier assignment + limits by subdomain.
 * Returns null when the tenant is unknown. Fails soft on DB errors.
 */
export async function getTenantTier(subdomain: string): Promise<TenantTier | null> {
  const key = sanitizeSubdomain(subdomain)
  if (!key) return null

  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value

  try {
    const rows = await sql`
      SELECT s.subdomain,
             s.disabled,
             s.subscription_status,
             s.subscription_tier_id,
             t.name          AS tier_name,
             t.display_name  AS tier_display_name,
             t.limits        AS tier_limits
      FROM subdomains s
      LEFT JOIN subscription_tiers t ON t.id = s.subscription_tier_id
      WHERE s.subdomain = ${key}
      LIMIT 1
    `

    if (rows.length === 0) {
      cache.set(key, { value: null, at: Date.now() })
      return null
    }

    const r = rows[0]
    let limits: TierLimits = {}
    if (r.tier_limits) {
      limits =
        typeof r.tier_limits === "string"
          ? (JSON.parse(r.tier_limits) as TierLimits)
          : (r.tier_limits as TierLimits)
    }

    const value: TenantTier = {
      subdomain: String(r.subdomain),
      tierId: (r.subscription_tier_id as string | null) ?? null,
      tierName: (r.tier_name as string | null) ?? null,
      tierDisplayName: (r.tier_display_name as string | null) ?? null,
      limits,
      disabled: Boolean(r.disabled),
      subscriptionStatus: (r.subscription_status as string | null) ?? null,
    }
    cache.set(key, { value, at: Date.now() })
    return value
  } catch (error) {
    console.error("[tenant-tier] resolve failed (soft):", error)
    return null
  }
}

/** Invalidate the cache for one subdomain after a tier/lifecycle write. */
export function invalidateTenantTier(subdomain: string): void {
  cache.delete(sanitizeSubdomain(subdomain))
}

/**
 * Quota check: is a tenant under its limit for a given resource?
 * Returns { allowed, limit, current }. Unlimited (-1) and unset → allowed.
 */
export function isUnderLimit(
  limits: TierLimits,
  key: keyof TierLimits,
  current: number,
): { allowed: boolean; limit: number | null; current: number } {
  const raw = limits[key]
  if (typeof raw !== "number") return { allowed: true, limit: null, current }
  if (raw < 0) return { allowed: true, limit: raw, current } // -1 = unlimited
  return { allowed: current < raw, limit: raw, current }
}
