'use client'

/**
 * Grainy composer — quick-action chips, an auto-growing textarea, and a send /
 * stop button. Enter submits, Shift+Enter inserts a newline. Uses the Grainy
 * .composer / .composer-quick / .composer-field / .send classes.
 */

import { useRef, useEffect } from 'react'
import { Send, Square, ArrowUpRight } from 'lucide-react'
import type { ChatPanelModel } from './types'

export function Composer({ model }: { model: ChatPanelModel }) {
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow the textarea like a real composer.
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(90, ta.scrollHeight)}px`
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

  const quick = model.suggestions.slice(0, 3)

  return (
    <div className="composer">
      {model.slashOpen && model.slashCommands.length > 0 && (
        <div className="menu" style={{ position: 'static', width: '100%' }}>
          {model.slashCommands.map((cmd) => (
            <button key={cmd.id} className="menu-item" onClick={() => model.onRunCommand(cmd.id)}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{cmd.cmd}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {model.input.trim() === '' && quick.length > 0 && (
        <div className="composer-quick">
          {quick.map((s) => (
            <button key={s} type="button" className="chip" style={{ cursor: 'pointer' }} onClick={() => model.onPickSuggestion(s)}>
              <ArrowUpRight style={{ width: 12, height: 12 }} />
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="composer-field">
        <textarea
          ref={taRef}
          value={model.input}
          onChange={(e) => model.onInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={model.composerPlaceholder || 'Ask anything · navigate, search or manage your store'}
        />
        <button
          type="button"
          className="send"
          onClick={model.streaming ? model.onStop : model.onSubmit}
          title={model.streaming ? 'Stop' : 'Send'}
          aria-label={model.streaming ? 'Stop' : 'Send'}
        >
          {model.streaming ? <Square fill="currentColor" /> : <Send />}
        </button>
      </div>
    </div>
  )
}
