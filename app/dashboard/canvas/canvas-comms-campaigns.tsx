"use client"

/**
 * Email campaigns — REAL (account-level, /api/dashboard/campaigns).
 * Campaigns are authored inside each site's tenant admin, so the empty state
 * links straight to every site's email tools instead of dead-ending.
 */

import { useEffect, useState } from "react"
import { Loader2, Mail, ExternalLink } from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"

interface Campaign {
  id: string; name: string; subject: string; status: string
  sentAt: string | null; recipientCount: number; sentCount: number; createdAt: string; site?: string
}

/** Minimal shape of a subdomain we need to build the email-tools link. */
export interface CommsSite {
  subdomain: string
  site_title?: string | null
}

export function CampaignsPanel({ subdomains = [] }: { subdomains?: CommsSite[] }) {
  const [rows, setRows] = useState<Campaign[] | null>(null)
  useEffect(() => {
    fetch("/api/dashboard/campaigns")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows(Array.isArray(d?.campaigns) ? d.campaigns : []))
      .catch(() => setRows([]))
  }, [])

  return (
    <div className="dirH__page" style={{ padding: "20px 24px", overflow: "auto" }}>
      <div className="tnt__page-h">
        <div>
          <h1>Email campaigns</h1>
          <div className="sub">Newsletters and automated flows across your sites.</div>
        </div>
      </div>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Campaigns</h3></div>
        {rows === null ? (
          <div style={{ padding: 18 }} className="muted"><Loader2 className="tnt-spin" style={{ width: 14, height: 14 }} /> Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center" }}>
            <Mail style={{ width: 22, height: 22, opacity: 0.5 }} />
            <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              No campaigns yet. Campaigns are created in a site&apos;s email tools and show up here once sent.
            </div>
            {subdomains.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 14 }}>
                {subdomains.map((s) => (
                  <a
                    key={s.subdomain}
                    className="btn btn--secondary btn--xs"
                    href={`${protocol}://${s.subdomain}.${rootDomain}/admin/email-marketing`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.site_title || s.subdomain} — open email tools <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>Create a site first to set up email campaigns.</div>
            )}
          </div>
        ) : (
          <table className="tnt__matrix">
            <thead><tr><th>Campaign</th><th>Site</th><th>Status</th><th>Sent</th><th>Recipients</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong style={{ fontSize: 12.5 }}>{r.name}</strong><div className="muted" style={{ fontSize: 11 }}>{r.subject}</div></td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.site ?? "—"}</td>
                  <td><span className={"pill " + (r.status === "SENT" ? "pill--green" : r.status === "DRAFT" ? "pill--slate" : "pill--blue")} style={{ fontSize: 10.5 }}>{r.status.toLowerCase()}</span></td>
                  <td className="mono">{r.sentCount.toLocaleString()}</td>
                  <td className="mono">{r.recipientCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
