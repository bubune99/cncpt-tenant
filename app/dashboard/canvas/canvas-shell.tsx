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
  comms: "Communications",
  "comms-announce": "Communications",
  "comms-campaigns": "Communications",
  "comms-feedback": "Communications",
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

  // Leave detail view whenever the section changes away from Sites.
  useEffect(() => {
    if (activeSection !== "sites") setDetailSubdomain(null)
  }, [activeSection])

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

  const crumbs = ["Workspace", SECTION_LABEL[activeSection] ?? "Overview"]
  const isSitesDetail = activeSection === "sites" && detailSubdomain

  // The Sites detail renders its own topbar (with tabs); every other view uses
  // the default CanvasTopbar.
  const renderMain = () => {
    if (activeSection === "overview") {
      return <CanvasOverview user={user} subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
    }
    if (activeSection === "sites") {
      if (detailSubdomain) {
        return (
          <CanvasSubdomainDetail
            subdomain={detailSubdomain}
            subdomains={subdomains}
            onBack={() => setDetailSubdomain(null)}
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
    if (activeSection === "team") {
      return <CanvasTeam user={user} />
    }
    if (activeSection.startsWith("comms")) {
      const commsTab =
        activeSection === "comms-announce" ? "announce"
        : activeSection === "comms-campaigns" ? "campaigns"
        : activeSection === "comms-feedback" ? "feedback"
        : "tickets"
      return <CanvasComms key={activeSection} initialTab={commsTab} />
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
    <div className="tnt-canvas dirH br-theme">
      <CanvasSidebar
        user={user}
        subdomains={subdomains}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        selectedSubdomain={selectedSubdomain}
        setSelectedSubdomain={setSelectedSubdomain}
        onOpenSearch={() => setPaletteOpen(true)}
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
