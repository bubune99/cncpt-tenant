"use client"

/**
 * Canvas topbar — recreates the design's `dirH__top`: breadcrumbs on the left,
 * right-side controls (theme toggle, help, support, avatar). Right content is
 * overridable per-screen via `right`.
 */

import { Fragment } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, LifeBuoy, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { CanvasNotifications } from "./canvas-notifications"

interface CanvasTopbarProps {
  crumbs: string[]
  right?: React.ReactNode
  userInitials: string
}

export function CanvasTopbar({ crumbs, right, userInitials }: CanvasTopbarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  return (
    <header className="dirH__top">
      <div className="dirH__crumbs">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            <span className={i === crumbs.length - 1 ? "dirH__crumb-active" : "muted"}>{c}</span>
            {i < crumbs.length - 1 ? <ChevronRight /> : null}
          </Fragment>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {right ?? (
        <>
          <button
            className="iconbtn iconbtn--sm iconbtn--ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun style={{ width: 13, height: 13 }} /> : <Moon style={{ width: 13, height: 13 }} />}
          </button>
          <CanvasNotifications />
          <button
            className="iconbtn iconbtn--sm iconbtn--ghost"
            onClick={() => router.push("/dashboard/support")}
            aria-label="Support"
          >
            <LifeBuoy style={{ width: 13, height: 13 }} />
          </button>
          <div className="avatar avatar--sm avatar--orange" style={{ marginLeft: 4 }}>{userInitials}</div>
        </>
      )}
    </header>
  )
}
