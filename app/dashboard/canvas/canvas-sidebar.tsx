"use client"

/**
 * Canvas sidebar — recreates the design's `dirH__rail` grouped nav:
 * brand block + plan, site-switcher, ⌘K search, grouped nav sections,
 * rail footer with the signed-in user. Wired to the dashboard's existing
 * section router + sub-routes (see nav-config).
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Boxes, ChevronsUpDown, Search, Plus, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GROUP_ICONS } from "./nav-config"
import { NAV_GROUPS, groupOfSection, firstSection } from "@/lib/dashboard/nav-groups"
import { rootDomain } from "@/lib/utils"
import { Shortcut } from "@/components/ui/shortcut"

interface CanvasSidebarProps {
  user: any
  subdomains: any[]
  activeSection: string
  setActiveSection: (s: string) => void
  selectedSubdomain: string | null
  setSelectedSubdomain: (s: string | null) => void
  onOpenSearch: () => void
  /** opens the New client site panel on the Overview */
  onNewSite: () => void
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
  onNewSite,
}: CanvasSidebarProps) {
  const router = useRouter()
  const activeGroup = groupOfSection(activeSection)
  const site = subdomains.find((s) => s.subdomain === selectedSubdomain) || subdomains[0] || null
  const displayName = user?.displayName ?? user?.name ?? (user?.primaryEmail ?? user?.email ?? "Account")
  const email = user?.primaryEmail ?? user?.email ?? ""

  return (
    <aside className="dirH__rail">
      {/* Brand block + plan */}
      <div className="dirH__brand">
        <div className="dirH__brand-mark"><Boxes /></div>
        <div className="col" style={{ gap: 0 }}>
          <div className="dirH__brand-name">CNCPT</div>
          <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.1 }}>Workspace</div>
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
              <span className="tnt__site-host">{site ? `${site.subdomain}.${rootDomain}` : "no sites yet"}</span>
            </div>
            <ChevronsUpDown style={{ width: 12, height: 12, color: "var(--br-text-secondary)" }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
          {subdomains.map((s) => (
            <DropdownMenuItem key={s.subdomain} onClick={() => setSelectedSubdomain(s.subdomain)}>
              <span className="font-medium">{s.site_title || s.subdomain}</span>
            </DropdownMenuItem>
          ))}
          {subdomains.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={onNewSite}>
            <Plus className="w-4 h-4 mr-2" /> New client site
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ⌘K search */}
      <button className="dirH__search" onClick={onOpenSearch}>
        <Search />
        <span className="dirH__search-q">Search workspace…</span>
        <Shortcut k="K" className="kbd" />
      </button>

      {/* Seven places; the open place lists its pages under it (walk dce2661a: 22 items at once). */}
      <nav className="dirH__nav" aria-label="Workspace">
        {NAV_GROUPS.map((g) => {
          const Icon = GROUP_ICONS[g.id]
          const open = activeGroup === g.id
          return (
            <div key={g.id} className="dirH__nav-group">
              <button
                type="button"
                className={"dirH__nav-item" + (open && g.items.length === 0 ? " is-active" : "") + (open && g.items.length ? " is-open" : "")}
                onClick={() => setActiveSection(firstSection(g.id))}
                aria-expanded={g.items.length ? open : undefined}
                aria-current={open && g.items.length === 0 ? "page" : undefined}
                data-tour-id={`canvas-nav-${g.id}`}
              >
                {Icon ? <Icon /> : null}
                <span>{g.label}</span>
              </button>
              {open && g.items.length ? (
                <div className="dirH__nav-sub">
                  {g.items.map((it) => (
                    <button
                      type="button"
                      key={it.id}
                      className={"dirH__nav-subitem" + (activeSection === it.section ? " is-active" : "")}
                      aria-current={activeSection === it.section ? "page" : undefined}
                      onClick={() => setActiveSection(it.section)}
                      data-tour-id={`canvas-nav-${it.id}`}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
          <div className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
            {email}
          </div>
        </div>
        <button className="iconbtn iconbtn--sm iconbtn--ghost" aria-label="Account settings" title="Account settings" onClick={() => router.push("/handler/account-settings")}>
          <MoreHorizontal style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </aside>
  )
}
