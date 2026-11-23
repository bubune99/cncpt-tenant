/**
 * One list of plans for the public Pricing page and the dashboard's Billing page (walk 2026-11-22: Billing
 * showed Free / Pro $29 / Enterprise $99 while Pricing sells Starter $25, Growth $49, Pro $99, Business $349).
 * Run from the repo root: node_modules/.bin/tsx lib/billing/plans.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { PLANS, planFor, monthlyShown, usagePercent } from "./plans"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

ok("the four plans Pricing sells, in order, with their prices", () => {
  assert.deepEqual(PLANS.map((p) => [p.slug, p.price, p.yearlyPrice]), [["starter", 25, 250], ["growth", 49, 490], ["pro", 99, 990], ["business", 349, 3490]])
})
ok("the prices agree with the plans-table script (scripts/tiers-match-pricing.mjs)", () => {
  const script = readFileSync("scripts/tiers-match-pricing.mjs", "utf8")
  for (const p of PLANS) assert.match(script, new RegExp(`name: "${p.slug}"[^}]*m: ${p.price}, y: ${p.yearlyPrice}`), p.slug)
})
ok("planFor finds a plan by its stored name or display name, any case", () => {
  assert.equal(planFor("Growth")?.slug, "growth")
  assert.equal(planFor("pro")?.slug, "pro")
  assert.equal(planFor("Free"), undefined)
  assert.equal(planFor(null), undefined)
})
ok("both pages read the shared list and keep no list of their own", () => {
  const pricing = readFileSync("app/(public)/pricing/page.tsx", "utf8")
  const billing = readFileSync("app/dashboard/billing.tsx", "utf8")
  for (const [name, src] of [["pricing", pricing], ["billing", billing]] as const) assert.match(src, /from "@\/lib\/billing\/plans"/, name)
  assert.doesNotMatch(pricing, /^const plans = \[/m)
  assert.doesNotMatch(billing, /price: 29,/)
})
ok("billed yearly, a plan shows its yearly price as a monthly figure, rounded to the dollar", () => {
  const [starter, growth, pro, business] = PLANS
  assert.deepEqual([starter, growth, pro, business].map((p) => monthlyShown(p, true)), [21, 41, 83, 291])
  assert.deepEqual([starter, growth, pro, business].map((p) => monthlyShown(p, false)), [25, 49, 99, 349])
})
ok("usage as a share of the limit: 0 to 100, and 0 when there is no limit to measure against", () => {
  assert.equal(usagePercent(1, 4), 25)
  assert.equal(usagePercent(5, 4), 100)
  assert.equal(usagePercent(0, 3), 0)
  assert.equal(usagePercent(2, 0), 0)
  assert.equal(usagePercent(2, -1), 0)
})
ok("the pages call these and work out neither figure themselves", () => {
  const pricing = readFileSync("app/(public)/pricing/page.tsx", "utf8")
  const billing = readFileSync("app/dashboard/billing.tsx", "utf8")
  assert.doesNotMatch(pricing, /yearlyPrice \/ 12/)
  assert.match(pricing, /monthlyShown\(/)
  assert.doesNotMatch(billing, /used \/ sub\.usage\.subdomains\.limit/)
  assert.match(billing, /usagePercent\(/)
})
console.log(`\n${n} checks passed`)
