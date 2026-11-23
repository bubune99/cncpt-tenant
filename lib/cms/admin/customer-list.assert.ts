/**
 * A site's Customers list: which customers each segment holds, the counts on its tabs, search and sort, and how a
 * figure that has not arrived yet is shown. Moved out of app/s/[subdomain]/admin/customers/page.tsx (2026-11-22,
 * check "the page file holds no business rule"); the stat chips used to read 0 while still loading.
 * Run from the repo root: node_modules/.bin/tsx lib/cms/admin/customer-list.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { NEW_WINDOW_MS, inSegment, segmentCounts, searchAndSort, withOrdersCount, figure } from "./customer-list"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

const now = Date.parse("2026-11-22T12:00:00Z")
const day = 86_400_000
const row = (id: string, o: Partial<{ name: string; email: string; isActive: boolean; createdAt: string; designCount: number; lastActivityAt: string | null }> = {}) => ({
  id, name: o.name ?? `SAMPLE ${id}`, email: o.email ?? `${id}@example.org`, isActive: o.isActive ?? true,
  createdAt: o.createdAt ?? new Date(now - 30 * day).toISOString(), designCount: o.designCount ?? 0, lastActivityAt: o.lastActivityAt ?? null,
})
const rows = [
  row("a", { name: "Ama", isActive: true, designCount: 3, lastActivityAt: new Date(now - 2 * day).toISOString() }),
  row("b", { name: "Kofi", isActive: false, createdAt: new Date(now - 6 * day).toISOString() }),
  row("c", { name: "Esi", isActive: true, createdAt: new Date(now - 8 * day).toISOString(), designCount: 1, lastActivityAt: new Date(now - 1 * day).toISOString() }),
  row("d", { name: "Yaw", isActive: true, createdAt: new Date(now - NEW_WINDOW_MS + 1).toISOString() }),
]

ok("segments: active, dormant (not active) and new within 7 days", () => {
  assert.deepEqual(rows.filter((r) => inSegment(r, "active", now)).map((r) => r.id), ["a", "c", "d"])
  assert.deepEqual(rows.filter((r) => inSegment(r, "inactive", now)).map((r) => r.id), ["b"])
  assert.deepEqual(rows.filter((r) => inSegment(r, "new", now)).map((r) => r.id), ["b", "d"])
  assert.equal(rows.filter((r) => inSegment(r, "all", now)).length, 4)
})
ok("a customer exactly 7 days old is no longer new", () => {
  assert.equal(inSegment(row("e", { createdAt: new Date(now - NEW_WINDOW_MS).toISOString() }), "new", now), false)
})
ok("the tab counts are the segment sizes, worked out from the whole list", () => {
  assert.deepEqual(segmentCounts(rows, now), { all: 4, active: 3, inactive: 1, new: 2 })
  assert.deepEqual(segmentCounts([], now), { all: 0, active: 0, inactive: 0, new: 0 })
})
ok("search matches name, email or id, any case, and leaves the list alone when empty", () => {
  assert.deepEqual(searchAndSort(rows, "  ESI ", "Name A–Z").map((r) => r.id), ["c"])
  assert.deepEqual(searchAndSort(rows, "b@example", "Name A–Z").map((r) => r.id), ["b"])
  assert.equal(searchAndSort(rows, "", "Name A–Z").length, 4)
})
ok("sort: by orders, by name, or most recent activity first with none last", () => {
  assert.deepEqual(searchAndSort(rows, "", "Orders").map((r) => r.id).slice(0, 2), ["a", "c"])
  assert.deepEqual(searchAndSort(rows, "", "Name A–Z").map((r) => r.name), ["Ama", "Esi", "Kofi", "Yaw"])
  assert.deepEqual(searchAndSort(rows, "", "Last order").map((r) => r.id).slice(0, 2), ["c", "a"])
})
ok("sorting never changes the list it was given", () => {
  const before = rows.map((r) => r.id).join()
  searchAndSort(rows, "", "Name A–Z")
  assert.equal(rows.map((r) => r.id).join(), before)
})
ok("with orders counts customers who have placed at least one", () => {
  assert.equal(withOrdersCount(rows), 2)
})
ok("a figure not known yet shows a dash, never 0; a known 0 shows 0", () => {
  assert.equal(figure(undefined), "—")
  assert.equal(figure(null), "—")
  assert.equal(figure(0), 0)
  assert.equal(figure(12), 12)
})
ok("the Customers page uses these rules and keeps no copy of its own", () => {
  const src = readFileSync("app/s/[subdomain]/admin/customers/page.tsx", "utf8")
  assert.match(src, /from '@\/lib\/cms\/admin\/customer-list'/)
  assert.doesNotMatch(src, /NEW_WINDOW_MS =/)
  assert.doesNotMatch(src, /\?\? 0,/)
})

console.log(`${n} checks passed`)
