'use client'

/**
 * AI Chat Panel (v2) — the redesigned Page Builder AI chat.
 *
 * Faithful implementation of the "AI Chat Panel" design handoff, wired to the
 * real block-editor `useChat` stream and the live editor. Renders the
 * presentational <ChatPanel> from a ChatPanelModel built here.
 *
 * Kept side-by-side with the original ai-chat-panel.tsx; selected via the
 * USE_CHAT_V2 flag in page-builder so the working panel stays as fallback.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useEditor } from '@/lib/cms/block-editor/editor-context'
import { stripParentIds } from '@/lib/cms/block-editor/tree-utils'
import { ChatPanel } from './panel'
import { mapMessages, estimateContext } from './map-messages'
import { useApplyToolOutputs } from './use-apply-tool-outputs'
import type { ChatMessageVM, ChatPanelModel, SelectionChip, SlashCommand } from './types'

const SLASH: SlashCommand[] = [
  { id: 'compact', cmd: '/compact', desc: 'Summarize & free up context' },
  { id: 'revert', cmd: '/revert', desc: 'Roll back the last change' },
  { id: 'diff', cmd: '/diff', desc: 'Show the pending visual diff' },
  { id: 'components', cmd: '/components', desc: 'Browse registry components' },
  { id: 'clear', cmd: '/clear', desc: 'Clear the conversation' },
]

const SUGGESTIONS = [
  'Add a testimonials band under the hero',
  'Make the hero CTA larger + a secondary link',
  'Create a 3-column feature grid',
]

export function AIChatPanelV2({ accent }: { accent?: string }) {
  const editor = useEditor()
  const editorRef = useRef(editor)
  editorRef.current = editor

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/cms/block-editor-chat',
        prepareSendMessagesRequest: ({ id, messages: msgs }) => ({
          body: {
            messages: msgs,
            id,
            pageState: stripParentIds(editorRef.current.state.blocks),
            selectedBlockId: editorRef.current.state.selectedBlockId,
            sourceCode: editorRef.current.state.currentPage?.sourceCode || undefined,
            sourceDeps: editorRef.current.state.currentPage?.sourceDeps || undefined,
          },
        }),
      }),
    []
  )

  const { messages, sendMessage, status, setMessages, stop } = useChat({ transport })
  useApplyToolOutputs(messages as UIMessage[], status, editor)

  // ---- local UI state ----
  const [input, setInput] = useState('')
  const [slashOpen, setSlashOpen] = useState(false)
  const [chips, setChips] = useState<SelectionChip[]>([])
  const [openThinking, setOpenThinking] = useState<Set<string>>(new Set())
  const [reverted, setReverted] = useState(false)
  const [summary, setSummary] = useState<ChatMessageVM | null>(null)
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const streaming = status === 'streaming' || status === 'submitted'

  const send = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text || streaming) return
    const ctx = chips.length ? ` (focused: ${chips.map((c) => c.tag).join(', ')})` : ''
    sendMessage({ text: text + ctx })
    setInput('')
    setChips([])
    setSlashOpen(false)
  }, [chips, sendMessage, streaming])

  const runCommand = useCallback((id: string) => {
    setSlashOpen(false)
    setInput('')
    if (id === 'clear') { setMessages([]); setSummary(null) }
    else if (id === 'compact') {
      const retained = mapMessages(messages as UIMessage[], { openThinking })
        .filter((m) => m.role === 'assistant')
        .flatMap((m) => (m.parts || []).filter((p) => p.kind === 'changeset'))
        .map((p) => (p.kind === 'changeset' ? `${p.summary} change(s)` : ''))
        .filter(Boolean)
        .slice(-4)
      setSummary({ id: `sum-${messages.length}`, role: 'system', retained: retained.length ? retained : ['Earlier turns summarized'], saved: '~context freed' })
      setMessages((prev) => prev.slice(-2))
    }
    else if (id === 'revert') {
      const ms = messages as UIMessage[]
      for (let i = ms.length - 1; i >= 0; i--) {
        if (ms[i].role === 'user') { revertTo(ms[i].id); break }
      }
    }
    else if (id === 'diff') setInput('Show me the pending visual diff')
    else if (id === 'components') setInput('List the components in my registry')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, openThinking, setMessages])

  const revertTo = useCallback((messageId: string) => {
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === messageId)
      return i < 0 ? prev : prev.slice(0, i + 1)
    })
    setReverted(true)
    if (revertTimer.current) clearTimeout(revertTimer.current)
    revertTimer.current = setTimeout(() => setReverted(false), 2400)
  }, [setMessages])

  const toggleThinking = useCallback((_mid: string, partId: string) => {
    setOpenThinking((prev) => {
      const next = new Set(prev)
      next.has(partId) ? next.delete(partId) : next.add(partId)
      return next
    })
  }, [])

  // ---- build the model ----
  const mapped = useMemo(() => mapMessages(messages as UIMessage[], { openThinking }), [messages, openThinking])
  const ctx = useMemo(() => estimateContext(messages as UIMessage[]), [messages])
  const vmMessages = useMemo(() => (summary ? [summary, ...mapped] : mapped), [summary, mapped])

  const model: ChatPanelModel = {
    assistantName: 'Page Builder AI',
    modelLabel: 'Claude Haiku 4.5',
    messages: vmMessages,
    isEmpty: vmMessages.length === 0,
    streaming,
    reverted,
    contextPct: ctx.pct,
    tokenLabel: ctx.label,
    input,
    composerPlaceholder: 'Ask anything · plan, build or edit the page',
    chips,
    slashOpen,
    slashCommands: slashOpen ? SLASH.filter((c) => c.id.includes(input.replace(/^\//, '').toLowerCase())) : SLASH,
    suggestions: SUGGESTIONS,
    canvasBlocks: [],
    onInput: (v) => { setInput(v); setSlashOpen(v.startsWith('/') && !v.includes(' ') && !v.includes('\n')) },
    onSubmit: () => send(input),
    onPickSuggestion: (t) => send(t),
    onAttachBlock: (b) => setChips((prev) => (prev.some((c) => c.tag === b.tag) ? prev : [...prev, b])),
    onRemoveChip: (id) => setChips((prev) => prev.filter((c) => c.id !== id)),
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
    onUndoChangeset: () => editorRef.current.undo(),
    onCopyCode: () => {},
    onApplyCode: () => {},
    onApproveTool: () => {},
    onDenyTool: () => {},
  }

  return <ChatPanel model={model} accent={accent} />
}
