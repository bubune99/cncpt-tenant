/**
 * A site admin's Overview: which orders are open, which products are low, how a customer is named, how the
 * analytics payload is read, and what a widget shows while its data is loading, after it failed, or when it is
 * truly empty. Moved out of app/s/[subdomain]/admin/page.tsx (2026-11-22, check "the page file holds no business
 * rule"). Before: the order and stock lists started as [] and stayed [] after a failed request, so the widgets said
 * "No orders waiting on fulfillment. Nice." while still loading or when the request had failed.
 * Run from the repo root: node_modules/.bin/tsx lib/cms/admin/overview-rules.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  orderName, toOverviewOrder, openOrdersOf, mergeOpenOrders, OPEN_ORDER_QUERIES, lowStockOf, analyticsFrom, view, countMeta, salesCells,
} from "./overview-rules"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

const raw = (o: Partial<Parameters<typeof toOverviewOrder>[0]> = {}) => ({
  id: "o1", orderNumber: "SAMPLE-1", email: null, total: 1200, status: "pending", createdAt: "2026-11-22T10:00:00Z",
  customer: null, currentStage: null, ...o,
})

ok("a customer is named by first and last name, then email, then the order's email, then Guest", () => {
  assert.equal(orderName(raw({ customer: { firstName: "Ama", lastName: "Mensah", email: "a@example.org" } })), "Ama Mensah")
  assert.equal(orderName(raw({ customer: { firstName: null, lastName: null, email: "a@example.org" } })), "a@example.org")
  assert.equal(orderName(raw({ email: "guest@example.org" })), "guest@example.org")
  assert.equal(orderName(raw()), "Guest")
})
ok("an order row keeps its total in cents and its status in capitals", () => {
  const o = toOverviewOrder(raw({ status: "processing", currentStage: { displayName: "Packing", color: "#c00" } }))
  assert.deepEqual([o.total, o.status, o.stageLabel, o.stageColor], [1200, "PROCESSING", "Packing", "#c00"])
})
ok("open orders are the pending and processing ones; loading and failed pass through", () => {
  const list = ["PENDING", "PROCESSING", "SHIPPED", "CANCELLED"].map((s, i) => toOverviewOrder(raw({ id: String(i), status: s })))
  const open = openOrdersOf(list)
  assert.ok(Array.isArray(open))
  assert.deepEqual((open as readonly { id: string }[]).map((o) => o.id), ["0", "1"])
  assert.equal(openOrdersOf("loading"), "loading")
  assert.equal(openOrdersOf("failed"), "failed")
})
ok("open orders are asked for by status, not picked from the newest few (walk 2026-11-22)", () => {
  assert.deepEqual([...OPEN_ORDER_QUERIES], ["status=pending", "status=processing"])
  const older = toOverviewOrder(raw({ id: "old", status: "processing", createdAt: "2026-10-01T10:00:00Z" }))
  const newer = toOverviewOrder(raw({ id: "new", status: "pending", createdAt: "2026-11-21T10:00:00Z" }))
  assert.deepEqual((mergeOpenOrders([[older], [newer]]) as readonly { id: string }[]).map((o) => o.id), ["new", "old"])
  assert.deepEqual(mergeOpenOrders([[], []]), [])
  assert.equal(mergeOpenOrders([[older], "failed"]), "failed")
  assert.equal(mergeOpenOrders(["loading", [newer]]), "loading")
})
ok("low stock is a tracked product at or below its reorder point", () => {
  const p = (id: string, stock: number, lowStockThreshold: number, trackInventory = true) => ({ id, title: `SAMPLE ${id}`, stock, lowStockThreshold, trackInventory, status: "ACTIVE" })
  assert.deepEqual(lowStockOf([p("a", 5, 5), p("b", 6, 5), p("c", 0, 5), p("d", 1, 5, false)]).map((x) => x.id), ["a", "c"])
})
ok("the analytics payload: an error or nothing counts as failed; known zeros stay zeros", () => {
  assert.equal(analyticsFrom(null), "failed")
  assert.equal(analyticsFrom({ error: "boom" }), "failed")
  const a = analyticsFrom({ revenue: 0, purchases: 0, uniqueVisitors: 3, pageViews: 9, timeSeries: [] })
  assert.notEqual(a, "failed")
  assert.deepEqual(a, { revenue: 0, purchases: 0, uniqueVisitors: 3, pageViews: 9, timeSeries: [] })
})
ok("a widget's list: loading, failed, empty only when known, else its rows", () => {
  assert.deepEqual(view("loading"), { kind: "loading" })
  assert.deepEqual(view("failed"), { kind: "failed" })
  assert.deepEqual(view([]), { kind: "empty" })
  assert.deepEqual(view([1, 2]), { kind: "items", items: [1, 2] })
})
ok("the count beside a widget's title shows only once the list is known and not empty", () => {
  assert.equal(countMeta("loading", "open"), null)
  assert.equal(countMeta("failed", "open"), null)
  assert.equal(countMeta([], "open"), null)
  assert.equal(countMeta([1, 2, 3], "open"), "3 open")
})
ok("sales summary: a dash until known, a known 0 shows as 0, average only when there are orders", () => {
  const fmt = { usd: (v: number) => `$${v}`, money: (c: number) => `¢${c}` }
  assert.deepEqual(salesCells("loading", null, fmt).map((c) => c[1]), ["—", "—", "—", "—"])
  assert.deepEqual(salesCells("failed", null, fmt).map((c) => c[1]), ["—", "—", "—", "—"])
  const zero = { revenue: 0, purchases: 0, uniqueVisitors: 0, pageViews: 0, timeSeries: [] }
  assert.deepEqual(salesCells(zero, { totalCustomers: 0 }, fmt).map((c) => c[1]), ["$0", "0", "—", "0"])
  const some = { revenue: 300, purchases: 3, uniqueVisitors: 0, pageViews: 0, timeSeries: [] }
  assert.deepEqual(salesCells(some, { totalCustomers: 12 }, fmt).map((c) => c[1]), ["$300", "3", "¢100", "12"])
})
ok("the Overview page uses these rules and keeps none of its own", () => {
  const src = readFileSync("app/s/[subdomain]/admin/page.tsx", "utf8")
  assert.match(src, /from '@\/lib\/cms\/admin\/overview-rules'/)
  assert.doesNotMatch(src, /OPEN_STATUSES =/)
  assert.doesNotMatch(src, /lowStockThreshold\)/)
  assert.doesNotMatch(src, /\?\? 0,/)
  assert.match(src, /OPEN_ORDER_QUERIES/)
  assert.doesNotMatch(src, /openOrdersOf\(orders\)/)
})
ok("the widgets show loading and failed, never the empty message, for a list not known yet", () => {
  const src = readFileSync("components/cms/admin/overview/overview-widgets.tsx", "utf8")
  assert.match(src, /from '@\/lib\/cms\/admin\/overview-rules'/)
  assert.doesNotMatch(src, /data\.(openOrders|lowStock|recentOrders)\.length/)
})

console.log(`${n} checks passed`)
