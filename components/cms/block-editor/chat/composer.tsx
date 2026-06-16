'use client'

import { useRef, useEffect } from 'react'
import { C, MONO } from './tokens'
import type { ChatPanelModel } from './types'

const ACCENT = 'var(--cbx-accent)'
const toolBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer' } as const

export function Composer({ model }: { model: ChatPanelModel }) {
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow the textarea like a real composer.
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(140, ta.scrollHeight)}px`
  }, [model.input])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (model.slashOpen && model.slashCommands[0]) {
        model.onRunCommand(model.slashCommands[0].id)
        return
      }
      model.onSubmit()
    }
  }

  return (
    <div style={{ flexShrink: 0, padding: '10px 14px 14px', background: C.headerBg }}>
      <div className="cbx-composer" style={{ position: 'relative', border: `1px solid ${C.borderStrong}`, background: C.raised, borderRadius: 16, padding: '10px 12px 9px' }}>

        {model.slashOpen && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, background: 'oklch(0.2 0.006 260)', border: '1px solid oklch(0.3 0.01 260)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 14px 34px oklch(0 0 0 / 0.55)', zIndex: 20 }}>
            <div style={{ padding: '7px 13px', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, fontWeight: 600 }}>Commands</div>
            {model.slashCommands.map((cmd) => (
              <button key={cmd.id} onClick={() => model.onRunCommand(cmd.id)} className="cbx-slash" style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 13px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: 'oklch(0.72 0.06 250)', minWidth: 92 }}>{cmd.cmd}</span>
                <span style={{ fontSize: 11.5, color: 'oklch(0.64 0.01 260)' }}>{cmd.desc}</span>
              </button>
            ))}
          </div>
        )}

        {model.chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {model.chips.map((chip) => (
              <span key={chip.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 6px 3px 8px', borderRadius: 7, background: 'oklch(0.24 0.02 250 / 0.7)', fontSize: 11, color: 'oklch(0.82 0.04 250)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
                <span style={{ fontFamily: MONO }}>{chip.tag}</span>
                <button onClick={() => model.onRemoveChip(chip.id)} className="cbx-chip-x" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: 4, background: 'transparent', border: 'none', color: 'oklch(0.65 0.04 250)', cursor: 'pointer', padding: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={taRef}
          className="cbx-textarea"
          value={model.input}
          onChange={(e) => model.onInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={model.composerPlaceholder || 'Ask anything · plan, build or edit the page'}
          style={{ display: 'block', width: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none', color: C.textStrong, fontSize: 13, lineHeight: 1.5, padding: '2px 2px 0', maxHeight: 140, minHeight: 24, fontFamily: 'inherit' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
          <button title="Add context" className="cbx-icon-btn" style={toolBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </button>
          <button title="Insert code" className="cbx-icon-btn" style={toolBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>
          </button>
          <button title="Model" className="cbx-icon-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 9px', borderRadius: 8, background: 'transparent', border: 'none', color: 'oklch(0.7 0.01 260)', fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer' }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: ACCENT }} />
            {model.modelLabel}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <button title="Agent mode" className="cbx-icon-btn" style={toolBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56" /><path d="M16 8 21 3" /><path d="M21 3v5h-5" /></svg>
            </button>
            <button title="Dictate" className="cbx-icon-btn" style={toolBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
            </button>
            <button onClick={model.streaming ? model.onStop : model.onSubmit} title={model.streaming ? 'Stop' : 'Send'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30, width: 30, borderRadius: 9, background: ACCENT, color: 'oklch(0.99 0 0)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              {model.streaming ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'cbxspin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
