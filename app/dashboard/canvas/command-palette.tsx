"use client"

/**
 * Lightweight ⌘K command palette — jumps between the Canvas nav targets using
 * the same nav-config. No new dependency; a focus-trapped overlay over the
 * canvas. Opens on ⌘K / Ctrl+K or the sidebar search button.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, CornerDownLeft } from "lucide-react"
import { NAV, isHeading, type NavItem } from "./nav-config"

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  setActiveSection: (s: string) => void
}

export function CommandPalette({ open, onClose, setActiveSection }: CommandPaletteProps) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items = useMemo(() => NAV.filter((e): e is NavItem => !isHeading(e)), [])
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter((i) => i.label.toLowerCase().includes(term))
  }, [q, items])

  useEffect(() => {
    if (open) {
      setQ("")
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    setIdx(0)
  }, [q])

  if (!open) return null

  const go = (item: NavItem) => {
    onClose()
    if (item.route) router.push(item.route)
    else if (item.section) setActiveSection(item.section)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === "Enter" && filtered[idx]) { e.preventDefault(); go(filtered[idx]) }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{ width: 540, maxWidth: "90%", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.12)", overflow: "hidden", fontFamily: "var(--font-geist-sans), Geist, sans-serif" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
          <Search style={{ width: 15, height: 15, color: "#6b7280" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workspace…"
            style={{ flex: 1, border: 0, outline: "none", fontSize: 14, color: "#1f2937", background: "transparent" }}
          />
          <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, background: "#f8fafc", border: "1px solid #e5e7eb", borderBottomWidth: 2, padding: "1px 5px", borderRadius: 4, color: "#6b7280" }}>esc</span>
        </div>
        <div style={{ maxHeight: 360, overflow: "auto", padding: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "20px 12px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>No matches</div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon
              const isOn = i === idx
              return (
                <button
                  key={item.id + i}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(item)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: 0, background: isOn ? "#eff6ff" : "transparent", color: isOn ? "#1d4ed8" : "#1f2937", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  <Icon style={{ width: 15, height: 15, color: isOn ? "#2563eb" : "#6b7280" }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.phase2 ? <span style={{ fontSize: 10, color: "#94a3b8" }}>soon</span> : null}
                  {isOn ? <CornerDownLeft style={{ width: 13, height: 13, color: "#94a3b8" }} /> : null}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
