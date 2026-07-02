'use client'

/**
 * Grainy AI chat panel shell. Presentational: renders a `ChatPanelModel`.
 * Layout uses the Grainy .chat / .chat-log / .msg / .composer classes; it must
 * be mounted inside the `.atlas` (or `.grainy`) admin-shell root so the scoped
 * grainy.css rules apply.
 */

import { useEffect, useRef } from 'react'
import { Sparkles, History, RotateCcw, Minimize2, ArrowUpRight, Coins, RotateCw } from 'lucide-react'
import { Composer } from './composer'
import { MessagePart } from './parts'
import type { ChatPanelModel, ChatMessageVM } from './types'
import './chat-v2.css'

const avatarMark: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 'var(--r-sm)', flex: 'none',
  background: 'var(--primary)', color: 'var(--text-on-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: 'var(--shadow-xs)',
}

function UserMessage({ m }: { m: ChatMessageVM }) {
  return (
    <div className="msg user">
      <div className="bubble user" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
    </div>
  )
}

function AssistantMessage({ model, m }: { model: ChatPanelModel; m: ChatMessageVM }) {
  return (
    <div className="msg">
      <div style={avatarMark}><Sparkles style={{ width: 15, height: 15 }} /></div>
      <div className="msg-body">
        {(m.parts || []).map((part) => <MessagePart key={part.id} model={model} messageId={m.id} part={part} />)}
      </div>
    </div>
  )
}

function SummaryMessage({ m }: { m: ChatMessageVM }) {
  return (
    <div className="chat-v2-summary">
      <span className="block-label"><RotateCcw /> Conversation compacted</span>
      {(m.retained || []).map((r, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r}</div>)}
    </div>
  )
}

function EmptyState({ model }: { model: ChatPanelModel }) {
  return (
    <div className="chat-v2-empty">
      <div style={{ ...avatarMark, width: 44, height: 44, borderRadius: 'var(--r-md)' }}>
        <Sparkles style={{ width: 22, height: 22 }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Ask anything</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 260, lineHeight: 1.5 }}>
          Navigate, search, or manage your store — or type <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>/</span> for commands.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', marginTop: 4 }}>
        {model.suggestions.map((t) => (
          <button key={t} type="button" className="chip" style={{ cursor: 'pointer', justifyContent: 'flex-start', width: '100%' }} onClick={() => model.onPickSuggestion(t)}>
            <ArrowUpRight style={{ width: 13, height: 13 }} />
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

function NoticeCard({ model }: { model: ChatPanelModel }) {
  const notice = model.notice
  if (!notice) return null
  return (
    <div className="qwidget" style={{ margin: '0 16px 12px' }}>
      <span className="block-label"><Coins /> {notice.kind === 'credits' ? 'Out of credits' : 'Something went wrong'}</span>
      <div className="q-text">{notice.message}</div>
      {notice.actionHref && (
        <a className="btn btn-primary btn-sm" href={notice.actionHref} style={{ marginTop: 4, display: 'inline-flex', textDecoration: 'none' }}>
          {notice.actionLabel || 'Continue'}
        </a>
      )}
    </div>
  )
}

function Header({ model, onHistory, onMinimize }: { model: ChatPanelModel; onHistory?: () => void; onMinimize?: () => void }) {
  return (
    <div className="chat-head">
      <div style={avatarMark}><Sparkles style={{ width: 15, height: 15 }} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="ch-title">{model.assistantName}</div>
        <div className="ch-sub">{model.modelLabel} · {model.tokenLabel}</div>
      </div>
      <div className="ch-actions">
        {onHistory && <button className="gr-iconbtn" title="History" onClick={onHistory}><History style={{ width: 15, height: 15 }} /></button>}
        <button className="gr-iconbtn" title="Clear" onClick={model.onClear}><RotateCw style={{ width: 15, height: 15 }} /></button>
        {onMinimize && <button className="gr-iconbtn" title="Minimize" onClick={onMinimize}><Minimize2 style={{ width: 15, height: 15 }} /></button>}
      </div>
    </div>
  )
}

interface Props {
  model: ChatPanelModel
  hideHeader?: boolean
  onHistory?: () => void
  onMinimize?: () => void
}

export function ChatPanel({ model, hideHeader = false, onHistory, onMinimize }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [model.messages])

  return (
    <div className="chat" style={{ height: '100%', border: 'none', borderRadius: 0, boxShadow: 'none', background: 'var(--surface)' }}>
      {!hideHeader && <Header model={model} onHistory={onHistory} onMinimize={onMinimize} />}
      {model.streaming && <div className="chat-v2-progress" />}

      <div ref={scrollRef} className="chat-log scroll-clay" style={{ flex: 1, minHeight: 0 }}>
        {model.isEmpty ? (
          <EmptyState model={model} />
        ) : (
          model.messages.map((m) => {
            if (m.role === 'user') return <UserMessage key={m.id} m={m} />
            if (m.role === 'system') return <SummaryMessage key={m.id} m={m} />
            return <AssistantMessage key={m.id} model={model} m={m} />
          })
        )}
      </div>

      <NoticeCard model={model} />
      <Composer model={model} />
    </div>
  )
}
