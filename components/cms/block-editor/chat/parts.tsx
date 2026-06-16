'use client'

/**
 * Renderers for each assistant message part. One component per `ChatPart.kind`,
 * each a faithful translation of the design's widget. Borderless / minimal,
 * agent-plan styling — see the design handoff "AI Chat Panel".
 */

import type { CSSProperties } from 'react'
import { C, MONO } from './tokens'
import { StatusCircle } from './icons'
import type {
  ChatPart,
  ChatPanelModel,
  PlanTask,
  PlanSubtask,
  ChangeRow,
  TokenItem,
} from './types'

const ACCENT = 'var(--cbx-accent)'

interface PartProps {
  model: ChatPanelModel
  messageId: string
  part: ChatPart
}

const sectionHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  padding: '0 2px 6px',
}
const sectionTitle: CSSProperties = {
  fontSize: 11,
  color: C.textMuted,
  fontWeight: 600,
  letterSpacing: '0.04em',
}
const sectionMeta: CSSProperties = {
  fontSize: 10.5,
  color: C.textFaint,
  fontFamily: MONO,
}

const Chevron = ({ open, size = 12 }: { open: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    {open ? <path d="m6 9 6 6 6-6" /> : <path d="m9 18 6-6-6-6" />}
  </svg>
)

/* ---------------- thinking ---------------- */
function ThinkingPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'thinking' }> }) {
  return (
    <div>
      <button
        onClick={() => model.onToggleThinking(messageId, part.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: C.textMuted, font: 'inherit', padding: 0 }}
      >
        <span style={{ color: C.textMuted, display: 'flex' }}><Chevron open={part.open} /></span>
        <span style={{ fontSize: 11.5, fontWeight: 500 }}>Thought process</span>
      </button>
      {part.open && part.text && (
        <div style={{ margin: '6px 0 0 5px', paddingLeft: 14, borderLeft: `1px dashed ${C.dashed}`, fontSize: 11.5, lineHeight: 1.65, color: C.textMuted }}>
          {part.text}
        </div>
      )}
    </div>
  )
}

/* ---------------- plan (agent-plan tree) ---------------- */
function taskTitleStyle(status: PlanTask['status']): CSSProperties {
  if (status === 'completed') return { fontSize: 12.5, color: C.textMuted, textDecoration: 'line-through', flex: 1 }
  if (status === 'in-progress') return { fontSize: 12.5, color: 'oklch(0.93 0 0)', fontWeight: 500, flex: 1 }
  return { fontSize: 12.5, color: 'oklch(0.78 0.01 260)', flex: 1 }
}
function subTitleStyle(status: PlanSubtask['status']): CSSProperties {
  if (status === 'completed') return { fontSize: 12, color: C.textFaint, textDecoration: 'line-through', flex: 1 }
  return { fontSize: 12, color: 'oklch(0.74 0.01 260)', flex: 1 }
}
function statusPill(status: PlanTask['status']): CSSProperties {
  const map: Record<string, string> = {
    completed: 'oklch(0.7 0.15 155)', 'in-progress': 'oklch(0.66 0.18 250)',
    'need-help': 'oklch(0.8 0.13 80)', failed: 'oklch(0.65 0.2 25)',
  }
  const c = map[status] || C.textMuted
  return { fontSize: 9, padding: '1px 7px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.03em', color: c, background: `color-mix(in oklch, ${c} 16%, transparent)` }
}

