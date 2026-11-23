/**
 * Rate-limit counts in the app's own Postgres (`usage_counters`), shared by every server instance. Ported from
 * Dzidzor's reserveCounter (far-cms packages/cms/src/lib/rate-limit/store.ts). One row per key; each row carries
 * its own window and rolls over on its own. THROWS on a database error (including a missing table): the caller
 * decides what a failure means (index.ts falls back to the per-instance memory limiter).
 * The meaning of the answer is in db-window.ts, checked in db-window.assert.ts.
 */
import { prisma } from "@/lib/cms/db"
import { decide, RATE_LIMIT_KIND, type CounterRow, type LimitDecision } from "./db-window"

/** Rows whose window ended this long ago are pruned now and then. */
const PRUNE_AFTER_MS = 86_400_000
let reservesSincePrune = 0

/**
 * Count one request for `key` if the window's count stays within `maxRequests`. ONE statement: the INSERT adds
 * nothing when a single request is already over the limit, and ON CONFLICT ... DO UPDATE ... WHERE re-checks the
 * guard on the row it has locked, so concurrent requests serialize on the row and never jointly cross the limit.
 */
export async function dbLimit(key: string, maxRequests: number, windowMs: number, nowMs: number = Date.now()): Promise<LimitDecision> {
  const now = BigInt(Math.floor(nowMs))
  const win = BigInt(Math.floor(windowMs))
  const lim = BigInt(Math.max(0, Math.floor(maxRequests)))
  const one = BigInt(1)
  const rows = await prisma.$queryRaw<CounterRow[]>`
    INSERT INTO "usage_counters" ("kind", "identity", "windowStart", "windowMs", "amount", "updatedAt")
    SELECT ${RATE_LIMIT_KIND}, ${key}, ${now}::bigint, ${win}::bigint, ${one}::bigint, NOW()
    WHERE ${one}::bigint <= ${lim}::bigint
    ON CONFLICT ("kind", "identity") DO UPDATE SET
      "amount" = CASE WHEN "usage_counters"."windowStart" + "usage_counters"."windowMs" <= EXCLUDED."windowStart"
                      THEN EXCLUDED."amount" ELSE "usage_counters"."amount" + EXCLUDED."amount" END,
      "windowMs" = CASE WHEN "usage_counters"."windowStart" + "usage_counters"."windowMs" <= EXCLUDED."windowStart"
                      THEN EXCLUDED."windowMs" ELSE "usage_counters"."windowMs" END,
      "windowStart" = CASE WHEN "usage_counters"."windowStart" + "usage_counters"."windowMs" <= EXCLUDED."windowStart"
                      THEN EXCLUDED."windowStart" ELSE "usage_counters"."windowStart" END,
      "updatedAt" = NOW()
    WHERE "usage_counters"."windowStart" + "usage_counters"."windowMs" <= EXCLUDED."windowStart"
       OR "usage_counters"."amount" + EXCLUDED."amount" <= ${lim}::bigint
    RETURNING "windowStart", "windowMs", "amount"
  `
  if (++reservesSincePrune >= 500) {
    reservesSincePrune = 0
    const cutoff = BigInt(Math.floor(nowMs - PRUNE_AFTER_MS))
    prisma.$executeRaw`
      DELETE FROM "usage_counters" WHERE "kind" = ${RATE_LIMIT_KIND} AND "windowStart" + "windowMs" < ${cutoff}::bigint
    `.catch((e: unknown) => console.warn("[rate-limit] prune failed:", e instanceof Error ? e.message : e))
  }
  if (rows[0]) return decide(rows[0], null, nowMs, windowMs)
  // Refused: nothing changed. This read only says when to retry; it plays no part in the decision.
  const current = await prisma.$queryRaw<CounterRow[]>`
    SELECT "windowStart", "windowMs", "amount" FROM "usage_counters" WHERE "kind" = ${RATE_LIMIT_KIND} AND "identity" = ${key}
  `
  return decide(null, current[0] ?? null, nowMs, windowMs)
}

/** Removes this kind's rows for keys starting with `prefix` (used by the live test to clean up its SAMPLE keys). */
export async function deleteLimitKeys(prefix: string): Promise<number> {
  return prisma.$executeRaw`DELETE FROM "usage_counters" WHERE "kind" = ${RATE_LIMIT_KIND} AND "identity" LIKE ${prefix + "%"}`
}
