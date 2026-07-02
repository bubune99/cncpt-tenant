'use client'

/**
 * Grainy admin chat orchestrator.
 *
 * Owns the AI SDK `useChat` wiring and maps its stream through the Grainy
 * mapper + panel. The backend contract is preserved exactly from the previous
 * v2 orchestrator: DefaultChatTransport → /api/cms/chat, the same body fields,
 * approval flow (addToolApprovalResponse keyed on approval.id),
 * sendAutomaticallyWhen, and the spotlight/navigation interceptor. The only
 * additions are Grainy-native rendering, 402 credit-exhaustion surfacing, and
 * nav/tour widget wiring to the existing rail + help mechanisms.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from 'ai'
import type { ChatMessage } from '@/lib/cms/chatsdk/types'
import { generateUUID, fetchWithErrorHandlers } from '@/lib/cms/utils'
import { useSpotlightToolInterceptor } from '@/components/cms/spotlight/use-spotlight-tool-interceptor'
import { AGENT_NAVIGATE_EVENT } from '@/components/cms/admin/agent-nav-rail'
import { useHelpOptional } from '@/components/cms/help-system/help-provider'
import { ChatPanel } from './panel'
import { mapAdminMessages } from './map-admin-messages'
import { estimateContext } from '@/components/cms/block-editor/chat/map-messages'
import type { ChatMessageVM, ChatNotice, ChatPanelModel, SlashCommand } from './types'

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
  hideHeader?: boolean
  onHelpAction?: (action: Record<string, unknown>) => void
}

export function AdminChatPanelGrainy({
  conversationId,
  api = '/api/cms/chat',
  initialMessages = [],
  initialChatModel,
  customBody,
  suggestions = DEFAULT_SUGGESTIONS,
  assistantName = 'Assistant',
  composerPlaceholder = 'Ask anything · navigate, search or manage your store',
  hideHeader = true,
  onHelpAction,
}: Props) {
  const modelRef = useRef(initialChatModel || 'anthropic/claude-sonnet-4.5')
  const customBodyRef = useRef(customBody)
  customBodyRef.current = customBody
  const help = useHelpOptional()

  const [notice, setNotice] = useState<ChatNotice | null>(null)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        fetch: fetchWithErrorHandlers,
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
    // Re-send once every approval request has an approve/deny response, so the
    // server can execute (or skip) the gated tool.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onData: (dataPart) => {
      if ((dataPart.type as string) === 'data-help-action' && onHelpAction) {
        onHelpAction((dataPart as unknown as { data: Record<string, unknown> }).data)
      }
    },
    onError: (error) => {
      const status = (error as { status?: number }).status
      const msg = error?.message || ''
      if (status === 402 || /credit/i.test(msg) || /insufficient/i.test(msg)) {
        setNotice({
          kind: 'credits',
          message: 'You’re out of AI credits. Top up to keep using the assistant.',
          actionLabel: 'Top up credits',
          actionHref: '/dashboard?section=credits',
        })
      } else {
        setNotice({ kind: 'error', message: msg || 'The request failed. Please try again.' })
      }
    },
  })

  // Execute client-side spotlight/navigation tool results (spotlight_steps ->
  // spotlight store; navigate_to_route / navigateTo -> AgentNavRail).
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
    setNotice(null)
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
    if (id === 'clear') { setMessages([]); setSummary(null); setNotice(null) }
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
      if (next.has(partId)) next.delete(partId)
      else next.add(partId)
      return next
    })
  }, [])

  const navigate = useCallback((path: string) => {
    if (typeof window === 'undefined' || !path) return
    window.dispatchEvent(new CustomEvent(AGENT_NAVIGATE_EVENT, { detail: { path } }))
  }, [])

  const startTour = useCallback((slug: string) => {
    if (slug) help?.startWalkthrough(slug)
  }, [help])

  const mapped = useMemo(() => mapAdminMessages(messages as UIMessage[], { openThinking }), [messages, openThinking])
  const ctx = useMemo(() => estimateContext(messages as UIMessage[]), [messages])
  const vmMessages = useMemo(() => (summary ? [summary, ...mapped] : mapped), [summary, mapped])

  const noop = () => {}

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
    notice,
    onInput: (v) => { setInput(v); setSlashOpen(v.startsWith('/') && !v.includes(' ') && !v.includes('\n')) },
    onSubmit: () => send(input),
    onPickSuggestion: (t) => send(t),
    onAttachBlock: noop,
    onRemoveChip: noop,
    onRunCommand: runCommand,
    onCompact: () => runCommand('compact'),
    onClear: () => runCommand('clear'),
    onRevertTo: revertTo,
    onStop: () => stop(),
    onToggleThinking: toggleThinking,
    onToggleTask: noop,
    onToggleSubtask: noop,
    onAcceptChangeset: noop,
    onRejectChangeset: noop,
    onUndoChangeset: noop,
    onCopyCode: noop,
    onApplyCode: noop,
    onApproveTool: (_mid, approvalId) => addToolApprovalResponse?.({ id: approvalId, approved: true }),
    onDenyTool: (_mid, approvalId) => addToolApprovalResponse?.({ id: approvalId, approved: false }),
    onNavigate: navigate,
    onStartTour: startTour,
  }

  return <ChatPanel model={model} hideHeader={hideHeader} />
}
