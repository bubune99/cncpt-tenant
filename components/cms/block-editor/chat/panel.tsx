'use client'

import { useEffect, useRef } from 'react'
import { C, FONT, ACCENT_DEFAULT } from './tokens'
import { ChatPanelStyles } from './styles'
import { ChatHeader } from './header'
import { Composer } from './composer'
import { MessagePart } from './parts'
import type { ChatPanelModel, ChatMessageVM } from './types'

const ACCENT = 'var(--cbx-accent)'

const revertBtn = { display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: C.textGhost, fontSize: 10, cursor: 'pointer', padding: '1px 2px', font: 'inherit' } as const

function UserMessage({ model, m }: { model: ChatPanelModel; m: ChatMessageVM }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {m.chips && m.chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: '90%' }}>
          {m.chips.map((chip) => (
            <span key={chip.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: 'oklch(0.24 0.02 250 / 0.6)', fontSize: 10.5, color: 'oklch(0.78 0.04 250)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
              <span style={{ fontFamily: "'Geist Mono',monospace" }}>{chip.tag}</span>
            </span>
          ))}
        </div>
      )}
      <div style={{ maxWidth: '90%', borderRadius: '13px 13px 4px 13px', background: ACCENT, color: 'oklch(0.99 0 0)', padding: '9px 13px', fontSize: 12.5, lineHeight: 1.55, boxShadow: '0 1px 3px oklch(0 0 0 / 0.35)', whiteSpace: 'pre-wrap' }}>{m.text}</div>
      <button onClick={() => model.onRevertTo(m.id)} className="cbx-revert" style={revertBtn}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
        revert to here
      </button>
    </div>
  )
}

function AssistantMessage({ model, m }: { model: ChatPanelModel; m: ChatMessageVM }) {
  const showActions = !(model.streaming && m.id === model.messages[model.messages.length - 1]?.id)
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'oklch(0.21 0.02 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.12 250)" strokeWidth={2}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, flex: 1 }}>
        {(m.parts || []).map((part) => <MessagePart key={part.id} model={model} messageId={m.id} part={part} />)}
        {showActions && (m.parts && m.parts.length > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => model.onRevertTo(m.id)} className="cbx-revert" style={{ ...revertBtn, padding: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
              revert
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryMessage({ m }: { m: ChatMessageVM }) {
  return (
    <div style={{ padding: '4px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.04 250)" strokeWidth={2}><path d="m7 20 5-5 5 5" /><path d="m7 4 5 5 5-5" /></svg>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.78 0 0)', flex: 1, letterSpacing: '0.04em' }}>Conversation compacted</span>
        {m.saved && <span style={{ fontSize: 10, color: C.greenStrong, fontFamily: "'Geist Mono',monospace" }}>{m.saved}</span>}
      </div>
      <div style={{ position: 'relative', paddingLeft: 14 }}>
        <div style={{ position: 'absolute', top: 2, bottom: 2, left: 4, borderLeft: `1px dashed ${C.dashed}` }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(m.retained || []).map((r, i) => <div key={i} style={{ fontSize: 11, color: C.textMuted }}>{r}</div>)}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ model }: { model: ChatPanelModel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '40px 8px', textAlign: 'center' }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: 'oklch(0.2 0.02 250)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.12 250)" strokeWidth={1.8}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'oklch(0.92 0 0)' }}>Plan, build, or ask anything</p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted, maxWidth: 250, lineHeight: 1.5 }}>Describe a section, attach a block from the canvas, or type <span style={{ fontFamily: "'Geist Mono',monospace", color: 'oklch(0.7 0.04 250)' }}>/</span> for commands.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 4 }}>
        {model.suggestions.map((t, i) => (
          <button key={i} onClick={() => model.onPickSuggestion(t)} className="cbx-suggestion" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, background: C.chip, border: 'none', color: 'oklch(0.76 0.01 260)', fontSize: 12, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.04 250)" strokeWidth={2} style={{ flexShrink: 0 }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatPanel({ model, accent = ACCENT_DEFAULT, hideHeader = false }: { model: ChatPanelModel; accent?: string; hideHeader?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [model.messages])

  return (
    <aside
      className="cbx-scope"
      data-cbx-build="v2.0.1"
      style={{ ['--cbx-accent' as string]: accent, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: C.panelBg, borderLeft: `1px solid ${C.border}`, fontFamily: FONT, color: C.text } as React.CSSProperties}
    >
      <ChatPanelStyles />
      {!hideHeader && <ChatHeader model={model} />}

      <div ref={scrollRef} className="cbx-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {model.isEmpty ? (
          <EmptyState model={model} />
        ) : (
          model.messages.map((m) => {
            if (m.role === 'user') return <UserMessage key={m.id} model={model} m={m} />
            if (m.role === 'system') return <SummaryMessage key={m.id} m={m} />
            return <AssistantMessage key={m.id} model={model} m={m} />
          })
        )}
      </div>

      <Composer model={model} />
    </aside>
  )
}
