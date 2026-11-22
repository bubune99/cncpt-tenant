"use client"

/**
 * Tenant Admin Canvas — the shell.
 *
 * Recreates the design chrome (dirH rail + topbar + right Activity rail) and
 * hosts the content column. The Overview section renders the new Canvas
 * overview; every OTHER existing section (branding, domains, hosting, credits,
 * billing, settings, analytics, mcp, visibility) is rendered THROUGH the
 * existing DashboardContent unchanged — kept reachable and working inside the
 * new shell. Their full redesign is Phase 2+.
 *
 * The existing DashboardChat is reused as the real "Ask CNCPT" AI dock (its
 * floating launcher is restyled via canvas.css + a data attribute).
 */

import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import { DashboardContent } from "../dashboard-content"
import { CanvasSidebar } from "./canvas-sidebar"
import { CanvasTopbar } from "./canvas-topbar"
import { CanvasActivityRail } from "./canvas-activity-rail"
import { CanvasOverview } from "./canvas-overview"
import { CanvasSites } from "./canvas-sites"
import { CanvasSubdomainDetail } from "./canvas-subdomain-detail"
import { CanvasTeam } from "./canvas-team"
import { CanvasComms } from "./canvas-comms"
import { CanvasAccount } from "./canvas-account"
import { CommandPalette } from "./command-palette"
import "./canvas.css"

interface CanvasShellProps {
  user: any
  subdomains: any[]
  activeSection: string
  setActiveSection: (s: string) => void
  selectedSubdomain: string | null
  setSelectedSubdomain: (s: string | null) => void
}

const SECTION_LABEL: Record<string, string> = {
  overview: "Overview",
  sites: "Subdomains",
  team: "Team",
  analytics: "Analytics",
  branding: "Branding",
  domains: "Custom domains",
  frontend: "Hosting",
  visibility: "Visibility",
  settings: "Workspace settings",
  credits: "AI Credits",
  billing: "Billing & plan",
  mcp: "MCP / AI Agents",
}

// Communications sub-views each carry their own header name (breadcrumb reads
// Workspace › Communications › <view>) so the topbar never drifts to "Overview".
const COMMS_LABEL: Record<string, string> = {
  comms: "Support inbox",
  "comms-announce": "Announcements",
  "comms-campaigns": "Email campaigns",
  "comms-team-chat": "Team messages",
  "comms-feedback": "Feedback board",
}

// Team sub-views each carry their own header name (breadcrumb reads
// Workspace › Team › <view>) so the topbar reflects the active nav item.
const TEAM_LABEL: Record<string, string> = {
  team: "Members",
  "team-roles": "Roles & Permissions",
  "team-activity": "Activity log",
}

function userInitials(user: any): string {
  const name = user?.displayName ?? user?.name
  const email = user?.primaryEmail ?? user?.email
  const src = (name && name.trim()) || (email ? email.split("@")[0] : "") || "U"
  return src.split(/[\s.@_-]+/).slice(0, 2).map((s: string) => s[0]).join("").toUpperCase()
}

