"use client"

/**
 * ACCOUNT — AI Credits + Billing + Branding + Workspace settings.
 * Recreates tenant-settings.jsx (Tnt_Credits / Tnt_Billing / Tnt_WhiteLabel /
 * Tnt_WorkspaceSettings) on the Canvas chrome with tnt__tabs.
 *
 * DATA WIRING:
 *  - AI Credits: REAL. Designed pool view wired to /api/credits/balance
 *    (balance, monthly/purchased split, allocation) + recentTransactions
 *    (real ledger rows when present; empty when the ledger table isn't
 *    provisioned — handled gracefully by the API fix).
 *  - Billing: hosts the existing real Billing component.
 *  - Branding (white-label): hosts the existing real BrandingSettings.
 *  - Workspace settings: hosts the existing real SiteSettings.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles, CreditCard, Paintbrush, Settings, Zap, Repeat, Loader2,
} from "lucide-react"
import { Billing } from "../billing"
import { BrandingSettings } from "../branding-settings"
import { SiteSettings } from "../site-settings"

type Tab = "credits" | "billing" | "branding" | "settings"

interface CanvasAccountProps {
  initialTab?: Tab
  selectedSubdomain: string | null
}

const TABS: { id: Tab; l: string; icon: any }[] = [
  { id: "credits", l: "AI Credits", icon: Sparkles },
  { id: "billing", l: "Billing & plan", icon: CreditCard },
  { id: "branding", l: "Branding", icon: Paintbrush },
  { id: "settings", l: "Workspace settings", icon: Settings },
]

interface Balance { total: number; monthly: number; purchased: number; monthlyAllocation: number; lifetimeUsed: number }
interface Txn { id: string; type: string; amount: number; feature: string | null; description: string | null; createdAt: string }

export function CanvasAccount({ initialTab = "credits", selectedSubdomain }: CanvasAccountProps) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <>
      <div className="tnt__tabs">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} className={"tnt__tab" + (t.id === tab ? " is-on" : "")} onClick={() => setTab(t.id)}>
              <Icon /> {t.l}
            </button>
          )
        })}
      </div>
      <div className="dirH__page" style={{ overflow: "auto" }}>
        {tab === "credits" ? <CreditsPanel /> : null}
        {tab === "billing" ? <div className="tnt__embed" style={{ padding: "20px 24px" }}><Billing /></div> : null}
        {tab === "branding" ? <div className="tnt__embed" style={{ padding: "20px 24px" }}><BrandingSettings selectedSubdomain={selectedSubdomain} /></div> : null}
        {tab === "settings" ? <div className="tnt__embed" style={{ padding: "20px 24px" }}><SiteSettings selectedSubdomain={selectedSubdomain} /></div> : null}
      </div>
    </>
  )
}

/* ─── AI Credits (real balance + transactions) ─── */
function CreditsPanel() {
  const router = useRouter()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [txns, setTxns] = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch("/api/credits/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.balance) return
        const b = data.balance
        setBalance({
          total: Number(b.total) || 0,
          monthly: Number(b.monthly) || 0,
          purchased: Number(b.purchased) || 0,
          monthlyAllocation: Number(b.monthlyAllocation) || 0,
          lifetimeUsed: Number(b.lifetimeUsed) || 0,
        })
        setTxns(Array.isArray(data.recentTransactions) ? data.recentTransactions : [])
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const total = balance?.total ?? 0
  const allocation = balance ? Math.max(balance.monthlyAllocation, balance.total) : 0
  const used = balance?.lifetimeUsed ?? 0
  const pct = allocation > 0 ? Math.min(100, Math.round((total / allocation) * 100)) : 0

  return (
    <div style={{ padding: "20px 24px" }}>
      <div className="tnt__page-h">
        <div>
          <h1>AI Credits</h1>
          <div className="sub">Credits power AI features across CNCPT — copywriting, images, translation, smart replies.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {balance ? <span className="pill pill--blue"><Sparkles style={{ width: 11, height: 11 }} /> {total.toLocaleString()} remaining</span> : null}
          <span className="pill"><Repeat style={{ width: 11, height: 11 }} /> Monthly pool</span>
        </div>
      </div>

      {loading ? (
        <div className="row" style={{ gap: 8, padding: 24 }}><Loader2 className="tnt-spin" style={{ width: 16, height: 16 }} /> <span className="muted">Loading credit balance…</span></div>
      ) : !balance ? (
        <div className="tnt__banner tnt__banner--warn"><span>Credit balance is unavailable right now.</span></div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Pool */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Credit pool</h3><span className="muted" style={{ fontSize: 11 }}>Monthly + purchased</span></div>
              <div className="card__body">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>{total.toLocaleString()}</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {allocation > 0 ? `of ${allocation.toLocaleString()} allotted` : "available"} · {used.toLocaleString()} used lifetime
                    </span>
                  </div>
                </div>
                <div style={{ height: 14, borderRadius: 8, overflow: "hidden", background: "var(--br-surface)", border: "1px solid var(--br-border)", marginBottom: 12 }}>
                  <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }} />
                </div>
                <div className="row" style={{ gap: 18, fontSize: 12 }}>
                  <div className="col" style={{ gap: 1 }}><span className="muted">Monthly</span><strong className="mono">{balance.monthly.toLocaleString()}</strong></div>
                  <div className="col" style={{ gap: 1 }}><span className="muted">Purchased</span><strong className="mono">{balance.purchased.toLocaleString()}</strong></div>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 14 }}>
                  <button className="btn btn--primary btn--xs" onClick={() => router.push("/dashboard?section=credits")}><Zap style={{ width: 12, height: 12 }} /> Top up credits</button>
                </div>
              </div>
            </div>

            {/* Split summary */}
            <div className="card">
              <div className="card__head"><h3 className="card__title">Allocation</h3></div>
              <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5 }}>
                <div className="row between"><span className="muted">Monthly balance</span><strong className="mono">{balance.monthly.toLocaleString()}</strong></div>
                <div className="row between"><span className="muted">Purchased balance</span><strong className="mono">{balance.purchased.toLocaleString()}</strong></div>
                <div className="row between"><span className="muted">Monthly allocation</span><strong className="mono">{balance.monthlyAllocation.toLocaleString()}</strong></div>
                <div className="row between" style={{ borderTop: "1px solid var(--br-border)", paddingTop: 10 }}><span>Total available</span><strong className="mono">{total.toLocaleString()}</strong></div>
              </div>
            </div>
          </div>

          {/* Recent transactions (real) */}
          <div className="card">
            <div className="card__head"><h3 className="card__title">Recent activity</h3><span className="muted" style={{ fontSize: 11 }}>{txns.length} record{txns.length === 1 ? "" : "s"}</span></div>
            {txns.length === 0 ? (
              <div className="card__body muted" style={{ fontSize: 12 }}>No credit transactions yet.</div>
            ) : (
              <table className="tnt__matrix">
                <thead><tr><th>Time</th><th>Action</th><th>Feature</th><th style={{ textAlign: "right" }}>Credits</th></tr></thead>
                <tbody>
                  {txns.map((r) => (
                    <tr key={r.id}>
                      <td className="muted" style={{ fontSize: 11.5 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                      <td style={{ fontSize: 12 }}>{r.description || r.type}</td>
                      <td>{r.feature ? <span className="tag-sm">{r.feature}</span> : <span className="muted">—</span>}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--br-font-mono)", color: r.amount > 0 ? "#047857" : "var(--br-text)" }}>{r.amount > 0 ? "+" : ""}{Number(r.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
