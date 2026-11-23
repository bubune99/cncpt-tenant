"use client"

import { useEffect, useState } from "react"
import { isMacPlatform, shortcutLabel } from "@/lib/ui/mod-key"

/** A keyboard shortcut hint: "Ctrl K" on Windows and Linux, "⌘K" on a Mac. */
export function Shortcut({ k, className }: { k: string; className?: string }) {
  const [mac, setMac] = useState(false)
  useEffect(() => { setMac(isMacPlatform(navigator.platform || "")) }, [])
  return <span className={className}>{shortcutLabel(k, mac)}</span>
}
