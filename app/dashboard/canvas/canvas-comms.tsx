"use client"

/**
 * COMMUNICATIONS — Support inbox (3-pane) + Announcements + Campaigns +
 * Team messages + Feedback board. Recreates tenant-comms.jsx.
 *
 * DATA WIRING:
 *  - Support inbox: REAL. Channels rail is built from the live ticket stats
 *    (/api/dashboard/support → stats), the ticket list is the real tickets,
 *    and the conversation pane loads real messages
 *    (/api/dashboard/support/[id]/messages). "AI suggested reply" is REAL —
 *    generated from the ticket thread via /api/dashboard/support/[id]/
 *    suggest-reply (editable draft, never auto-sent).
 *  - Email campaigns: REAL. Aggregated across the account's sites
 *    (/api/dashboard/campaigns → EmailCampaign). Empty state when none.
 *  - Feedback board: REAL. Aggregated across sites (/api/dashboard/feedback →
 *    Feedback), grouped by status. Empty state when none.
 *  - Announcements: REAL. Per-site storefront banner editor
 *    (/api/dashboard/announcements → SiteSettings.announcementBar).
 *  - Team messages: REAL. In-app #general team chat
 *    (/api/dashboard/team-messages, membership-gated, polled).
 */

import { useEffect, useState, useCallback } from "react"
import {
  MessageSquare, Plus, Inbox, UserX, User, Hourglass, CheckCircle,
  Sparkles, Send, Megaphone, MessagesSquare, Lightbulb, AlarmClock, Loader2,
} from "lucide-react"
import { CampaignsPanel, type CommsSite } from "./canvas-comms-campaigns"

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

