/**
 * Redis Client (Upstash)
 *
 * Uses @upstash/redis to match cncpt-tenant platform.
 * Upstash provides serverless-friendly HTTP-based Redis.
 */

import { Redis } from '@upstash/redis'

// Redis client singleton
let redis: Redis | null = null

/**
 * Check if Redis is configured via environment variables
 * Supports both Vercel KV naming and Upstash naming
 */
export function isRedisConfigured(): boolean {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return !!(url && token)
}

/**
 * Get the Redis client singleton
 * Creates the client on first call if configured
 */
export function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

/**
 * Execute a Redis operation with error handling
 * Returns null if Redis is not configured or operation fails
 */
export async function withRedis<T>(
  operation: (client: Redis) => Promise<T>
): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  try {
    return await operation(client)
  } catch (err) {
    console.error('[Redis] Operation failed:', err)
    return null
  }
}

// Key prefixes for organization
export const REDIS_KEYS = {
  // Session data
  session: (sessionId: string) => `session:${sessionId}`,
  sessionContext: (sessionId: string) => `session:${sessionId}:context`,
  sessionHelpClick: (sessionId: string) => `session:${sessionId}:help-click`,

  // Chat data
  chatHistory: (conversationId: string) => `chat:${conversationId}:history`,
  chatContext: (conversationId: string) => `chat:${conversationId}:context`,

  // Help content cache
  helpContent: (elementKey: string) => `help:content:${elementKey}`,
  helpKeys: (category?: string) => category ? `help:keys:${category}` : 'help:keys:all',

  // Entity cache
  entityDetails: (type: string, id: string) => `entity:${type}:${id}`,
  entityStats: (type: string) => `entity:stats:${type}`,

  // Pub/Sub simulation via lists (Upstash doesn't support traditional pub/sub)
  // Use these as message queues that can be polled
  channels: {
    helpUpdates: 'channel:help:updates',
    entityUpdates: 'channel:entity:updates',
    chatMessages: 'channel:chat:messages',
  },
} as const

// Re-export Redis type for convenience
export type { Redis }
