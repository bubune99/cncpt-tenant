"use client"

/**
 * AdminShell — Hybrid-direction platform/super-admin shell.
 *
 * Implements the Hybrid design from:
 *   docs/designs/cncpt-web-admin-ui/project/direction-hybrid.jsx
 *   admin-styles.css (dirH__* classes)
 *
 * Shell structure:
 *   .cncpt-admin > .ca-board
 *     .ca-sidebar       (224px left nav)
 *     .ca-main          (flex-1 vertical column)
 *       .ca-topbar      (48px breadcrumb + actions bar)
 *       .ca-page        (scrollable content)
 *     .ca-rrail         (304px right live-activity rail)
 */

import React, { type ReactNode } from "react"
import {
  LayoutDashboard,
  Inbox,
  Users,
  Building2,
  Globe,
  CreditCard,
  Wand2,
  Sparkles,
  MessageSquare,
  KanbanSquare,
  Rocket,
  BarChart3,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  MoreHorizontal,
  Bell,
  LifeBuoy,
  PanelRightClose,
  Filter,
  Download,
  UserPlus,
  Key,
  Ban,
  ShieldCheck,
  MessageCircle,
  UserX,
  Frown,
  type LucideIcon,
} from "lucide-react"
import "@/app/admin/cncpt-admin.css"

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdminSection =
  | "home"
  | "inbox"
  | "users"
  | "teams"
  | "tenants"
  | "tiers"
  | "credits"
  | "overrides"
  | "fb-inbox"
  | "fb-board"
  | "fb-shipped"
  | "analytics"
  | "activity"
  | "platform"
  // Legacy section IDs kept for backwards compat with old dashboard.tsx
  | "overview"
  | "clients"
  | "subdomains"
  | "ai-credits"
  | "feedback"
  | "settings"

export type AdminRole = "super" | "tenant"

interface NavItemDef {
  id: AdminSection
  label: string
  Icon: LucideIcon
  badge?: number | string
  badgeKind?: "hot" | "blue" | "default"
}

interface NavGroupDef {
  heading: string
}

type NavEntry = NavItemDef | NavGroupDef

function isGroup(entry: NavEntry): entry is NavGroupDef {
  return "heading" in entry
}

// ─── Nav definitions ─────────────────────────────────────────────────────────

const SUPER_NAV: NavEntry[] = [
  { id: "home",      label: "Overview",              Icon: LayoutDashboard },
  { id: "inbox",     label: "Admin Inbox",            Icon: Inbox,           badge: 18, badgeKind: "hot" },
  { heading: "Manage" },
  { id: "users",     label: "Users",                  Icon: Users,           badge: "12.4k" },
  { id: "teams",     label: "Teams",                  Icon: Building2,       badge: "1,072" },
  { id: "tenants",   label: "Tenants & Subdomains",   Icon: Globe },
  { id: "tiers",     label: "Subscription Tiers",     Icon: CreditCard },
  { id: "credits",   label: "AI Credits",             Icon: Sparkles },
  { id: "overrides", label: "Permission Overrides",   Icon: Wand2 },
  { heading: "Feedback" },
  { id: "fb-inbox",  label: "Inbox",                  Icon: MessageSquare,   badge: 12, badgeKind: "hot" },
  { id: "fb-board",  label: "Triage Board",           Icon: KanbanSquare,    badge: 6,  badgeKind: "blue" },
  { id: "fb-shipped",label: "Shipped",                Icon: Rocket },
  { heading: "Insights" },
  { id: "analytics", label: "Analytics",              Icon: BarChart3 },
  { id: "activity",  label: "Activity Log",           Icon: History },
  { heading: "Settings" },
  { id: "platform",  label: "Platform Settings",      Icon: Settings },
]

// ─── Activity event type ─────────────────────────────────────────────────────

interface ActivityEvent {
  who: string
  text: string
  time: string
  Icon: LucideIcon
  color: string
  actionable?: boolean
}