export function CanvasComms({ initialTab = "tickets", subdomains = [] }: { initialTab?: Tab; subdomains?: CommsSite[] }) {
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
      {tab === "campaigns" ? <CampaignsPanel subdomains={subdomains} /> : null}
      {tab === "feedback" ? <FeedbackPanel /> : null}
      {tab === "announce" ? <AnnouncementsPanel /> : null}
      {tab === "team-chat" ? <TeamChatPanel /> : null}
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
  const [aiDraft, setAiDraft] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const generateReply = useCallback(async () => {
    if (!selId) return
    setAiLoading(true); setAiError(null)
    try {
      const res = await fetch(`/api/dashboard/support/${selId}/suggest-reply`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setAiDraft(data.draft || "")
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Failed to generate")
    } finally {
      setAiLoading(false)
    }
  }, [selId])

  useEffect(() => { setAiDraft(""); setAiError(null) }, [selId])

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

              {/* AI suggested reply — REAL, generated from the ticket thread */}
              <div className="card" style={{ borderColor: "#bfdbfe", background: "linear-gradient(135deg, rgba(59,130,246,0.04), rgba(6,182,212,0.04))" }}>
                <div className="card__head" style={{ borderColor: "#bfdbfe" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Sparkles style={{ width: 11, height: 11 }} /></div>
                    <strong style={{ fontSize: 12.5, color: "#1d4ed8" }}>Suggested reply</strong>
                  </div>
                  <button className="btn btn--secondary btn--xs" onClick={generateReply} disabled={aiLoading || messages.length === 0}>
                    {aiLoading ? <><Loader2 className="tnt-spin" style={{ width: 11, height: 11 }} /> Drafting…</> : <><Sparkles style={{ width: 11, height: 11 }} /> {aiDraft ? "Regenerate" : "Generate"}</>}
                  </button>
                </div>
                <div className="card__body" style={{ fontSize: 12, lineHeight: 1.55 }}>
                  {aiError ? (
                    <span style={{ color: "#b91c1c" }}>{aiError}</span>
                  ) : aiDraft ? (
                    <textarea className="tnt__textarea" style={{ width: "100%", minHeight: 90, fontSize: 12.5, lineHeight: 1.5 }} value={aiDraft} onChange={(e) => setAiDraft(e.target.value)} />
                  ) : (
                    <span className="muted">Generate a draft reply from this conversation, then edit it before sending.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Composer */}
            <div style={{ padding: "12px 18px 18px", borderTop: "1px solid var(--br-border)", background: "var(--br-background)" }}>
              <div className="tnt__input" style={{ padding: "10px 12px", alignItems: "center" }}>
                <span style={{ flex: 1, color: "var(--br-text-secondary)", fontSize: 12.5 }}>{aiDraft ? "Edit the suggested reply above" : `Reply to ${sel.customerName}…`}</span>
                <button className="btn btn--primary btn--xs" disabled>Send reply <Send style={{ width: 11, height: 11 }} /></button>
              </div>
              <span className="muted" style={{ fontSize: 10.5, marginTop: 6, display: "block" }}>Sending replies from here is handled by the existing Support area; this inbox drafts and reads.</span>
            </div>
          </>
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

/* ─── Announcements — REAL (per-site storefront banner, /api/dashboard/announcements) ─── */
interface SiteAnnouncement { subdomain: string; enabled: boolean; announcementBar: Record<string, any> }
interface AnnDraft { message: string; link: string; backgroundColor: string; textColor: string; enabled: boolean }

function annDraftFromSite(s: SiteAnnouncement): AnnDraft {
  const a = s.announcementBar || {}
  return {
    message: (a.message ?? a.text ?? "") as string,
    link: (a.link ?? a.href ?? "") as string,
    backgroundColor: (a.backgroundColor ?? "#0f172a") as string,
    textColor: (a.textColor ?? "#ffffff") as string,
    enabled: !!s.enabled,
  }
}

function AnnouncementsPanel() {
  const [sites, setSites] = useState<SiteAnnouncement[] | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [draft, setDraft] = useState<AnnDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/announcements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list: SiteAnnouncement[] = Array.isArray(d?.announcements) ? d.announcements : []
        setSites(list)
        if (list.length > 0) { setActive(list[0].subdomain); setDraft(annDraftFromSite(list[0])) }
      })
      .catch(() => setSites([]))
  }, [])

  const selectSite = (sub: string) => {
    const s = sites?.find((x) => x.subdomain === sub)
    setActive(sub); setSaved(false)
    if (s) setDraft(annDraftFromSite(s))
  }

  const save = async () => {
    if (!active || !draft) return
    setSaving(true); setSaved(false)
    try {
      const res = await fetch("/api/dashboard/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: active,
          enabled: draft.enabled,
          announcementBar: { message: draft.message, link: draft.link, backgroundColor: draft.backgroundColor, textColor: draft.textColor },
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSites((prev) => (prev || []).map((s) => s.subdomain === active ? { subdomain: active, enabled: updated.enabled, announcementBar: updated.announcementBar } : s))
        setSaved(true)
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>Announcements</h1>
          <div className="sub">Show a banner across the top of a site&apos;s storefront.</div>
        </div>
      </div>
      {sites === null ? (
        <div className="card" style={{ padding: 18 }}><span className="muted"><Loader2 className="tnt-spin" style={{ width: 14, height: 14 }} /> Loading…</span></div>
      ) : sites.length === 0 ? (
        <div className="card" style={{ padding: "28px 18px", textAlign: "center" }}>
          <Megaphone style={{ width: 22, height: 22, opacity: 0.5 }} />
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Create a site first, then add an announcement banner to it.</div>
        </div>
      ) : draft ? (
        <>
          {sites.length > 1 ? (
            <div className="tnt__tabs" style={{ marginBottom: 12 }}>
              {sites.map((s) => (
                <button key={s.subdomain} className={"tnt__tab" + (s.subdomain === active ? " is-on" : "")} onClick={() => selectSite(s.subdomain)}>
                  {s.subdomain}{s.enabled ? <span className="pill pill--green" style={{ fontSize: 9, marginLeft: 6 }}>live</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          {/* Live preview */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card__head"><h3 className="card__title">Preview</h3>
              <label className="row" style={{ gap: 6, fontSize: 12 }}>
                <input type="checkbox" checked={draft.enabled} onChange={(e) => { setDraft({ ...draft, enabled: e.target.checked }); setSaved(false) }} /> Show on storefront
              </label>
            </div>
            <div style={{ padding: 14, background: "var(--br-surface)" }}>
              {draft.message ? (
                <div style={{ background: draft.backgroundColor, color: draft.textColor, padding: "10px 14px", borderRadius: 8, textAlign: "center", fontSize: 12.5, fontWeight: 600, opacity: draft.enabled ? 1 : 0.5 }}>
                  {draft.message}{draft.link ? <span style={{ marginLeft: 8, textDecoration: "underline" }}>Learn more</span> : null}
                </div>
              ) : <span className="muted" style={{ fontSize: 12 }}>Add a message below to preview the banner.</span>}
            </div>
          </div>

          {/* Editor */}
          <div className="card">
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              <label className="col" style={{ gap: 4 }}>
                <span className="muted" style={{ fontSize: 11 }}>Message</span>
                <input className="tnt__field" value={draft.message} onChange={(e) => { setDraft({ ...draft, message: e.target.value }); setSaved(false) }} placeholder="Summer sale — 25% off through Sunday" />
              </label>
              <label className="col" style={{ gap: 4 }}>
                <span className="muted" style={{ fontSize: 11 }}>Link (optional)</span>
                <input className="tnt__field" value={draft.link} onChange={(e) => { setDraft({ ...draft, link: e.target.value }); setSaved(false) }} placeholder="/shop/sale" />
              </label>
              <div className="row" style={{ gap: 16 }}>
                <label className="row" style={{ gap: 6, fontSize: 12 }}>
                  <span className="muted" style={{ fontSize: 11 }}>Background</span>
                  <input type="color" value={draft.backgroundColor} onChange={(e) => { setDraft({ ...draft, backgroundColor: e.target.value }); setSaved(false) }} />
                </label>
                <label className="row" style={{ gap: 6, fontSize: 12 }}>
                  <span className="muted" style={{ fontSize: 11 }}>Text</span>
                  <input type="color" value={draft.textColor} onChange={(e) => { setDraft({ ...draft, textColor: e.target.value }); setSaved(false) }} />
                </label>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
                  {saving ? <><Loader2 className="tnt-spin" style={{ width: 12, height: 12 }} /> Saving…</> : "Save announcement"}
                </button>
                {saved ? <span className="pill pill--green" style={{ fontSize: 11 }}>Saved</span> : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ─── Team messages — REAL (in-app team chat, /api/dashboard/team-messages) ─── */
function chatRelTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  return new Date(iso).toLocaleDateString()
}

function TeamChatPanel() {
  const [teams, setTeams] = useState<any[] | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<any[]>([])
  const [me, setMe] = useState<string>("")
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const ts = Array.isArray(d?.teams) ? d.teams : []
        setTeams(ts)
        if (ts.length > 0) setTeamId(ts[0].id)
      })
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    if (!teamId) return
    let active = true
    const load = () => fetch(`/api/dashboard/team-messages?teamId=${teamId}&channel=general`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d) { setMsgs(Array.isArray(d.messages) ? d.messages : []); setMe(d.me || "") } })
      .catch(() => {})
    load()
    const iv = setInterval(load, 5000)
    return () => { active = false; clearInterval(iv) }
  }, [teamId])

  const send = async () => {
    const body = text.trim()
    if (!body || !teamId) return
    setSending(true)
    try {
      const res = await fetch("/api/dashboard/team-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, channel: "general", body }),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.message) setMsgs((prev) => [...prev, d.message])
        setText("")
      }
    } finally { setSending(false) }
  }

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto", display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="tnt__page-h">
        <div>
          <h1>Team messages</h1>
          <div className="sub">#general — a shared channel for your team.</div>
        </div>
        {teams && teams.length > 1 ? (
          <select className="tnt__field" style={{ width: "auto" }} value={teamId ?? ""} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        ) : null}
      </div>

      {teams === null ? (
        <div className="card" style={{ padding: 18 }}><span className="muted"><Loader2 className="tnt-spin" style={{ width: 14, height: 14 }} /> Loading…</span></div>
      ) : teams.length === 0 ? (
        <div className="card" style={{ padding: "28px 18px", textAlign: "center" }}>
          <MessagesSquare style={{ width: 22, height: 22, opacity: 0.5 }} />
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Create a team (Team → Members) to start messaging.</div>
        </div>
      ) : (
        <div className="card" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 360 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {msgs.length === 0 ? (
              <div className="muted" style={{ fontSize: 12, textAlign: "center", padding: 24 }}>No messages yet — say hello 👋</div>
            ) : msgs.map((m) => (
              <div key={m.id} className="row" style={{ alignItems: "flex-start", gap: 10, justifyContent: m.user_id === me ? "flex-end" : "flex-start" }}>
                {m.user_id !== me ? <div className="avatar avatar--sm avatar--purple">{String(m.user_name || "?").slice(0, 2).toUpperCase()}</div> : null}
                <div className="col" style={{ gap: 2, maxWidth: "70%", alignItems: m.user_id === me ? "flex-end" : "flex-start" }}>
                  <div className="row" style={{ gap: 6 }}>
                    <strong style={{ fontSize: 11.5 }}>{m.user_id === me ? "You" : (m.user_name || "Member")}</strong>
                    <span className="muted" style={{ fontSize: 10 }}>{chatRelTime(m.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, background: m.user_id === me ? "var(--br-primary)" : "var(--br-surface)", color: m.user_id === me ? "#fff" : "var(--br-text)", padding: "7px 11px", borderRadius: 10, border: m.user_id === me ? "none" : "1px solid var(--br-border)", whiteSpace: "pre-wrap" }}>{m.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid var(--br-border)" }}>
            <div className="tnt__input" style={{ padding: "8px 10px", alignItems: "center", gap: 8 }}>
              <input
                className="tnt__field"
                style={{ flex: 1, border: "none", background: "transparent" }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Message #general…"
              />
              <button className="btn btn--primary btn--xs" onClick={send} disabled={sending || !text.trim()}>
                {sending ? <Loader2 className="tnt-spin" style={{ width: 11, height: 11 }} /> : <Send style={{ width: 11, height: 11 }} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
