'use client'

/**
 * Socket.io Client Context
 *
 * Provides WebSocket connectivity throughout the admin UI.
 * Handles connection, reconnection, and event management.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket/types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface SocketContextValue {
  socket: TypedSocket | null
  isConnected: boolean
  sessionId: string
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void
}

const SocketContext = createContext<SocketContextValue | null>(null)

// Generate a stable session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'

  let sessionId = sessionStorage.getItem('cms-session-id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    sessionStorage.setItem('cms-session-id', sessionId)
  }
  return sessionId
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const sessionIdRef = useRef<string>('')
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Initialize session ID
  useEffect(() => {
    sessionIdRef.current = getSessionId()
  }, [])

  // Initialize socket connection
  useEffect(() => {
    // Only connect in browser
    if (typeof window === 'undefined') return

    let socketInstance: TypedSocket | null = null

    async function connect() {
      try {
        const { io } = await import('socket.io-client')

        socketInstance = io({
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        }) as TypedSocket

        socketInstance.on('connect', () => {
          setIsConnected(true)
          reconnectAttempts.current = 0
          console.log('[Socket] Connected:', socketInstance?.id)
        })

        socketInstance.on('disconnect', (reason) => {
          setIsConnected(false)
          console.log('[Socket] Disconnected:', reason)
        })

        socketInstance.on('connect_error', (error) => {
          reconnectAttempts.current++
          console.error('[Socket] Connection error:', error.message)

          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.error('[Socket] Max reconnection attempts reached')
          }
        })

        // Handle server events
        socketInstance.on('help:context-received', (data) => {
          console.log('[Socket] Help context received:', data.helpKey)
        })

        socketInstance.on('chat:context-request', () => {
          // Server is requesting context - this shouldn't happen often
          // as we push context on every navigation
          console.log('[Socket] Context requested by server')
        })

        socketInstance.on('ai:suggestion', (data) => {
          // Handle AI suggestions (future feature)
          console.log('[Socket] AI suggestion:', data.message)
        })

        setSocket(socketInstance)
      } catch (error) {
        console.error('[Socket] Failed to initialize:', error)
      }
    }

    connect()

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance.removeAllListeners()
      }
    }
  }, [])

  // Typed emit function
  const emit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => {
    if (socket && isConnected) {
      socket.emit(event, ...args)
    } else {
      console.warn('[Socket] Cannot emit, not connected:', event)
    }
  }, [socket, isConnected])

  const value: SocketContextValue = {
    socket,
    isConnected,
    sessionId: sessionIdRef.current,
    emit,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

/**
 * Hook to use socket context
 */
export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

/**
 * Optional hook that returns null if outside provider
 */
export function useSocketOptional() {
  return useContext(SocketContext)
}
