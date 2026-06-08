/**
 * Rate-limit configuration types — shared by the config loader, the enforcement
 * helper, and the owner-facing management UI/API.
 */

/** Where a rule applies. */
export type RateLimitScope = "global" | "tenant" | "endpoint"

/** How a rule behaves when the limit is hit. */
export type RateLimitMode = "enforce" | "observe"

/** A single configurable rate-limit rule (one DB row). */
export interface RateLimitRule {
  id: string
  /** Scope of the rule. */
  scope: RateLimitScope
  /**
   * Target identifier:
   * - scope=global  → "*" (applies to all)
   * - scope=tenant  → the subdomain string (e.g. "dzidzor")
   * - scope=endpoint→ a preset name (e.g. "checkout") or a path prefix
   */
  target: string
  /** Maximum requests allowed in the window. */
  maxRequests: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Per-rule mode override. Falls back to the global mode when null. */
  mode: RateLimitMode | null
  /** Whether the rule is active. Disabled rules are ignored entirely. */
  enabled: boolean
  /** Optional human note. */
  note: string | null
  createdAt: string
  updatedAt: string
}

/** Master switch + defaults, stored as a KV blob. */
export interface RateLimitSettings {
  /**
   * Master enforcement mode.
   * - "observe": never block, only record (safe default — cannot lock anyone out)
   * - "enforce": block when limits exceeded (per-rule mode can still downgrade)
   * - "off": rate limiting fully disabled
   */
  mode: "observe" | "enforce" | "off"
}

export const DEFAULT_RATE_LIMIT_SETTINGS: RateLimitSettings = {
  // Default to observe so enabling the feature can never lock out the owner.
  mode: "observe",
}
