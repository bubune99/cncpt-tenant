/**
 * Socket.io Server
 *
 * WebSocket server for real-time context synchronization between
 * the admin UI and AI chat system.
 *
 * Uses Upstash Redis for:
 * - Session context storage accessible by all instances
 * - Message queue for cross-instance event delivery
 */

import type { Server as HTTPServer } from 'http'
import type { Server as SocketServer } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  EntityContext,
  HelpClickEvent,
  HelpContentUpdateEvent,
} from './types'

// Singleton instance
let io: SocketServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> | null = null

// Store contexts by session for AI chat access (local fallback)
const sessionContexts = new Map<string, {
  context: EntityContext
  lastHelpClick?: HelpClickEvent
  socketId: string
}>()

// Track if Redis poller is set up
let redisPollerInitialized = false
let lastPollTimestamp = Date.now()

/**
 * Initialize Redis message poller for relaying events to clients
 * Since Upstash is HTTP-based, we use polling instead of pub/sub
 */
async function initRedisPoller() {
  if (redisPollerInitialized) return

  try {
    const { pollMessages, REDIS_KEYS, isRedisConfigured } = await import('../redis')

    if (!isRedisConfigured()) {
      console.log('[Socket.io] Redis not configured, skipping message poller')
      return
    }

    // Poll for help content updates every 2 seconds
    const pollInterval = setInterval(async () => {
      if (!io) return

      try {
        const result = await pollMessages(REDIS_KEYS.channels.helpUpdates, lastPollTimestamp, 10)
        lastPollTimestamp = result.lastTimestamp

        for (const msg of result.messages) {
          const event = msg.payload as HelpContentUpdateEvent
          io.emit('help:content-updated', event)
          console.log(`[Socket.io] Relayed help:content-updated for ${event.elementKey}`)
        }
      } catch (err) {
        console.error('[Socket.io] Poll error:', err)
      }
    }, 2000)

    // Clean up on process exit
    process.on('beforeExit', () => clearInterval(pollInterval))

    redisPollerInitialized = true
    console.log('[Socket.io] Redis message poller initialized')
  } catch (err) {
    console.warn('[Socket.io] Failed to init Redis poller:', err)
  }
}

/**
 * Initialize Socket.io server
 */
export async function initSocketServer(httpServer: HTTPServer) {
  if (io) return io

  // Dynamic import to avoid issues in edge runtime
  const { Server } = await import('socket.io')

  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Initialize Redis message poller for cross-instance events
  // Note: Upstash HTTP-based Redis doesn't support socket.io adapter,
  // but we can still use it for session storage and message queues
  await initRedisPoller()

  // Connection handling
  io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id)

    // Initialize socket data
    socket.data.connectedAt = Date.now()

    // Handle context updates from client
    socket.on('context:update', async (context: EntityContext) => {
      socket.data.context = context

      // Store in local map for same-instance access
      sessionContexts.set(context.sessionId, {
        context,
        lastHelpClick: socket.data.lastHelpClick,
        socketId: socket.id,
      })

      // Also store in Redis for cross-instance access
      try {
        const { setSessionContext, isRedisConfigured } = await import('../redis')
        if (isRedisConfigured()) {
          await setSessionContext(context.sessionId, context)
        }
      } catch (err) {
        // Redis not available, local storage is sufficient
      }

      console.log('[Socket.io] Context updated:', {
        sessionId: context.sessionId,
        route: context.route,
        entityType: context.entityType,
        entityId: context.entityId,
      })
    })

    // Handle help element clicks
    socket.on('help:element-click', async (data: HelpClickEvent) => {
      socket.data.lastHelpClick = data

      // Update local session store
      if (data.context.sessionId) {
        const existing = sessionContexts.get(data.context.sessionId)
        if (existing) {
          existing.lastHelpClick = data
        } else {
          sessionContexts.set(data.context.sessionId, {
            context: data.context,
            lastHelpClick: data,
            socketId: socket.id,
          })
        }

        // Also store in Redis for cross-instance access
        try {
          const { setSessionHelpClick, isRedisConfigured } = await import('../redis')
          if (isRedisConfigured()) {
            await setSessionHelpClick(data.context.sessionId, data)
          }
        } catch (err) {
          // Redis not available, local storage is sufficient
        }
      }

      // Acknowledge receipt
      socket.emit('help:context-received', { helpKey: data.helpKey })

      console.log('[Socket.io] Help element clicked:', data.helpKey)
    })

    // Handle chat context response
    socket.on('chat:context-response', (data) => {
      // This is handled by the request-response pattern
      // The AI chat route will use getSessionContext instead
    })

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log('[Socket.io] Client disconnected:', socket.id)

      // Remove from session contexts after a delay (allow reconnect)
      setTimeout(() => {
        sessionContexts.forEach((value, key) => {
          if (value.socketId === socket.id) {
            sessionContexts.delete(key)
          }
        })
      }, 30000) // 30 second grace period
    })
  })

  console.log('[Socket.io] Server initialized')
  return io
}

/**
 * Get the Socket.io server instance
 */
export function getSocketServer() {
  return io
}

/**
 * Get context for a session (used by AI chat)
 * Checks local map first, then Redis for cross-instance access
 */
export async function getSessionContextAsync(sessionId: string): Promise<{
  context: EntityContext
  lastHelpClick?: HelpClickEvent
  socketId?: string
} | null> {
  // Check local map first (same instance)
  const local = sessionContexts.get(sessionId)
  if (local) return local

  // Check Redis (cross-instance)
  try {
    const { getFullSession, isRedisConfigured } = await import('../redis')
    if (isRedisConfigured()) {
      const session = await getFullSession(sessionId)
      if (session.context) {
        return {
          context: session.context,
          lastHelpClick: session.helpClick || undefined,
        }
      }
    }
  } catch (err) {
    console.warn('[Socket.io] Redis session lookup failed:', err)
  }

  return null
}

/**
 * Get context for a session (synchronous, local only - used by AI chat)
 * @deprecated Use getSessionContextAsync for cross-instance support
 */
export function getSessionContext(sessionId: string) {
  return sessionContexts.get(sessionId) || null
}

/**
 * Get all active sessions (for debugging)
 */
export function getActiveSessions() {
  return Array.from(sessionContexts.entries()).map(([sessionId, data]) => ({
    sessionId,
    route: data.context.route,
    entityType: data.context.entityType,
    entityId: data.context.entityId,
    hasHelpClick: !!data.lastHelpClick,
  }))
}

/**
 * Send a message to a specific session
 */
export function sendToSession(sessionId: string, event: keyof ServerToClientEvents, data: unknown) {
  const session = sessionContexts.get(sessionId)
  if (session && io) {
    const socket = io.sockets.sockets.get(session.socketId)
    if (socket) {
      socket.emit(event, data as never)
      return true
    }
  }
  return false
}

/**
 * Request context from a client (if needed)
 */
export function requestContextFromSession(sessionId: string) {
  return sendToSession(sessionId, 'chat:context-request', undefined)
}
