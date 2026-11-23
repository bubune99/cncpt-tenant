/**
 * How long the rate limiter waits on its Redis backend, and when it stops trying. Found 2026-11-22 on staging:
 * the Upstash host is gone, so every request to a route behind withTenantAuth waited ~5 s on the failed lookup
 * before falling back to memory (GET /api/cms/orders took 4.5-6.2 s; routes without that check took ~200 ms).
 * Run from the repo root: node_modules/.bin/tsx lib/cms/rate-limit/backend-breaker.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createBreaker, withinTime, BACKEND_TIMEOUT_MS, BACKEND_COOLDOWN_MS } from "./backend-breaker"

let n = 0
const ok = async (name: string, fn: () => void | Promise<void>) => { await fn(); n++; console.log(`ok ${n} - ${name}`) }

async function main() {
  await ok("a closed breaker lets the backend be tried", () => {
    let t = 0
    const b = createBreaker({ cooldownMs: 1000, now: () => t })
    assert.equal(b.canTry(), true)
  })
  await ok("after a failure the backend is skipped for the cooldown, then tried again", () => {
    let t = 1000
    const b = createBreaker({ cooldownMs: 300_000, now: () => t })
    b.failed()
    assert.equal(b.canTry(), false)
    t += 299_999
    assert.equal(b.canTry(), false)
    t += 1
    assert.equal(b.canTry(), true)
  })
  await ok("a success closes it again", () => {
    let t = 0
    const b = createBreaker({ cooldownMs: 1000, now: () => t })
    b.failed(); t = 5000; b.succeeded()
    assert.equal(b.canTry(), true)
  })
  await ok("a backend answer inside the time limit comes through", async () => {
    assert.equal(await withinTime(Promise.resolve("yes"), 50), "yes")
  })
  await ok("a backend that hangs is given up on at the time limit", async () => {
    const started = Date.now()
    await assert.rejects(withinTime(new Promise(() => {}), 40), /timed out/)
    assert.ok(Date.now() - started < 400)
  })
  await ok("a backend error still comes through as an error", async () => {
    await assert.rejects(withinTime(Promise.reject(new Error("ENOTFOUND")), 50), /ENOTFOUND/)
  })
  await ok("the limits are short enough not to hold a request up", () => {
    assert.ok(BACKEND_TIMEOUT_MS <= 800)
    assert.ok(BACKEND_COOLDOWN_MS >= 60_000)
  })
  await ok("the rate limiter uses the breaker and the time limit around its Redis call", () => {
    const src = readFileSync("lib/cms/rate-limit/index.ts", "utf8")
    assert.match(src, /from '\.\/backend-breaker'/)
    assert.match(src, /backendBreaker\.canTry\(\)/)
    assert.match(src, /withinTime\(limiter\.limit\(key\), BACKEND_TIMEOUT_MS\)/)
  })
  console.log(`${n} checks passed`)
}
main()
