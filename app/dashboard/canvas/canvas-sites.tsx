"use client"

/**
 * SITES — Subdomains list + empty state. Recreates Tnt_Subdomains /
 * Tnt_SubdomainsEmpty from tenant-overview-subdomains.jsx.
 *
 * REAL data: the sites are the user's actual subdomains (getUserSubdomains,
 * passed down). "Manage" opens the Canvas subdomain detail (in-shell). The
 * create flow routes to the existing /dashboard/create-subdomain wizard.
 *
 * The list columns "Traffic · 30d" has no per-site analytics source yet
 * (Analytics is a separate Phase-2 redesign), so that cell is shown as "—"
 * with a note rather than a fabricated number.
 */

import { useRouter } from "next/navigation"
import {
  Plus, Filter, ArrowUpDown, Grid3x3, ExternalLink, MoreHorizontal,
  Globe, ShoppingBag, BookOpen, Link as LinkIcon,
} from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"

interface CanvasSitesProps {
  subdomains: any[]
  onManage: (subdomain: string) => void
}

const TEMPLATES = [
  { icon: ShoppingBag, l: "Storefront", d: "Product catalog, checkout, customer accounts." },
  { icon: BookOpen, l: "Blog or Journal", d: "Posts, authors, taxonomy, RSS feed." },
  { icon: Globe, l: "Landing page", d: "Single page, capture form, analytics ready." },
]

export function CanvasSites({ subdomains, onManage }: CanvasSitesProps) {
  const router = useRouter()

  if (subdomains.length === 0) {
    return (
      <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
        <div className="tnt__page-h">
          <div>
            <h1>Subdomains</h1>
            <div className="sub">Manage the sites in your workspace.</div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="tnt__empty">
            <div className="tnt__empty-glyph"><Globe /></div>
            <h2 className="tnt__empty-h">Spin up your first site</h2>
            <p className="tnt__empty-p">
              Your workspace can host any number of subdomains — storefronts, blogs,
              landing pages, or staging. Each gets its own DNS, branding, and access.
            </p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--primary" onClick={() => router.push("/dashboard/create-subdomain")}>
                <Plus style={{ width: 13, height: 13 }} /> Create subdomain
              </button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">Or start from a template</h3>
            <span className="muted" style={{ fontSize: 11 }}>Pre-configured visibility, pages, and branding</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
            {TEMPLATES.map((t) => {
              const Icon = t.icon
              return (
                <button key={t.l} className="tnt__template" onClick={() => router.push("/dashboard/create-subdomain")}>
                  <div className="tnt__template-glyph"><Icon /></div>
                  <strong style={{ fontSize: 13 }}>{t.l}</strong>
                  <span className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, textAlign: "left" }}>{t.d}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const publicCount = subdomains.length

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>Subdomains</h1>
          <div className="sub">Manage the sites in your workspace.</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn--secondary btn--xs"><Filter style={{ width: 12, height: 12 }} /> Filter</button>
          <button className="btn btn--primary btn--xs" onClick={() => router.push("/dashboard/create-subdomain")}>
            <Plus style={{ width: 12, height: 12 }} /> Create subdomain
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head">
          <div className="row" style={{ gap: 8 }}>
            <h3 className="card__title">{subdomains.length} site{subdomains.length === 1 ? "" : "s"}</h3>
            <span className="muted" style={{ fontSize: 11 }}>{publicCount} active</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn--ghost btn--xs"><ArrowUpDown style={{ width: 12, height: 12 }} /> Sort</button>
            <button className="btn btn--ghost btn--xs"><Grid3x3 style={{ width: 12, height: 12 }} /> Grid</button>
          </div>
        </div>
        <div>
          {subdomains.map((s) => {
            const siteUrl = `${protocol}://${s.subdomain}.${rootDomain}`
            const created = s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"
            return (
              <div
                key={s.subdomain}
                style={{ padding: "16px 18px", borderBottom: "1px solid var(--br-border)", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: 18, alignItems: "center" }}
              >
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#0F172A,#3B82F6)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
                    {(s.subdomain[0] || "S").toUpperCase()}
                  </div>
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <strong style={{ fontSize: 13.5 }}>{s.site_title || s.subdomain}</strong>
                      <span className="pill pill--green" style={{ fontSize: 10.5 }}><span className="dot" /> Active</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--br-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.subdomain}.{rootDomain}
                    </div>
                  </div>
                </div>
                <div className="col" style={{ gap: 1 }}>
                  <span className="muted" style={{ fontSize: 10.5 }}>Created</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{created}</span>
                </div>
                <div className="col" style={{ gap: 1 }}>
                  <span className="muted" style={{ fontSize: 10.5 }}>Traffic · 30d</span>
                  <span style={{ fontSize: 12 }} className="muted">—</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn--secondary btn--xs" onClick={() => onManage(s.subdomain)}>Manage</button>
                  <a className="iconbtn iconbtn--sm" href={siteUrl} target="_blank" rel="noreferrer" aria-label="Visit"><ExternalLink style={{ width: 12, height: 12 }} /></a>
                  <a className="iconbtn iconbtn--sm iconbtn--ghost" href={`${siteUrl}/admin`} aria-label="Content"><MoreHorizontal style={{ width: 13, height: 13 }} /></a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="muted" style={{ fontSize: 10.5 }}>
        Per-site traffic figures arrive with the Analytics redesign (Phase 2).
      </div>
    </div>
  )
}
