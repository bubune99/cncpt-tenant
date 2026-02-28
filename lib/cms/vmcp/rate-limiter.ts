/**
 * VMCP Rate Limiter
 *
 * In-memory sliding window rate limiter for tool executions.
 * Provides per-user and per-tool rate limiting.
 */

export class RateLimiter {
  private windows: Map<string, number[]> = new Map();

  /**
   * Check whether a request is allowed under the sliding window limit.
   */
  checkLimit(
    key: string,
    windowMs: number,
    maxRequests: number
  ): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing timestamps and prune expired entries
    let timestamps = this.windows.get(key) ?? [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      // Find the earliest timestamp in the window — retry after it expires
      const oldest = timestamps[0];
      const retryAfterMs = oldest + windowMs - now;
      this.windows.set(key, timestamps);
      return { allowed: false, retryAfterMs };
    }

    timestamps.push(now);
    this.windows.set(key, timestamps);
    return { allowed: true };
  }
}

// Per-user limits: 60/min, 500/hour
const USER_LIMITS = [
  { windowMs: 60_000, maxRequests: 60 },
  { windowMs: 3_600_000, maxRequests: 500 },
] as const;

// Per-tool limits: 120/min (global across all users)
const TOOL_LIMITS = [
  { windowMs: 60_000, maxRequests: 120 },
] as const;

const limiter = new RateLimiter();

export const vmcpRateLimiter = {
  checkUser(userId: string): { allowed: boolean; retryAfterMs?: number } {
    for (const { windowMs, maxRequests } of USER_LIMITS) {
      const result = limiter.checkLimit(`user:${userId}`, windowMs, maxRequests);
      if (!result.allowed) return result;
    }
    return { allowed: true };
  },

  checkTool(toolId: string): { allowed: boolean; retryAfterMs?: number } {
    for (const { windowMs, maxRequests } of TOOL_LIMITS) {
      const result = limiter.checkLimit(`tool:${toolId}`, windowMs, maxRequests);
      if (!result.allowed) return result;
    }
    return { allowed: true };
  },
};
