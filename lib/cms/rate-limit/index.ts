/**
 * API Rate Limiter
 *
 * Redis-backed sliding window rate limiter using @upstash/ratelimit.
 * Works across serverless instances and survives deploys.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';
import { resolveRateLimit } from './resolve';

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

/** Optional context that lets owner-configured rules apply to this request. */
export interface RateLimitCheckOptions {
  /** Logical endpoint name (preset key) for endpoint-scoped rules. */
  name?: string;
  /** Tenant subdomain, when known, for tenant-scoped rules. */
  tenant?: string | null;
}

/**
 * Check rate limit for the current request.
 *
 * Layers owner-configured DB rules (global / per-tenant / per-endpoint) on top
 * of the hardcoded `config` preset, which always remains the safety floor.
 *
 * Behaviour depends on the resolved mode:
 * - "off"     → never limited (returns null)
 * - "observe" → counts the request but NEVER blocks (returns null even when
 *               over the limit); exposes `X-RateLimit-Mode: observe` so the
 *               overage is still measurable. This is the safe default and
 *               cannot lock anyone out.
 * - "enforce" → returns a 429 when the limit is exceeded.
 *
 * Returns `null` when the request may proceed, or a `NextResponse` (429) when
 * enforced and over the limit.
 *
 * Usage:
 * ```ts
 * const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.auth, { name: 'auth' });
 * if (limited) return limited;
 * ```
 */
export async function rateLimitCheck(
  request: NextRequest,
  config: RateLimitConfig,
  options: RateLimitCheckOptions = {},
): Promise<NextResponse | null> {
  const path = new URL(request.url).pathname;

  // Per-tenant rules apply automatically: middleware sets `x-subdomain` on
  // tenant requests, so we can resolve the tenant without changing call sites.
  const tenant =
    options.tenant ?? request.headers.get('x-subdomain') ?? null;

  // Resolve the effective limit + mode from owner config (fails open).
  let resolved;
  try {
    resolved = await resolveRateLimit({
      preset: config,
      name: options.name ?? config.keyPrefix,
      path,
      tenant,
    });
  } catch (error) {
    // Never let the config layer break a live route — fall back to the preset
    // in enforce mode (its original behaviour).
    console.error('[rate-limit] resolve failed, using preset:', error);
    resolved = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      mode: 'enforce' as const,
      source: 'preset' as const,
    };
  }

  if (resolved.mode === 'off') return null;

  const ip = getClientIp(request);
  const prefix = config.keyPrefix ?? path;
  const key = `${prefix}:${ip}`;

  const limiter = getLimiter({ maxRequests: resolved.maxRequests, windowMs: resolved.windowMs });
  let success: boolean;
  let reset: number;
  try {
    ({ success, reset } = await limiter.limit(key));
  } catch (error) {
    // Rate limiting must never take a route down with it — if the Redis
    // backend is unreachable (e.g. a deleted Upstash instance), fail open.
    console.error('[rate-limit] backend unavailable, failing open:', error);
    return null;
  }

  if (!success) {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

    // Observe mode: record the overage but let the request through.
    if (resolved.mode === 'observe') {
      console.warn(
        `[rate-limit] OBSERVE overage key=${key} source=${resolved.source} limit=${resolved.maxRequests}/${resolved.windowMs}ms`,
      );
      return null;
    }

    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(resolved.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
          'X-RateLimit-Mode': resolved.mode,
          'X-RateLimit-Source': resolved.source,
        },
      },
    );
  }

  return null;
}
