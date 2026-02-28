/**
 * API Rate Limiter
 *
 * In-memory sliding window rate limiter for API route protection.
 * Returns standardized 429 responses with Retry-After header.
 *
 * NOTE: This is an in-memory implementation suitable for single-server deployments.
 * For multi-server / horizontally scaled deployments, replace with a Redis-backed
 * implementation (e.g. using the existing src/lib/redis connection).
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Core limiter (reused from vmcp pattern)
// ---------------------------------------------------------------------------

class SlidingWindowLimiter {
  private windows: Map<string, number[]> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodically prune stale keys to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  check(
    key: string,
    windowMs: number,
    maxRequests: number,
  ): { allowed: boolean; retryAfterMs?: number; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.windows.get(key) ?? [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const retryAfterMs = oldest + windowMs - now;
      this.windows.set(key, timestamps);
      return { allowed: false, retryAfterMs, remaining: 0 };
    }

    timestamps.push(now);
    this.windows.set(key, timestamps);
    return { allowed: true, remaining: maxRequests - timestamps.length };
  }

  private cleanup() {
    const now = Date.now();
    // Remove keys where all timestamps are older than 24 hours
    const cutoff = now - 86_400_000;
    for (const [key, timestamps] of this.windows) {
      const recent = timestamps.filter((t) => t > cutoff);
      if (recent.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, recent);
      }
    }
  }
}

const limiter = new SlidingWindowLimiter();

// ---------------------------------------------------------------------------
// IP extraction helper
// ---------------------------------------------------------------------------

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ---------------------------------------------------------------------------
// Preset configurations
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional prefix for the rate limit key (defaults to route path) */
  keyPrefix?: string;
}

/** Common presets matching the task specification */
export const RATE_LIMIT_PRESETS = {
  /** Auth endpoints: 10 req / 60s */
  auth: { maxRequests: 10, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Checkout: 5 req / 60s */
  checkout: { maxRequests: 5, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Cart operations: 30 req / 60s */
  cart: { maxRequests: 30, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Email subscribe: 5 req / 60s */
  emailSubscribe: { maxRequests: 5, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Forms / contact: 10 req / 60s */
  forms: { maxRequests: 10, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Data export: 1 req / 24h */
  dataExport: { maxRequests: 1, windowMs: 86_400_000 } satisfies RateLimitConfig,
} as const;

// ---------------------------------------------------------------------------
// Main helper — call at the top of any route handler
// ---------------------------------------------------------------------------

/**
 * Check rate limit for the current request.
 *
 * Returns `null` if the request is within limits, or a `NextResponse` (429)
 * if the limit has been exceeded.
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const limited = rateLimitCheck(request, RATE_LIMIT_PRESETS.auth);
 *   if (limited) return limited;
 *   // ... rest of handler
 * }
 * ```
 */
export function rateLimitCheck(
  request: NextRequest,
  config: RateLimitConfig,
): NextResponse | null {
  const ip = getClientIp(request);
  const prefix = config.keyPrefix ?? new URL(request.url).pathname;
  const key = `rl:${prefix}:${ip}`;

  const result = limiter.check(key, config.windowMs, config.maxRequests);

  if (!result.allowed) {
    const retryAfterSec = Math.ceil((result.retryAfterMs ?? config.windowMs) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(
            Math.ceil((Date.now() + (result.retryAfterMs ?? config.windowMs)) / 1000),
          ),
        },
      },
    );
  }

  return null;
}
