"use client"

/**
 * TEAM · Roles & Permissions — REAL role model, no fabricated data.
 *
 * Built entirely from TEAM_PERMISSIONS + PERMISSION_DESCRIPTIONS in
 * lib/team-utils (the role→permission grants enforced server-side). Columns are
 * the four built-in roles (owner / admin / member / viewer); each cell reflects
 * the real grant (owner = "*"). This is an explanatory, read-only view — actual
 * per-member role assignment happens in the team detail (Members view).
 */

import { Users, Send, Globe, CreditCard, Crown, Shield, Eye, Check, X } from "lucide-react"
import {
  TEAM_PERMISSIONS, PERMISSION_DESCRIPTIONS, getRoleLabel, getRoleDescription,
  hasTeamPermission, type TeamRole,
} from "@/lib/team-utils"

const ROLE_COLS: TeamRole[] = ["owner", "admin", "member", "viewer"]
const PERM_GROUPS: { group: string; icon: any; perms: string[] }[] = [
  { group: "Team & Members", icon: Users, perms: ["team.view", "team.edit", "team.delete", "members.view", "members.invite", "members.remove", "members.edit_role"] },
  { group: "Invitations", icon: Send, perms: ["invitations.view", "invitations.create", "invitations.cancel"] },
  { group: "Subdomains", icon: Globe, perms: ["subdomains.view", "subdomains.add", "subdomains.remove", "subdomains.edit"] },
  { group: "Settings", icon: CreditCard, perms: ["settings.view", "settings.edit"] },
]

interface RolesPanelProps {
  /** Jump to the Members view where per-member role assignment happens. */
  onManageMembers: () => void
}

export function RolesPanel({ onManageMembers }: RolesPanelProps) {
  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>Roles &amp; Permissions</h1>
          <div className="sub">What each role can do. These reflect the access enforced across your workspace.</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn--secondary btn--xs" onClick={onManageMembers}>
            <Users style={{ width: 12, height: 12 }} /> Assign roles in Members
          </button>
        </div>
      </div>

      {/* Role cards */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head"><h3 className="card__title">Roles</h3><span className="muted" style={{ fontSize: 11 }}>4 built-in roles</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {ROLE_COLS.map((r, i) => {
            const Icon = r === "owner" ? Crown : r === "viewer" ? Eye : Shield
            const bg = r === "owner" ? "#fef3c7" : r === "admin" ? "#dbeafe" : r === "member" ? "#ede9fe" : "#f1f5f9"
            const fg = r === "owner" ? "#92400e" : r === "admin" ? "#1d4ed8" : r === "member" ? "#6d28d9" : "#475569"
            return (
              <div key={r} style={{ padding: 14, borderRight: i < ROLE_COLS.length - 1 ? "1px solid var(--br-border)" : "none", display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="row" style={{ gap: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 5, background: bg, color: fg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon style={{ width: 12, height: 12 }} /></span>
                  <strong style={{ fontSize: 13 }}>{getRoleLabel(r)}</strong>
                </div>
                <span className="muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{getRoleDescription(r)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Permission matrix */}
      <div className="card">
        <div className="card__head">
          <div>
            <h3 className="card__title">Permissions matrix</h3>
            <div className="muted" style={{ fontSize: 11 }}>What each role is granted. Owners always have everything.</div>
          </div>
        </div>

        <div className="tnt__perm-row" style={{ background: "var(--br-surface)", borderBottom: "1px solid var(--br-border)" }}>
          <div className="head-cell" style={{ textAlign: "left" }}>Capability</div>
          {ROLE_COLS.map((r) => <div key={r} className="head-cell">{getRoleLabel(r)}</div>)}
          <div className="head-cell" /><div className="head-cell" />
        </div>

        {PERM_GROUPS.map((grp) => {
          const Icon = grp.icon
          return (
            <div key={grp.group}>
              <div className="row" style={{ padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid var(--br-border)", gap: 8 }}>
                <Icon style={{ width: 13, height: 13, color: "var(--br-primary)" }} />
                <strong style={{ fontSize: 12 }}>{grp.group}</strong>
                <span className="muted" style={{ fontSize: 11 }}>{grp.perms.length} permissions</span>
              </div>
              {grp.perms.map((perm) => (
                <div key={perm} className="tnt__perm-row">
                  <div className="col" style={{ gap: 2 }}>
                    <span className="tnt__perm-name">{PERMISSION_DESCRIPTIONS[perm] || perm}</span>
                    <span className="tnt__perm-desc mono" style={{ fontSize: 10.5 }}>{perm}</span>
                  </div>
                  {ROLE_COLS.map((r) => {
                    const granted = hasTeamPermission(TEAM_PERMISSIONS[r], perm)
                    return (
                      <div key={r} className="toggle-cell">
                        <span className={"tnt__perm-check " + (granted ? "tnt__perm-check--on" : "tnt__perm-check--off")}>
                          {granted ? <Check /> : <X />}
                        </span>
                      </div>
                    )
                  })}
                  <div /><div />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
