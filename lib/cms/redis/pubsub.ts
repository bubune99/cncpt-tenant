/**
 * Redis Message Queue Utilities
 *
 * Since Upstash HTTP-based Redis doesn't support traditional pub/sub,
 * we use a list-based message queue pattern that's compatible with serverless.
 *
 * Messages are pushed to lists and consumers can poll for them.
 * This works well across serverless function invocations.
 */

import { withRedis, REDIS_KEYS } from './client'

// Message TTL in seconds (5 minutes - messages older than this are considered stale)
const MESSAGE_TTL = 300

// Maximum messages to store per channel
const MAX_MESSAGES = 100

// Type for message handlers
export type MessageHandler = (channel: string, message: string) => void

// Message structure stored in the queue
interface QueueMessage {
  id: string
  payload: string
  timestamp: number
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Publish a message to a channel (push to list)
 */
export async function publish(channel: string, message: string | object): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    const payload = typeof message === 'string' ? message : JSON.stringify(message)

    const queueMessage: QueueMessage = {
      id: generateMessageId(),
      payload,
      timestamp: Date.now(),
    }

    // Push to the head of the list
    await redis.lpush(channel, JSON.stringify(queueMessage))

    // Trim to keep only the most recent messages
    await redis.ltrim(channel, 0, MAX_MESSAGES - 1)

    // Set expiry on the list
    await redis.expire(channel, MESSAGE_TTL * 2)

    return true
  })

  return result ?? false
}

/**
 * Get recent messages from a channel (poll pattern)
 * @param channel The channel to read from
 * @param since Only return messages newer than this timestamp (ms)
 * @param limit Maximum number of messages to return
 */
export async function getMessages(
  channel: string,
  since: number = 0,
  limit: number = 10
): Promise<Array<{ id: string; payload: string; timestamp: number }>> {
  const result = await withRedis(async (redis) => {
    // Get messages from the list
    const messages = await redis.lrange(channel, 0, limit - 1)

    const parsed: QueueMessage[] = []
    for (const msg of messages) {
      try {
        const m = typeof msg === 'string' ? JSON.parse(msg) : msg
        if (m.timestamp > since) {
          parsed.push(m as QueueMessage)
        }
      } catch {
        // Skip malformed messages
      }
    }

    return parsed
  })

  return result ?? []
}

/**
 * Get the latest message from a channel
 */
export async function getLatestMessage(
  channel: string
): Promise<{ id: string; payload: string; timestamp: number } | null> {
  const messages = await getMessages(channel, 0, 1)
  return messages[0] ?? null
}

/**
 * Poll for new messages since a given timestamp
 * Returns messages and the new timestamp to use for next poll
 */
export async function pollMessages(
  channel: string,
  lastTimestamp: number = 0,
  limit: number = 10
): Promise<{
  messages: Array<{ id: string; payload: unknown; timestamp: number }>
  lastTimestamp: number
}> {
  const raw = await getMessages(channel, lastTimestamp, limit)

  const messages = raw.map((m) => {
    let payload: unknown = m.payload
    try {
      payload = JSON.parse(m.payload)
    } catch {
      // Keep as string if not valid JSON
    }
    return { id: m.id, payload, timestamp: m.timestamp }
  })

  const newTimestamp = messages.length > 0
    ? Math.max(...messages.map((m) => m.timestamp))
    : lastTimestamp

  return { messages, lastTimestamp: newTimestamp }
}

/**
 * Subscribe simulation - not real-time but can be used with polling
 * Returns a function to unsubscribe
 *
 * Note: This is a polling-based approach, not real-time pub/sub.
 * For real-time, consider using Upstash's dedicated pub/sub package
 * or WebSocket-based solutions.
 */
export function createPoller<T>(
  channel: string,
  handler: (data: T) => void,
  intervalMs: number = 1000
): {
  start: () => void
  stop: () => void
} {
  let lastTimestamp = Date.now()
  let intervalId: ReturnType<typeof setInterval> | null = null

  const poll = async () => {
    const result = await pollMessages(channel, lastTimestamp)
    lastTimestamp = result.lastTimestamp

    for (const msg of result.messages) {
      try {
        handler(msg.payload as T)
      } catch (err) {
        console.error('[Redis Poller] Handler error:', err)
      }
    }
  }

  return {
    start: () => {
      if (intervalId) return
      intervalId = setInterval(poll, intervalMs)
      // Also poll immediately
      poll()
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  }
}

/**
 * Clear all messages from a channel
 */
export async function clearChannel(channel: string): Promise<boolean> {
  const result = await withRedis(async (redis) => {
    await redis.del(channel)
    return true
  })
  return result ?? false
}

// Legacy exports for backwards compatibility
export const subscribe = async (_channel: string, _handler: MessageHandler): Promise<boolean> => {
  console.warn('[Redis] Traditional pub/sub not supported with Upstash HTTP. Use createPoller instead.')
  return false
}

export const unsubscribe = async (_channel: string, _handler: MessageHandler): Promise<boolean> => {
  return true
}

export function createSubscriber<T>(
  channel: string,
  handler: (data: T) => void
): {
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
} {
  console.warn('[Redis] createSubscriber is deprecated with Upstash HTTP. Use createPoller instead.')
  return {
    subscribe: async () => false,
    unsubscribe: async () => true,
  }
}
