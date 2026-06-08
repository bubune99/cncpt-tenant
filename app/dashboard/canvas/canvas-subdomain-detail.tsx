"use client"

/**
 * SITES — Subdomain detail with tabs. Recreates Tnt_SubdomainDetail
 * (Overview / Visibility / DNS / Branding / Hosting / Danger).
 *
 * The Visibility / Branding / Hosting / Custom-domains tabs HOST the existing,
 * working shadcn sections (SiteVisibility, BrandingSettings, FrontendDeployment,
 * DomainManagement) inside the canvas chrome (.tnt__embed). Overview, DNS and
 * Danger are designed Canvas panels:
 *  - Overview: setup checklist + quick links (real site URLs).
 *  - DNS: REAL custom-domain verification records via getDomainsForSubdomain,
 *    plus the platform A/CNAME defaults (labeled as platform-provided).
 *  - Danger: routes destructive actions to the existing delete flow.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, ExternalLink, LayoutDashboard, Eye, Globe, Paintbrush,
  Server, AlertTriangle, RotateCw, Plus, Check, ArrowRight, ShieldCheck,
} from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"
import { getDomainsForSubdomain, type DomainInfo } from "@/app/domain-actions"
import { SiteVisibility } from "../site-visibility"
import { BrandingSettings } from "../branding-settings"
import { FrontendDeployment } from "../frontend-deployment"
import { DomainManagement } from "../domain-management"

type Tab = "overview" | "visibility" | "dns" | "branding" | "hosting" | "danger"

interface CanvasSubdomainDetailProps {
  subdomain: string
  subdomains: any[]
  onBack: () => void
}

const TABS: { id: Tab; l: string; icon: any }[] = [
  { id: "overview", l: "Overview", icon: LayoutDashboard },
  { id: "visibility", l: "Visibility", icon: Eye },
  { id: "dns", l: "DNS & domains", icon: Globe },
  { id: "branding", l: "Branding", icon: Paintbrush },
  { id: "hosting", l: "Hosting", icon: Server },
  { id: "danger", l: "Danger zone", icon: AlertTriangle },
]

export function CanvasSubdomainDetail({ subdomain, subdomains, onBack }: CanvasSubdomainDetailProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const site = subdomains.find((s) => s.subdomain === subdomain)
  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`
  const title = site?.site_title || subdomain

  return (
    <>
      <div className="dirH__top" style={{ height: 48 }}>
        <button className="iconbtn iconbtn--sm iconbtn--ghost" onClick={onBack} aria-label="Back to sites"><ChevronLeft style={{ width: 14, height: 14 }} /></button>
        <div className="dirH__crumbs">
          <span className="muted">Subdomains</span>
          <span className="dirH__crumb-active">{title}</span>
        </div>
        <div style={{ flex: 1 }} />
        <span className="pill pill--green" style={{ fontSize: 11 }}><span className="dot" /> Active</span>
        <a className="btn btn--secondary btn--xs" href={siteUrl} target="_blank" rel="noreferrer"><ExternalLink style={{ width: 12, height: 12 }} /> Visit</a>
        <a className="btn btn--primary btn--xs" href={`${siteUrl}/admin`}>Manage content</a>
      </div>

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

      <div className="dirH__page" style={{ padding: tab === "overview" || tab === "dns" || tab === "danger" ? "20px 24px" : 0, overflow: "auto" }}>
        {tab === "overview" ? <OverviewPanel title={title} subdomain={subdomain} siteUrl={siteUrl} onTab={setTab} /> : null}
        {tab === "dns" ? <DNSPanel subdomain={subdomain} /> : null}
        {tab === "danger" ? <DangerPanel title={title} onBack={onBack} /> : null}
        {tab === "visibility" ? <div className="tnt__embed"><div style={{ padding: "20px 24px" }}><SiteVisibility selectedSubdomain={subdomain} /></div></div> : null}
        {tab === "branding" ? <div className="tnt__embed"><div style={{ padding: "20px 24px" }}><BrandingSettings selectedSubdomain={subdomain} /></div></div> : null}
        {tab === "hosting" ? <div className="tnt__embed"><div style={{ padding: "20px 24px" }}><FrontendDeployment selectedSubdomain={subdomain} /></div></div> : null}
      </div>
    </>
  )
}

function OverviewPanel({ title, subdomain, siteUrl, onTab }: { title: string; subdomain: string; siteUrl: string; onTab: (t: Tab) => void }) {
  const checklist = [
    { l: "Subdomain provisioned", ok: true, tab: null as Tab | null },
    { l: "Branding applied (logo + colors)", ok: false, tab: "branding" as Tab },
    { l: "Custom domain connected", ok: false, tab: "dns" as Tab },
    { l: "Visibility set", ok: true, tab: "visibility" as Tab },
  ]
  const done = checklist.filter((c) => c.ok).length
  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>{title}</h1>
          <div className="sub mono">{subdomain}.{rootDomain}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { l: "Status", v: "Active", i: ShieldCheck },
          { l: "Visibility", v: "Public", i: Eye },
          { l: "Host", v: `${rootDomain}`, i: Globe },
          { l: "Custom domain", v: "Not set", i: Globe },
        ].map((k) => {
          const Icon = k.i
          return (
            <div className="tnt__stat" key={k.l}>
              <div className="tnt__stat-label"><Icon /> {k.l}</div>
              <div className="tnt__stat-value" style={{ fontSize: 16 }}>{k.v}</div>
            </div>
          )
        })}
      </div>
      <div className="card">
        <div className="card__head">
          <h3 className="card__title">Setup checklist</h3>
          <span className="muted" style={{ fontSize: 11 }}>{done} of {checklist.length} complete</span>
        </div>
        <div>
          {checklist.map((x, i) => (
            <div key={i} className="row" style={{ padding: "9px 16px", borderBottom: "1px solid var(--br-border)", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9999, background: x.ok ? "#10b981" : "#fff", border: x.ok ? "1px solid #10b981" : "1.5px dashed #cbd5e1", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                {x.ok ? <Check style={{ width: 11, height: 11 }} /> : null}
              </span>
              <span style={{ fontSize: 12.5, color: x.ok ? "var(--br-text-secondary)" : "var(--br-text)", textDecoration: x.ok ? "line-through" : "none" }}>{x.l}</span>
              {!x.ok && x.tab ? (
                <button className="btn btn--ghost btn--xs" style={{ marginLeft: "auto" }} onClick={() => onTab(x.tab as Tab)}>Resolve <ArrowRight style={{ width: 11, height: 11 }} /></button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function DNSPanel({ subdomain }: { subdomain: string }) {
  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getDomainsForSubdomain(subdomain)
      .then((d) => { if (active) setDomains(Array.isArray(d) ? d : []) })
      .catch(() => { if (active) setDomains([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [subdomain])

  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>DNS &amp; domains</h1>
          <div className="sub">Connect a custom domain to <span className="mono">{subdomain}.{rootDomain}</span>.</div>
        </div>
      </div>

      {/* Platform records — what every custom domain points at (platform-provided). */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head">
          <h3 className="card__title">Platform DNS targets</h3>
          <span className="muted" style={{ fontSize: 11 }}>Point your domain here</span>
        </div>
        <div style={{ overflow: "auto" }}>
          <table className="tnt__dns">
            <thead><tr><th style={{ width: 70 }}>Type</th><th style={{ width: 140 }}>Host</th><th>Value</th><th style={{ width: 60 }}>TTL</th></tr></thead>
            <tbody>
              <tr><td><span className="tnt__dns-type">A</span></td><td className="is-label">@</td><td>76.76.21.21</td><td>Auto</td></tr>
              <tr><td><span className="tnt__dns-type">CNAME</span></td><td className="is-label">www</td><td>cname.vercel-dns.com</td><td>Auto</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card__body" style={{ paddingTop: 8 }}>
          <span className="muted" style={{ fontSize: 11 }}>
            A/CNAME targets are platform defaults shown for reference; email auth records (SPF/DKIM/DMARC)
            are configured per custom domain once added.
          </span>
        </div>
      </div>

      {/* REAL custom-domain verification records */}
      <div className="card">
        <div className="card__head">
          <h3 className="card__title">Your custom domains</h3>
          <span className="muted" style={{ fontSize: 11 }}>{loading ? "Loading…" : `${domains.length} connected`}</span>
        </div>
        {loading ? (
          <div className="card__body muted" style={{ fontSize: 12 }}>Loading domains…</div>
        ) : domains.length === 0 ? (
          <div className="tnt__empty" style={{ padding: "36px 24px" }}>
            <div className="tnt__empty-glyph"><Globe /></div>
            <h2 className="tnt__empty-h">No custom domain yet</h2>
            <p className="tnt__empty-p">Add a domain to verify ownership and issue SSL. Use the Custom domains manager for the full add + verify flow.</p>
          </div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table className="tnt__dns">
              <thead><tr><th>Domain</th><th style={{ width: 90 }}>Status</th><th style={{ width: 90 }}>SSL</th><th>Verification record</th></tr></thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id}>
                    <td className="is-label">{d.domain}{d.is_primary ? <span className="pill pill--blue" style={{ fontSize: 9, marginLeft: 6 }}>primary</span> : null}</td>
                    <td>
                      <span className="row" style={{ gap: 5, fontSize: 11 }}>
                        <span className={"tnt__dot " + (d.status === "active" ? "tnt__dot--ok" : d.status === "error" ? "tnt__dot--err" : "tnt__dot--warn")} />
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <span className="row" style={{ gap: 5, fontSize: 11 }}>
                        <span className={"tnt__dot " + (d.ssl_status === "active" ? "tnt__dot--ok" : d.ssl_status === "error" ? "tnt__dot--err" : "tnt__dot--warn")} />
                        {d.ssl_status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>
                      {d.verification_type ? <span className="tnt__dns-type" style={{ marginRight: 6 }}>{d.verification_type.toUpperCase()}</span> : null}
                      {d.verification_value || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="card__body" style={{ borderTop: "1px solid var(--br-border)" }}>
          <span className="muted" style={{ fontSize: 11 }}>Manage domains, add/verify, and set the primary in the Custom domains manager below.</span>
        </div>
      </div>

      {/* Full real domain manager embedded */}
      <div className="tnt__embed" style={{ marginTop: 16 }}>
        <DomainManagement subdomains={[{ subdomain }]} selectedSubdomain={subdomain} />
      </div>
    </>
  )
}

function DangerPanel({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <>
      <div className="tnt__page-h">
        <div>
          <h1>Danger zone</h1>
          <div className="sub">Destructive actions for <strong>{title}</strong>. These can't be undone.</div>
        </div>
      </div>
      {[
        { l: "Reset branding to defaults", d: "Clear logo and colors, restore the default theme.", b: "Reset", danger: true, action: "branding" },
        { l: "Delete this subdomain", d: "Permanently delete this subdomain and all of its data.", b: "Delete", danger: true, action: "delete" },
      ].map((r, i) => (
        <div key={i} className="card" style={{ marginBottom: 12, borderColor: r.danger ? "#fecaca" : "var(--br-border)" }}>
          <div className="card__body" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="col" style={{ flex: 1, gap: 2 }}>
              <strong style={{ fontSize: 13.5 }}>{r.l}</strong>
              <span className="muted" style={{ fontSize: 11.5 }}>{r.d}</span>
            </div>
            <button
              className={"btn btn--xs " + (r.danger ? "btn--danger" : "btn--secondary")}
              onClick={() => onBack()}
            >
              {r.b}
            </button>
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 11 }}>
        Subdomain delete is performed from the Subdomains list (with confirm). Use the back arrow to return.
      </div>
    </>
  )
}
