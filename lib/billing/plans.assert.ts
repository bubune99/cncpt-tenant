/**
 * One list of plans for the public Pricing page and the dashboard's Billing page (walk 2026-11-22: Billing
 * showed Free / Pro $29 / Enterprise $99 while Pricing sells Starter $25, Growth $49, Pro $99, Business $349).
 * Run from the repo root: node_modules/.bin/tsx lib/billing/plans.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { PLANS, planFor } from "./plans"

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
console.log(`\n${n} checks passed`)
