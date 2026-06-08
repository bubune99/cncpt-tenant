"use client"

/**
 * Canvas right "Activity" rail — recreates the design's `dirH__rrail`:
 * a persistent, collapsible, scrolling rail on the right edge with a live
 * header.
 *
 * Data: REAL — the signed-in user's recent audit-log entries
 * (/api/dashboard/activity). No fabricated rows; empty accounts show an honest
 * empty state.
 */

import { useState, useEffect, useCallback } from "react"
import {
  PanelRightClose,
  PanelRightOpen,
  Activity,
} from "lucide-react"

interface CanvasActivityRailProps {
  subdomains: any[]
}

interface ActivityLog {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  userEmail: string | null
  createdAt: string
}

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function phrase(log: ActivityLog): string {
  const verb = log.action.replace(/[._]/g, " ").trim()
  const tgt = log.targetId ? ` · ${log.targetType ?? "item"}` : ""
  return `${verb}${tgt}`
}

export function CanvasActivityRail({ subdomains }: CanvasActivityRailProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [logs, setLogs] = useState<ActivityLog[] | null>(null)

  const load = useCallback(() => {
    fetch("/api/dashboard/activity", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLogs(Array.isArray(d?.logs) ? d.logs : []))
      .catch(() => setLogs([]))
  }, [])

  useEffect(() => {
    load()
    const onRefresh = () => load()
    window.addEventListener("nw:data-refresh", onRefresh)
    window.addEventListener("nw:team-refresh", onRefresh)
    return () => {
      window.removeEventListener("nw:data-refresh", onRefresh)
      window.removeEventListener("nw:team-refresh", onRefresh)
    }
  }, [load])

  if (collapsed) {
    return (
      <aside className="dirH__rrail dirH__rrail--collapsed">
        <div className="dirH__rrail-h" style={{ justifyContent: "center", padding: "10px 0" }}>
          <button className="iconbtn iconbtn--sm iconbtn--ghost" onClick={() => setCollapsed(false)} aria-label="Open activity">
            <PanelRightOpen style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </aside>
    )
  }

  const siteCount = subdomains.length

  return (
    <aside className="dirH__rrail">
      <div className="dirH__rrail-h">
        <span className="live-dot" />
        <h3>Activity</h3>
        <button
          className="iconbtn iconbtn--sm iconbtn--ghost"
          style={{ marginLeft: "auto" }}
          onClick={() => setCollapsed(true)}
          aria-label="Collapse activity"
        >
          <PanelRightClose style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div className="dirH__rrail-body">
        <div style={{ padding: "8px 14px 4px" }}>
          <span className="pill pill--blue" style={{ fontSize: 10 }}>
            {siteCount} site{siteCount === 1 ? "" : "s"}
          </span>
        </div>
        {logs === null ? (
          <div className="tnt__act-row"><div className="tnt__act-body muted">Loading activity…</div></div>
        ) : logs.length === 0 ? (
          <div className="tnt__act-row">
            <div className="tnt__act-icon"><Activity /></div>
            <div className="tnt__act-body">
              No recent activity
              <div className="tnt__act-time">Account actions (team, roles, settings) will appear here</div>
            </div>
          </div>
        ) : (
          logs.map((a) => (
            <div className="tnt__act-row" key={a.id}>
              <div className="tnt__act-icon"><Activity /></div>
              <div className="tnt__act-body">
                <strong>{a.userEmail ?? "You"}</strong> {phrase(a)}
                <div className="tnt__act-time">{relTime(a.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
