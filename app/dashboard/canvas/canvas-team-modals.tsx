"use client"

/**
 * TEAM — Invite member modal. Recreates Tnt_InviteModal. WIRED to the real
 * POST /api/teams/[teamId]/invitations endpoint ({ email, role }). On success
 * it dispatches a refresh so the Members panel can re-load.
 */

import { useState } from "react"
import { UserPlus, X, Check, Loader2 } from "lucide-react"
import { getRoleLabel, getRoleDescription, getAssignableRoles, type TeamRole } from "@/lib/team-utils"

interface CanvasInviteModalProps {
  teamId: string
  onClose: () => void
}

// Roles an owner/admin can assign (server enforces too); show the full set
// minus "owner" which can't be granted via invite.
const INVITABLE: TeamRole[] = ["admin", "member", "viewer"]

export function CanvasInviteModal({ teamId, onClose }: CanvasInviteModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<TeamRole>("member")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const send = async () => {
    if (!emailValid || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSent(true)
        // Let the members panel know to refresh, then close shortly after.
        window.dispatchEvent(new CustomEvent("nw:team-refresh"))
        setTimeout(onClose, 900)
      } else {
        setError(data?.error || "Failed to send invitation")
      }
    } catch {
      setError("Failed to send invitation")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="tnt__modal-wrap" onClick={onClose}>
      <div className="tnt__modal tnt__modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="tnt__modal-head">
          <div className="tnt__modal-icon tnt__modal-icon--info"><UserPlus /></div>
          <div className="col" style={{ flex: 1, gap: 2 }}>
            <h3 className="tnt__modal-title">Invite a team member</h3>
            <p className="tnt__modal-sub">They'll get an email link to join.</p>
          </div>
          <button className="iconbtn iconbtn--sm iconbtn--ghost" onClick={onClose} aria-label="Close"><X style={{ width: 13, height: 13 }} /></button>
        </div>
        <div className="tnt__modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="tnt__field">
            <span className="tnt__field-label">Email address</span>
            <div className={"tnt__input" + (emailValid ? "" : "")}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                style={{ flex: 1, border: 0, outline: "none", fontSize: 12.5, background: "transparent", color: "var(--br-text)" }}
              />
              {emailValid ? <Check style={{ width: 14, height: 14, color: "#10b981" }} /> : null}
            </div>
          </div>

          <div className="tnt__field">
            <span className="tnt__field-label">Role</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {INVITABLE.map((r) => {
                const on = role === r
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{ padding: "10px 11px", borderRadius: 8, textAlign: "left", border: "1.5px solid " + (on ? "var(--br-primary)" : "var(--br-border)"), background: on ? "#eff6ff" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, fontFamily: "inherit" }}
                  >
                    <div className="row" style={{ gap: 5 }}>
                      <strong style={{ fontSize: 12 }}>{getRoleLabel(r)}</strong>
                      {on ? <Check style={{ width: 12, height: 12, color: "var(--br-primary)", marginLeft: "auto" }} /> : null}
                    </div>
                    <span className="muted" style={{ fontSize: 10.5, lineHeight: 1.4 }}>{getRoleDescription(r)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error ? <div className="tnt__banner tnt__banner--err" style={{ fontSize: 12 }}>{error}</div> : null}
          {sent ? <div className="tnt__banner tnt__banner--ok" style={{ fontSize: 12 }}>Invitation sent.</div> : null}
        </div>
        <div className="tnt__modal-foot">
          <button className="btn btn--secondary btn--xs" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary btn--xs" onClick={send} disabled={!emailValid || sending} style={{ opacity: !emailValid || sending ? 0.6 : 1 }}>
            {sending ? <Loader2 style={{ width: 12, height: 12 }} /> : null} Send invitation
          </button>
        </div>
      </div>
    </div>
  )
}
