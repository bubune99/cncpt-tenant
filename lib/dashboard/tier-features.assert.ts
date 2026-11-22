/**
 * Which features a new site starts with, by the owner's plan (was a WHERE clause in api/dashboard/subdomain).
 * Run from the repo root: node_modules/.bin/tsx lib/dashboard/tier-features.assert.ts
 */
import assert from "node:assert/strict"
import { tierAllows, featuresForTier } from "./tier-features"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

ok("free features are on for every plan", () => {
  for (const t of ["free", "pro", "enterprise", "unknown"]) assert.equal(tierAllows("free", t), true, t)
})
ok("pro features need pro or enterprise", () => {
  assert.equal(tierAllows("pro", "free"), false)
  assert.equal(tierAllows("pro", "pro"), true)
  assert.equal(tierAllows("pro", "enterprise"), true)
})
ok("enterprise features need enterprise", () => {
  assert.equal(tierAllows("enterprise", "pro"), false)
  assert.equal(tierAllows("enterprise", "enterprise"), true)
})
ok("an unknown minimum is never switched on", () => {
  assert.equal(tierAllows("platinum", "enterprise"), false)
  assert.equal(tierAllows(null, "enterprise"), false)
})
ok("featuresForTier keeps only what the plan allows, and a missing plan reads as free", () => {
  const all = [{ id: 1, minimum_tier: "free" }, { id: 2, minimum_tier: "pro" }, { id: 3, minimum_tier: "enterprise" }]
  assert.deepEqual(featuresForTier(all, null).map((f) => f.id), [1])
  assert.deepEqual(featuresForTier(all, "pro").map((f) => f.id), [1, 2])
  assert.deepEqual(featuresForTier(all, "enterprise").map((f) => f.id), [1, 2, 3])
})
ok("the route uses it instead of its own WHERE clause", () => {
  const route = require("node:fs").readFileSync("app/api/dashboard/subdomain/route.ts", "utf8") as string
  assert.match(route, /featuresForTier\(/)
  assert.doesNotMatch(route, /minimum_tier = 'pro' AND/)
})
console.log(`\n${n} checks passed`)