export function CanvasShell({
  user,
  subdomains,
  activeSection,
  setActiveSection,
  selectedSubdomain,
  setSelectedSubdomain,
}: CanvasShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  // When viewing a single subdomain's detail (Sites section).
  const [detailSubdomain, setDetailSubdomain] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<string | undefined>(undefined)
  const [newSiteRequest, setNewSiteRequest] = useState(0)
  // Phone width: the sidebar is a drawer (walk 2026-11-20 at 440px: both rails left the page 0px wide).
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => { setNavOpen(false) }, [activeSection, detailSubdomain])
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNavOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [navOpen])

  // Leave detail view whenever the section changes away from Sites.
  useEffect(() => {
    if (activeSection !== "sites") setDetailSubdomain(null)
  }, [activeSection])

  // "open-site" (Overview's site rows): go to Sites and open that site's page.
  useEffect(() => {
    // detail: "<subdomain>" or { subdomain, tab } (the setup guide opens the tab for its step).
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<string | { subdomain: string; tab?: string }>).detail
      const sub = typeof d === "string" ? d : d?.subdomain
      if (typeof sub !== "string" || !subdomains.some((s) => s.subdomain === sub)) return
      window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "sites" }))
      setSelectedSubdomain(sub)
      setDetailTab(typeof d === "string" ? undefined : d.tab)
      setDetailSubdomain(sub)
    }
    window.addEventListener("open-site", onOpen)
    return () => window.removeEventListener("open-site", onOpen)
  }, [subdomains, setSelectedSubdomain])

  // ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const crumbs = activeSection.startsWith("comms")
    ? ["Workspace", "Communications", COMMS_LABEL[activeSection] ?? "Support inbox"]
    : activeSection.startsWith("team")
    ? ["Workspace", "Team", TEAM_LABEL[activeSection] ?? "Members"]
    : ["Workspace", SECTION_LABEL[activeSection] ?? "Overview"]
  const isSitesDetail = activeSection === "sites" && detailSubdomain

  // The Sites detail renders its own topbar (with tabs); every other view uses
  // the default CanvasTopbar.
  const renderMain = () => {
    if (activeSection === "overview") {
      return <CanvasOverview user={user} subdomains={subdomains} selectedSubdomain={selectedSubdomain} newSiteRequest={newSiteRequest} onNewSiteHandled={() => setNewSiteRequest(0)} />
    }
    if (activeSection === "sites") {
      if (detailSubdomain) {
        return (
          <CanvasSubdomainDetail
            key={detailSubdomain + ":" + (detailTab ?? "")}
            subdomain={detailSubdomain}
            subdomains={subdomains}
            initialTab={detailTab}
            onBack={() => { setDetailSubdomain(null); setDetailTab(undefined) }}
          />
        )
      }
      return (
        <CanvasSites
          subdomains={subdomains}
          onManage={(s) => { setSelectedSubdomain(s); setDetailSubdomain(s) }}
        />
      )
    }
    if (activeSection.startsWith("team")) {
      const teamTab =
        activeSection === "team-roles" ? "roles"
        : activeSection === "team-activity" ? "activity"
        : "members"
      return <CanvasTeam key={activeSection} user={user} initialTab={teamTab} />
    }
    if (activeSection.startsWith("comms")) {
      const commsTab =
        activeSection === "comms-announce" ? "announce"
        : activeSection === "comms-campaigns" ? "campaigns"
        : activeSection === "comms-team-chat" ? "team-chat"
        : activeSection === "comms-feedback" ? "feedback"
        : "tickets"
      return <CanvasComms key={activeSection} initialTab={commsTab} subdomains={subdomains} />
    }
    // Account: AI Credits + Billing + Branding + Workspace settings under one
    // tabbed surface. The three sidebar entries open the matching tab.
    if (activeSection === "credits" || activeSection === "billing" || activeSection === "settings") {
      const initialTab = activeSection === "billing" ? "billing" : activeSection === "settings" ? "settings" : "credits"
      return <CanvasAccount key={activeSection} initialTab={initialTab} selectedSubdomain={selectedSubdomain} />
    }
    // Existing shadcn sections, hosted inside the canvas shell.
    return (
      <div className="dirH__page">
        <div className="tnt__embed">
          <DashboardContent
            user={user}
            subdomains={subdomains}
            activeSection={activeSection}
            selectedSubdomain={selectedSubdomain}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={"tnt-canvas dirH br-theme" + (navOpen ? " is-nav-open" : "")}>
      <button
        type="button"
        className="dirH__menu-btn iconbtn iconbtn--ghost"
        aria-label={navOpen ? "Close menu" : "Open menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((v) => !v)}
        data-ui="shell.menu"
      >
        {navOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
      </button>
      {navOpen ? <div className="dirH__nav-backdrop" aria-hidden="true" onPointerDown={() => setNavOpen(false)} /> : null}
      <CanvasSidebar
        user={user}
        subdomains={subdomains}
        activeSection={activeSection}
        // Choosing a place also leaves an open site's page: from a site, Client sites and All sites did nothing
        // (activeSection was already "sites", so the effect that clears the detail never ran; walk 2026-11-22).
        setActiveSection={(sec: string) => { setDetailSubdomain(null); setDetailTab(undefined); setActiveSection(sec); setNavOpen(false) }}
        selectedSubdomain={selectedSubdomain}
        setSelectedSubdomain={(sub: string | null) => { setSelectedSubdomain(sub); setNavOpen(false) }}
        onOpenSearch={() => setPaletteOpen(true)}
        onNewSite={() => { setActiveSection("overview"); setNewSiteRequest((n) => n + 1); setNavOpen(false) }}
      />

      <div className="dirH__main">
        {isSitesDetail ? null : <CanvasTopbar crumbs={crumbs} userInitials={userInitials(user)} />}
        {renderMain()}
      </div>

      <CanvasActivityRail subdomains={subdomains} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        setActiveSection={setActiveSection}
      />
    </div>
  )
}