const DEMO_EVENTS: ActivityEvent[] = [
  { who: "system",  text: "new signup · daydream.io",              time: "1m ago",  Icon: UserPlus,  color: "#10b981" },
  { who: "Felix K.",text: "tier changed Starter → DTF Pro",        time: "2m ago",  Icon: CreditCard,color: "#1d4ed8" },
  { who: "Aisha B.",text: "credits topped up +5,000",              time: "8m ago",  Icon: Sparkles,  color: "#9333ea" },
  { who: "Jonas B.",text: "requested DTF Gang Sheet access",       time: "14m ago", Icon: ShieldCheck,color: "#a16207", actionable: true },
  { who: "Hana Y.", text: "requested DTF Pro permission",          time: "32m ago", Icon: ShieldCheck,color: "#a16207", actionable: true },
  { who: "Diego R.",text: "left feedback · CSAT 1 · billing",     time: "1h ago",  Icon: Frown,     color: "#dc2626" },
  { who: "system",  text: "subdomain craftshop orphaned",          time: "2h ago",  Icon: Globe,     color: "#dc2626", actionable: true },
  { who: "Tomás S.",text: "API key revoked",                       time: "3h ago",  Icon: Key,       color: "#475569" },
  { who: "Owen R.", text: "suspended · policy violation",          time: "5h ago",  Icon: Ban,       color: "#dc2626" },
  { who: "Diego R.",text: "credit balance reached 0",              time: "6h ago",  Icon: Sparkles,  color: "#a16207" },
  { who: "Priya S.",text: "joined · daydream tenant",              time: "1d ago",  Icon: UserPlus,  color: "#10b981" },
]

// ─── Helper: initials ─────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SidebarProps {
  active: AdminSection
  role: AdminRole
  onSectionChange: (s: AdminSection) => void
  onRoleChange: (r: AdminRole) => void
  adminEmail?: string
}

