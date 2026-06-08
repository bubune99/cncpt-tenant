"use client"

/**
 * COMMUNICATIONS — Support inbox (3-pane) + Announcements + Campaigns +
 * Team messages + Feedback board. Recreates tenant-comms.jsx.
 *
 * DATA WIRING:
 *  - Support inbox: REAL. Channels rail is built from the live ticket stats
 *    (/api/dashboard/support → stats), the ticket list is the real tickets,
 *    and the conversation pane loads real messages
 *    (/api/dashboard/support/[id]/messages). The "AI suggested reply" block is
 *    a labeled placeholder (no AI-reply endpoint wired) — never presented as a
 *    real generated draft.
 *  - Announcements / Campaigns / Team messages / Feedback board: new features
 *    with no backing source yet → the designed UI is shown with a clear
 *    "Phase 2 — preview" banner and illustrative (labeled) sample rows.
 */

import { useEffect, useState } from "react"
import {
  MessageSquare, Filter, Plus, Inbox, UserX, User, Hourglass, CheckCircle,
  Sparkles, Send, Megaphone, MessagesSquare, Lightbulb, AlarmClock, Loader2,
  ChevronUp, Mail,
} from "lucide-react"

type Tab = "tickets" | "announce" | "campaigns" | "team-chat" | "feedback"

const TABS: { id: Tab; l: string; icon: any }[] = [
  { id: "tickets", l: "Support inbox", icon: MessageSquare },
  { id: "announce", l: "Announcements", icon: Megaphone },
  { id: "campaigns", l: "Email campaigns", icon: Send },
  { id: "team-chat", l: "Team messages", icon: MessagesSquare },
  { id: "feedback", l: "Feedback board", icon: Lightbulb },
]

interface Ticket {
  id: string; title: string; status: string; priority: string
  customerName: string; customerEmail: string; messageCount: number; createdAt: string
}
interface Stats { open: number; inProgress: number; resolved: number; closed: number; total: number }

export function CanvasComms({ initialTab = "tickets" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  return (
    <>
      <div className="tnt__tabs">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} className={"tnt__tab" + (t.id === tab ? " is-on" : "")} onClick={() => setTab(t.id)}>
              <Icon /> {t.l}
            </button>
          )
        })}
      </div>
      {tab === "tickets" ? <SupportInbox /> : null}
      {tab === "announce" ? <PreviewPanel kind="announce" /> : null}
      {tab === "campaigns" ? <PreviewPanel kind="campaigns" /> : null}
      {tab === "team-chat" ? <PreviewPanel kind="team-chat" /> : null}
      {tab === "feedback" ? <PreviewPanel kind="feedback" /> : null}
    </>
  )
}

