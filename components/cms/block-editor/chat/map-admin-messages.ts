'use client'

/**
 * Maps an admin/dashboard `/api/*chat` stream onto the shared chat panel
 * view-model, so the assistant renders with the same v2 design as the page
 * builder.
 *
 * Mapping:
 *   reasoning            -> thinking
 *   text                 -> text
 *   approval-requested   -> approval part (governance needsApproval)
 *   mutating entity tool -> changeset (Applied, non-undoable)
 *   navigation/spotlight -> skipped (handled elsewhere when present)
 *   read/search tools    -> skipped (the agent narrates results as text)
 */

import { isToolUIPart, type UIMessage } from 'ai'
import type { ChatMessageVM, ChatPart, ChangeRow, ChangeType } from './types'

// Tools whose results represent a persistent mutation worth a change card.
// Covers both the CMS admin tools and the merchant dashboard tools.
const MUTATING_TOOLS = new Set([
  'createPage', 'updatePage', 'deletePage', 'duplicatePage', 'publishPage',
  'createProduct', 'updateProduct', 'deleteProduct', 'manageProductVariant', 'syncProductToStripe',
  'createBlogPost', 'updateBlogPost', 'deleteBlogPost', 'publishBlogPost', 'manageBlogCategory', 'manageBlogTag',
  'updateOrderStatus', 'fulfillOrder', 'refundOrder', 'cancelOrder',
  'updateSettings', 'updateBrandingSettings', 'updateSiteSettings',
  'createSite', 'updateSite', 'deleteSite', 'connectDomain',
])

const toolName = (t: string) => t.replace(/^tool-/, '')

function changeTypeFor(name: string): ChangeType {
  if (/^(create|add|duplicate|connect)/.test(name)) return 'added'
  if (/^(delete|remove|cancel|refund)/.test(name)) return 'removed'
  return 'updated'
}

function humanize(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
}

export interface AdminMapOpts {
  openThinking: Set<string>
}

export function mapAdminMessages(messages: UIMessage[], opts: AdminMapOpts): ChatMessageVM[] {
  return messages.map((msg) => {
    const id = msg.id
    const parts = (msg.parts || []) as Array<Record<string, unknown>>

    if (msg.role === 'user') {
      const text = parts.filter((p) => p.type === 'text').map((p) => String(p.text || '')).join('')
      return { id, role: 'user', text }
    }
    if (msg.role !== 'assistant') return { id, role: 'system', text: '' }

    const tail: ChatPart[] = []
    const changes: ChangeRow[] = []
    const approvals: ChatPart[] = []
    let thinkAccum = ''

    parts.forEach((p, i) => {
      const type = String(p.type || '')
      if (type === 'reasoning') { thinkAccum += String(p.text || ''); return }
      if (type === 'text') {
        const t = String(p.text || '').trim()
        if (t) tail.push({ id: `${id}-t${i}`, kind: 'text', text: t })
        return
      }
      if (isToolUIPart(p as never)) {
        const rec = p as Record<string, unknown>
        const name = toolName(type)
        const state = String(rec.state || '')
        if (state === 'approval-requested') {
          approvals.push({
            id: `${id}-ap-${rec.toolCallId}`,
            kind: 'approval',
            toolCallId: String(rec.toolCallId || ''),
            toolName: name,
            input: (rec.input as Record<string, unknown>) || {},
          })
          return
        }
        if (state === 'output-available' && MUTATING_TOOLS.has(name)) {
          const out = (rec.output as Record<string, unknown>) || {}
          if (out.success === false) return
          const label = typeof out.message === 'string' ? out.message : humanize(name)
          changes.push({ id: `${id}-c${changes.length}`, type: changeTypeFor(name), tag: name, label, detail: '' })
        }
      }
    })

    const partsOut: ChatPart[] = []
    if (thinkAccum.trim()) partsOut.push({ id: `${id}-think`, kind: 'thinking', text: thinkAccum, open: opts.openThinking.has(`${id}-think`) })
    partsOut.push(...approvals)
    if (changes.length > 0) {
      const added = changes.filter((c) => c.type === 'added').length
      const updated = changes.filter((c) => c.type === 'updated').length
      const removed = changes.filter((c) => c.type === 'removed').length
      const summary = [added && `${added} added`, updated && `${updated} updated`, removed && `${removed} removed`].filter(Boolean).join(' · ')
      partsOut.push({ id: `${id}-cs`, kind: 'changeset', status: 'accepted', summary, changes, undoable: false })
    }
    partsOut.push(...tail)

    return { id, role: 'assistant', parts: partsOut }
  })
}
