/**
 * API Rate Limiter
 *
 * Redis-backed sliding window rate limiter using @upstash/ratelimit.
 * Works across serverless instances and survives deploys.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

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
  /** Media upload: 20 req / 60s */
  upload: { maxRequests: 20, windowMs: 60_000, keyPrefix: 'media-upload' } satisfies RateLimitConfig,
  /** Presigned URL generation: 30 req / 60s */
  presign: { maxRequests: 30, windowMs: 60_000, keyPrefix: 'media-presign' } satisfies RateLimitConfig,
} as const;

// ---------------------------------------------------------------------------
// Limiter cache — one Ratelimit instance per unique config
// ---------------------------------------------------------------------------

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.maxRequests}:${config.windowMs}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000));
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSec} s`),
      prefix: '@upstash/ratelimit',
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

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
 *   const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.auth);
 *   if (limited) return limited;
 *   // ... rest of handler
 * }
 * ```
 */
export async function rateLimitCheck(
  request: NextRequest,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const prefix = config.keyPrefix ?? new URL(request.url).pathname;
  const key = `${prefix}:${ip}`;

  const limiter = getLimiter(config);
  const { success, remaining, reset } = await limiter.limit(key);

  if (!success) {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
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
          'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
        },
      },
    );
  }

  return null;
}
