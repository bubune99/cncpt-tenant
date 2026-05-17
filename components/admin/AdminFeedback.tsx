"use client"

/**
 * AdminFeedback — Super-admin feedback section (Inbox + Triage Board views).
 * Design: Hybrid direction with dual Inbox/Board view toggle.
 * Data: Delegates to the existing FeedbackDashboard component in app/admin/feedback/.
 */

import { useState } from "react"
import { MessageSquare, KanbanSquare, List } from "lucide-react"
import "@/app/admin/cncpt-admin.css"

type FeedbackView = "inbox" | "board"

export interface AdminFeedbackWrapperProps {
  children: React.ReactNode
  defaultView?: FeedbackView
}

export function AdminFeedbackWrapper({
  children,
  defaultView = "inbox",
}: AdminFeedbackWrapperProps) {
  const [view, setView] = useState<FeedbackView>(defaultView)

  return (
    <div className="cncpt-admin">
      <div className="ca-page-h" style={{ marginBottom: 16 }}>
        <div>
          <h1>Feedback</h1>
          <div className="sub">Triage and respond to platform feedback</div>
        </div>
        {/* View toggle — matches Hybrid design pattern */}
        <div
          className="ca-row"
          style={{
            background: "var(--ca-bg)",
            border: "1px solid var(--ca-border)",
            borderRadius: 7,
            padding: 2,
            gap: 2,
          }}
        >
          <button
            type="button"
            className="ca-btn ca-btn--xs"
            style={{
              borderRadius: 5,
              background: view === "inbox" ? "#fff" : "transparent",
              boxShadow: view === "inbox" ? "var(--ca-shadow-sm)" : "none",
              color: view === "inbox" ? "var(--ca-text)" : "var(--ca-text-soft)",
              border: "none",
            }}
            onClick={() => setView("inbox")}
          >
            <List size={12} aria-hidden /> Inbox
          </button>
          <button
            type="button"
            className="ca-btn ca-btn--xs"
            style={{
              borderRadius: 5,
              background: view === "board" ? "#fff" : "transparent",
              boxShadow: view === "board" ? "var(--ca-shadow-sm)" : "none",
              color: view === "board" ? "var(--ca-text)" : "var(--ca-text-soft)",
              border: "none",
            }}
            onClick={() => setView("board")}
          >
            <KanbanSquare size={12} aria-hidden /> Board
          </button>
        </div>
      </div>

      {/* View tabs — shown in topbar per Hybrid design */}
      <div className="ca-tabs" style={{ marginBottom: 16, marginLeft: -24, marginRight: -24, paddingLeft: 24 }}>
        <button
          type="button"
          className={`ca-tab${view === "inbox" ? " is-on" : ""}`}
          onClick={() => setView("inbox")}
        >
          <MessageSquare size={13} aria-hidden /> Inbox
        </button>
        <button
          type="button"
          className={`ca-tab${view === "board" ? " is-on" : ""}`}
          onClick={() => setView("board")}
        >
          <KanbanSquare size={13} aria-hidden /> Triage Board
        </button>
      </div>

      {/* Content — FeedbackDashboard or kanban (existing component handles both) */}
      <div data-feedback-view={view}>{children}</div>
    </div>
  )
}
