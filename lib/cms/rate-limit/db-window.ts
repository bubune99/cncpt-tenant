/**
 * What a rate-limit counter row means for the request. The counting itself is one atomic SQL statement in
 * db-limit.ts (Dzidzor's reserveCounter): it adds 1 only when the window's count stays within the limit, or the
 * window has rolled over. This module turns its answer into allowed / refused and the reset time. Pure.
 * Checked in db-window.assert.ts.
 */

export interface CounterRow {
  windowStart: bigint | number
  windowMs: bigint | number
  amount: bigint | number
}

export interface LimitDecision {
  success: boolean
  /** Epoch ms when this window ends and the count starts again. */
  reset: number
}

/** All rate-limit rows share one kind; the key (`<prefix>:<ip>`) is the identity. */
export const RATE_LIMIT_KIND = "rate-limit"

/**
 * `reserved` is the row the reserve statement returned (it counted this request), or null when it refused.
 * `current` is the row read after a refusal (only to say when to retry).
 */
export function decide(reserved: CounterRow | null, current: CounterRow | null, nowMs: number, windowMs: number): LimitDecision {
  if (reserved) return { success: true, reset: Number(reserved.windowStart) + Number(reserved.windowMs) }
  const end = current ? Number(current.windowStart) + Number(current.windowMs) : 0
  // A refusal with no live window can only be a limit below one request; retry after a full window.
  return { success: false, reset: end > nowMs ? end : nowMs + windowMs }
}
