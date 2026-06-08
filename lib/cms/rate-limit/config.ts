/**
 * Rate-limit configuration loader.
 *
 * Reads owner-configured rules + the master mode from Postgres, with a short
 * in-memory cache so config changes propagate within seconds without a redeploy
 * and without hitting the DB on every request.
 *
 * Resolution precedence for an incoming request (most specific wins):
 *   1. an enabled tenant-scoped rule matching the request's tenant
 *   2. an enabled endpoint-scoped rule matching the preset/path
 *   3. an enabled global rule
 *   4. the hardcoded preset passed by the caller (always the safety floor)
 *
 * If the DB is unavailable the loader fails OPEN (returns no rules + observe
 * mode) so a config-store outage can never block live traffic.
 */

import { sql } from "@/lib/neon"
import {
  DEFAULT_RATE_LIMIT_SETTINGS,
  type RateLimitMode,
  type RateLimitRule,
  type RateLimitSettings,
} from "./types"

const CACHE_TTL_MS = 15_000

interface RateLimitConfigSnapshot {
  rules: RateLimitRule[]
  settings: RateLimitSettings
  loadedAt: number
}

// Cache on globalThis so it survives HMR in dev and module re-eval.
const globalForRl = globalThis as unknown as {
  __rlConfigSnapshot?: RateLimitConfigSnapshot
  __rlConfigPromise?: Promise<RateLimitConfigSnapshot>
}

/** Idempotently ensure the config tables exist. Safe to call repeatedly. */
export async function ensureRateLimitTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_rules (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scope       VARCHAR(16)  NOT NULL,
      target      VARCHAR(255) NOT NULL DEFAULT '*',
      max_requests INTEGER     NOT NULL,
      window_ms   INTEGER      NOT NULL,
      mode        VARCHAR(16),
      enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
      note        TEXT,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      UNIQUE (scope, target)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_settings (
      key        VARCHAR(64) PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by VARCHAR(255)
    )
  `
}

function rowToRule(row: Record<string, unknown>): RateLimitRule {
  return {
    id: String(row.id),
    scope: row.scope as RateLimitRule["scope"],
    target: String(row.target),
    // pg returns INTEGER as number, but coerce defensively.
    maxRequests: Number(row.max_requests),
    windowMs: Number(row.window_ms),
    mode: (row.mode as RateLimitMode | null) ?? null,
    enabled: Boolean(row.enabled),
    note: (row.note as string | null) ?? null,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  }
}

async function loadSnapshot(): Promise<RateLimitConfigSnapshot> {
  try {
    await ensureRateLimitTables()

    const [ruleRows, settingRows] = await Promise.all([
      sql`SELECT * FROM rate_limit_rules WHERE enabled = TRUE`,
      sql`SELECT key, value FROM rate_limit_settings WHERE key = 'config'`,
    ])

    let settings: RateLimitSettings = { ...DEFAULT_RATE_LIMIT_SETTINGS }
    if (settingRows.length > 0) {
      try {
        settings = { ...settings, ...JSON.parse(settingRows[0].value as string) }
      } catch {
        /* keep defaults on malformed JSON */
      }
    }

    return {
      rules: ruleRows.map(rowToRule),
      settings,
      loadedAt: Date.now(),
    }
  } catch (error) {
    // Fail OPEN — never block traffic because the config store is down.
    console.error("[rate-limit/config] load failed, failing open:", error)
    return {
      rules: [],
      settings: { ...DEFAULT_RATE_LIMIT_SETTINGS },
      loadedAt: Date.now(),
    }
  }
}

/** Get the current config snapshot, using the cache when fresh. */
export async function getRateLimitConfig(): Promise<RateLimitConfigSnapshot> {
  const cached = globalForRl.__rlConfigSnapshot
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached
  }
  // De-dupe concurrent loads.
  if (!globalForRl.__rlConfigPromise) {
    globalForRl.__rlConfigPromise = loadSnapshot().then((snap) => {
      globalForRl.__rlConfigSnapshot = snap
      globalForRl.__rlConfigPromise = undefined
      return snap
    })
  }
  return globalForRl.__rlConfigPromise
}

/** Force the next read to hit the DB (call after a config write). */
export function invalidateRateLimitConfig(): void {
  globalForRl.__rlConfigSnapshot = undefined
  globalForRl.__rlConfigPromise = undefined
}
