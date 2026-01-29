/**
 * Redis Module (Upstash)
 *
 * Uses @upstash/redis for serverless-compatible Redis operations.
 * Matches cncpt-tenant platform configuration.
 */

export {
  getRedis,
  withRedis,
  isRedisConfigured,
  REDIS_KEYS,
  type Redis,
} from './client'

export {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheGetJson,
  cacheSetJson,
  cacheGetOrSet,
  cacheClear,
} from './cache'

export {
  publish,
  getMessages,
  getLatestMessage,
  pollMessages,
  createPoller,
  clearChannel,
  // Legacy exports (deprecated)
  subscribe,
  unsubscribe,
  createSubscriber,
} from './pubsub'

export {
  setSessionContext,
  getSessionContext,
  setSessionHelpClick,
  getSessionHelpClick,
  clearSession,
  refreshSession,
  getFullSession,
} from './session'
