/**
 * Redis Session Utilities
 *
 * Store and retrieve session context for AI chat integration.
 * Uses Upstash Redis for serverless-compatible session storage.
 */

import { withRedis, REDIS_KEYS } from './client'
import type { EntityContext, HelpClickEvent } from '../socket/types'

// Session TTL in seconds (30 minutes)
const SESSION_TTL = 1800

/**
 * Set session context in Redis
 */
export async function setSessionContext(
  sessionId: string,
  context: EntityContext
): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    const key = REDIS_KEYS.sessionContext(sessionId)
    await redis.set(key, context, { ex: SESSION_TTL })
    return true
  })
  return result ?? false
}

/**
 * Get session context from Redis
 */
export async function getSessionContext(
  sessionId: string
): Promise<EntityContext | null> {
  return withRedis(async (redis) => {
    const key = REDIS_KEYS.sessionContext(sessionId)
    const value = await redis.get<EntityContext>(key)
    return value ?? null
  })
}

/**
 * Set last help click for a session
 */
export async function setSessionHelpClick(
  sessionId: string,
  helpClick: HelpClickEvent
): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    const key = REDIS_KEYS.sessionHelpClick(sessionId)
    await redis.set(key, helpClick, { ex: SESSION_TTL })
    return true
  })
  return result ?? false
}

/**
 * Get last help click for a session
 */
export async function getSessionHelpClick(
  sessionId: string
): Promise<HelpClickEvent | null> {
  return withRedis(async (redis) => {
    const key = REDIS_KEYS.sessionHelpClick(sessionId)
    const value = await redis.get<HelpClickEvent>(key)
    return value ?? null
  })
}

/**
 * Clear all session data
 */
export async function clearSession(sessionId: string): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    const contextKey = REDIS_KEYS.sessionContext(sessionId)
    const helpClickKey = REDIS_KEYS.sessionHelpClick(sessionId)
    await redis.del(contextKey, helpClickKey)
    return true
  })
  return result ?? false
}

/**
 * Refresh session TTL (keep session alive)
 */
export async function refreshSession(sessionId: string): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    const contextKey = REDIS_KEYS.sessionContext(sessionId)
    const helpClickKey = REDIS_KEYS.sessionHelpClick(sessionId)

    // Refresh both keys if they exist
    const contextExists = await redis.exists(contextKey)
    const helpClickExists = await redis.exists(helpClickKey)

    if (contextExists) {
      await redis.expire(contextKey, SESSION_TTL)
    }
    if (helpClickExists) {
      await redis.expire(helpClickKey, SESSION_TTL)
    }

    return true
  })
  return result ?? false
}

/**
 * Get full session data (context + help click)
 */
export async function getFullSession(sessionId: string): Promise<{
  context: EntityContext | null
  helpClick: HelpClickEvent | null
}> {
  const [context, helpClick] = await Promise.all([
    getSessionContext(sessionId),
    getSessionHelpClick(sessionId),
  ])

  return { context, helpClick }
}
