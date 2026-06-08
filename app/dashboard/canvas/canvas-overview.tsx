"use client"

/**
 * Canvas Overview screen — recreates tenant-overview-subdomains.jsx (Tnt_Overview):
 * KPI strip, "Your sites" list, team activity, customer-support + AI-credits
 * widgets.
 *
 * DATA WIRING:
 *  - Sites list           → REAL  (getUserSubdomains, passed in)
 *  - AI credits widget    → REAL  (/api/credits/balance)
 *  - Onboarding banner    → REAL  (links into the existing create/setup flow)
 *  - KPI strip (revenue/orders/visitors/conversion) → PLACEHOLDER. There is no
 *    per-tenant analytics source wired into the dashboard yet (the Analytics
 *    section is itself a Phase 2 redesign target), so these are clearly marked
 *    "demo" rather than presented as live figures.
 *  - Support / activity widgets → PLACEHOLDER, marked as such.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, ExternalLink, Calendar, ArrowRight, ChevronRight, Sparkles, Zap,
  Info, X, TrendingUp, ShoppingBag, Users, Percent, AlarmClock, MessageSquare,
} from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"

interface CanvasOverviewProps {
  user: any
  subdomains: any[]
  selectedSubdomain: string | null
}

interface CreditBalance {
  total: number
  monthly: number
  purchased: number
  monthlyAllocation: number
  lifetimeUsed: number
}

// Placeholder KPI strip — see DATA WIRING note above.
const DEMO_KPIS = [
  { l: "Revenue · 7d", v: "$12,840", d: "+18%", up: true, bars: [4, 6, 5, 7, 8, 7, 9], icon: TrendingUp },
  { l: "Orders · 7d", v: "164", d: "+12%", up: true, bars: [3, 4, 4, 6, 5, 7, 7], icon: ShoppingBag },
  { l: "Visitors · 7d", v: "8,341", d: "−3%", up: false, bars: [6, 7, 5, 6, 5, 4, 5], icon: Users },
  { l: "Conversion", v: "1.96%", d: "+0.3pt", up: true, bars: [2, 3, 3, 4, 4, 5, 6], icon: Percent },
]

function firstName(user: any): string | null {
  const name = user?.displayName ?? user?.name
  if (typeof name === "string" && name.trim()) return name.trim().split(/\s+/)[0]
  const email = user?.primaryEmail ?? user?.email
  if (typeof email === "string" && email.includes("@")) return email.split("@")[0]
  return null
}

export function CanvasOverview({ user, subdomains, selectedSubdomain }: CanvasOverviewProps) {
  const router = useRouter()
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [supportStats, setSupportStats] = useState<{ open: number; total: number } | null>(null)
  const [supportReady, setSupportReady] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.balance) {
          // coerce numerics defensively (pg numeric-as-string gotcha)
          const b = data.balance
          setBalance({
            total: Number(b.total) || 0,
            monthly: Number(b.monthly) || 0,
            purchased: Number(b.purchased) || 0,
            monthlyAllocation: Number(b.monthlyAllocation) || 0,
            lifetimeUsed: Number(b.lifetimeUsed) || 0,
          })
        }
      })
      .catch(() => {})

    // Real support stats for the support widget. Marked ready in finally so the
    // widget can leave its loading state even when the endpoint is unavailable
    // (e.g. support tables not provisioned in this environment → 500).
    fetch("/api/dashboard/support")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) setSupportStats({ open: Number(data.stats.open) || 0, total: Number(data.stats.total) || 0 })
      })
      .catch(() => {})
      .finally(() => setSupportReady(true))
  }, [])

  const name = firstName(user)
  const used = balance ? balance.total : 0
  const allocation = balance ? Math.max(balance.monthlyAllocation, balance.total) : 0
  const pct = allocation > 0 ? Math.min(100, Math.round((used / allocation) * 100)) : 0

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      {/* Page header */}
      <div className="tnt__page-h">
        <div>
          <h1>{name ? `Good day, ${name}` : "Overview"}</h1>
          <div className="sub">
            {subdomains.length > 0
              ? `Here's what's happening across your ${subdomains.length} site${subdomains.length === 1 ? "" : "s"}.`
              : "Spin up your first site to get started."}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill pill--green"><span className="dot" /> All systems normal</span>
          {balance ? (
            <span className="pill pill--blue"><Sparkles style={{ width: 11, height: 11 }} /> {used.toLocaleString()} credits</span>
          ) : null}
        </div>
      </div>

      {/* Onboarding banner (real link into setup) */}
      {!bannerDismissed && subdomains.length > 0 ? (
        <div className="tnt__banner tnt__banner--info" style={{ marginBottom: 16 }}>
          <Info />
          <div className="tnt__banner-row">
            <span>
              <b>Finish setting up {selectedSubdomain || subdomains[0]?.subdomain}</b>
              <span className="sub"> — add branding, connect a custom domain, and choose a launch date.</span>
            </span>
          </div>
          <button className="btn btn--secondary btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "branding" }))}>Open setup</button>
          <button className="iconbtn iconbtn--sm iconbtn--ghost" onClick={() => setBannerDismissed(true)}><X style={{ width: 12, height: 12 }} /></button>
        </div>
      ) : null}

      {/* KPI strip (demo) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 6 }}>
        {DEMO_KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div className="tnt__stat" key={k.l}>
              <div className="tnt__stat-label"><Icon /> {k.l}</div>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="tnt__stat-value">{k.v}</div>
                <div className="tnt__bars" style={{ width: 64 }}>
                  {k.bars.map((h, i) => <span key={i} style={{ height: h * 3 + "px" }} />)}
                </div>
              </div>
              <div className={"tnt__stat-delta " + (k.up ? "tnt__stat-delta--up" : "tnt__stat-delta--down")}>
                {k.d} vs prev. 7d
              </div>
            </div>
          )
        })}
      </div>
      <div className="muted" style={{ fontSize: 10.5, marginBottom: 16 }}>
        KPI figures above are demo data — per-site analytics wiring lands with the Analytics redesign (Phase 2).
      </div>

      {/* Sites + activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* Your sites — REAL */}
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Your sites</h3>
            <button className="btn btn--ghost btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "sites" }))}>
              Manage all <ArrowRight style={{ width: 11, height: 11 }} />
            </button>
          </div>
          <div>
            {subdomains.length === 0 ? (
              <div className="tnt__empty">
                <div className="tnt__empty-glyph"><Plus /></div>
                <h2 className="tnt__empty-h">Spin up your first site</h2>
                <p className="tnt__empty-p">Each site gets its own DNS, branding, and access controls.</p>
                <button className="btn btn--primary" onClick={() => router.push("/dashboard/create-subdomain")}>
                  <Plus style={{ width: 13, height: 13 }} /> Create subdomain
                </button>
              </div>
            ) : (
              <>
                {subdomains.map((s) => {
                  const siteUrl = `${protocol}://${s.subdomain}.${rootDomain}`
                  return (
                    <div key={s.subdomain} className="row" style={{ gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--br-border)", alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0F172A,#3B82F6)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(s.subdomain[0] || "S").toUpperCase()}
                      </div>
                      <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <strong style={{ fontSize: 13 }}>{s.site_title || s.subdomain}</strong>
                          <span className="pill pill--green" style={{ fontSize: 10 }}><span className="dot" /> Active</span>
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.subdomain}.{rootDomain}
                        </div>
                      </div>
                      <a className="iconbtn iconbtn--sm" href={siteUrl} target="_blank" rel="noreferrer" aria-label="Visit site">
                        <ExternalLink style={{ width: 12, height: 12 }} />
                      </a>
                      <a className="iconbtn iconbtn--sm iconbtn--ghost" href={`${siteUrl}/admin`} aria-label="Manage site">
                        <ChevronRight style={{ width: 13, height: 13 }} />
                      </a>
                    </div>
                  )
                })}
                <div className="row" style={{ padding: "10px 16px", gap: 6 }}>
                  <button className="btn btn--ghost btn--xs" onClick={() => router.push("/dashboard/create-subdomain")}>
                    <Plus style={{ width: 12, height: 12 }} /> Add subdomain
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team activity — placeholder */}
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Team activity</h3>
            <span className="muted" style={{ fontSize: 11 }}>Phase 2</span>
          </div>
          <div>
            <div className="tnt__act-row">
              <div className="avatar avatar--xs avatar--orange">{(firstName(user)?.[0] || "U").toUpperCase()}</div>
              <div className="tnt__act-body">
                <strong>{firstName(user) || "You"}</strong> signed in to the workspace
                <div className="tnt__act-time">just now</div>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }} className="muted">
              <span style={{ fontSize: 11.5 }}>A full team activity log arrives with the Team redesign.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Support + credits */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
        {/* Customer support — REAL open/total ticket counts */}
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Customer support</h3>
            <button className="btn btn--ghost btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "comms" }))}>
              Open inbox <ArrowRight style={{ width: 11, height: 11 }} />
            </button>
          </div>
          <div className="card__body" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="tnt__act-icon" style={{ width: 32, height: 32 }}><MessageSquare /></div>
            <div className="col" style={{ flex: 1, gap: 1 }}>
              {supportStats ? (
                <>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>
                    {supportStats.open} open · {supportStats.total} total ticket{supportStats.total === 1 ? "" : "s"}
                  </span>
                  <span className="muted" style={{ fontSize: 11 }}>Manage customer tickets in the Communications inbox.</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>Support inbox</span>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {supportReady ? "Open the Communications inbox to manage tickets." : "Loading ticket counts…"}
                  </span>
                </>
              )}
            </div>
            <button className="btn btn--secondary btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "comms" }))}>Go</button>
          </div>
        </div>

        {/* AI credits — REAL */}
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">AI credits</h3>
            <button className="btn btn--ghost btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "credits" }))}>Details</button>
          </div>
          <div className="card__body">
            {balance ? (
              <>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="tnt__stat-value" style={{ fontSize: 28 }}>{used.toLocaleString()}</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>
                    {allocation > 0 ? `of ${allocation.toLocaleString()} allotted` : "available"}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--br-surface)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }} />
                </div>
                <div className="row" style={{ gap: 14, fontSize: 11 }}>
                  <span><strong>{balance.monthly.toLocaleString()}</strong> <span className="muted">monthly</span></span>
                  <span><strong>{balance.purchased.toLocaleString()}</strong> <span className="muted">purchased</span></span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 12 }}>
                  <button className="btn btn--primary btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "credits" }))}>
                    <Zap style={{ width: 12, height: 12 }} /> Top up
                  </button>
                  <button className="btn btn--ghost btn--xs" onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-section", { detail: "credits" }))}>Usage details</button>
                </div>
              </>
            ) : (
              <div className="muted" style={{ fontSize: 12 }}>Loading credit balance…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
