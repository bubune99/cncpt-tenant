"use client"

/**
 * TEAM — Members + Roles & Permissions + Activity. Recreates tenant-team.jsx
 * (Tnt_Members / Tnt_RolesPermissions / Tnt_ActivityLog) on the Canvas chrome.
 *
 * DATA WIRING:
 *  - Members: REAL. Loads the user's teams (/api/teams) and, per team, the
 *    members (/api/teams/[teamId]/members) and pending invitations
 *    (/api/teams/[teamId]/invitations). Invite + remove use the real endpoints.
 *  - Roles & Permissions matrix: REAL. Built from TEAM_PERMISSIONS +
 *    PERMISSION_DESCRIPTIONS in lib/team-utils (the actual role→permission model
 *    enforced server-side). Columns Owner/Admin/Member/Viewer; checks reflect
 *    the real grants (owner = "*").
 *  - Activity log: PLACEHOLDER (no per-team audit source yet) — clearly labeled.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  UserPlus, Filter, Download, Mail, MoreHorizontal, ShieldCheck, History,
  Users, Crown, Shield, Eye, Check, X, Plus, Globe, CreditCard, Send,
  LayoutGrid, Loader2,
} from "lucide-react"
import {
  TEAM_PERMISSIONS, PERMISSION_DESCRIPTIONS, getRoleLabel, getRoleDescription,
  hasTeamPermission, type TeamRole,
} from "@/lib/team-utils"
import { CanvasInviteModal } from "./canvas-team-modals"

type Tab = "members" | "roles" | "activity"

interface CanvasTeamProps {
  user: any
}

interface Team { id: string; name: string; slug: string; description: string | null; memberCount: number; role?: string }
interface Member { id: string; userId: string; name?: string; email?: string; role: TeamRole; joinedAt?: string }
interface Invite { id: string; email: string; role: string; token: string }

const TABS: { id: Tab; l: string; icon: any }[] = [
  { id: "members", l: "Members", icon: Users },
  { id: "roles", l: "Roles & Permissions", icon: ShieldCheck },
  { id: "activity", l: "Activity log", icon: History },
]

function initialsOf(name?: string, email?: string): string {
  const src = (name && name.trim()) || (email ? email.split("@")[0] : "") || "?"
  return src.split(/[\s.@_-]+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase()
}

const ROLE_CHIP: Record<string, string> = {
  owner: "role-chip--owner", admin: "role-chip--admin",
  member: "role-chip--editor", viewer: "role-chip--viewer",
}

export function CanvasTeam({ user }: CanvasTeamProps) {
  const [tab, setTab] = useState<Tab>("members")
  const [inviteFor, setInviteFor] = useState<string | null>(null)

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
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        {tab === "members" ? <MembersPanel onInvite={(teamId) => setInviteFor(teamId)} /> : null}
        {tab === "roles" ? <RolesPanel /> : null}
        {tab === "activity" ? <ActivityPanel /> : null}
      </div>
      {inviteFor ? <CanvasInviteModal teamId={inviteFor} onClose={() => setInviteFor(null)} /> : null}
    </>
  )
}

/* ─── Members ─── */
function MembersPanel({ onInvite }: { onInvite: (teamId: string) => void }) {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>({})
  const [invitesByTeam, setInvitesByTeam] = useState<Record<string, Invite[]>>({})
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  // Reload when an invite is sent (CanvasInviteModal dispatches nw:team-refresh).
  useEffect(() => {
    const onRefresh = () => setReloadKey((k) => k + 1)
    window.addEventListener("nw:team-refresh", onRefresh)
    return () => window.removeEventListener("nw:team-refresh", onRefresh)
  }, [])

  useEffect(() => {
    let active = true
    fetch("/api/teams")
      .then((r) => (r.ok ? r.json() : { teams: [] }))
      .then(async (data) => {
        const ts: Team[] = Array.isArray(data.teams) ? data.teams : []
        if (!active) return
        setTeams(ts)
        // Load members + invitations per team in parallel.
        const m: Record<string, Member[]> = {}
        const inv: Record<string, Invite[]> = {}
        await Promise.all(
          ts.map(async (t) => {
            try {
              const [mr, ir] = await Promise.all([
                fetch(`/api/teams/${t.id}/members`).then((r) => (r.ok ? r.json() : { members: [] })),
                fetch(`/api/teams/${t.id}/invitations`).then((r) => (r.ok ? r.json() : { invitations: [] })),
              ])
              m[t.id] = Array.isArray(mr.members) ? mr.members : []
              inv[t.id] = Array.isArray(ir.invitations) ? ir.invitations : []
            } catch {
              m[t.id] = []; inv[t.id] = []
            }
          })
        )
        if (active) { setMembersByTeam(m); setInvitesByTeam(inv) }
      })
      .catch(() => { if (active) setTeams([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const totalMembers = Object.values(membersByTeam).reduce((s, m) => s + m.length, 0)
  const totalInvites = Object.values(invitesByTeam).reduce((s, m) => s + m.length, 0)

  if (loading) {
    return <div className="row" style={{ gap: 8, padding: 24 }} ><Loader2 className="tnt-spin" style={{ width: 16, height: 16 }} /> <span className="muted">Loading team…</span></div>
  }

  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>Members</h1>
          <div className="sub">
            {teams.length === 0
              ? "Create a team to collaborate and manage member access."
              : `${totalMembers} member${totalMembers === 1 ? "" : "s"} and ${totalInvites} pending invitation${totalInvites === 1 ? "" : "s"} across ${teams.length} team${teams.length === 1 ? "" : "s"}.`}
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn--secondary btn--xs" onClick={() => router.push("/dashboard/teams")}><Filter style={{ width: 12, height: 12 }} /> Manage teams</button>
          <button className="btn btn--primary btn--xs" onClick={() => router.push("/dashboard/teams/create")}><Plus style={{ width: 12, height: 12 }} /> New team</button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="card">
          <div className="tnt__empty">
            <div className="tnt__empty-glyph"><Users /></div>
            <h2 className="tnt__empty-h">No teams yet</h2>
            <p className="tnt__empty-p">Teams let you invite collaborators with scoped roles and share subdomains. Create your first team to get started.</p>
            <button className="btn btn--primary" onClick={() => router.push("/dashboard/teams/create")}><Plus style={{ width: 13, height: 13 }} /> Create team</button>
          </div>
        </div>
      ) : (
        teams.map((team) => {
          const members = membersByTeam[team.id] || []
          const invites = invitesByTeam[team.id] || []
          return (
            <div className="card" style={{ marginBottom: 16 }} key={team.id}>
              <div className="card__head">
                <div className="row" style={{ gap: 8 }}>
                  <h3 className="card__title">{team.name}</h3>
                  <span className="muted" style={{ fontSize: 11 }}>{members.length} member{members.length === 1 ? "" : "s"}</span>
                </div>
                <button className="btn btn--primary btn--xs" onClick={() => onInvite(team.id)}><UserPlus style={{ width: 12, height: 12 }} /> Invite</button>
              </div>

              {/* Pending invitations */}
              {invites.length > 0 ? (
                <div style={{ borderBottom: "1px solid var(--br-border)" }}>
                  <div className="eyebrow" style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--br-text-secondary)" }}>Pending invitations</div>
                  {invites.map((iv) => (
                    <div key={iv.id} className="row" style={{ padding: "10px 16px", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9999, background: "#eff6ff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Mail style={{ width: 14, height: 14, color: "var(--br-primary)" }} /></div>
                      <div className="col" style={{ flex: 1, gap: 1 }}>
                        <strong style={{ fontSize: 12.5 }}>{iv.email}</strong>
                        <span className="muted" style={{ fontSize: 11 }}>Invited as {getRoleLabel(iv.role as TeamRole)}</span>
                      </div>
                      <span className={"role-chip " + (ROLE_CHIP[iv.role] || "role-chip--editor")}>{getRoleLabel(iv.role as TeamRole)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Members table */}
              {members.length === 0 ? (
                <div className="card__body muted" style={{ fontSize: 12 }}>No members loaded for this team.</div>
              ) : (
                <table className="tnt__matrix" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr><th>Member</th><th style={{ width: 120 }}>Role</th><th style={{ width: 140 }}>Joined</th><th style={{ width: 50 }}></th></tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="row" style={{ gap: 9 }}>
                            <div className="avatar avatar--sm avatar--purple">{initialsOf(m.name, m.email)}</div>
                            <div className="col" style={{ gap: 0 }}>
                              <span style={{ fontWeight: 500 }}>{m.name || (m.email ? m.email.split("@")[0] : "Member")}</span>
                              <span className="muted" style={{ fontSize: 11 }}>{m.email || m.userId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={"role-chip " + (ROLE_CHIP[m.role] || "role-chip--editor")}>
                            {m.role === "owner" ? <Crown style={{ width: 10, height: 10 }} /> : null}
                            {getRoleLabel(m.role)}
                          </span>
                        </td>
                        <td className="muted" style={{ fontSize: 11 }}>{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}</td>
                        <td><button className="iconbtn iconbtn--sm iconbtn--ghost"><MoreHorizontal style={{ width: 13, height: 13 }} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })
      )}
    </>
  )
}

/* ─── Roles & Permissions (wired to real TEAM_PERMISSIONS) ─── */
const ROLE_COLS: TeamRole[] = ["owner", "admin", "member", "viewer"]
const PERM_GROUPS: { group: string; icon: any; perms: string[] }[] = [
  { group: "Team & Members", icon: Users, perms: ["team.view", "team.edit", "team.delete", "members.view", "members.invite", "members.remove", "members.edit_role"] },
  { group: "Invitations", icon: Send, perms: ["invitations.view", "invitations.create", "invitations.cancel"] },
  { group: "Subdomains", icon: Globe, perms: ["subdomains.view", "subdomains.add", "subdomains.remove", "subdomains.edit"] },
  { group: "Settings", icon: CreditCard, perms: ["settings.view", "settings.edit"] },
]

function RolesPanel() {
  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>Roles &amp; Permissions</h1>
          <div className="sub">What each role can do. These reflect the access enforced across your workspace.</div>
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

/* ─── Activity (placeholder) ─── */
function ActivityPanel() {
  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>Activity log</h1>
          <div className="sub">Actions taken by your team members.</div>
        </div>
      </div>
      <div className="card">
        <div className="tnt__empty" style={{ padding: "48px 24px" }}>
          <div className="tnt__empty-glyph"><History /></div>
          <h2 className="tnt__empty-h">Team activity log coming soon</h2>
          <p className="tnt__empty-p">A per-team audit trail (member changes, role updates, invites, subdomain shares) lands in a follow-up. There is no team-activity source wired yet, so no events are shown here rather than fabricated ones.</p>
        </div>
      </div>
    </>
  )
}
