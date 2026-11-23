/**
 * Rate limits count in the app's own database (owner, inbox 67cd4334: "Add the table to the CNCPT database (as
 * Dzidzor does)"). Run from the repo root: node_modules/.bin/tsx lib/cms/rate-limit/db-window.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { decide, RATE_LIMIT_KIND } from "./db-window"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

ok("a counted request is allowed, and resets when its window ends", () => {
  assert.deepEqual(decide({ windowStart: BigInt(1000), windowMs: BigInt(60_000), amount: BigInt(3) }, null, 5000, 60_000), { success: true, reset: 61_000 })
})
ok("a refused request is told when the live window ends", () => {
  assert.deepEqual(decide(null, { windowStart: 1000, windowMs: 60_000, amount: 10 }, 5000, 60_000), { success: false, reset: 61_000 })
})
ok("a refusal with no live window waits a full window", () => {
  assert.deepEqual(decide(null, null, 5000, 60_000), { success: false, reset: 65_000 })
  assert.deepEqual(decide(null, { windowStart: 0, windowMs: 1000, amount: 9 }, 5000, 60_000), { success: false, reset: 65_000 })
})
ok("BigInt rows from Postgres read as numbers", () => {
  assert.equal(typeof decide({ windowStart: BigInt(2), windowMs: BigInt(3), amount: BigInt(1) }, null, 0, 3).reset, "number")
})

const src = readFileSync("lib/cms/rate-limit/index.ts", "utf8")
const store = readFileSync("lib/cms/rate-limit/db-limit.ts", "utf8")
ok("the limiter counts in the database, inside the time limit and the breaker", () => {
  assert.match(src, /from '\.\/db-limit'/)
  assert.match(src, /backendBreaker\.canTry\(\)/)
  assert.match(src, /withinTime\(dbLimit\(key, resolved\.maxRequests, resolved\.windowMs\), BACKEND_TIMEOUT_MS\)/)
})
ok("memory is only the fallback for a database error", () => {
  const catchBlock = src.slice(src.indexOf("} catch (error) {", src.indexOf("dbLimit(")))
  assert.match(catchBlock.slice(0, 600), /memoryLimit\(key/)
})
ok("the deleted Upstash store is no longer used by the limiter", () => {
  assert.doesNotMatch(src, /@upstash\/ratelimit|from '@\/lib\/redis'|KV_REST_API/)
})
ok("the reserve is one guarded upsert on usage_counters, so concurrent requests cannot cross the limit", () => {
  assert.match(store, /INSERT INTO "usage_counters"/)
  assert.match(store, /ON CONFLICT \("kind", "identity"\) DO UPDATE/)
  assert.match(store, /WHERE "usage_counters"\."windowStart" \+ "usage_counters"\."windowMs" <= EXCLUDED\."windowStart"\s+OR "usage_counters"\."amount" \+ EXCLUDED\."amount" <= /)
  assert.ok(store.includes("RATE_LIMIT_KIND"))
  assert.equal(RATE_LIMIT_KIND, "rate-limit")
})
ok("the table is in the schema with its migration", () => {
  const schema = readFileSync("prisma/cms/schema.prisma", "utf8")
  assert.match(schema, /model UsageCounter \{[\s\S]*?@@id\(\[kind, identity\]\)[\s\S]*?@@map\("usage_counters"\)/)
  const sqlText = readFileSync("prisma/migrations/rate-limit-usage-counters/001_create_usage_counters.sql", "utf8")
  assert.match(sqlText, /CREATE TABLE IF NOT EXISTS "usage_counters"/)
})
console.log(`${n} checks passed`)
