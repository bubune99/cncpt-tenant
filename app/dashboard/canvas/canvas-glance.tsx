"use client"
/**
 * Support tickets and AI credits at a glance, kept from the old Overview (parity check 2026-11-22:
 * the redesign had dropped both; the owner never chose to). Rules and wording: lib/dashboard/glance.ts.
 */
import { useEffect, useState } from "react"
import { MessageSquare, Zap } from "lucide-react"
import { parseSupport, parseCredits, supportLine, creditsLine, type LoadState, type SupportStats, type CreditStats } from "@/lib/dashboard/glance"

const go = (section: string) => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: section }))

function useFigure<T>(url: string, parse: (d: unknown) => T | null): [LoadState, T | null] {
  const [state, setState] = useState<LoadState>("loading")
  const [value, setValue] = useState<T | null>(null)
  useEffect(() => {
    let live = true
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!live) return; const v = parse(d); setValue(v); setState(v ? "ready" : "failed") })
      .catch(() => { if (live) setState("failed") })
    return () => { live = false }
  }, [url, parse])
  return [state, value]
}

export function CanvasGlance() {
  const [supportState, support] = useFigure<SupportStats>("/api/dashboard/support", parseSupport)
  const [creditState, credits] = useFigure<CreditStats>("/api/credits/balance", parseCredits)
  return (
    <section className="tnt__glance" aria-label="At a glance" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 16 }}>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
        <div className="tnt__act-icon" style={{ width: 32, height: 32 }} aria-hidden="true"><MessageSquare /></div>
        <div className="col" style={{ flex: 1, gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Customer support</span>
          <span className="muted" style={{ fontSize: 11.5 }} aria-live="polite">{supportLine(supportState, support)}</span>
        </div>
        <button type="button" className="btn btn--secondary btn--xs" onClick={() => go("comms")} data-ui="overview.glance.support">Open inbox</button>
      </div>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
        <div className="tnt__act-icon" style={{ width: 32, height: 32 }} aria-hidden="true"><Zap /></div>
        <div className="col" style={{ flex: 1, gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>AI credits</span>
          <span className="muted" style={{ fontSize: 11.5 }} aria-live="polite">{creditsLine(creditState, credits)}</span>
        </div>
        <button type="button" className="btn btn--secondary btn--xs" onClick={() => go("credits")} data-ui="overview.glance.credits">Top up or see usage</button>
      </div>
    </section>
  )
}
