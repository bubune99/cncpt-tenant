"use client"

/**
 * Canvas right "Activity" rail — recreates the design's `dirH__rrail`:
 * a persistent, collapsible, scrolling rail on the right edge with a live
 * header.
 *
 * Data note: there is no per-tenant activity-feed source wired yet, so the
 * feed below is a clearly-structured PLACEHOLDER (it surfaces the user's real
 * sites where it can, but the event rows are illustrative, not live). This is
 * called out in the rail header so it is never presented as live data.
 */

import { useState } from "react"
import {
  PanelRightClose,
  PanelRightOpen,
  Megaphone,
  Globe,
  UserPlus,
  Send,
  Rocket,
} from "lucide-react"

interface CanvasActivityRailProps {
  subdomains: any[]
}

const PLACEHOLDER_ACTIVITY = [
  { who: "You", text: "signed in to the workspace", icon: UserPlus, time: "just now" },
  { who: "System", text: "synced subdomain list", icon: Globe, time: "1m ago" },
  { who: "System", text: "checked deployment status", icon: Rocket, time: "5m ago" },
  { who: "System", text: "refreshed credit balance", icon: Send, time: "12m ago" },
  { who: "System", text: "loaded announcements", icon: Megaphone, time: "30m ago" },
]

export function CanvasActivityRail({ subdomains }: CanvasActivityRailProps) {
  const [collapsed, setCollapsed] = useState(false)

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
        {PLACEHOLDER_ACTIVITY.map((a, i) => {
          const Icon = a.icon
          return (
            <div className="tnt__act-row" key={i}>
              <div className="tnt__act-icon"><Icon /></div>
              <div className="tnt__act-body">
                <strong>{a.who}</strong> {a.text}
                <div className="tnt__act-time">{a.time}</div>
              </div>
            </div>
          )
        })}
        <div style={{ padding: "10px 14px", fontSize: 10.5 }} className="muted">
          Live event feed lands in Phase 2 (Team / Communications). The rows above are placeholders.
        </div>
      </div>
    </aside>
  )
}
