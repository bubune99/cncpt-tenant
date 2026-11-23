/**
 * A site admin's Overview rules: open orders, low stock, how a customer is named, reading the analytics payload,
 * and what a widget shows while its data is loading, after it failed, or when it is truly empty.
 * Pure: no React, no fetching. Checked in overview-rules.assert.ts.
 */
import type {
  Loaded, OverviewAnalytics, OverviewOrder, OverviewProduct, OverviewStats,
} from "@/components/cms/admin/overview/overview-types"

/** An order as GET /api/cms/orders returns it (only the fields read). */
export interface RawOrder {
  readonly id: string
  readonly orderNumber: string
  readonly email: string | null
  readonly total: number
  readonly status: string
  readonly createdAt: string
  readonly customer: { readonly firstName: string | null; readonly lastName: string | null; readonly email: string | null } | null
  readonly currentStage: { readonly displayName: string | null; readonly color: string | null } | null
}

/** A product as GET /api/cms/products returns it (only the fields read). */
export interface RawProduct {
  readonly id: string
  readonly title: string
  readonly stock: number
  readonly lowStockThreshold: number
  readonly trackInventory: boolean
  readonly status: string
}

/** Orders waiting on fulfilment. */
const OPEN_STATUSES: ReadonlySet<string> = new Set(["PENDING", "PROCESSING"])

/** First and last name, else the customer's email, else the order's email, else Guest. */
export function orderName(o: RawOrder): string {
  const full = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ").trim()
  return full || o.customer?.email || o.email || "Guest"
}

export function toOverviewOrder(o: RawOrder): OverviewOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    total: o.total,
    createdAt: o.createdAt,
    status: (o.status ?? "").toUpperCase(),
    customerName: orderName(o),
    stageLabel: o.currentStage?.displayName ?? null,
    stageColor: o.currentStage?.color ?? null,
  }
}

/** The pending and processing orders; a list still loading or failed stays so. */
export function openOrdersOf(orders: Loaded<readonly OverviewOrder[]>): Loaded<readonly OverviewOrder[]> {
  return typeof orders === "string" ? orders : orders.filter((o) => OPEN_STATUSES.has(o.status))
}

/** Tracked products at or below their reorder point. */
export function lowStockOf(products: readonly RawProduct[]): OverviewProduct[] {
  return products
    .filter((p) => p.trackInventory && p.stock <= p.lowStockThreshold)
    .map((p) => ({ id: p.id, title: p.title, stock: p.stock, lowStockThreshold: p.lowStockThreshold, status: p.status }))
}

/** The analytics payload, or "failed" when there is none or it carries an error. Missing fields are not made up as 0. */
export function analyticsFrom(d: (Partial<OverviewAnalytics> & { error?: string }) | null | undefined): Loaded<OverviewAnalytics> {
  if (!d || d.error) return "failed"
  const { revenue, purchases, uniqueVisitors, pageViews, timeSeries } = d
  if ([revenue, purchases, uniqueVisitors, pageViews].some((v) => typeof v !== "number") || !Array.isArray(timeSeries)) return "failed"
  return { revenue: revenue!, purchases: purchases!, uniqueVisitors: uniqueVisitors!, pageViews: pageViews!, timeSeries: timeSeries! }
}

export type View<T> = { kind: "loading" } | { kind: "failed" } | { kind: "empty" } | { kind: "items"; items: readonly T[] }

/** What a list widget shows: loading, failed, empty (only once known), or its rows. */
export function view<T>(state: Loaded<readonly T[]>): View<T> {
  if (state === "loading") return { kind: "loading" }
  if (state === "failed") return { kind: "failed" }
  return state.length === 0 ? { kind: "empty" } : { kind: "items", items: state }
}

/** The count beside a widget's title, only once the list is known and not empty. */
export function countMeta(state: Loaded<readonly unknown[]>, unit: string): string | null {
  return typeof state === "string" || state.length === 0 ? null : `${state.length} ${unit}`
}

/** The Sales summary's four figures: a dash until known; a known 0 shows as 0; the average only when there are orders. */
export function salesCells(
  analytics: Loaded<OverviewAnalytics>,
  stats: Pick<OverviewStats, "totalCustomers"> & Partial<Pick<OverviewStats, "totalUsers">> | null,
  fmt: { usd: (v: number) => string; money: (cents: number) => string },
): ReadonlyArray<readonly [string, string]> {
  const a = typeof analytics === "string" ? null : analytics
  const customers = stats ? (stats.totalCustomers ?? stats.totalUsers ?? null) : null
  return [
    ["Revenue · 30d", a ? fmt.usd(a.revenue) : "—"],
    ["Orders · 30d", a ? a.purchases.toLocaleString("en-US") : "—"],
    ["Avg order", a && a.purchases > 0 ? fmt.money(a.revenue / a.purchases) : "—"],
    ["Customers", customers === null ? "—" : customers.toLocaleString("en-US")],
  ]
}
