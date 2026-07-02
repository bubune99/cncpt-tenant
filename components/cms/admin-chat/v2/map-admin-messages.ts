'use client'

/**
 * Maps the cncpt admin CMS `/api/cms/chat` stream onto the Grainy chat panel
 * view-model. Adapted from the dzidzor spine for cncpt's tool landscape.
 *
 * Mapping (see the table in the PR description):
 *   reasoning                              -> thinking
 *   text                                   -> text
 *   approval-requested / -responded        -> approval (governance needsApproval)
 *   navigate_to_route / navigateTo         -> nav chip
 *   spotlight_steps                        -> tour chip
 *   suggestWalkthroughs (suggestions[])    -> one tour chip per suggestion
 *   searchEntities / getEntityDetails      -> entities card
 *   getEntityStats / getDashboardStats     -> stats grid
 *   mutating tools (create / update / …)   -> changeset (Applied, non-undoable)
 *   any other tool with output             -> generic toolcall row
 *
 * Tool outputs are unknown-shaped JSON: every widget mapping is feature-detected
 * and wrapped so a malformed payload can never throw — it falls back to a
 * generic toolcall row (or is dropped) instead of blanking the whole panel.
 */

import { isToolUIPart, type UIMessage } from 'ai'
import type { ChatMessageVM, ChatPart, ChangeRow, ChangeType, EntityRow, StatRow } from './types'

// Tools whose results represent a persistent mutation worth a change card.
// Covers the CMS admin tools and the merchant dashboard tools.
const MUTATING_TOOLS = new Set([
  'createPage', 'updatePage', 'deletePage', 'duplicatePage', 'publishPage',
  'createProduct', 'updateProduct', 'deleteProduct', 'manageProductVariant', 'syncProductToStripe',
  'createBlogPost', 'updateBlogPost', 'deleteBlogPost', 'publishBlogPost', 'manageBlogCategory', 'manageBlogTag',
  'updateOrderStatus', 'fulfillOrder', 'refundOrder', 'cancelOrder',
  'updateSettings', 'updateBrandingSettings', 'updateSiteSettings',
  'createSite', 'updateSite', 'deleteSite', 'connectDomain',
  'updateHelpContent', 'batchGenerateHelp', 'generateWalkthrough',
])

// Tools the interceptor executes client-side (navigation, spotlight); we only
// render a confirmation widget for them, never a changeset.
const CLIENT_TOOLS = new Set(['navigate_to_route', 'navigateTo', 'navigate', 'spotlight_steps'])

// Read/lookup tools that the agent narrates in prose — no card, no toolcall row.
const SILENT_TOOLS = new Set(['listHelpKeys', 'getHelpContent', 'scanPage'])

const toolName = (t: string) => t.replace(/^tool-/, '')

function changeTypeFor(name: string): ChangeType {
  if (/^(create|add|duplicate|connect|generate|batch)/.test(name)) return 'added'
  if (/^(delete|remove|cancel|refund)/.test(name)) return 'removed'
  return 'updated'
}

function humanize(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
}

const money = (cents: unknown) =>
  typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : ''

