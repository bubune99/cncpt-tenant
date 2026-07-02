"use client"

/**
 * TEAM — Members + Roles & Permissions + Activity. Recreates tenant-team.jsx
 * (Tnt_Members / Tnt_RolesPermissions / Tnt_ActivityLog) on the Canvas chrome.
 *
 * Each sidebar Team entry (Members / Roles & Permissions / Activity log) maps to
 * a distinct section that mounts this component with the matching `initialTab`
 * (see canvas-shell), so the three nav items render three distinct views. The
 * in-view tab bar lets you switch between them without leaving the section.
 *
 * DATA WIRING:
 *  - Members: REAL. Loads the user's teams (/api/teams) and, per team, the
 *    members (/api/teams/[teamId]/members) and pending invitations
 *    (/api/teams/[teamId]/invitations). Invite + remove use the real endpoints.
 *  - Roles & Permissions: REAL — see canvas-team-roles.tsx (TEAM_PERMISSIONS).
 *  - Activity log: REAL — see canvas-team-activity.tsx (/api/dashboard/activity).
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  UserPlus, Filter, Mail, MoreHorizontal, ShieldCheck, History,
  Users, Crown, Plus, Loader2,
} from "lucide-react"
import { getRoleLabel, type TeamRole } from "@/lib/team-utils"
import { CanvasInviteModal } from "./canvas-team-modals"
import { RolesPanel } from "./canvas-team-roles"
import { ActivityPanel } from "./canvas-team-activity"

type Tab = "members" | "roles" | "activity"

interface CanvasTeamProps {
  user: any
  /** Which view to open — driven by the active sidebar Team entry. */
  initialTab?: Tab
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

export function CanvasTeam({ user, initialTab = "members" }: CanvasTeamProps) {
  const [tab, setTab] = useState<Tab>(initialTab)
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
        {tab === "roles" ? <RolesPanel onManageMembers={() => setTab("members")} /> : null}
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
