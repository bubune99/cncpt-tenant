/**
 * The workspace sidebar: seven places instead of 22 items (walk dce2661a, density 2; mock-up approved
 * 2026-11-20). Nothing the old sidebar reached may be lost. Run: tsx lib/dashboard/nav-groups.assert.ts
 */
import assert from "node:assert/strict"
import { NAV_GROUPS, groupOfSection, firstSection } from "./nav-groups"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

// Every section the 22-item sidebar opened (nav-config before 2026-11-20).
const OLD = ["overview", "analytics", "sites", "branding", "domains", "frontend", "visibility", "team", "team-roles",
  "team-activity", "comms", "comms-announce", "comms-campaigns", "comms-team-chat", "comms-feedback", "mcp", "credits",
  "billing", "settings"]

ok("seven top-level places", () => {
  assert.equal(NAV_GROUPS.length, 7)
  assert.deepEqual(NAV_GROUPS.map((g) => g.label), ["Overview", "Client sites", "Analytics", "Team", "Inbox", "Billing & credits", "Settings"])
})
ok("every section the old sidebar reached is still reachable, once", () => {
  const all = NAV_GROUPS.flatMap((g) => (g.items.length ? g.items.map((i) => i.section) : [g.section]))
  for (const s of OLD) assert.ok(all.includes(s), `missing ${s}`)
  assert.equal(new Set(all).size, all.length, "no section listed twice")
})
ok("no group shows more than seven entries", () => {
  for (const g of NAV_GROUPS) assert.ok(g.items.length <= 7, g.label)
})
ok("a section is found in its group, so the group opens around it", () => {
  assert.equal(groupOfSection("branding"), "sites")
  assert.equal(groupOfSection("comms-campaigns"), "inbox")
  assert.equal(groupOfSection("team-roles"), "team")
  assert.equal(groupOfSection("credits"), "billing")
  assert.equal(groupOfSection("mcp"), "settings")
  assert.equal(groupOfSection("overview"), "overview")
  assert.equal(groupOfSection("nope"), "overview")
})
ok("pressing a group opens its first entry", () => {
  assert.equal(firstSection("sites"), "sites")
  assert.equal(firstSection("inbox"), "comms")
  assert.equal(firstSection("billing"), "billing")
  assert.equal(firstSection("analytics"), "analytics")
})
console.log(`\n${n} checks passed`)
