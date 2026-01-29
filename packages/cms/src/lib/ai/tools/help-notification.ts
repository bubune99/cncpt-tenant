/**
 * Help Content Notification Utility
 *
 * Notifies clients when help content is updated by AI tools.
 * Uses Redis pub/sub for cross-instance communication, then Socket.io for client delivery.
 */

import type { HelpContentUpdateEvent } from '../../socket/types'

// In-memory event queue for polling fallback
const pendingEvents: HelpContentUpdateEvent[] = []
const MAX_QUEUE_SIZE = 100

/**
 * Emit a help content update event
 *
 * This function notifies connected clients that help content has changed.
 * Uses Redis pub/sub for cross-instance communication in serverless environments.
 */
export async function emitHelpContentUpdate(event: Omit<HelpContentUpdateEvent, 'timestamp'>): Promise<void> {
  const fullEvent: HelpContentUpdateEvent = {
    ...event,
    timestamp: Date.now(),
  }

  // Try Redis pub/sub first (works across serverless instances)
  try {
    const { publish, REDIS_KEYS, isRedisConfigured } = await import('../../redis')

    if (isRedisConfigured()) {
      const published = await publish(REDIS_KEYS.channels.helpUpdates, fullEvent)
      if (published) {
        console.log(`[HelpNotification] Published to Redis for ${event.elementKey}`)
        return
      }
    }
  } catch (err) {
    console.warn('[HelpNotification] Redis publish failed:', err)
  }

  // Try Socket.io direct emit (works if running on same instance)
  try {
    const { getSocketServer } = await import('../../socket/server')
    const io = getSocketServer()

    if (io) {
      io.emit('help:content-updated', fullEvent)
      console.log(`[HelpNotification] Emitted via Socket.io for ${event.elementKey}`)
      return
    }
  } catch {
    // Socket server not available
  }

  // Fallback: queue the event for polling
  pendingEvents.push(fullEvent)

  // Keep queue bounded
  while (pendingEvents.length > MAX_QUEUE_SIZE) {
    pendingEvents.shift()
  }

  console.log(`[HelpNotification] Queued for ${event.elementKey} (no realtime available)`)
}

/**
 * Get and clear pending events (for polling fallback)
 */
export function getPendingHelpEvents(): HelpContentUpdateEvent[] {
  const events = [...pendingEvents]
  pendingEvents.length = 0
  return events
}

/**
 * Check if there are pending events (for polling)
 */
export function hasPendingHelpEvents(): boolean {
  return pendingEvents.length > 0
}
