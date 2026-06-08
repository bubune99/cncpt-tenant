/**
 * Resolve the effective rate-limit decision for a request by layering
 * owner-configured DB rules on top of the hardcoded preset.
 */

import { getRateLimitConfig } from "./config"
import { getTenantTier } from "@/lib/cms/billing/tenant-tier"
import type { RateLimitMode, RateLimitRule } from "./types"
import type { RateLimitConfig } from "./index"

export interface ResolveInput {
  /** The hardcoded preset the caller passed (safety floor). */
  preset: RateLimitConfig
  /** Logical endpoint name (preset key, e.g. "checkout") for endpoint rules. */
  name?: string
  /** Request path, used as a fallback endpoint match. */
  path: string
  /** Tenant subdomain, when known, for per-tenant rules. */
  tenant?: string | null
}

export interface ResolvedLimit {
  maxRequests: number
  windowMs: number
  /** Effective behaviour after combining master mode + per-rule mode. */
  mode: "enforce" | "observe" | "off"
  /** Which config layer won (for observability). */
  source: "tenant" | "tier" | "endpoint" | "global" | "preset"
}

function endpointMatches(rule: RateLimitRule, name: string | undefined, path: string): boolean {
  if (name && rule.target === name) return true
  // Allow path-prefix targets (e.g. "/api/cms/checkout").
  if (rule.target.startsWith("/") && path.startsWith(rule.target)) return true
  return false
}

/**
 * Resolve the limit + mode for this request.
 *
 * The hardcoded preset is always the floor: a configured rule can only be
 * chosen when it exists and is enabled, otherwise we keep the preset values.
 */
export async function resolveRateLimit(input: ResolveInput): Promise<ResolvedLimit> {
  const { preset, name, path, tenant } = input
  const { rules, settings } = await getRateLimitConfig()

  // Master kill-switch.
  if (settings.mode === "off") {
    return {
      maxRequests: preset.maxRequests,
      windowMs: preset.windowMs,
      mode: "off",
      source: "preset",
    }
  }

  // Most-specific-wins: explicit tenant rule → endpoint rule → tenant-tier
  // default → global rule. An explicit owner-set rule always beats the tier.
  const tenantRule = tenant
    ? rules.find((r) => r.scope === "tenant" && r.target === tenant)
    : undefined
  const endpointRule = rules.find(
    (r) => r.scope === "endpoint" && endpointMatches(r, name, path),
  )
  const globalRule = rules.find((r) => r.scope === "global")

  // Tier-derived limit: if the tenant's assigned plan carries rate_limit_*
  // in its limits JSON, use it as a layer below explicit tenant/endpoint rules.
  let tierLimit: { maxRequests: number; windowMs: number } | undefined
  if (tenant && !tenantRule) {
    try {
      const tier = await getTenantTier(tenant)
      const max = tier?.limits?.rate_limit_max
      const win = tier?.limits?.rate_limit_window_ms
      if (typeof max === "number" && max > 0 && typeof win === "number" && win >= 1000) {
        tierLimit = { maxRequests: max, windowMs: win }
      }
    } catch {
      /* fail soft — tier layer is optional */
    }
  }

  let maxRequests: number
  let windowMs: number
  let source: ResolvedLimit["source"]
  let chosenMode: RateLimitMode | null

  if (tenantRule) {
    maxRequests = tenantRule.maxRequests
    windowMs = tenantRule.windowMs
    source = "tenant"
    chosenMode = tenantRule.mode
  } else if (endpointRule) {
    maxRequests = endpointRule.maxRequests
    windowMs = endpointRule.windowMs
    source = "endpoint"
    chosenMode = endpointRule.mode
  } else if (tierLimit) {
    maxRequests = tierLimit.maxRequests
    windowMs = tierLimit.windowMs
    source = "tier"
    chosenMode = null
  } else if (globalRule) {
    maxRequests = globalRule.maxRequests
    windowMs = globalRule.windowMs
    source = "global"
    chosenMode = globalRule.mode
  } else {
    maxRequests = preset.maxRequests
    windowMs = preset.windowMs
    source = "preset"
    chosenMode = null
  }

  // Effective mode = per-rule override, else master mode.
  const mode = chosenMode ?? settings.mode

  return { maxRequests, windowMs, mode, source }
}
