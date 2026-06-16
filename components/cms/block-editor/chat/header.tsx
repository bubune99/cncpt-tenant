'use client'

import { C, MONO } from './tokens'
import type { ChatPanelModel } from './types'

const ACCENT = 'var(--cbx-accent)'

export function ChatHeader({ model }: { model: ChatPanelModel }) {
  const pct = model.contextPct
  const ctxColor = pct > 78 ? 'oklch(0.68 0.18 35)' : pct > 55 ? 'oklch(0.78 0.13 80)' : ACCENT
  return (
    <div style={{ flexShrink: 0, background: C.headerBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30, width: 30, borderRadius: 9, background: ACCENT, boxShadow: '0 2px 8px oklch(0 0 0 / 0.4)', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.99 0 0)" strokeWidth={2}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{model.assistantName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: C.textMuted }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.online }} />
            Connected to canvas
          </div>
        </div>
        <button onClick={model.onCompact} title="Compact conversation" className="cbx-icon-btn" style={iconBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m7 20 5-5 5 5" /><path d="m7 4 5 5 5-5" /></svg>
        </button>
        <button onClick={model.onClear} title="Clear conversation" className="cbx-icon-btn" style={iconBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px 11px' }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'oklch(0.23 0.008 260)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: ctxColor, borderRadius: 2, transition: 'width .3s ease' }} />
        </div>
        <span style={{ fontSize: 10, color: C.textFaint, fontFamily: MONO }}>{model.tokenLabel}</span>
      </div>
      {model.streaming && (
        <div style={{ height: 2, background: 'oklch(0.2 0.006 260)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '35%', background: `linear-gradient(90deg,transparent,${ACCENT},transparent)`, animation: 'cbxshimmer 1.2s ease-in-out infinite' }} />
        </div>
      )}
      {model.reverted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'oklch(0.24 0.05 80 / 0.2)', fontSize: 11, color: C.amber }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
          Reverted to this point — later turns were rolled back.
        </div>
      )}
    </div>
  )
}

const iconBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer' } as const
