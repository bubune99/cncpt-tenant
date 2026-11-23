/**
 * A site's Customers list rules: segments, their counts, search and sort, and how a figure that has not arrived
 * yet is shown. Pure: no React, no clock of its own (pass `now`). Checked in customer-list.assert.ts.
 */

export type SegKey = "all" | "active" | "inactive" | "new"
export type SortKey = "Last order" | "Orders" | "Name A–Z"

/** A customer counts as new for 7 days after they were added. */
export const NEW_WINDOW_MS = 7 * 86_400_000

export interface ListedCustomer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly isActive: boolean
  readonly createdAt: string
  /** The order count (the list API fills it from _count.orders). */
  readonly designCount: number
  readonly lastActivityAt: string | null
}

/** Whether a customer belongs to a segment: active, dormant (not active), new within 7 days, or all. */
export function inSegment(c: ListedCustomer, seg: SegKey, now: number): boolean {
  switch (seg) {
    case "active": return c.isActive
    case "inactive": return !c.isActive
    case "new": return now - new Date(c.createdAt).getTime() < NEW_WINDOW_MS
    default: return true
  }
}

/** Each tab's count, always worked out from the whole list. */
export function segmentCounts(rows: readonly ListedCustomer[], now: number): Record<SegKey, number> {
  const count = (seg: SegKey) => rows.filter((c) => inSegment(c, seg, now)).length
  return { all: rows.length, active: count("active"), inactive: count("inactive"), new: count("new") }
}

/** Search by name, email or id (any case), then sort. Returns a new list; the one given is left alone. */
export function searchAndSort<T extends ListedCustomer>(rows: readonly T[], query: string, sort: SortKey | string): T[] {
  const term = query.trim().toLowerCase()
  const searched = term
    ? rows.filter((c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || c.id.toLowerCase().includes(term))
    : [...rows]
  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0)
  return [...searched].sort((a, b) => {
    if (sort === "Orders") return b.designCount - a.designCount
    if (sort === "Name A–Z") return a.name.localeCompare(b.name)
    return time(b.lastActivityAt) - time(a.lastActivityAt) // most recent activity first, none last
  })
}

/** How many customers have placed at least one order. */
export function withOrdersCount(rows: readonly ListedCustomer[]): number {
  return rows.filter((c) => c.designCount > 0).length
}

/** A figure for display: a dash until it is known, so a value still loading never reads as 0. */
export function figure(value: number | null | undefined): number | "—" {
  return typeof value === "number" ? value : "—"
}
