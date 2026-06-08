"use client"

/**
 * Canvas sidebar — recreates the design's `dirH__rail` grouped nav:
 * brand block + plan, site-switcher, ⌘K search, grouped nav sections,
 * rail footer with the signed-in user. Wired to the dashboard's existing
 * section router + sub-routes (see nav-config).
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Boxes, ChevronsUpDown, Search, Plus, MoreHorizontal, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NAV, isHeading, activeNavId, type NavItem } from "./nav-config"

interface CanvasSidebarProps {
  user: any
  subdomains: any[]
  activeSection: string
  setActiveSection: (s: string) => void
  selectedSubdomain: string | null
  setSelectedSubdomain: (s: string | null) => void
  onOpenSearch: () => void
}

function userInitials(name: string | undefined, email: string | undefined): string {
  const src = (name && name.trim()) || (email ? email.split("@")[0] : "") || "U"
  return src
    .split(/[\s.@_-]+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
}

export function CanvasSidebar({
  user,
  subdomains,
  activeSection,
  setActiveSection,
  selectedSubdomain,
  setSelectedSubdomain,
  onOpenSearch,
}: CanvasSidebarProps) {
  const router = useRouter()
  const active = activeNavId(activeSection)
  const site = subdomains.find((s) => s.subdomain === selectedSubdomain) || subdomains[0] || null
  const displayName = user?.displayName ?? user?.name ?? (user?.primaryEmail ?? user?.email ?? "Account")
  const email = user?.primaryEmail ?? user?.email ?? ""

  const handleNav = (item: NavItem) => {
    if (item.route) {
      router.push(item.route)
      return
    }
    if (item.section) setActiveSection(item.section)
  }

  return (
    <aside className="dirH__rail">
      {/* Brand block + plan */}
      <div className="dirH__brand">
        <div className="dirH__brand-mark"><Boxes /></div>
        <div className="col" style={{ gap: 0 }}>
          <div className="dirH__brand-name">CNCPT</div>
          <div className="muted" style={{ fontSize: 10, lineHeight: 1 }}>Workspace</div>
        </div>
        <ChevronsUpDown className="dirH__brand-chev" style={{ width: 12, height: 12 }} />
      </div>

      {/* Site switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="tnt__site-switch" data-tour-id="dashboard-subdomain-selector">
            <div className="tnt__site-mark">{(site?.subdomain?.[0] || "S").toUpperCase()}</div>
            <div className="col" style={{ flex: 1, minWidth: 0 }}>
              <span className="tnt__site-name">{site?.site_title || site?.subdomain || "Select site"}</span>
              <span className="tnt__site-host">{site ? `${site.subdomain}.cncpt.app` : "no sites yet"}</span>
            </div>
            <ChevronsUpDown style={{ width: 12, height: 12, color: "var(--br-text-secondary)" }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {subdomains.map((s) => (
            <DropdownMenuItem key={s.subdomain} onClick={() => setSelectedSubdomain(s.subdomain)}>
              <span className="font-medium">{s.site_title || s.subdomain}</span>
            </DropdownMenuItem>
          ))}
          {subdomains.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => router.push("/dashboard/create-subdomain")}>
            <Plus className="w-4 h-4 mr-2" /> Create new
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ⌘K search */}
      <button className="dirH__search" onClick={onOpenSearch}>
        <Search />
        <span className="dirH__search-q">Search workspace…</span>
        <span className="kbd">⌘K</span>
      </button>

      {/* Grouped nav */}
      <nav className="dirH__nav">
        {NAV.map((entry, i) => {
          if (isHeading(entry)) {
            return (
              <div className="dirH__nav-h" key={"h" + i}>
                <ChevronDown />
                {entry.heading}
              </div>
            )
          }
          const item = entry
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              className={"dirH__nav-item" + (isActive ? " is-active" : "")}
              onClick={() => handleNav(item)}
              data-tour-id={`canvas-nav-${item.id}`}
            >
              <Icon />
              <span>{item.label}</span>
              {item.badge !== undefined ? (
                <span className={"badge" + (item.badgeKind === "hot" ? " is-hot" : item.badgeKind === "blue" ? " is-blue" : "")}>
                  {item.badge}
                </span>
              ) : null}
              {item.phase2 ? <span className="badge" style={{ fontSize: 9 }}>soon</span> : null}
            </button>
          )
        })}
      </nav>

      {/* Rail footer — signed-in user */}
      <div className="dirH__rail-foot">
        <div className="avatar avatar--sm avatar--orange">{userInitials(user?.displayName ?? user?.name, email)}</div>
        <div className="col">
          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
            {displayName}
          </div>
          <div className="muted" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
            {email}
          </div>
        </div>
        <button className="iconbtn iconbtn--sm iconbtn--ghost" onClick={() => router.push("/handler/account-settings")}>
          <MoreHorizontal style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </aside>
  )
}
