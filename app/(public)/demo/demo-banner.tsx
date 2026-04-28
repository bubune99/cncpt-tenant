"use client"

import Link from "next/link"
import { Sparkles, X } from "lucide-react"
import { useState } from "react"

/**
 * Subtle banner shown at the top of the demo dashboard.
 * Lets visitors know this is a preview and points them at the
 * "Sign up to use this for real" CTA.
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      data-demo-banner
      className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 text-sm relative"
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      <span className="text-center">
        You&apos;re exploring the demo dashboard with sample data.
      </span>
      <Link
        href="/register"
        className="font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
      >
        Sign up to create your own site
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
