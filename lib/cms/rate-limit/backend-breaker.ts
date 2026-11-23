/**
 * Keeps a dead or slow rate-limit backend from holding every request up. Each backend call gets a short time
 * limit; after a failure the backend is skipped for a cooldown and the in-memory limiter is used meanwhile.
 * Which store to use long-term is the owner's choice (inbox 67cd4334); this only bounds the wait.
 * Pure: the clock is passed in. Checked in backend-breaker.assert.ts.
 */

/** Longest a request waits on the rate-limit backend before using the in-memory limiter. */
export const BACKEND_TIMEOUT_MS = 600
/** How long the backend is skipped after it failed or timed out. */
export const BACKEND_COOLDOWN_MS = 5 * 60_000

export interface Breaker {
  canTry(): boolean
  failed(): void
  succeeded(): void
}

export function createBreaker({ cooldownMs, now }: { cooldownMs: number; now: () => number }): Breaker {
  let skipUntil = 0
  return {
    canTry: () => now() >= skipUntil,
    failed: () => { skipUntil = now() + cooldownMs },
    succeeded: () => { skipUntil = 0 },
  }
}

/** The promise's answer, or an error once `ms` has passed without one. */
export function withinTime<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`rate-limit backend timed out after ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
