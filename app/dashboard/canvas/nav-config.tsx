"use client"

/**
 * Canvas navigation config.
 *
 * Maps the Tenant Admin Canvas grouped nav (Sites / Team / Communications /
 * Account) onto the dashboard's EXISTING IA. Every entry resolves to one of:
 *  - `section`: drives the in-page section router (activeSection state)
 *  - `route`:   navigates to a real sub-route (/dashboard/teams, /support, …)
 *
 * The design's "Subdomains / Branding / Custom domains / Hosting" are the
 * existing `overview` / `branding` / `domains` / `frontend` sections; the
 * design's "Members / Roles / Activity" map to the /dashboard/teams route;
 * "Support inbox" → /dashboard/support. Sections that have no backing
 * implementation yet (announcements, campaigns, feedback, roles) are marked
 * `phase2` so the shell can show them as reachable-but-coming-soon rather than
 * inventing fake screens.
 */

import {
  LayoutDashboard,
  Bell,
  Globe,
  Paintbrush,
  Link as LinkIcon,
  Server,
  Users,
  ShieldCheck,
  History,
  MessageSquare,
  Megaphone,
  Send,
  MessagesSquare,
  Lightbulb,
  Sparkles,
  CreditCard,
  Settings,
  BarChart3,
  Bot,
  type LucideIcon,
} from "lucide-react"

export type NavBadgeKind = "default" | "blue" | "hot"

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  /** in-page section id consumed by DashboardContent */
  section?: string
  /** real route to navigate to */
  route?: string
  badge?: number
  badgeKind?: NavBadgeKind
  /** no backing screen yet — render as coming-soon */
  phase2?: boolean
}

export type NavEntry = { heading: string } | NavItem

export const NAV: NavEntry[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, section: "overview" },
  { id: "analytics", label: "Analytics", icon: BarChart3, section: "analytics" },

  { heading: "Sites" },
  { id: "subdomains", label: "Subdomains", icon: Globe, section: "sites" },
  { id: "branding", label: "Branding", icon: Paintbrush, section: "branding" },
  { id: "domains", label: "Custom domains", icon: LinkIcon, section: "domains" },
  { id: "frontend", label: "Hosting", icon: Server, section: "frontend" },
  { id: "visibility", label: "Visibility", icon: ShieldCheck, section: "visibility" },

  { heading: "Team" },
  { id: "members", label: "Members", icon: Users, section: "team" },
  { id: "roles", label: "Roles & Permissions", icon: ShieldCheck, section: "team" },
  { id: "activity", label: "Activity log", icon: History, section: "team" },

  { heading: "Communications" },
  { id: "tickets", label: "Support inbox", icon: MessageSquare, route: "/dashboard/support" },
  { id: "announce", label: "Announcements", icon: Megaphone, section: "overview", phase2: true },
  { id: "campaigns", label: "Email campaigns", icon: Send, section: "overview", phase2: true },
  { id: "feedback", label: "Feedback board", icon: Lightbulb, section: "overview", phase2: true },

  { heading: "Account" },
  { id: "mcp", label: "MCP / AI Agents", icon: Bot, section: "mcp" },
  { id: "credits", label: "AI Credits", icon: Sparkles, section: "credits" },
  { id: "billing", label: "Billing & plan", icon: CreditCard, section: "billing" },
  { id: "settings", label: "Workspace settings", icon: Settings, section: "settings" },
]

export function isHeading(e: NavEntry): e is { heading: string } {
  return (e as { heading?: string }).heading !== undefined
}

/** Resolve the active nav item id from the current section. The two "alias"
 * items (subdomains → overview) share a section; we prefer the canonical one. */
export function activeNavId(section: string): string {
  const sectionToNav: Record<string, string> = {
    overview: "overview",
    sites: "subdomains",
    team: "members",
    analytics: "analytics",
    branding: "branding",
    domains: "domains",
    frontend: "frontend",
    visibility: "visibility",
    mcp: "mcp",
    credits: "credits",
    billing: "billing",
    settings: "settings",
  }
  return sectionToNav[section] ?? "overview"
}

export { Bell, History, MessagesSquare }
