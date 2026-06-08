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
 *  - Email campaigns: REAL. Aggregated across the account's sites
 *    (/api/dashboard/campaigns → EmailCampaign). Empty state when none.
 *  - Feedback board: REAL. Aggregated across sites (/api/dashboard/feedback →
 *    Feedback), grouped by status. Empty state when none.
 *  - Announcements / Team messages: no backing source yet → honest "coming
 *    soon" empty state (no fabricated rows).
 */

import { useEffect, useState } from "react"
import {
  MessageSquare, Plus, Inbox, UserX, User, Hourglass, CheckCircle,
  Sparkles, Send, Megaphone, MessagesSquare, Lightbulb, AlarmClock, Loader2,
  Mail,
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
      {tab === "campaigns" ? <CampaignsPanel /> : null}
      {tab === "feedback" ? <FeedbackPanel /> : null}
      {tab === "announce" ? <ComingSoonPanel kind="announce" /> : null}
      {tab === "team-chat" ? <ComingSoonPanel kind="team-chat" /> : null}
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

/* ─── Email campaigns — REAL (account-level, /api/dashboard/campaigns) ─── */
interface Campaign {
  id: string; name: string; subject: string; status: string
  sentAt: string | null; recipientCount: number; sentCount: number; createdAt: string; site?: string
}

function CampaignsPanel() {
  const [rows, setRows] = useState<Campaign[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard/campaigns")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows(Array.isArray(d?.campaigns) ? d.campaigns : []))
      .catch(() => setRows([]))
  }, [])

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>Email campaigns</h1>
          <div className="sub">Newsletters and automated flows across your sites.</div>
        </div>
      </div>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Campaigns</h3></div>
        {rows === null ? (
          <div style={{ padding: 18 }} className="muted"><Loader2 className="tnt-spin" style={{ width: 14, height: 14 }} /> Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center" }} className="muted">
            <Mail style={{ width: 22, height: 22, opacity: 0.5 }} />
            <div style={{ fontSize: 12.5, marginTop: 8 }}>No campaigns yet. Create one from a site&apos;s email tools and it&apos;ll show here.</div>
          </div>
        ) : (
          <table className="tnt__matrix">
            <thead><tr><th>Campaign</th><th>Site</th><th>Status</th><th>Sent</th><th>Recipients</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong style={{ fontSize: 12.5 }}>{r.name}</strong><div className="muted" style={{ fontSize: 11 }}>{r.subject}</div></td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.site ?? "—"}</td>
                  <td><span className={"pill " + (r.status === "SENT" ? "pill--green" : r.status === "DRAFT" ? "pill--slate" : "pill--blue")} style={{ fontSize: 10.5 }}>{r.status.toLowerCase()}</span></td>
                  <td className="mono">{r.sentCount.toLocaleString()}</td>
                  <td className="mono">{r.recipientCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ─── Feedback board — REAL (account-level, /api/dashboard/feedback) ─── */
interface FeedbackItem {
  id: string; type: string; subject: string | null; message: string; status: string; createdAt: string; site?: string
}
const FEEDBACK_COLUMNS: { key: string; label: string; tone: string }[] = [
  { key: "NEW", label: "New", tone: "idle" },
  { key: "IN_PROGRESS", label: "In progress", tone: "warn" },
  { key: "RESOLVED", label: "Resolved", tone: "ok" },
  { key: "CLOSED", label: "Closed", tone: "idle" },
]

function FeedbackPanel() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard/feedback")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(Array.isArray(d?.feedback) ? d.feedback : []))
      .catch(() => setItems([]))
  }, [])

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>Feedback board</h1>
          <div className="sub">Customer feedback submitted across your sites.</div>
        </div>
      </div>
      {items === null ? (
        <div className="card" style={{ padding: 18 }}><span className="muted"><Loader2 className="tnt-spin" style={{ width: 14, height: 14 }} /> Loading…</span></div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: "28px 18px", textAlign: "center" }}>
          <Lightbulb style={{ width: 22, height: 22, opacity: 0.5 }} />
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>No feedback yet. Submissions from your sites&apos; feedback widget will appear here.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {FEEDBACK_COLUMNS.map((c) => {
            const colItems = items.filter((it) => it.status === c.key)
            return (
              <div key={c.key} className="card" style={{ background: "var(--br-surface)" }}>
                <div className="card__head">
                  <div className="row" style={{ gap: 6 }}>
                    <span className={"tnt__dot tnt__dot--" + c.tone} />
                    <strong style={{ fontSize: 12.5 }}>{c.label}</strong>
                    <span className="muted mono" style={{ fontSize: 11 }}>{colItems.length}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
                  {colItems.map((it) => (
                    <div key={it.id} className="card" style={{ padding: 12 }}>
                      <span className="pill pill--slate" style={{ fontSize: 9.5 }}>{it.type.toLowerCase()}</span>
                      <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, marginTop: 6 }}>{it.subject || it.message.slice(0, 80)}</div>
                      {it.site ? <div className="muted mono" style={{ fontSize: 10, marginTop: 4 }}>{it.site}</div> : null}
                    </div>
                  ))}
                  {colItems.length === 0 ? <div className="muted" style={{ fontSize: 11, padding: "4px 2px" }}>—</div> : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Not-yet-backed comms features — honest empty state, no fake rows ─── */
function ComingSoonPanel({ kind }: { kind: "announce" | "team-chat" }) {
  const meta = {
    announce: { h: "Announcements", sub: "Push banners, top-bars, and modals to your customers across your sites.", icon: Megaphone },
    "team-chat": { h: "Team messages", sub: "In-app channels and DMs for your team.", icon: MessagesSquare },
  }[kind]
  const Icon = meta.icon
  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>{meta.h}</h1>
          <div className="sub">{meta.sub}</div>
        </div>
        <span className="pill pill--blue" style={{ fontSize: 11 }}>Coming soon</span>
      </div>
      <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
        <Icon style={{ width: 26, height: 26, opacity: 0.5 }} />
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>{meta.h} isn&apos;t available yet</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>This feature is on the roadmap. There&apos;s no data to show here yet.</div>
      </div>
    </div>
  )
}
