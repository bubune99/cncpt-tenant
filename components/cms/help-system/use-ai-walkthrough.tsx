'use client'

/**
 * AI Walkthrough Hook
 *
 * Handles AI tool results related to walkthroughs and help content.
 * Integrates with the help provider to trigger tours, navigate, etc.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHelp } from './help-provider'

// AI Tool Action Types
export type AIWalkthroughAction =
  | 'suggest_walkthroughs'
  | 'start_walkthrough'
  | 'walkthrough_created'
  | 'walkthrough_exists'
  | 'help_content_created'
  | 'explain_element'
  | 'error'

export interface AIWalkthroughResult {
  action: AIWalkthroughAction
  tourId?: string
  tourSlug?: string
  title?: string
  stepsCount?: number
  navigateTo?: string
  message?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface UseAIWalkthroughOptions {
  // Callback when AI suggests navigating
  onNavigate?: (path: string) => void
  // Callback when a tour is started
  onTourStart?: (tourSlug: string) => void
  // Enable auto-handling of AI actions
  autoHandle?: boolean
}

export function useAIWalkthrough(options: UseAIWalkthroughOptions = {}) {
  const { autoHandle = true, onNavigate, onTourStart } = options
  const router = useRouter()
  const { startWalkthrough, isWalkthroughActive } = useHelp()
  const [pendingAction, setPendingAction] = useState<AIWalkthroughResult | null>(null)

  // Handle AI tool result
  const handleToolResult = useCallback(
    (result: AIWalkthroughResult) => {
      if (!autoHandle) {
        setPendingAction(result)
        return
      }

      switch (result.action) {
        case 'start_walkthrough':
          // Navigate first if needed
          if (result.navigateTo) {
            if (onNavigate) {
              onNavigate(result.navigateTo)
            } else {
              router.push(result.navigateTo)
            }
            // Start tour after a short delay for navigation
            setTimeout(() => {
              if (result.tourSlug) {
                if (onTourStart) {
                  onTourStart(result.tourSlug)
                } else {
                  startWalkthrough(result.tourSlug)
                }
              }
            }, 500)
          } else if (result.tourSlug) {
            if (onTourStart) {
              onTourStart(result.tourSlug)
            } else {
              startWalkthrough(result.tourSlug)
            }
          }
          break

        case 'walkthrough_created':
          // Tour was created, optionally auto-start
          if (result.tourSlug) {
            // Could show a notification or auto-start
            console.log(`Tour created: ${result.title}`)
          }
          break

        case 'suggest_walkthroughs':
          // UI will render the suggestions - no action needed here
          break

        case 'explain_element':
          // UI will render the explanation - no action needed here
          break

        case 'help_content_created':
          // Help content was saved
          console.log(`Help content created for: ${result.elementKey}`)
          break

        case 'error':
          console.error('AI walkthrough error:', result.message)
          break

        default:
          console.log('Unknown AI action:', result.action)
      }
    },
    [autoHandle, onNavigate, onTourStart, router, startWalkthrough]
  )

  // Start a tour by slug
  const startTour = useCallback(
    (tourSlug: string, navigateFirst?: string) => {
      if (navigateFirst) {
        if (onNavigate) {
          onNavigate(navigateFirst)
        } else {
          router.push(navigateFirst)
        }
        setTimeout(() => {
          if (onTourStart) {
            onTourStart(tourSlug)
          } else {
            startWalkthrough(tourSlug)
          }
        }, 500)
      } else {
        if (onTourStart) {
          onTourStart(tourSlug)
        } else {
          startWalkthrough(tourSlug)
        }
      }
    },
    [onNavigate, onTourStart, router, startWalkthrough]
  )

  // Request AI to generate a custom tour
  const requestCustomTour = useCallback(
    async (context: string): Promise<AIWalkthroughResult | null> => {
      // This would typically be called via the chat interface
      // The AI would use generateWalkthrough tool
      console.log('Requesting custom tour for context:', context)
      return null
    },
    []
  )

  // Clear pending action
  const clearPendingAction = useCallback(() => {
    setPendingAction(null)
  }, [])

  // Process pending action
  const processPendingAction = useCallback(() => {
    if (pendingAction) {
      const action = pendingAction
      setPendingAction(null)
      handleToolResult({ ...action } as AIWalkthroughResult & { action: AIWalkthroughAction })
    }
  }, [pendingAction, handleToolResult])

  return {
    handleToolResult,
    startTour,
    requestCustomTour,
    pendingAction,
    clearPendingAction,
    processPendingAction,
    isWalkthroughActive,
  }
}

/**
 * Utility to check if a tool result is a walkthrough-related action
 */
export function isWalkthroughAction(result: unknown): result is AIWalkthroughResult {
  if (typeof result !== 'object' || result === null) return false
  const r = result as Record<string, unknown>
  return (
    typeof r.action === 'string' &&
    [
      'suggest_walkthroughs',
      'start_walkthrough',
      'walkthrough_created',
      'walkthrough_exists',
      'help_content_created',
      'explain_element',
      'error',
    ].includes(r.action)
  )
}

/**
 * Component to auto-handle AI walkthrough actions from streaming responses
 */
interface AIWalkthroughHandlerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolResults?: any[]
  onNavigate?: (path: string) => void
  onTourStart?: (tourSlug: string) => void
}

export function AIWalkthroughHandler({
  toolResults,
  onNavigate,
  onTourStart,
}: AIWalkthroughHandlerProps) {
  const { handleToolResult } = useAIWalkthrough({
    onNavigate,
    onTourStart,
  })

  useEffect(() => {
    if (!toolResults) return

    for (const result of toolResults) {
      if (isWalkthroughAction(result)) {
        handleToolResult(result)
      }
    }
  }, [toolResults, handleToolResult])

  return null
}
