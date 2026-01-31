'use client'

/**
 * Help Tool Handler Hook
 *
 * Detects help-related tool calls in chat responses and updates the HelpProvider.
 * This is a client-side approach that avoids complex server-to-client socket events.
 *
 * Usage:
 * ```tsx
 * function AdminChat() {
 *   const { processToolResult } = useHelpToolHandler()
 *
 *   // In your useChat config:
 *   const { messages } = useChat({
 *     onToolCall: async (toolCall) => {
 *       // ... your other handling
 *     },
 *   })
 *
 *   // Watch for tool results in messages and process them
 *   useEffect(() => {
 *     messages.forEach(m => {
 *       if (m.toolInvocations) {
 *         m.toolInvocations.forEach(ti => {
 *           if (ti.state === 'result') {
 *             processToolResult(ti.toolName, ti.result)
 *           }
 *         })
 *       }
 *     })
 *   }, [messages, processToolResult])
 * }
 * ```
 */

import { useCallback, useRef } from 'react'
import { useHelpOptional } from './help-provider'
import type { HelpContentUpdateEvent } from './types'

// Help-related tool names
const HELP_TOOLS = [
  'updateHelpContent',
  'batchGenerateHelp',
  'generateEntityHelp',
  'manageHelpStatus',
  'markHelpOrphaned',
]

interface ToolResult {
  action?: string
  elementKey?: string
  elementKeys?: string[]
  entries?: Array<{ elementKey: string }>
  results?: Array<{ key: string; status: string }>
  title?: string
  summary?: string
  [key: string]: unknown
}

export function useHelpToolHandler() {
  const helpContext = useHelpOptional()
  const processedRef = useRef<Set<string>>(new Set())

  /**
   * Process a tool result and update HelpProvider if it's a help-related tool
   */
  const processToolResult = useCallback(
    (toolName: string, result: unknown, invocationId?: string) => {
      // Skip if no help context available
      if (!helpContext) return false

      // Skip if not a help-related tool
      if (!HELP_TOOLS.includes(toolName)) return false

      // Skip if already processed (using invocationId if provided)
      if (invocationId && processedRef.current.has(invocationId)) return false
      if (invocationId) processedRef.current.add(invocationId)

      // Keep processed set bounded
      if (processedRef.current.size > 100) {
        const arr = Array.from(processedRef.current)
        processedRef.current = new Set(arr.slice(-50))
      }

      const toolResult = result as ToolResult
      if (!toolResult || typeof toolResult !== 'object') return false

      // Determine action and keys based on tool type
      switch (toolName) {
        case 'updateHelpContent': {
          if (
            toolResult.action === 'created' ||
            toolResult.action === 'updated'
          ) {
            const event: HelpContentUpdateEvent = {
              elementKey: toolResult.elementKey || '',
              action: toolResult.action,
              title: toolResult.title,
              summary: toolResult.summary,
              source: 'ai',
              timestamp: Date.now(),
            }
            helpContext.onContentUpdated(event)
            return true
          }
          break
        }

        case 'batchGenerateHelp': {
          if (toolResult.results && Array.isArray(toolResult.results)) {
            toolResult.results.forEach((r) => {
              if (r.status === 'created' || r.status === 'updated') {
                const event: HelpContentUpdateEvent = {
                  elementKey: r.key,
                  action: r.status as 'created' | 'updated',
                  source: 'ai',
                  timestamp: Date.now(),
                }
                helpContext.onContentUpdated(event)
              }
            })
            return true
          }
          break
        }

        case 'generateEntityHelp': {
          if (
            toolResult.action === 'created' ||
            toolResult.action === 'updated'
          ) {
            const event: HelpContentUpdateEvent = {
              elementKey: toolResult.elementKey || '',
              action: toolResult.action,
              title: toolResult.title,
              summary: toolResult.summary,
              source: 'ai',
              timestamp: Date.now(),
            }
            helpContext.onContentUpdated(event)
            return true
          }
          break
        }

        case 'manageHelpStatus':
        case 'markHelpOrphaned': {
          // For these, we just note that content was modified
          const keys = toolResult.elementKeys || []
          keys.forEach((key) => {
            const event: HelpContentUpdateEvent = {
              elementKey: key,
              action: 'updated',
              source: 'ai',
              timestamp: Date.now(),
            }
            helpContext.onContentUpdated(event)
          })
          return keys.length > 0
        }
      }

      return false
    },
    [helpContext]
  )

  /**
   * Check if a tool name is help-related
   */
  const isHelpTool = useCallback((toolName: string) => {
    return HELP_TOOLS.includes(toolName)
  }, [])

  return {
    processToolResult,
    isHelpTool,
    isAvailable: !!helpContext,
  }
}
