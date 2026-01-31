'use client'

/**
 * Entity Context Provider
 *
 * Tracks the current entity context (what the user is viewing)
 * and synchronizes it with the server via WebSocket.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSocketOptional } from './socket-context'
import type { EntityContext } from '@/lib/socket/types'
import { parseRouteToContext } from '@/lib/socket/types'

interface EntityContextValue {
  context: EntityContext | null
  updateContext: (updates: Partial<EntityContext>) => void
  setSelectedIds: (ids: string[]) => void
  setModalOpen: (modalId: string | null) => void
  setTabActive: (tabId: string | null) => void
}

const EntityContextContext = createContext<EntityContextValue | null>(null)

export function EntityContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const socketContext = useSocketOptional()
  const [context, setContext] = useState<EntityContext | null>(null)
  const lastEmittedRef = useRef<string>('')

  // Parse route and create context
  useEffect(() => {
    const sessionId = socketContext?.sessionId || 'no-socket'
    const newContext = parseRouteToContext(pathname, searchParams, sessionId)
    setContext(newContext)
  }, [pathname, searchParams, socketContext?.sessionId])

  // Emit context changes via WebSocket (debounced)
  useEffect(() => {
    if (!context || !socketContext?.isConnected) return

    // Create a hash to detect real changes
    const contextHash = JSON.stringify({
      route: context.route,
      entityType: context.entityType,
      entityId: context.entityId,
      filters: context.filters,
      searchQuery: context.searchQuery,
      selectedIds: context.selectedIds,
      tabActive: context.tabActive,
    })

    // Only emit if something changed
    if (contextHash === lastEmittedRef.current) return
    lastEmittedRef.current = contextHash

    // Emit with slight delay to batch rapid changes
    const timer = setTimeout(() => {
      socketContext.emit('context:update', context)
    }, 100)

    return () => clearTimeout(timer)
  }, [context, socketContext])

  // Manual context updates
  const updateContext = useCallback((updates: Partial<EntityContext>) => {
    setContext((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        ...updates,
        timestamp: Date.now(),
      }
    })
  }, [])

  // Convenience methods
  const setSelectedIds = useCallback((ids: string[]) => {
    updateContext({ selectedIds: ids.length > 0 ? ids : undefined })
  }, [updateContext])

  const setModalOpen = useCallback((modalId: string | null) => {
    updateContext({ modalOpen: modalId || undefined })
  }, [updateContext])

  const setTabActive = useCallback((tabId: string | null) => {
    updateContext({ tabActive: tabId || undefined })
  }, [updateContext])

  const value: EntityContextValue = {
    context,
    updateContext,
    setSelectedIds,
    setModalOpen,
    setTabActive,
  }

  return (
    <EntityContextContext.Provider value={value}>
      {children}
    </EntityContextContext.Provider>
  )
}

/**
 * Hook to use entity context
 */
export function useEntityContext() {
  const context = useContext(EntityContextContext)
  if (!context) {
    throw new Error('useEntityContext must be used within an EntityContextProvider')
  }
  return context
}

/**
 * Optional hook that returns null if outside provider
 */
export function useEntityContextOptional() {
  return useContext(EntityContextContext)
}

/**
 * Hook to get just the current entity info
 */
export function useCurrentEntity() {
  const { context } = useEntityContext()
  return {
    entityType: context?.entityType || null,
    entityId: context?.entityId || null,
    route: context?.route || null,
    section: context?.section || null,
  }
}
