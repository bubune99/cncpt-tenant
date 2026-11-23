/**
 * How the rate limiter is wired: it counts in the database (./db-limit) inside the time limit and the breaker,
 * falls back to memory only on a database error, and no longer touches the deleted Upstash store
 * (owner, inbox 67cd4334). Run from the repo root: node_modules/.bin/tsx lib/cms/rate-limit/index.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

const src = readFileSync("lib/cms/rate-limit/index.ts", "utf8")
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
ok("the client IP comes from the first forwarded address", () => {
  assert.match(src, /x-forwarded-for'\)\?\.split\(','\)\[0\]\?\.trim\(\)/)
})
console.log(`${n} checks passed`)
