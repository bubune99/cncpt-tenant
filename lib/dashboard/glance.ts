/**
 * The Overview's "at a glance" figures (support tickets, AI credits), kept from the old Overview.
 * A figure that is loading or failed says so; it is never shown as 0. Check: glance.assert.ts
 */
export type LoadState = "loading" | "ready" | "failed"
export interface SupportStats { open: number; total: number }
export interface CreditStats { left: number; allotted: number; monthly: number; purchased: number }

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

export function parseSupport(data: unknown): SupportStats | null {
  const s = (data as { stats?: { open?: unknown; total?: unknown } } | null)?.stats
  const open = num(s?.open), total = num(s?.total)
  return open === null || total === null ? null : { open, total }
}

export function parseCredits(data: unknown): CreditStats | null {
  const b = (data as { balance?: Record<string, unknown> } | null)?.balance
  const left = num(b?.total)
  if (!b || left === null) return null
  return { left, allotted: num(b.monthlyAllocation) ?? 0, monthly: num(b.monthly) ?? 0, purchased: num(b.purchased) ?? 0 }
}

export function supportLine(state: LoadState, s: SupportStats | null): string {
  if (state === "loading") return "Loading ticket counts…"
  if (state === "failed" || !s) return "Ticket counts couldn't load"
  return `${s.open.toLocaleString("en-US")} open · ${s.total.toLocaleString("en-US")} ticket${s.total === 1 ? "" : "s"} in all`
}

export function creditsLine(state: LoadState, c: CreditStats | null): string {
  if (state === "loading") return "Loading credit balance…"
  if (state === "failed" || !c) return "Credit balance couldn't load"
  const left = `${c.left.toLocaleString("en-US")} left`
  return c.allotted > 0 ? `${left} of ${c.allotted.toLocaleString("en-US")} this month` : left
}
