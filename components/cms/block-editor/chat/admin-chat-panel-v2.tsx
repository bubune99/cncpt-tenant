'use client'

/**
 * Admin / Dashboard CMS Chat Panel (v2) — the same redesigned chat used in the
 * page builder, driven by an admin or dashboard `/api/*chat` stream for a
 * consistent assistant across the whole product.
 *
 * Ported from the dzidzor reference and adapted for cncpt-tenant:
 *  - the streaming endpoint is a prop (`api`) so the same panel can drive the
 *    CMS admin chat (/api/cms/chat) or the merchant dashboard chat
 *    (/api/dashboard-chat);
 *  - the dzidzor spotlight tool-interceptor + nav-feedback aren't part of the
 *    cncpt surface yet, so they're omitted (the rest of the v2 UX — slash
 *    commands, compact, revert, reasoning, tool-approval, context meter,
 *    suggestions — is intact).
 *
 * Renders the shared <ChatPanel> (header hidden — the window chrome supplies
 * the title bar).
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import type { ChatMessage } from '@/lib/cms/chatsdk/types'
import { generateUUID } from '@/lib/cms/utils'
import { ChatPanel } from './panel'
import { mapAdminMessages } from './map-admin-messages'
import { estimateContext } from './map-messages'
import { useSpotlightToolInterceptor } from '@/components/cms/spotlight/use-spotlight-tool-interceptor'
import type { ChatMessageVM, ChatPanelModel, SlashCommand } from './types'

const SLASH: SlashCommand[] = [
  { id: 'compact', cmd: '/compact', desc: 'Summarize & free up context' },
  { id: 'revert', cmd: '/revert', desc: 'Roll back to a previous turn' },
  { id: 'clear', cmd: '/clear', desc: 'Clear the conversation' },
]

const DEFAULT_SUGGESTIONS = [
  'Take me to the orders page',
  'Show products that are low on stock',
  'Summarize today’s store activity',
]

function humanizeModel(id?: string): string {
  if (!id) return 'Claude Sonnet 4.5'
  const slug = id.split('/').pop() || id
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/(\d)\s(\d)/, '$1.$2')
}

interface Props {
  conversationId: string
  /** Streaming endpoint. Defaults to the CMS admin chat. */
  api?: string
  initialMessages?: ChatMessage[]
  initialChatModel?: string
  customBody?: Record<string, unknown>
  suggestions?: string[]
  assistantName?: string
  composerPlaceholder?: string
  onHelpAction?: (action: Record<string, unknown>) => void
}

export function AdminChatPanelV2({
  conversationId,
  api = '/api/cms/chat',
  initialMessages = [],
  initialChatModel,
  customBody,
  suggestions = DEFAULT_SUGGESTIONS,
  assistantName = 'CMS Assistant',
  composerPlaceholder = 'Ask anything · navigate, search or manage your store',
  onHelpAction,
}: Props) {
  const modelRef = useRef(initialChatModel || 'anthropic/claude-sonnet-4.5')
  const customBodyRef = useRef(customBody)
  customBodyRef.current = customBody

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        prepareSendMessagesRequest(request) {
          return {
            body: {
              id: request.id,
              messages: request.messages,
              selectedChatModel: modelRef.current,
              selectedVisibilityType: 'private',
              ...customBodyRef.current,
              ...request.body,
            },
          }
        },
      }),
    [api]
  )

  const { messages, sendMessage, status, setMessages, stop, addToolApprovalResponse } = useChat<ChatMessage>({
    id: conversationId,
    messages: initialMessages,
    generateId: generateUUID,
    transport,
    onData: (dataPart) => {
      if ((dataPart.type as string) === 'data-help-action' && onHelpAction) {
        onHelpAction((dataPart as unknown as { data: Record<string, unknown> }).data)
      }
    },
  })

  // Execute client-side spotlight/navigation tool results in the browser:
  // spotlight_steps -> spotlight store/overlay, navigate_to_route + legacy
  // navigateTo -> AgentNavRail. (SpotlightHost + AgentNavRail are mounted in
  // the admin/dashboard shell.)
  useSpotlightToolInterceptor(messages)

  const [input, setInput] = useState('')
  const [slashOpen, setSlashOpen] = useState(false)
  const [openThinking, setOpenThinking] = useState<Set<string>>(new Set())
  const [reverted, setReverted] = useState(false)
  const [summary, setSummary] = useState<ChatMessageVM | null>(null)
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const streaming = status === 'streaming' || status === 'submitted'

  const send = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text || streaming) return
    sendMessage({ text })
    setInput('')
    setSlashOpen(false)
  }, [sendMessage, streaming])

  const revertTo = useCallback((messageId: string) => {
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === messageId)
      return i < 0 ? prev : prev.slice(0, i + 1)
    })
    setReverted(true)
    if (revertTimer.current) clearTimeout(revertTimer.current)
    revertTimer.current = setTimeout(() => setReverted(false), 2400)
  }, [setMessages])

  const runCommand = useCallback((id: string) => {
    setSlashOpen(false)
    setInput('')
    if (id === 'clear') { setMessages([]); setSummary(null) }
    else if (id === 'compact') {
      setSummary({ id: `sum-${messages.length}`, role: 'system', retained: ['Earlier turns summarized'], saved: '~context freed' })
      setMessages((prev) => prev.slice(-2))
    }
    else if (id === 'revert') {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') { revertTo(messages[i].id); break }
      }
    }
  }, [messages, setMessages, revertTo])

  const toggleThinking = useCallback((_mid: string, partId: string) => {
    setOpenThinking((prev) => {
      const next = new Set(prev)
      next.has(partId) ? next.delete(partId) : next.add(partId)
      return next
    })
  }, [])

  const mapped = useMemo(() => mapAdminMessages(messages as UIMessage[], { openThinking }), [messages, openThinking])
  const ctx = useMemo(() => estimateContext(messages as UIMessage[]), [messages])
  const vmMessages = useMemo(() => (summary ? [summary, ...mapped] : mapped), [summary, mapped])

  const model: ChatPanelModel = {
    assistantName,
    modelLabel: humanizeModel(modelRef.current),
    messages: vmMessages,
    isEmpty: vmMessages.length === 0,
    streaming,
    reverted,
    contextPct: ctx.pct,
    tokenLabel: ctx.label,
    input,
    composerPlaceholder,
    chips: [],
    slashOpen,
    slashCommands: slashOpen ? SLASH.filter((c) => c.id.includes(input.replace(/^\//, '').toLowerCase())) : SLASH,
    suggestions,
    canvasBlocks: [],
    onInput: (v) => { setInput(v); setSlashOpen(v.startsWith('/') && !v.includes(' ') && !v.includes('\n')) },
    onSubmit: () => send(input),
    onPickSuggestion: (t) => send(t),
    onAttachBlock: () => {},
    onRemoveChip: () => {},
    onRunCommand: runCommand,
    onCompact: () => runCommand('compact'),
    onClear: () => runCommand('clear'),
    onRevertTo: revertTo,
    onStop: () => stop(),
    onToggleThinking: toggleThinking,
    onToggleTask: () => {},
    onToggleSubtask: () => {},
    onAcceptChangeset: () => {},
    onRejectChangeset: () => {},
    onUndoChangeset: () => {},
    onCopyCode: () => {},
    onApplyCode: () => {},
    onApproveTool: (_mid, toolCallId) => addToolApprovalResponse?.({ id: toolCallId, approved: true }),
    onDenyTool: (_mid, toolCallId) => addToolApprovalResponse?.({ id: toolCallId, approved: false }),
  }

  return <ChatPanel model={model} hideHeader />
}