/* ─── Support inbox (3-pane, real tickets) ─── */
function SupportInbox() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selId, setSelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/dashboard/support")
      .then((r) => (r.ok ? r.json() : { tickets: [], stats: null }))
      .then((data) => {
        if (!active) return
        const ts: Ticket[] = Array.isArray(data.tickets) ? data.tickets : []
        setTickets(ts)
        setStats(data.stats || null)
        if (ts.length > 0) setSelId(ts[0].id)
      })
      .catch(() => { if (active) setTickets([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selId) { setMessages([]); return }
    let active = true
    setMsgLoading(true)
    fetch(`/api/dashboard/support/${selId}/messages`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => { if (active) setMessages(Array.isArray(data.messages) ? data.messages : []) })
      .catch(() => { if (active) setMessages([]) })
      .finally(() => { if (active) setMsgLoading(false) })
    return () => { active = false }
  }, [selId])

  const sel = tickets.find((t) => t.id === selId)
  const channels = [
    { l: "All inboxes", icon: Inbox, n: stats?.total ?? 0 },
    { l: "Open", icon: UserX, n: stats?.open ?? 0 },
    { l: "In progress", icon: Hourglass, n: stats?.inProgress ?? 0 },
    { l: "Resolved", icon: CheckCircle, n: stats?.resolved ?? 0 },
    { l: "Closed", icon: User, n: stats?.closed ?? 0 },
  ]

  return (
    <div className="dirH__page" style={{ display: "grid", gridTemplateColumns: "220px 1.1fr 1.3fr", padding: 0, minHeight: 0, overflow: "hidden" }}>
      {/* Channels rail */}
      <div style={{ background: "#fff", borderRight: "1px solid var(--br-border)", overflow: "auto" }}>
        <div className="eyebrow" style={{ padding: "12px 14px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--br-text-secondary)" }}>Channels</div>
        {channels.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={c.l} className={"tnt__chan-row" + (i === 0 ? " is-on" : "")}>
              <div className="tnt__chan-icon"><Icon /></div>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: i === 0 ? 600 : 500 }}>{c.l}</span>
              <span className="muted mono" style={{ fontSize: 11 }}>{c.n}</span>
            </div>
          )
        })}
      </div>

      {/* Ticket list */}
      <div style={{ borderRight: "1px solid var(--br-border)", background: "#fff", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="row between" style={{ padding: "10px 14px", borderBottom: "1px solid var(--br-border)", background: "var(--br-surface)" }}>
          <div className="row" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>All tickets</span>
            <span className="muted mono" style={{ fontSize: 11 }}>{tickets.length}</span>
          </div>
          <button className="btn btn--primary btn--xs"><Plus style={{ width: 12, height: 12 }} /> New</button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {loading ? (
            <div className="row" style={{ gap: 8, padding: 20 }}><Loader2 className="tnt-spin" style={{ width: 15, height: 15 }} /> <span className="muted" style={{ fontSize: 12 }}>Loading tickets…</span></div>
          ) : tickets.length === 0 ? (
            <div className="tnt__empty" style={{ padding: "40px 20px" }}>
              <div className="tnt__empty-glyph"><MessageSquare /></div>
              <h2 className="tnt__empty-h">No tickets yet</h2>
              <p className="tnt__empty-p">Customer support tickets will appear here once they come in.</p>
            </div>
          ) : (
            tickets.map((t) => {
              const isSel = t.id === selId
              const tone = t.priority === "high" || t.priority === "urgent" ? "#dc2626" : t.priority === "medium" ? "#a16207" : "#475569"
              return (
                <button
                  key={t.id}
                  onClick={() => setSelId(t.id)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", paddingLeft: isSel ? 11 : 14, borderBottom: "1px solid var(--br-border)", background: isSel ? "#eff6ff" : "transparent", borderLeft: "3px solid " + (isSel ? "var(--br-primary)" : "transparent"), border: 0, borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "var(--br-border)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: tone, minHeight: 28 }} />
                    <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className={"pill " + (t.status === "open" ? "pill--blue" : t.status === "resolved" || t.status === "closed" ? "pill--green" : "pill--amber")} style={{ fontSize: 9.5 }}>{t.status}</span>
                        {(t.priority === "high" || t.priority === "urgent") ? <span className="pill pill--rose" style={{ fontSize: 9.5 }}>{t.priority}</span> : null}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{t.title}</div>
                      <div className="muted" style={{ fontSize: 11, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.customerName} · {t.messageCount} message{t.messageCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Conversation pane */}
      <div style={{ overflow: "auto", background: "var(--br-surface)" }}>
        {!sel ? (
          <div className="tnt__empty" style={{ padding: "60px 24px" }}>
            <div className="tnt__empty-glyph"><MessageSquare /></div>
            <h2 className="tnt__empty-h">Select a ticket</h2>
            <p className="tnt__empty-p">Pick a ticket from the list to view the conversation.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--br-border)", background: "#fff" }}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className={"pill " + (sel.priority === "high" || sel.priority === "urgent" ? "pill--rose" : "pill--slate")} style={{ fontSize: 10.5 }}>
                  {(sel.priority === "high" || sel.priority === "urgent") ? <AlarmClock style={{ width: 11, height: 11 }} /> : null} {sel.priority}
                </span>
                <span className="pill" style={{ fontSize: 10.5 }}>{sel.status}</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{sel.title}</h2>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>
                From <strong style={{ color: "var(--br-text)" }}>{sel.customerName}</strong>
                {sel.customerEmail ? ` · ${sel.customerEmail}` : ""} · {new Date(sel.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Messages (real) */}
              {msgLoading ? (
                <div className="row" style={{ gap: 8 }}><Loader2 className="tnt-spin" style={{ width: 15, height: 15 }} /> <span className="muted" style={{ fontSize: 12 }}>Loading conversation…</span></div>
              ) : messages.length === 0 ? (
                <div className="card"><div className="card__body muted" style={{ fontSize: 12 }}>No messages on this ticket yet.</div></div>
              ) : (
                messages.map((m, i) => (
                  <div className="card" key={m.id || i}>
                    <div className="card__body" style={{ display: "flex", gap: 12 }}>
                      <div className="avatar avatar--sm avatar--slate">{(m.senderName || m.authorName || sel.customerName || "?").slice(0, 2).toUpperCase()}</div>
                      <div className="col" style={{ gap: 4, flex: 1 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <strong style={{ fontSize: 12.5 }}>{m.senderName || m.authorName || sel.customerName}</strong>
                          {m.createdAt ? <span className="muted" style={{ fontSize: 11 }}>{new Date(m.createdAt).toLocaleString()}</span> : null}
                        </div>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>{m.message || m.body || m.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* AI suggested reply — labeled placeholder */}
              <div className="card" style={{ borderColor: "#bfdbfe", background: "linear-gradient(135deg, rgba(59,130,246,0.04), rgba(6,182,212,0.04))" }}>
                <div className="card__head" style={{ borderColor: "#bfdbfe" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Sparkles style={{ width: 11, height: 11 }} /></div>
                    <strong style={{ fontSize: 12.5, color: "#1d4ed8" }}>Suggested reply</strong>
                    <span className="pill" style={{ fontSize: 9.5 }}>preview</span>
                  </div>
                </div>
                <div className="card__body muted" style={{ fontSize: 12, lineHeight: 1.55 }}>
                  AI-drafted replies arrive in a follow-up. Use the "Ask CNCPT" dock for help drafting a response in the meantime — no AI-reply endpoint is wired here yet, so this card is a preview, not a generated draft.
                </div>
              </div>
            </div>

            {/* Composer */}
            <div style={{ padding: "12px 18px 18px", borderTop: "1px solid var(--br-border)", background: "#fff" }}>
              <div className="tnt__input" style={{ padding: "10px 12px", alignItems: "center" }}>
                <span style={{ flex: 1, color: "var(--br-text-secondary)", fontSize: 12.5 }}>Reply to {sel.customerName}…</span>
                <button className="btn btn--primary btn--xs">Send reply <Send style={{ width: 11, height: 11 }} /></button>
              </div>
              <span className="muted" style={{ fontSize: 10.5, marginTop: 6, display: "block" }}>Full reply composer is part of the existing Support area; this inbox is read-first in Phase 2.</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Preview panels for the not-yet-backed comms features ─── */
function PreviewPanel({ kind }: { kind: "announce" | "campaigns" | "team-chat" | "feedback" }) {
  const meta = {
    announce: { h: "Announcements", sub: "Push banners, top-bars, and modals to your customers across your sites.", icon: Megaphone },
    campaigns: { h: "Email campaigns", sub: "Newsletters, transactional emails, and automated flows to your customer list.", icon: Send },
    "team-chat": { h: "Team messages", sub: "In-app channels and DMs for your team.", icon: MessagesSquare },
    feedback: { h: "Feedback board", sub: "Feature requests and ideas from your customers, with voting.", icon: Lightbulb },
  }[kind]
  const Icon = meta.icon

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>{meta.h}</h1>
          <div className="sub">{meta.sub}</div>
        </div>
        <span className="pill pill--blue" style={{ fontSize: 11 }}>Phase 2 · preview</span>
      </div>
      <div className="tnt__banner tnt__banner--info" style={{ marginBottom: 16 }}>
        <Sparkles />
        <div className="tnt__banner-row">
          <span><b>Preview of an upcoming feature</b><span className="sub"> — {meta.h} isn't wired to a live data source yet. The layout below shows the designed surface; rows are illustrative samples, not live data.</span></span>
        </div>
      </div>

      {kind === "feedback" ? <FeedbackPreview /> : null}
      {kind === "announce" ? <AnnouncePreview /> : null}
      {kind === "campaigns" ? <CampaignsPreview /> : null}
      {kind === "team-chat" ? <TeamChatPreview /> : null}
    </div>
  )
}

function FeedbackPreview() {
  const cols = [
    { col: "Under review", tone: "idle", items: [{ t: "Faster mobile checkout", v: 36 }, { t: "Multi-language storefront", v: 19 }] },
    { col: "Planned", tone: "idle", items: [{ t: "Save for later on product page", v: 48 }] },
    { col: "In progress", tone: "warn", items: [{ t: "Gift wrap at checkout", v: 22 }] },
    { col: "Shipped", tone: "ok", items: [{ t: "Apple Pay express checkout", v: 12 }] },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {cols.map((c) => (
        <div key={c.col} className="card" style={{ background: "var(--br-surface)" }}>
          <div className="card__head" style={{ background: "#fff" }}>
            <div className="row" style={{ gap: 6 }}>
              <span className={"tnt__dot tnt__dot--" + c.tone} />
              <strong style={{ fontSize: 12.5 }}>{c.col}</strong>
              <span className="muted mono" style={{ fontSize: 11 }}>{c.items.length}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
            {c.items.map((it) => (
              <div key={it.t} className="card" style={{ background: "#fff", padding: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <div className="col" style={{ alignItems: "center", padding: "4px 6px", borderRadius: 6, background: "var(--br-surface)", border: "1px solid var(--br-border)" }}>
                  <ChevronUp style={{ width: 11, height: 11 }} />
                  <strong style={{ fontSize: 11 }}>{it.v}</strong>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.4 }}>{it.t}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AnnouncePreview() {
  return (
    <div className="card">
      <div className="card__head"><h3 className="card__title">Live preview</h3></div>
      <div style={{ padding: 14, background: "var(--br-surface)" }}>
        <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid var(--br-border)" }}>
          <div style={{ background: "linear-gradient(135deg, #0F172A, #3B82F6)", color: "#fff", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12, fontWeight: 600 }}>
            <Sparkles style={{ width: 12, height: 12 }} /> Summer Sale — 25% off through Sunday
            <span style={{ background: "#fff", color: "#0F172A", padding: "2px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>SUMMER25</span>
          </div>
          <div style={{ padding: 18 }}><div style={{ fontSize: 18, fontWeight: 700 }}>Your Storefront</div><div className="muted" style={{ fontSize: 11.5 }}>Banner auto-applies the code at checkout for all visitors.</div></div>
        </div>
      </div>
    </div>
  )
}

function CampaignsPreview() {
  const rows = [
    { t: "Spring restock newsletter", s: "Sent", sent: "8,420", opens: "37%" },
    { t: "Loyalty: early access drop", s: "Sent", sent: "1,240", opens: "66%" },
    { t: "Abandoned cart (auto)", s: "Active", sent: "—", opens: "—" },
  ]
  return (
    <div className="card">
      <div className="card__head"><h3 className="card__title">Campaigns</h3></div>
      <table className="tnt__matrix">
        <thead><tr><th>Campaign</th><th>Status</th><th>Sent to</th><th>Open rate</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t}>
              <td><strong style={{ fontSize: 12.5 }}>{r.t}</strong></td>
              <td><span className={"pill " + (r.s === "Sent" ? "pill--green" : "pill--blue")} style={{ fontSize: 10.5 }}>{r.s}</span></td>
              <td className="mono">{r.sent}</td>
              <td>{r.opens}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamChatPreview() {
  return (
    <div className="card">
      <div className="card__head"><h3 className="card__title">#general</h3><span className="muted" style={{ fontSize: 11 }}>preview</span></div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { who: "Teammate", text: "Pushed the new hero variant — want a look before we publish?" },
          { who: "You", text: "Yes! Pulling it up now." },
        ].map((m, i) => (
          <div key={i} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
            <div className="avatar avatar--purple">{m.who.slice(0, 2).toUpperCase()}</div>
            <div className="col" style={{ gap: 2 }}>
              <strong style={{ fontSize: 12.5 }}>{m.who}</strong>
              <span style={{ fontSize: 13, lineHeight: 1.5 }}>{m.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