function Sidebar({
  active,
  role,
  onSectionChange,
  onRoleChange,
  adminEmail = "admin@cncpt.app",
}: SidebarProps) {
  const nav = role === "super" ? SUPER_NAV : SUPER_NAV

  return (
    <aside className="ca-sidebar">
      {/* Brand */}
      <div className="ca-sidebar__brand">
        <div className="ca-sidebar__brand-mark">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1L13 4.5V10.5L7 13L1 10.5V4.5L7 1Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <span className="ca-sidebar__brand-name">CNCPT Admin</span>
        <ChevronDown size={12} className="ca-sidebar__brand-chev" />
      </div>

      {/* Search */}
      <div className="ca-sidebar__search">
        <Search size={13} aria-hidden />
        <span className="ca-sidebar__search-q">Search…</span>
        <span className="ca-kbd">⌘K</span>
      </div>

      {/* Role switch */}
      <div className="ca-sidebar__role-switch">
        <button
          className={role === "super" ? "is-on" : ""}
          onClick={() => onRoleChange("super")}
          type="button"
        >
          Super Admin
        </button>
        <button
          className={role === "tenant" ? "is-on" : ""}
          onClick={() => onRoleChange("tenant")}
          type="button"
        >
          Tenant
        </button>
      </div>

      {/* Nav */}
      <nav className="ca-sidebar__nav">
        {nav.map((entry, i) => {
          if (isGroup(entry)) {
            return (
              <div className="ca-sidebar__nav-h" key={`h${i}`}>
                <ChevronDown size={11} aria-hidden />
                {entry.heading}
              </div>
            )
          }
          const { id, label, Icon, badge, badgeKind } = entry
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              className={`ca-sidebar__nav-item${isActive ? " is-active" : ""}`}
              onClick={() => onSectionChange(id)}
            >
              <Icon size={14} className="ca-nav-icon" aria-hidden />
              <span>{label}</span>
              {badge !== undefined && (
                <span
                  className={`ca-nav-badge${badgeKind === "hot" ? " is-hot" : badgeKind === "blue" ? " is-blue" : ""}`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="ca-sidebar__foot">
        <div className="ca-avatar ca-avatar--sm ca-avatar--orange">
          {initials(adminEmail.split("@")[0])}
        </div>
        <div className="ca-col" style={{ flex: 1, minWidth: 0, gap: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>
            {adminEmail.split("@")[0]}
          </div>
          <div className="ca-muted" style={{ fontSize: 10.5 }}>
            super admin
          </div>
        </div>
        <button className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost" type="button">
          <MoreHorizontal size={13} aria-hidden />
        </button>
      </div>
    </aside>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  crumbs: string[]
  right?: ReactNode
}

function Topbar({ crumbs, right }: TopbarProps) {
  return (
    <header className="ca-topbar">
      <div className="ca-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span className={i === crumbs.length - 1 ? "ca-crumb-active" : "ca-muted"}>
              {c}
            </span>
            {i < crumbs.length - 1 && (
              <ChevronRight size={12} className="ca-crumb-sep" aria-hidden />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="ca-topbar__spacer" />
      {right ?? (
        <>
          <button className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost" type="button">
            <Bell size={13} aria-hidden />
          </button>
          <button className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost" type="button">
            <LifeBuoy size={13} aria-hidden />
          </button>
        </>
      )}
    </header>
  )
}

// ─── Right Activity Rail ──────────────────────────────────────────────────────

type RailTab = "activity" | "queue" | "mentions"

interface ActivityRailProps {
  events?: ActivityEvent[]
}

function ActivityRail({ events = DEMO_EVENTS }: ActivityRailProps) {
  const [activeTab, setActiveTab] = React.useState<RailTab>("activity")

  return (
    <aside className="ca-rrail">
      <div className="ca-rrail__head">
        <span className="ca-live-dot" aria-hidden />
        <h3>Live activity</h3>
        <button className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost" type="button">
          <Filter size={12} aria-hidden />
        </button>
        <button className="ca-iconbtn ca-iconbtn--sm ca-iconbtn--ghost" type="button">
          <PanelRightClose size={12} aria-hidden />
        </button>
      </div>
      <div className="ca-rrail__tabs">
        {(
          [
            { id: "activity" as RailTab, label: "Activity" },
            { id: "queue" as RailTab,    label: "Queue",    n: 5 },
            { id: "mentions" as RailTab, label: "Mentions", n: 2 },
          ] as const
        ).map(({ id, label, n }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "is-on" : ""}
            onClick={() => setActiveTab(id)}
          >
            {label}
            {n !== undefined && (
              <span className="ca-muted" style={{ marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>
                {n}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="ca-rrail__body">
        {events.map((ev, i) => (
          <div
            key={i}
            className={`ca-act-row${ev.actionable ? " is-actionable" : ""}`}
          >
            <div
              className="ca-act-icon"
              style={{ color: ev.color }}
            >
              <ev.Icon size={12} aria-hidden />
            </div>
            <div className="ca-act-body">
              <span className="ca-act-who">{ev.who}</span>{" "}
              {ev.text}
              {ev.actionable && (
                <span
                  className="ca-btn ca-btn--xs ca-btn--ghost"
                  style={{ marginLeft: 6, fontSize: 11, padding: "1px 6px" }}
                >
                  Review
                </span>
              )}
              <div className="ca-act-time">{ev.time}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

// ─── Main exported shell ──────────────────────────────────────────────────────

export interface AdminShellProps {
  active: AdminSection
  crumbs?: string[]
  topbarRight?: ReactNode
  children: ReactNode
  role?: AdminRole
  onSectionChange?: (s: AdminSection) => void
  onRoleChange?: (r: AdminRole) => void
  adminEmail?: string
  showRail?: boolean
  activityEvents?: ActivityEvent[]
}

export function AdminShell({
  active,
  crumbs = ["Admin"],
  topbarRight,
  children,
  role = "super",
  onSectionChange = () => undefined,
  onRoleChange = () => undefined,
  adminEmail,
  showRail = true,
  activityEvents,
}: AdminShellProps) {
  return (
    <div className="cncpt-admin">
      <div className="ca-board">
        <Sidebar
          active={active}
          role={role}
          onSectionChange={onSectionChange}
          onRoleChange={onRoleChange}
          adminEmail={adminEmail}
        />
        <main className="ca-main">
          <Topbar crumbs={crumbs} right={topbarRight} />
          <div className="ca-page">
            <div className="ca-page-body">{children}</div>
          </div>
        </main>
        {showRail && <ActivityRail events={activityEvents} />}
      </div>
    </div>
  )
}

export { Topbar as AdminTopbar, ActivityRail, Sidebar as AdminSidebar, initials as adminInitials }
