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
  const isOverview = activeSection === "overview"

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
        <CanvasTopbar crumbs={crumbs} userInitials={userInitials(user)} />

        {isOverview ? (
          <CanvasOverview user={user} subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
        ) : (
          <div className="dirH__page">
            {/* Existing shadcn sections, hosted inside the canvas shell.
                .tnt__embed resets the canvas font-scale so they look right. */}
            <div className="tnt__embed">
              <DashboardContent
                user={user}
                subdomains={subdomains}
                activeSection={activeSection}
                selectedSubdomain={selectedSubdomain}
              />
            </div>
          </div>
        )}
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
