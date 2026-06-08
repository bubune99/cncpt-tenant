/**
 * Resolve the effective rate-limit decision for a request by layering
 * owner-configured DB rules on top of the hardcoded preset.
 */

import { getRateLimitConfig } from "./config"
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
  source: "tenant" | "endpoint" | "global" | "preset"
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

  // Most-specific-wins: tenant → endpoint → global.
  const tenantRule = tenant
    ? rules.find((r) => r.scope === "tenant" && r.target === tenant)
    : undefined
  const endpointRule = rules.find(
    (r) => r.scope === "endpoint" && endpointMatches(r, name, path),
  )
  const globalRule = rules.find((r) => r.scope === "global")

  const chosen = tenantRule ?? endpointRule ?? globalRule
  const source: ResolvedLimit["source"] = tenantRule
    ? "tenant"
    : endpointRule
      ? "endpoint"
      : globalRule
        ? "global"
        : "preset"

  const maxRequests = chosen?.maxRequests ?? preset.maxRequests
  const windowMs = chosen?.windowMs ?? preset.windowMs

  // Effective mode = per-rule override, else master mode.
  const ruleMode: RateLimitMode | null = chosen?.mode ?? null
  const mode = ruleMode ?? settings.mode

  return { maxRequests, windowMs, mode, source }
}
