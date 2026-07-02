'use client'

/**
 * Grainy-native renderers for each assistant message part. One component per
 * `ChatPart.kind`. Every widget uses the Grainy AI-assistant CSS classes
 * (.think / .toolcall / .qwidget / .chip / .gr-card …) defined in app/grainy.css,
 * scoped under the `.atlas` admin-shell root. Only structural / one-off styles
 * are inlined with CSS custom properties (var(--…)).
 */

import type { CSSProperties } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Brain, ChevronRight, Wrench, ShieldAlert, Check, ArrowRight, Compass,
  Plus, Minus, PencilLine, ListChecks, GitBranch, Braces,
} from 'lucide-react'
import type { ChatPart, ChatPanelModel, ChangeRow } from './types'

interface PartProps {
  model: ChatPanelModel
  messageId: string
  part: ChatPart
}

const mono: CSSProperties = { fontFamily: 'var(--font-mono)' }

/* ---------------- thinking ---------------- */
function ThinkingPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'thinking' }> }) {
  return (
    <details className="think" open={part.open}>
      <summary
        onClick={(e) => { e.preventDefault(); model.onToggleThinking(messageId, part.id) }}
      >
        <span className="block-label"><Brain /> Thought process</span>
        <ChevronRight className="th-chev" style={{ marginLeft: 'auto' }} />
      </summary>
      {part.text && <div className="think-body">{part.text}</div>}
    </details>
  )
}

/* ---------------- generic tool call ---------------- */
function ToolcallPart({ part }: { part: Extract<ChatPart, { kind: 'toolcall' }> }) {
  const hasResult = !!part.result
  const Row = (
    <>
      <span className="tc-ico"><Wrench /></span>
      <span className="tc-main">
        <span className="tc-name">{part.name}</span>
        {part.args && <span className="tc-args">{part.args}</span>}
      </span>
      <span className={`tc-status ${part.status}`}>
        <span className="sdot" />
        {part.status === 'running' ? 'Running' : 'Done'}
      </span>
    </>
  )
  if (!hasResult) {
    return <div className="toolcall"><div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px' }}>{Row}</div></div>
  }
  return (
    <details className="toolcall">
      <summary>{Row}</summary>
      <div className="tc-result">{part.result}</div>
    </details>
  )
}

/* ---------------- changeset (applied mutations) ---------------- */
function changeGlyph(type: ChangeRow['type']) {
  if (type === 'added') return <Plus />
  if (type === 'removed') return <Minus />
  return <PencilLine />
}
function ChangeRowView({ ch }: { ch: ChangeRow }) {
  const badge = ch.type === 'added' ? 'badge-sage' : ch.type === 'removed' ? 'badge-rust' : 'badge-clay'
  const Row = (
    <>
      <span className="tc-ico">{changeGlyph(ch.type)}</span>
      <span className="tc-main">
        <span className="tc-name">{ch.tag}</span>
        <span className="tc-args">{ch.label}</span>
      </span>
      <span className={`badge ${badge}`} style={{ marginLeft: 'auto' }}>{ch.type}</span>
    </>
  )
  if (!ch.detail) {
    return <div className="toolcall"><div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px' }}>{Row}</div></div>
  }
  return (
    <details className="toolcall">
      <summary>{Row}</summary>
      <div className="tc-result">{ch.detail}</div>
    </details>
  )
}
function ChangesetPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'changeset' }> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span className="block-label"><ListChecks /> Changes{part.summary ? ` · ${part.summary}` : ''}</span>
      {part.changes.map((c) => <ChangeRowView key={c.id} ch={c} />)}
      {part.status === 'pending' && (
        <div className="q-options" style={{ marginTop: 3 }}>
          <button className="q-opt selected" onClick={() => model.onAcceptChangeset(messageId, part.id)}><Check /> Accept</button>
          <button className="q-opt" onClick={() => model.onRejectChangeset(messageId, part.id)}>Reject</button>
        </div>
      )}
      {part.status === 'accepted' && part.undoable !== false && (
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => model.onUndoChangeset(messageId, part.id)}>Undo</button>
      )}
    </div>
  )
}

