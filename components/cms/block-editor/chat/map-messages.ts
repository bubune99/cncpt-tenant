'use client'

/**
 * Maps the real AI SDK `useChat` stream onto the chat panel view-model.
 *
 * Today's block-editor stream populates: user text, assistant reasoning
 * (-> thinking), assistant text, and building tool calls (-> a changeset of
 * change cards, auto-applied). The richer parts (plan / diff / tokens /
 * registry) are already renderable and will populate as soon as the server
 * emits them — see the unified-chat spine follow-up.
 */

import { isToolUIPart, type UIMessage } from 'ai'
import type { ChatMessageVM, ChatPart, ChangeRow } from './types'

const BUILDING_TOOLS = new Set([
  'setPageBlocks', 'addBlock', 'updateBlock', 'removeBlock', 'moveBlock',
  'generateImage', 'importAndAnalyze', 'repairBlock',
])

const toolName = (t: string) => t.replace(/^tool-/, '')

function changeFor(name: string, input: Record<string, unknown> | undefined): ChangeRow | null {
  const inp = input || {}
  const blockTag = (inp.block as Record<string, unknown> | undefined)?.tag as string | undefined
  switch (name) {
    case 'addBlock':
      return { id: '', type: 'added', tag: `<${blockTag || 'block'}>`, label: 'Added block', detail: String((inp.block as Record<string, unknown> | undefined)?.className || '') }
    case 'setPageBlocks':
      return { id: '', type: 'added', tag: '<page>', label: 'Rebuilt page', detail: `${Array.isArray(inp.blocks) ? (inp.blocks as unknown[]).length : 0} blocks` }
    case 'generateImage':
      return { id: '', type: 'added', tag: '<img>', label: 'Generated image', detail: String(inp.prompt || '') }
    case 'importAndAnalyze':
      return { id: '', type: 'added', tag: '<import>', label: 'Imported design', detail: '' }
    case 'updateBlock':
      return { id: '', type: 'updated', tag: `<${(inp.tag as string) || 'block'}>`, label: 'Updated block', detail: String(inp.className || inp.textContent || '') }
    case 'repairBlock':
      return { id: '', type: 'updated', tag: '<block>', label: 'Repaired block', detail: String(inp._action || '') }
    case 'moveBlock':
      return { id: '', type: 'updated', tag: '<block>', label: 'Moved block', detail: '' }
    case 'removeBlock':
      return { id: '', type: 'removed', tag: '<block>', label: 'Removed block', detail: '' }
    default:
      return null
  }
}

export interface MapOpts {
  openThinking: Set<string>
}

export function mapMessages(messages: UIMessage[], opts: MapOpts): ChatMessageVM[] {
  return messages.map((msg) => {
    const id = msg.id
    const parts = (msg.parts || []) as Array<Record<string, unknown>>

    if (msg.role === 'user') {
      const text = parts.filter((p) => p.type === 'text').map((p) => String(p.text || '')).join('')
      return { id, role: 'user', text }
    }

    if (msg.role !== 'assistant') {
      return { id, role: 'system', text: '' }
    }

    const out: ChatPart[] = []
    const changes: ChangeRow[] = []
    let allApplied = true
    let thinkAccum = ''

    parts.forEach((p, i) => {
      const type = String(p.type || '')
      if (type === 'reasoning') {
        thinkAccum += String(p.text || '')
        return
      }
      if (type === 'text') {
        const t = String(p.text || '').trim()
        if (t) out.push({ id: `${id}-t${i}`, kind: 'text', text: t })
        return
      }
      if (isToolUIPart(p as never)) {
        const name = toolName(type)
        if (BUILDING_TOOLS.has(name)) {
          const state = String((p as Record<string, unknown>).state || '')
          if (state !== 'output-available') allApplied = false
          const row = changeFor(name, (p as Record<string, unknown>).input as Record<string, unknown> | undefined)
          if (row) changes.push({ ...row, id: `${id}-c${changes.length}` })
        }
      }
    })

    // Thinking goes first if present.
    const partsOut: ChatPart[] = []
    if (thinkAccum.trim()) {
      partsOut.push({ id: `${id}-think`, kind: 'thinking', text: thinkAccum, open: opts.openThinking.has(`${id}-think`) })
    }
    if (changes.length > 0) {
      const added = changes.filter((c) => c.type === 'added').length
      const updated = changes.filter((c) => c.type === 'updated').length
      const removed = changes.filter((c) => c.type === 'removed').length
      const summary = [added && `${added} added`, updated && `${updated} updated`, removed && `${removed} removed`].filter(Boolean).join(' · ')
      partsOut.push({ id: `${id}-cs`, kind: 'changeset', status: allApplied ? 'accepted' : 'pending', summary, changes })
    }
    partsOut.push(...out)

    return { id, role: 'assistant', parts: partsOut }
  })
}

export function estimateContext(messages: UIMessage[]): { pct: number; label: string } {
  let chars = 0
  for (const m of messages) {
    for (const p of (m.parts || []) as Array<Record<string, unknown>>) {
      if (p.type === 'text' || p.type === 'reasoning') chars += String(p.text || '').length
    }
  }
  const tokens = chars / 4
  const pct = Math.min(96, Math.round((tokens / 200000) * 100) + 4)
  return { pct, label: `${(tokens / 1000).toFixed(1)}k / 200k` }
}