/** Short one-line summary of a tool's input for the generic toolcall row. */
function argSummary(input: Record<string, unknown>): string {
  const entries = Object.entries(input || {}).filter(([, v]) => v != null && v !== '')
  if (entries.length === 0) return ''
  return entries
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 40) : String(v).slice(0, 40)}`)
    .join(', ')
}

/**
 * Map a read/search/navigation tool result to a rich widget part.
 * Returns null when the output has no card-worthy shape (agent narrates it).
 */
function widgetFor(id: string, name: string, out: Record<string, unknown>): ChatPart | ChatPart[] | null {
  // Navigation + spotlight tools (client-executed). Two output shapes:
  //   1. sentinel { __requires_client_execution, name, arguments }
  //   2. legacy   { action: 'navigate', path }
  const sentinelArgs =
    out.__requires_client_execution === true && out.arguments && typeof out.arguments === 'object'
      ? (out.arguments as Record<string, unknown>)
      : null

  if (name === 'navigate_to_route' || name === 'navigateTo' || name === 'navigate') {
    const path = String(sentinelArgs?.path ?? out.path ?? '')
    return path ? { id, kind: 'nav', path } : null
  }
  if (name === 'spotlight_steps') {
    const steps = Array.isArray(sentinelArgs?.steps) ? (sentinelArgs!.steps as unknown[]).length : 0
    return { id, kind: 'tour', title: String(sentinelArgs?.title ?? 'Guided tour'), steps }
  }

  // Walkthrough suggestions → one tour chip per suggestion.
  if (name === 'suggestWalkthroughs' || out.action === 'suggest_walkthroughs') {
    const suggestions = Array.isArray(out.suggestions) ? (out.suggestions as Array<Record<string, unknown>>) : []
    const tours: ChatPart[] = suggestions.map((s, i) => ({
      id: `${id}-tour${i}`,
      kind: 'tour',
      title: String(s.title ?? 'Walkthrough'),
      steps: Number(s.estimatedSteps ?? 0),
      slug: s.tourSlug ? String(s.tourSlug) : undefined,
    }))
    return tours.length > 0 ? tours : null
  }

  // Search / list results → entity list cards.
  if (Array.isArray(out.products)) {
    const items: EntityRow[] = (out.products as Array<Record<string, unknown>>).map((p) => ({
      id: String(p.id),
      title: String(p.title ?? p.name ?? p.id),
      subtitle: p.sku ? `SKU ${p.sku}` : undefined,
      meta: typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : money(p.priceCents),
      badge: p.status ? String(p.status) : undefined,
      href: p.adminUrl ? String(p.adminUrl) : undefined,
    }))
    return { id, kind: 'entities', title: 'Products', count: Number(out.count ?? items.length), items }
  }
  if (Array.isArray(out.orders)) {
    const items: EntityRow[] = (out.orders as Array<Record<string, unknown>>).map((o) => ({
      id: String(o.id),
      title: o.orderNumber ? `#${o.orderNumber}` : String(o.id),
      subtitle: o.email ? String(o.email) : undefined,
      meta: money(o.total) || money(o.totalCents),
      badge: o.status ? String(o.status) : undefined,
      href: o.adminUrl ? String(o.adminUrl) : undefined,
    }))
    return { id, kind: 'entities', title: 'Orders', count: Number(out.count ?? items.length), items }
  }
  const list =
    (Array.isArray(out.results) && out.results) ||
    (Array.isArray(out.entities) && out.entities) ||
    (Array.isArray(out.items) && out.items) ||
    null
  if (list && list.length > 0 && typeof list[0] === 'object') {
    const items: EntityRow[] = (list as Array<Record<string, unknown>>).map((r, i) => ({
      id: String(r.id ?? i),
      title: String(r.title ?? r.name ?? r.email ?? r.orderNumber ?? r.id ?? '—'),
      subtitle: r.email && r.name ? String(r.email) : r.slug ? String(r.slug) : undefined,
      badge: r.status ? String(r.status) : undefined,
      meta: typeof r.price === 'number' ? `$${r.price.toFixed(2)}` : money(r.total),
      href: r.adminUrl ? String(r.adminUrl) : undefined,
    }))
    return { id, kind: 'entities', title: String(out.entityType ? humanize(String(out.entityType)) : 'Results'), count: Number(out.count ?? items.length), items }
  }

  // Dashboard stats → metric grid.
  if (name === 'getDashboardStats' && typeof out.orders !== 'undefined') {
    const stats: StatRow[] = [
      { label: 'Orders', value: String(out.orders ?? 0) },
      { label: 'Revenue', value: money(out.revenue) || '$0.00' },
      { label: 'Active products', value: String(out.activeProducts ?? 0) },
      { label: 'Total users', value: String(out.totalUsers ?? 0) },
    ]
    return { id, kind: 'stats', title: `Stats · this ${String(out.period ?? 'month')}`, stats }
  }

  // Entity stats → build a grid from up to 6 scalar fields.
  if (name === 'getEntityStats') {
    const src = (out.stats && typeof out.stats === 'object' ? out.stats : out) as Record<string, unknown>
    const stats: StatRow[] = Object.entries(src)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
      .slice(0, 6)
      .map(([k, v]) => ({ label: humanize(k), value: String(v) }))
    if (stats.length > 0) return { id, kind: 'stats', title: String(out.entityType ? `${humanize(String(out.entityType))} stats` : 'Statistics'), stats }
  }

  return null
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
      try {
        const type = String(p.type || '')
        if (type === 'reasoning') { thinkAccum += String(p.text || ''); return }
        if (type === 'text') {
          const t = String(p.text || '').trim()
          if (t) tail.push({ id: `${id}-t${i}`, kind: 'text', text: t })
          return
        }
        if (!isToolUIPart(p as never)) return

        const rec = p as Record<string, unknown>
        const name = toolName(type)
        const state = String(rec.state || '')

        if (state === 'approval-requested' || state === 'approval-responded') {
          // addToolApprovalResponse matches on approval.id (NOT toolCallId) — see AI SDK v6.
          const approval = (rec.approval as { id?: string; approved?: boolean } | undefined) || {}
          approvals.push({
            id: `${id}-ap-${rec.toolCallId}`,
            kind: 'approval',
            toolCallId: String(rec.toolCallId || ''),
            approvalId: approval.id ? String(approval.id) : undefined,
            toolName: name,
            input: (rec.input as Record<string, unknown>) || {},
            resolved: state === 'approval-responded' ? (approval.approved ? 'approved' : 'denied') : undefined,
          })
          return
        }

        if (state !== 'output-available') return
        if (SILENT_TOOLS.has(name)) return

        const out = (rec.output as Record<string, unknown>) || {}

        if (MUTATING_TOOLS.has(name) && !CLIENT_TOOLS.has(name)) {
          if (out.success === false) return
          const label = typeof out.message === 'string' ? out.message : humanize(name)
          changes.push({ id: `${id}-c${changes.length}`, type: changeTypeFor(name), tag: name, label, detail: '' })
          return
        }

        // Read / search / navigation tools: rich widget when the output has a
        // card-worthy shape; otherwise a generic toolcall row.
        const widget = widgetFor(`${id}-w${i}`, name, out)
        if (Array.isArray(widget)) tail.push(...widget)
        else if (widget) tail.push(widget)
        else if (!CLIENT_TOOLS.has(name)) {
          tail.push({ id: `${id}-w${i}`, kind: 'toolcall', name, args: argSummary((rec.input as Record<string, unknown>) || {}), status: 'done' })
        }
      } catch {
        // Never let a single malformed part blank the whole message.
        tail.push({ id: `${id}-err${i}`, kind: 'toolcall', name: toolName(String(p.type || 'tool')), status: 'done' })
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
