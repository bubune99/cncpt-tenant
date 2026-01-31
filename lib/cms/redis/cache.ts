/**
 * Redis Cache Utilities
 *
 * Simple caching operations with TTL support using Upstash Redis.
 */

import { getRedis, withRedis } from './client'

// Default TTL in seconds (5 minutes)
const DEFAULT_TTL = 300

/**
 * Get a value from cache
 */
export async function cacheGet(key: string): Promise<string | null> {
  return withRedis(async (redis) => {
    const value = await redis.get<string>(key)
    return value ?? null
  })
}

/**
 * Set a value in cache
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    if (ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds })
    } else {
      await redis.set(key, value)
    }
    return true
  })
  return result ?? false
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    await redis.del(key)
    return true
  })
  return result ?? false
}

/**
 * Get a JSON value from cache
 * Upstash Redis automatically handles JSON serialization
 */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  return withRedis(async (redis) => {
    const value = await redis.get<T>(key)
    return value ?? null
  })
}

/**
 * Set a JSON value in cache
 * Upstash Redis automatically handles JSON serialization
 */
export async function cacheSetJson<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    if (ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds })
    } else {
      await redis.set(key, value)
    }
    return true
  })
  return result ?? false
}

/**
 * Get or set a cached value
 * If the value doesn't exist, compute it and cache it
 */
export async function cacheGetOrSet<T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T | null> {
  // Try to get from cache first
  const cached = await cacheGetJson<T>(key)
  if (cached !== null) {
    return cached
  }

  // Compute the value
  try {
    const value = await compute()
    // Cache it for next time
    await cacheSetJson(key, value, ttlSeconds)
    return value
  } catch (err) {
    console.error('[Redis Cache] Compute error:', err)
    return null
  }
}

/**
 * Clear all keys matching a pattern
 * Note: Upstash has limitations on SCAN/KEYS in free tier
 */
export async function cacheClear(pattern: string): Promise<number> {
  const deleted = await withRedis(async (redis) => {
    // Use scan for pattern matching (more efficient than keys)
    const keys: string[] = []
    let cursor: number | string = 0

    do {
      const scanResult: [string | number, string[]] = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = scanResult[0]
      keys.push(...scanResult[1])
    } while (cursor !== 0 && cursor !== '0')

    if (keys.length === 0) return 0

    // Delete in batches to avoid hitting limits
    let deletedCount = 0
    for (let i = 0; i < keys.length; i += 100) {
      const batch = keys.slice(i, i + 100)
      const count = await redis.del(...batch)
      deletedCount += count
    }
    return deletedCount
  })
  return deleted ?? 0
}
