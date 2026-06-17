'use client'

/**
 * Spotlight / Navigation Tool Interceptor
 *
 * Watches the chat message stream for results of client-executed tools and
 * drives them on the client:
 *   - spotlight_steps      -> global spotlight store (SpotlightHost)
 *   - navigate_to_route    -> AgentNavRail (real navigation)
 *   - navigateTo (legacy)  -> AgentNavRail (real navigation)
 *
 * Two result shapes are recognized:
 *   1. { __requires_client_execution: true, name, arguments } — spotlight tools
 *   2. { action: 'navigate', path, ... }                       — legacy navigateTo
 *
 * Navigation is performed via the AgentNavRail, NOT router.push from here: this
 * hook runs inside the chat which is portaled to <body>, so its router is
 * detached from the app router tree and router.push() silently no-ops. The rail
 * lives in the admin layout tree, so clicking a rail button (or dispatching the
 * agent:navigate event it listens for) navigates in the correct context.
 *
 * Deduped by tool-call id so the same call never fires twice.
 */

import { useEffect } from 'react'
import type { ChatMessage } from '@/lib/cms/chatsdk/types'
import { useSpotlightStore } from '@/stores/spotlight-store'
import { AGENT_NAVIGATE_EVENT } from '@/components/cms/admin/agent-nav-rail'
import { setLastNav } from '@/lib/cms/ai/nav-feedback'
import type { SpotlightStep } from './types'

/**
 * Module-level dedupe set, shared across every mounted interceptor instance.
 * The main admin chat AND the #9 spotlight mini-chat both call this hook, so a
 * per-instance ref would let the same tool-call fire twice. A shared set means
 * the first instance to see a tool-call id claims it; the others skip.
 */
const processedToolCalls = new Set<string>()

interface SpotlightArgs {
  steps: Array<{
    target: string
    caption: string
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  }>
  title?: string
}

interface ClientSentinel {
  __requires_client_execution: true
  name: string
  arguments: Record<string, unknown>
  message?: string
}

interface NavigateAction {
  action: 'navigate'
  path: string
  reason?: string
}

function isClientSentinel(output: unknown): output is ClientSentinel {
  if (!output || typeof output !== 'object') return false
  const o = output as Record<string, unknown>
  return o.__requires_client_execution === true && typeof o.name === 'string'
}

/** Result shape of the legacy `navigateTo` tool (src/lib/ai/tools/index.ts). */
function isNavigateAction(output: unknown): output is NavigateAction {
  if (!output || typeof output !== 'object') return false
  const o = output as Record<string, unknown>
  return o.action === 'navigate' && typeof o.path === 'string'
}

const normalizePath = (p: string) => p.replace(/\/+$/, '') || '/'

/**
 * Navigate to `path` in the app router's (correct) context. Prefers clicking
 * the invisible AgentNavRail button for the path; for anything not in the rail
 * registry (e.g. dynamic routes like /admin/orders/123) it dispatches the
 * agent:navigate event the rail listens for. Never uses this hook's own
 * router, which is detached (see file header).
 */
function navigateViaRail(path: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const target = normalizePath(path)
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      '[data-agent-nav-rail] [data-agent-nav-path]'
    )
  )
  const match = buttons.find(
    (b) => normalizePath(b.getAttribute('data-agent-nav-path') || '') === target
  )
  if (match) {
    match.click()
  } else {
    window.dispatchEvent(
      new CustomEvent(AGENT_NAVIGATE_EVENT, { detail: { path } })
    )
  }
}

/**
 * Navigate, then verify the route actually changed and record the outcome so
 * the agent can be told the truth on its next turn (see lib/ai/nav-feedback).
 * Pattern-consistent with the rest of the chat: no client tool round-trip, just
 * a recorded result surfaced via the next request's system prompt.
 */
function navigateAndRecord(path: string) {
  navigateViaRail(path)
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    const actual = window.location.pathname
    setLastNav({
      requested: path,
      actual,
      success: normalizePath(actual) === normalizePath(path),
    })
  }, 800)
}

export function useSpotlightToolInterceptor(messages: ChatMessage[]) {
  const enqueueAll = useSpotlightStore((s) => s.enqueueAll)

  useEffect(() => {
    if (!messages || messages.length === 0) return

    for (const msg of messages) {
      const parts = (msg as unknown as { parts?: Array<Record<string, unknown>> })
        .parts
      if (!parts) continue

      for (const part of parts) {
        const type = part.type as string | undefined
        if (!type || !type.startsWith('tool-')) continue

        const state = part.state as string | undefined
        // AI SDK v6 uses 'output-available'; some transports / older versions
        // emit 'result' or 'tool-result-available'. Accept any terminal state.
        if (
          state !== 'output-available' &&
          state !== 'result' &&
          state !== 'tool-result-available' &&
          state !== 'done'
        ) {
          continue
        }

        const toolCallId = part.toolCallId as string | undefined
        if (!toolCallId || processedToolCalls.has(toolCallId)) continue

        // Field name is normally `output`; fall back to `result` defensively.
        const output = (part.output ?? part.result) as unknown
        const sentinel = isClientSentinel(output)
        const navAction = !sentinel && isNavigateAction(output)
        if (!sentinel && !navAction) continue

        // Mark processed early so we never double-fire (even if a re-render
        // happens before the action settles, or another interceptor instance
        // sees the same message).
        processedToolCalls.add(toolCallId)

        // Bound the dedupe set so it doesn't grow indefinitely.
        if (processedToolCalls.size > 200) {
          const keep = Array.from(processedToolCalls).slice(-100)
          processedToolCalls.clear()
          keep.forEach((id) => processedToolCalls.add(id))
        }

        if (sentinel && output.name === 'spotlight_steps') {
          const args = output.arguments as unknown as SpotlightArgs
          if (Array.isArray(args?.steps) && args.steps.length > 0) {
            const queue: Array<Omit<SpotlightStep, 'id'>> = args.steps.map((s) => ({
              target: s.target,
              tooltip: {
                content: s.caption,
                position: s.position ?? 'auto',
              },
            }))
            enqueueAll(queue)
          }
        } else if (sentinel && output.name === 'navigate_to_route') {
          const path = (output.arguments as { path?: unknown })?.path
          if (typeof path === 'string' && path) navigateAndRecord(path)
        } else if (navAction) {
          // Legacy navigateTo tool result — the agent's preferred nav tool.
          navigateAndRecord(output.path)
        }
      }
    }
  }, [messages, enqueueAll])
}