function SubtaskRow({ model, messageId, partId, taskId, sub }: { model: ChatPanelModel; messageId: string; partId: string; taskId: string; sub: PlanSubtask }) {
  const hasDetail = !!sub.desc || (sub.tools && sub.tools.length > 0)
  return (
    <div>
      <div
        onClick={() => model.onToggleSubtask(messageId, partId, taskId, sub.id)}
        className="cbx-row"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 7px 4px 31px', borderRadius: 7, cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 14, height: 14 }}>
          <StatusCircle status={sub.status} size={14} />
        </span>
        <span style={subTitleStyle(sub.status)}>{sub.title}</span>
        {hasDetail && <span style={{ color: C.textGhost, display: 'flex', flexShrink: 0 }}><Chevron open={sub.expanded} size={11} /></span>}
      </div>
      {sub.expanded && hasDetail && (
        <div style={{ margin: '1px 0 3px 38px', paddingLeft: 11, borderLeft: `1px dashed ${C.dashed}` }}>
          {sub.desc && <p style={{ margin: '2px 0', fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{sub.desc}</p>}
          {sub.tools && sub.tools.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 3 }}>
              <span style={{ fontSize: 9.5, color: C.textFaint }}>uses</span>
              {sub.tools.map((t) => (
                <span key={t} style={{ fontFamily: MONO, fontSize: 9.5, padding: '1px 6px', borderRadius: 5, color: 'oklch(0.72 0.05 250)', background: `color-mix(in oklch, ${ACCENT} 13%, transparent)` }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ model, messageId, partId, task }: { model: ChatPanelModel; messageId: string; partId: string; task: PlanTask }) {
  const showPill = task.status === 'in-progress' || task.status === 'need-help' || task.status === 'failed'
  const hasSubs = task.subtasks.length > 0
  return (
    <div>
      <div
        onClick={() => model.onToggleTask(messageId, partId, task.id)}
        className="cbx-row"
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 7px', borderRadius: 8, cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 17, height: 17 }}>
          <StatusCircle status={task.status} size={17} />
        </span>
        <span style={taskTitleStyle(task.status)}>{task.title}</span>
        {showPill && <span style={statusPill(task.status)}>{task.status}</span>}
        {hasSubs && <span style={{ color: C.textFaint, display: 'flex', flexShrink: 0 }}><Chevron open={task.expanded} size={13} /></span>}
      </div>
      {task.expanded && hasSubs && (
        <div style={{ position: 'relative', margin: '1px 0 3px' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 8, left: 15, borderLeft: `1px dashed ${C.dashed}` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {task.subtasks.map((s) => (
              <SubtaskRow key={s.id} model={model} messageId={messageId} partId={partId} taskId={task.id} sub={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlanPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'plan' }> }) {
  const done = part.tasks.filter((t) => t.status === 'completed').length
  return (
    <div>
      <div style={{ ...sectionHeader, paddingBottom: 7 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth={2}><path d="M11 12H3" /><path d="M16 6H3" /><path d="M16 18H3" /><path d="m17 12 3 3 4-5" /></svg>
        <span style={{ ...sectionTitle, flex: 1 }}>{part.title}</span>
        <span style={sectionMeta}>{done}/{part.tasks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {part.tasks.map((t) => <TaskRow key={t.id} model={model} messageId={messageId} partId={part.id} task={t} />)}
      </div>
    </div>
  )
}

/* ---------------- changeset ---------------- */
function ChangeRowView({ ch }: { ch: ChangeRow }) {
  const col = ch.type === 'added' ? C.green : ch.type === 'removed' ? C.red : 'oklch(0.66 0.16 250)'
  const glyph = ch.type === 'added' ? '+' : ch.type === 'removed' ? '−' : '~'
  return (
    <div className="cbx-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '5px 7px', borderRadius: 8 }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 16, height: 16, marginTop: 1, borderRadius: '50%', fontFamily: MONO, fontSize: 11, fontWeight: 700, border: `1.5px solid ${col}`, color: col }}>{glyph}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'oklch(0.6 0.05 250)' }}>{ch.tag}</span>
          <span style={{ fontSize: 12, color: C.textBody }}>{ch.label}</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.textFaint, marginTop: 1 }}>{ch.detail}</div>
      </div>
    </div>
  )
}

function ChangesetPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'changeset' }> }) {
  return (
    <div>
      <div style={sectionHeader}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth={2}><path d="M12 3v14" /><path d="M5 10h14" /><circle cx="12" cy="21" r="1" /></svg>
        <span style={{ ...sectionTitle, flex: 1 }}>Changes</span>
        <span style={sectionMeta}>{part.summary}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {part.changes.map((c) => <ChangeRowView key={c.id} ch={c} />)}
      </div>
      <div style={{ marginTop: 8, paddingTop: 9, borderTop: `1px solid ${C.borderSoft}` }}>
        {part.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => model.onAcceptChangeset(messageId, part.id)} className="cbx-accept" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, padding: '0 14px', borderRadius: 8, background: C.greenFill, border: 'none', color: 'oklch(0.99 0 0)', fontSize: 12, fontWeight: 600, cursor: 'pointer', font: 'inherit' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6 9 17l-5-5" /></svg>
              Accept
            </button>
            <button onClick={() => model.onRejectChangeset(messageId, part.id)} className="cbx-reject" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, padding: '0 13px', borderRadius: 8, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, fontWeight: 500, cursor: 'pointer', font: 'inherit' }}>Reject</button>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: C.textGhost, fontFamily: MONO }}>⌘⏎ accept</span>
          </div>
        )}
        {part.status === 'accepted' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, fontSize: 11.5, fontWeight: 600, color: C.greenStrong }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg>
              {part.undoable === false ? 'Applied' : 'Applied to canvas'}
            </span>
            {part.undoable !== false && (
              <button onClick={() => model.onUndoChangeset(messageId, part.id)} className="cbx-ghost" style={{ background: 'transparent', border: 'none', color: C.textMuted, fontSize: 11, cursor: 'pointer', font: 'inherit', padding: '3px 6px', borderRadius: 6 }}>Undo</button>
            )}
          </div>
        )}
        {part.status === 'rejected' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, fontSize: 11.5, fontWeight: 500, color: C.textMuted }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              Discarded
            </span>
            <button onClick={() => model.onAcceptChangeset(messageId, part.id)} className="cbx-ghost" style={{ background: 'transparent', border: 'none', color: C.textMuted, fontSize: 11, cursor: 'pointer', font: 'inherit', padding: '3px 6px', borderRadius: 6 }}>Re-apply</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- diff ---------------- */
function DiffPart({ part }: { part: Extract<ChatPart, { kind: 'diff' }> }) {
  return (
    <div>
      <div style={sectionHeader}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth={2}><circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" /><path d="M12 12v3" /></svg>
        <span style={{ ...sectionMeta, fontFamily: MONO }}>{part.label}</span>
      </div>
      <div style={{ background: C.codeBg, borderRadius: 9, padding: '8px 0', fontFamily: MONO, fontSize: 11, lineHeight: 1.7 }}>
        {part.rows.map((r, i) => {
          const style: CSSProperties = { padding: '0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
          if (r.type === 'add') Object.assign(style, { background: 'oklch(0.4 0.1 155 / 0.14)', color: 'oklch(0.76 0.13 155)' })
          else if (r.type === 'remove') Object.assign(style, { background: 'oklch(0.45 0.14 25 / 0.14)', color: 'oklch(0.72 0.18 25)' })
          else Object.assign(style, { color: 'oklch(0.46 0.01 260)' })
          return <div key={i} style={style}>{r.text}</div>
        })}
      </div>
    </div>
  )
}

/* ---------------- code ---------------- */
function CodePart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'code' }> }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px 5px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="oklch(0.58 0.04 250)" strokeWidth={2}><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>
        <span style={{ fontSize: 11, color: 'oklch(0.7 0.01 260)', fontFamily: MONO, flex: 1 }}>{part.label}</span>
        <button onClick={() => model.onCopyCode(messageId, part.id)} className="cbx-ghost" style={{ background: 'transparent', border: 'none', color: C.textMuted, fontSize: 10.5, cursor: 'pointer', font: 'inherit', padding: '2px 6px', borderRadius: 6 }}>{part.copied ? 'Copied' : 'Copy'}</button>
        <button onClick={() => model.onApplyCode(messageId, part.id)} className="cbx-apply" style={{ background: 'transparent', border: 'none', color: 'oklch(0.7 0.06 250)', fontSize: 10.5, fontWeight: 500, cursor: 'pointer', font: 'inherit', padding: '2px 6px', borderRadius: 6 }}>{part.applied ? 'Applied' : 'Apply'}</button>
      </div>
      <pre style={{ margin: 0, background: C.codeBg, borderRadius: 9, padding: '11px 13px', overflowX: 'auto' }}>
        <code style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: 'oklch(0.8 0.02 250)', whiteSpace: 'pre' }}>{part.code}</code>
      </pre>
    </div>
  )
}

/* ---------------- tokens ---------------- */
function TokensPart({ part }: { part: Extract<ChatPart, { kind: 'tokens' }> }) {
  return (
    <div>
      <div style={{ ...sectionHeader, paddingBottom: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="oklch(0.58 0.04 250)" strokeWidth={2}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" /></svg>
        <span style={sectionTitle}>{part.label}</span>
      </div>
      {part.tokenType === 'color' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '0 4px' }}>
          {part.items.map((it: TokenItem) => (
            <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: it.value, border: '1px solid oklch(1 0 0 / 0.14)', flexShrink: 0, boxShadow: '0 1px 2px oklch(0 0 0 / 0.3)' }} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'oklch(0.82 0 0)', flex: 1 }}>{it.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textFaint }}>{it.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '0 4px' }}>
          {part.items.map((it: TokenItem) => (
            <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'oklch(0.82 0 0)', width: 60, flexShrink: 0 }}>{it.name}</span>
              <span style={{ height: 7, borderRadius: 4, background: ACCENT, width: Math.min(it.px || 40, 120) }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textFaint }}>{it.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- registry ---------------- */
function RegistryPart({ part }: { part: Extract<ChatPart, { kind: 'registry' }> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in oklch, ${ACCENT} 14%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="oklch(0.72 0.1 250)" strokeWidth={2}>
          {part.regType === 'component' && <><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z" /><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z" /><path d="M8.916 17.912a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z" /><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z" /></>}
          {part.regType === 'styleset' && <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />}
          {part.regType === 'expression' && <><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></>}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(0.9 0 0)' }}>{part.name}</div>
        <div style={{ fontSize: 10.5, color: 'oklch(0.56 0.04 250)', fontFamily: MONO, marginTop: 1 }}>{part.meta}</div>
      </div>
      <span style={{ fontSize: 9.5, color: 'oklch(0.5 0.04 250)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Registry</span>
    </div>
  )
}

/* ---------------- approval (governance) ---------------- */
function ApprovalPart({ model, messageId, part }: PartProps & { part: Extract<ChatPart, { kind: 'approval' }> }) {
  const amber = 'oklch(0.82 0.1 80)'
  const entries = Object.entries(part.input || {}).filter(([, v]) => v != null && v !== '')
  return (
    <div style={{ borderRadius: 11, background: 'oklch(0.24 0.05 80 / 0.13)', border: `1px solid oklch(0.5 0.09 80 / 0.4)`, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth={2}><path d="M12 9v4" /><path d="M10.363 3.591 2.802 17.66A1.5 1.5 0 0 0 4.137 20h15.726a1.5 1.5 0 0 0 1.335-2.34L13.637 3.59a1.5 1.5 0 0 0-2.674 0z" /><path d="M12 17h.01" /></svg>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: amber }}>Approval required</span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: amber, opacity: 0.85 }}>{part.toolName}</span>
      </div>
      {entries.length > 0 && !part.resolved && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {entries.slice(0, 6).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, fontSize: 11 }}>
              <span style={{ fontFamily: MONO, color: C.textMuted, textTransform: 'capitalize', flexShrink: 0 }}>{k}:</span>
              <span style={{ color: C.textBody, wordBreak: 'break-word', minWidth: 0 }}>{typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : String(v).slice(0, 120)}</span>
            </div>
          ))}
        </div>
      )}
      {!part.resolved ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <button onClick={() => model.onApproveTool(messageId, part.toolCallId)} className="cbx-accept" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, padding: '0 14px', borderRadius: 8, background: C.greenFill, border: 'none', color: 'oklch(0.99 0 0)', fontSize: 12, fontWeight: 600, cursor: 'pointer', font: 'inherit' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6 9 17l-5-5" /></svg>
            Approve
          </button>
          <button onClick={() => model.onDenyTool(messageId, part.toolCallId)} className="cbx-reject" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, padding: '0 13px', borderRadius: 8, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, fontWeight: 500, cursor: 'pointer', font: 'inherit' }}>Deny</button>
        </div>
      ) : (
        <div style={{ marginTop: 9, fontSize: 11.5, fontWeight: 500, color: part.resolved === 'approved' ? C.greenStrong : C.textMuted }}>
          {part.resolved === 'approved' ? 'Approved — running…' : 'Denied'}
        </div>
      )}
    </div>
  )
}

/* ---------------- text ---------------- */
function TextPart({ part }: { part: Extract<ChatPart, { kind: 'text' }> }) {
  return <div style={{ fontSize: 12.5, lineHeight: 1.6, color: C.textBody, padding: '1px 2px', whiteSpace: 'pre-wrap' }}>{part.text}</div>
}

export function MessagePart({ model, messageId, part }: PartProps) {
  switch (part.kind) {
    case 'thinking': return <ThinkingPart model={model} messageId={messageId} part={part} />
    case 'plan': return <PlanPart model={model} messageId={messageId} part={part} />
    case 'changeset': return <ChangesetPart model={model} messageId={messageId} part={part} />
    case 'diff': return <DiffPart part={part} />
    case 'code': return <CodePart model={model} messageId={messageId} part={part} />
    case 'tokens': return <TokensPart part={part} />
    case 'registry': return <RegistryPart part={part} />
    case 'approval': return <ApprovalPart model={model} messageId={messageId} part={part} />
    case 'text': return <TextPart part={part} />
    default: return null
  }
}