/* ---------------- approval (governance) ---------------- */
function ApprovalPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'approval' }> }) {
  const intent = part.toolName.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
  const entries = Object.entries(part.input || {}).filter(([, v]) => v != null && v !== '').slice(0, 4)
  const helpText = entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 60) : String(v).slice(0, 80)}`).join(' · ')
  const id = part.approvalId ?? part.toolCallId
  return (
    <div className="qwidget">
      <span className="block-label"><ShieldAlert /> Approval required</span>
      <div className="q-text">{intent}</div>
      {helpText && <div className="q-help" style={mono}>{helpText}</div>}
      {!part.resolved ? (
        <div className="q-options">
          <button className="q-opt selected" onClick={() => model.onApproveTool(messageId, id)}><Check /> Approve</button>
          <button className="q-opt" onClick={() => model.onDenyTool(messageId, id)}>Deny</button>
        </div>
      ) : (
        <span className={`badge ${part.resolved === 'approved' ? 'badge-sage' : 'badge-rust'}`}>
          {part.resolved === 'approved' ? 'Approved' : 'Denied'}
        </span>
      )}
    </div>
  )
}

/* ---------------- nav (navigation chip) ---------------- */
function NavPart({ model, part }: { model: ChatPanelModel; part: Extract<ChatPart, { kind: 'nav' }> }) {
  return (
    <button
      className="chip"
      style={{ cursor: 'pointer', alignSelf: 'flex-start' }}
      title={`Go to ${part.path}`}
      onClick={() => model.onNavigate?.(part.path)}
    >
      <ArrowRight style={{ width: 13, height: 13 }} />
      <span>{part.label || 'Go to'}</span>
      <span style={{ ...mono, color: 'var(--text-muted)' }}>{part.path}</span>
    </button>
  )
}

/* ---------------- tour (spotlight walkthrough chip) ---------------- */
function TourPart({ model, part }: { model: ChatPanelModel; part: Extract<ChatPart, { kind: 'tour' }> }) {
  const clickable = !!part.slug && !!model.onStartTour
  return (
    <button
      className="chip"
      style={{ cursor: clickable ? 'pointer' : 'default', alignSelf: 'flex-start' }}
      onClick={() => { if (clickable) model.onStartTour!(part.slug!) }}
    >
      <Compass style={{ width: 13, height: 13 }} />
      <span>{part.title}</span>
      {part.steps > 0 && <span style={{ ...mono, color: 'var(--text-muted)' }}>{part.steps} step{part.steps === 1 ? '' : 's'}</span>}
    </button>
  )
}

/* ---------------- entities (search-result list card) ---------------- */
function EntitiesPart({ model, part }: { model: ChatPanelModel; part: Extract<ChatPart, { kind: 'entities' }> }) {
  const shown = part.items.slice(0, 8)
  const go = (href?: string) => { if (href) model.onNavigate?.(href) }
  return (
    <div className="gr-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--line-faint)' }}>
        <span className="block-label">{part.title}</span>
        <span className="gr-num" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-muted)' }}>{part.count} result{part.count === 1 ? '' : 's'}</span>
      </div>
      {shown.map((row) => (
        <div
          key={row.id}
          onClick={() => go(row.href)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderBottom: '1px solid var(--line-faint)', cursor: row.href ? 'pointer' : 'default' }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
            {row.subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.subtitle}</div>}
          </div>
          {row.badge && <span className="badge badge-clay">{row.badge}</span>}
          {row.meta && <span className="gr-num" style={{ fontSize: 12, color: 'var(--text)' }}>{row.meta}</span>}
        </div>
      ))}
      {part.count > shown.length && (
        <div style={{ padding: '7px 12px', fontSize: 10.5, color: 'var(--text-muted)', ...mono }}>+{part.count - shown.length} more</div>
      )}
      {part.count === 0 && <div style={{ padding: '10px 12px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No results</div>}
    </div>
  )
}

/* ---------------- stats (metric grid card) ---------------- */
function StatsPart({ part }: { part: Extract<ChatPart, { kind: 'stats' }> }) {
  return (
    <div className="gr-card" style={{ padding: 12 }}>
      <span className="block-label" style={{ marginBottom: 9, display: 'inline-flex' }}>{part.title}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 9 }}>
        {part.stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--line-faint)', borderRadius: 'var(--r-sm)', padding: '9px 11px' }}>
            <div className="gr-eyebrow">{s.label}</div>
            <div className="gr-num" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- code / diff (future-proof, Grainy-styled) ---------------- */
function CodePart({ part }: { part: Extract<ChatPart, { kind: 'code' }> }) {
  return (
    <div>
      <span className="block-label" style={{ marginBottom: 5, display: 'inline-flex' }}><Braces /> {part.label}</span>
      <pre style={{ margin: 0, background: 'var(--surface-sunken)', border: '1px solid var(--line-faint)', borderRadius: 'var(--r-md)', padding: '11px 13px', overflowX: 'auto' }}>
        <code style={{ ...mono, fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre' }}>{part.code}</code>
      </pre>
    </div>
  )
}
function DiffPart({ part }: { part: Extract<ChatPart, { kind: 'diff' }> }) {
  return (
    <div>
      <span className="block-label" style={{ marginBottom: 5, display: 'inline-flex' }}><GitBranch /> {part.label}</span>
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--r-md)', padding: '8px 0', ...mono, fontSize: 11.5, lineHeight: 1.65 }}>
        {part.rows.map((r, i) => {
          const bg = r.type === 'add' ? 'color-mix(in srgb, var(--sage-500) 16%, transparent)'
            : r.type === 'remove' ? 'color-mix(in srgb, var(--rust-500) 16%, transparent)' : 'transparent'
          const color = r.type === 'context' ? 'var(--text-muted)' : 'var(--text-secondary)'
          return <div key={i} style={{ padding: '0 12px', background: bg, color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.text}</div>
        })}
      </div>
    </div>
  )
}

/* ---------------- text (markdown, Grainy-styled) ---------------- */
const linkStyle: CSSProperties = { color: 'var(--link)', textDecoration: 'underline', textUnderlineOffset: 2 }
const inlineCode: CSSProperties = { ...mono, fontSize: 12, background: 'var(--surface-sunken)', border: '1px solid var(--line-faint)', borderRadius: 4, padding: '1px 5px' }
const mdComponents: Components = {
  a: ({ href, children }) => <a href={href} style={linkStyle} target="_blank" rel="noreferrer">{children}</a>,
  ul: ({ children }) => <ul style={{ margin: '0 0 8px', paddingLeft: 18, listStyle: 'disc' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 8px', paddingLeft: 18, listStyle: 'decimal' }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
  code: ({ className, children }) => className
    ? <code style={{ ...mono, fontSize: 12 }}>{children}</code>
    : <code style={inlineCode}>{children}</code>,
  pre: ({ children }) => <pre style={{ margin: '0 0 8px', ...mono, fontSize: 12, background: 'var(--surface-sunken)', border: '1px solid var(--line-faint)', borderRadius: 'var(--r-md)', padding: '9px 11px', overflowX: 'auto' }}>{children}</pre>,
  h1: ({ children }) => <div style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{children}</div>,
  h2: ({ children }) => <div style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{children}</div>,
  h3: ({ children }) => <div style={{ margin: '0 0 8px', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{children}</div>,
  h4: ({ children }) => <div style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{children}</div>,
  blockquote: ({ children }) => <blockquote style={{ margin: '0 0 8px', borderLeft: '2px solid var(--line)', paddingLeft: 10, color: 'var(--text-secondary)' }}>{children}</blockquote>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--line-faint)', margin: '8px 0' }} />,
  table: ({ children }) => <div style={{ overflowX: 'auto', margin: '0 0 8px' }}><table style={{ borderCollapse: 'collapse', fontSize: 12.5, width: '100%' }}>{children}</table></div>,
  th: ({ children }) => <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--line)', color: 'var(--text-secondary)', fontWeight: 600 }}>{children}</th>,
  td: ({ children }) => <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--line-faint)' }}>{children}</td>,
}
function TextPart({ part }: { part: Extract<ChatPart, { kind: 'text' }> }) {
  return (
    <div className="msg-answer">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{part.text}</ReactMarkdown>
    </div>
  )
}

export function MessagePart({ model, messageId, part }: PartProps) {
  switch (part.kind) {
    case 'thinking': return <ThinkingPart model={model} messageId={messageId} part={part} />
    case 'changeset': return <ChangesetPart model={model} messageId={messageId} part={part} />
    case 'approval': return <ApprovalPart model={model} messageId={messageId} part={part} />
    case 'nav': return <NavPart model={model} part={part} />
    case 'tour': return <TourPart model={model} part={part} />
    case 'entities': return <EntitiesPart model={model} part={part} />
    case 'stats': return <StatsPart part={part} />
    case 'toolcall': return <ToolcallPart part={part} />
    case 'code': return <CodePart part={part} />
    case 'diff': return <DiffPart part={part} />
    case 'text': return <TextPart part={part} />
    // plan / tokens / registry are page-builder-only; not emitted on the admin
    // surface. Rendered as null here (kept in the union for future reuse).
    default: return null
  }
}
