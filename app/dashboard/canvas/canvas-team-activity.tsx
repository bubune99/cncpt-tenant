"use client"

/**
 * TEAM · Activity log — REAL data (/api/dashboard/activity).
 *
 * Full-width chronological feed of the signed-in user's recent audit entries
 * (member, role, permission and invite changes). No fabricated rows; accounts
 * with no recorded actions show the honest empty state.
 */

import { useEffect, useState } from "react"
import { History } from "lucide-react"

interface AuditEntry {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  userEmail: string | null
  createdAt: string
}

function activityRelTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export function ActivityPanel() {
  const [logs, setLogs] = useState<AuditEntry[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard/activity", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLogs(Array.isArray(d?.logs) ? d.logs : []))
      .catch(() => setLogs([]))
  }, [])

  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>Activity log</h1>
          <div className="sub">Recent account actions — member, role, permission and invite changes.</div>
        </div>
      </div>
      <div className="card">
        {logs === null ? (
          <div style={{ padding: 18 }} className="muted">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="tnt__empty" style={{ padding: "48px 24px" }}>
            <div className="tnt__empty-glyph"><History /></div>
            <h2 className="tnt__empty-h">No activity yet</h2>
            <p className="tnt__empty-p">Account actions will appear here as they happen — member changes, role updates, and invites are all recorded.</p>
          </div>
        ) : (
          <div>
            {logs.map((a) => (
              <div className="tnt__act-row" key={a.id}>
                <div className="tnt__act-icon"><History /></div>
                <div className="tnt__act-body">
                  <strong>{a.userEmail ?? "You"}</strong> {a.action.replace(/[._]/g, " ").trim()}{a.targetId ? ` · ${a.targetType ?? "item"}` : ""}
                  <div className="tnt__act-time">{activityRelTime(a.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
