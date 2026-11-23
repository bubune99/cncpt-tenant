/** The Overview's "at a glance" figures: support tickets and AI credits.
 *  Run: npx tsx lib/dashboard/glance.assert.ts */
import assert from "node:assert/strict"
import { parseSupport, parseCredits, supportLine, creditsLine } from "./glance"
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("support counts read from the endpoint, numbers or numeric strings", () => {
  assert.deepEqual(parseSupport({ stats: { open: "2", total: 7 } }), { open: 2, total: 7 })
})
ok("support with no stats is unknown, not zero", () => {
  assert.equal(parseSupport(null), null); assert.equal(parseSupport({}), null)
})
ok("support line: loading, failed and known each say so", () => {
  assert.equal(supportLine("loading", null), "Loading ticket counts…")
  assert.equal(supportLine("failed", null), "Ticket counts couldn't load")
  assert.equal(supportLine("ready", { open: 1, total: 1 }), "1 open · 1 ticket in all")
  assert.equal(supportLine("ready", { open: 0, total: 5 }), "0 open · 5 tickets in all")
})
ok("credits read defensively (pg numerics as strings)", () => {
  assert.deepEqual(parseCredits({ balance: { total: "120", monthlyAllocation: "500", monthly: 100, purchased: "20" } }), { left: 120, allotted: 500, monthly: 100, purchased: 20 })
  assert.equal(parseCredits({ nope: 1 }), null)
})
ok("credits line says how many are left, never calls the balance 'used'", () => {
  assert.equal(creditsLine("loading", null), "Loading credit balance…")
  assert.equal(creditsLine("failed", null), "Credit balance couldn't load")
  assert.equal(creditsLine("ready", { left: 120, allotted: 500, monthly: 100, purchased: 20 }), "120 left of 500 this month")
  assert.equal(creditsLine("ready", { left: 1200, allotted: 0, monthly: 0, purchased: 1200 }), "1,200 left")
})
console.log(`\n${n} checks passed`)
