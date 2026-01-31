/**
 * MCP Rate Limiting
 *
 * Sliding window rate limiter for API key requests.
 * Uses in-memory storage with optional Redis backend.
 */

import { prisma } from "../db"

/**
 * Rate limit configuration per tier
 */
export const RATE_LIMIT_TIERS = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  pro: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
  },
} as const

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number // seconds until retry allowed
}

/**
 * In-memory rate limit store
 * Key: apiKeyId, Value: { timestamps: number[] }
 */
const rateLimitStore = new Map<string, { timestamps: number[] }>()

/**
 * Clean up old timestamps from the store
 */
function cleanupOldTimestamps(apiKeyId: string, windowMs: number): number[] {
  const now = Date.now()
  const entry = rateLimitStore.get(apiKeyId)

  if (!entry) {
    return []
  }

  // Filter out timestamps older than the window
  const validTimestamps = entry.timestamps.filter((ts) => now - ts < windowMs)
  entry.timestamps = validTimestamps

  return validTimestamps
}

/**
 * Check rate limit for an API key
 *
 * @param apiKeyId - The API key ID
 * @param tier - The rate limit tier (default: free)
 * @returns Rate limit result with allowed status and headers
 */
export async function checkRateLimit(
  apiKeyId: string,
  tier: RateLimitTier = "free"
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_TIERS[tier]
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window

  // Get or create entry
  if (!rateLimitStore.has(apiKeyId)) {
    rateLimitStore.set(apiKeyId, { timestamps: [] })
  }

  // Clean up old timestamps and get current count
  const timestamps = cleanupOldTimestamps(apiKeyId, windowMs)
  const currentCount = timestamps.length

  // Check if over limit
  if (currentCount >= config.requestsPerMinute) {
    const oldestTimestamp = timestamps[0]
    const resetAt = new Date(oldestTimestamp + windowMs)
    const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000)

    return {
      allowed: false,
      limit: config.requestsPerMinute,
      remaining: 0,
      resetAt,
      retryAfter,
    }
  }

  // Add current timestamp
  const entry = rateLimitStore.get(apiKeyId)!
  entry.timestamps.push(now)

  return {
    allowed: true,
    limit: config.requestsPerMinute,
    remaining: config.requestsPerMinute - currentCount - 1,
    resetAt: new Date(now + windowMs),
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.floor(result.resetAt.getTime() / 1000).toString(),
  }

  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = result.retryAfter.toString()
  }

  return headers
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please retry after ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...getRateLimitHeaders(result),
      },
    }
  )
}

/**
 * Periodic cleanup of the in-memory store
 * Call this on an interval to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  for (const [apiKeyId, entry] of rateLimitStore.entries()) {
    // Remove entries with no recent activity
    const latestTimestamp = entry.timestamps[entry.timestamps.length - 1]
    if (!latestTimestamp || now - latestTimestamp > maxAge) {
      rateLimitStore.delete(apiKeyId)
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000)
}
