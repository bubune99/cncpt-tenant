"use client"

/**
 * Canvas notifications bell — wires the previously-dead topbar bell to a real
 * data source: active platform announcements (/api/admin/announcements). Shows
 * an unread dot when there are active announcements and lists them in a
 * dropdown. Dismissals are remembered client-side (localStorage) so the dot
 * clears once the user has seen them, without needing a write endpoint.
 */

import { useEffect, useState } from "react"
import { Bell, Info, AlertTriangle, CheckCircle2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Announcement {
  id: number | string
  title: string
  message: string
  type: string
  created_at?: string
}

const SEEN_KEY = "cncpt:dashboard:seen-announcements"

function typeIcon(type: string) {
  if (type === "warning") return <AlertTriangle style={{ width: 14, height: 14, color: "#b45309" }} />
  if (type === "success") return <CheckCircle2 style={{ width: 14, height: 14, color: "#047857" }} />
  return <Info style={{ width: 14, height: 14, color: "var(--br-primary-600)" }} />
}

export function CanvasNotifications() {
  const [items, setItems] = useState<Announcement[]>([])
  const [seen, setSeen] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      if (raw) setSeen(new Set(JSON.parse(raw)))
    } catch {}

    fetch("/api/admin/announcements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(Array.isArray(d?.announcements) ? d.announcements : []))
      .catch(() => {})
  }, [])

  const unread = items.filter((a) => !seen.has(String(a.id))).length

  const markAllSeen = () => {
    const next = new Set(items.map((a) => String(a.id)))
    setSeen(next)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
    } catch {}
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open && unread > 0) markAllSeen() }}>
      <DropdownMenuTrigger asChild>
        <button
          className="iconbtn iconbtn--sm iconbtn--ghost"
          aria-label="Notifications"
          style={{ position: "relative" }}
        >
          <Bell style={{ width: 13, height: 13 }} />
          {unread > 0 ? (
            <span
              aria-hidden
              style={{
                position: "absolute", top: 3, right: 3,
                width: 7, height: 7, borderRadius: 9999,
                background: "#dc2626", border: "1.5px solid var(--br-background)",
              }}
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span>Notifications</span>
          {items.length > 0 ? (
            <span className="text-xs text-muted-foreground">{items.length}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </div>
        ) : (
          <div className="max-h-80 overflow-auto py-1">
            {items.map((a) => (
              <div key={a.id} className="flex gap-2 px-3 py-2.5 hover:bg-muted/60">
                <span className="mt-0.5 shrink-0">{typeIcon(a.type)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug">{a.title}</div>
                  <div className="text-xs text-muted-foreground leading-snug">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
