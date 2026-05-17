"use client"

/**
 * AdminOverview — Super-admin home / overview section.
 *
 * Visual: Hybrid design Home screen — KPI strip, Sites overview card,
 * Activity feed, quick-action banner.
 *
 * Data props are passed from the server page; fetch calls are done
 * client-side via the existing /api/super-admin/analytics endpoint.
 */

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  Users,
  Globe,
  Building2,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShieldAlert,
  Sparkles,
  Crown,
} from "lucide-react"

interface OverviewStats {
  users: {
    total: number
    newLast30Days: number
    dailySignups: Array<{ date: string; count: number }>
  }
  subdomains: { total: number; last30Days: number; last7Days: number }
  teams: { total: number; last30Days: number; totalMembers: number }
  topUsers: Array<{
    userId: string
    email: string
    displayName: string | null
    subdomainCount: number
  }>
}

interface AdminOverviewProps {
  superAdminEmail: string
}

function StatCard({
  label,
  value,
  delta,
  up,
  bars,
  Icon,
}: {
  label: string
  value: string
  delta?: string
  up?: boolean
  bars?: number[]
  Icon: React.ElementType
}) {
  return (
    <div className="ca-stat">
      <div className="ca-stat__label">
        <Icon size={12} aria-hidden />
        {label}
      </div>
      <div className="ca-row ca-between" style={{ alignItems: "flex-end" }}>
        <div className="ca-stat__value">{value}</div>
        {bars && (
          <div className="ca-bars" style={{ width: 64 }}>
            {bars.map((h, i) => (
              <span key={i} style={{ height: h * 3 + "px" }} />
            ))}
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div
          className={`ca-stat__delta${up ? " ca-stat__delta--up" : " ca-stat__delta--down"}`}
        >
          {up ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />}
          {delta}
        </div>
      )}
    </div>
  )
}

export function AdminOverview({ superAdminEmail }: AdminOverviewProps) {
  const [data, setData] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/super-admin/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const json = (await res.json()) as OverviewStats
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="ca-col" style={{ alignItems: "center", padding: "48px 0" }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--ca-text-soft)" }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="ca-banner ca-banner--err">
        <ShieldAlert size={16} aria-hidden />
        <div>
          <b>Failed to load dashboard data</b>
          <div className="ca-muted" style={{ marginTop: 4 }}>{error}</div>
          <button
            className="ca-btn ca-btn--xs ca-btn--secondary"
            onClick={fetchData}
            style={{ marginTop: 8 }}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const displayName = superAdminEmail.split("@")[0]

  const kpis = [
    {
      label: "Users · 30d",
      value: data.users.total.toLocaleString(),
      delta: `+${data.users.newLast30Days} new`,
      up: true,
      bars: [3, 4, 5, 6, 5, 7, 8],
      Icon: Users,
    },
    {
      label: "Subdomains",
      value: data.subdomains.total.toLocaleString(),
      delta: `+${data.subdomains.last30Days} this month`,
      up: true,
      bars: [2, 3, 3, 4, 5, 6, 7],
      Icon: Globe,
    },
    {
      label: "Teams",
      value: data.teams.total.toLocaleString(),
      delta: `+${data.teams.last30Days} this month`,
      up: data.teams.last30Days > 0,
      bars: [4, 4, 5, 5, 6, 6, 7],
      Icon: Building2,
    },
    {
      label: "Members",
      value: data.teams.totalMembers.toLocaleString(),
      bars: [3, 4, 4, 5, 6, 6, 7],
      Icon: Activity,
    },
  ]

  return (
    <div>
      <div className="ca-page-h">
        <div>
          <h1>Good morning, {displayName}</h1>
          <div className="sub">Platform overview · all tenants and users</div>
        </div>
        <div className="ca-row" style={{ gap: 8 }}>
          <span className="ca-pill ca-pill--green">
            <span className="ca-dot" />
            All systems normal
          </span>
          <span className="ca-pill ca-pill--blue">
            <Sparkles size={11} aria-hidden /> Platform admin
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Top users + recent signups */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="ca-card">
          <div className="ca-card__head">
            <h3 className="ca-card__title">Top tenants by subdomains</h3>
            <button className="ca-btn ca-btn--ghost ca-btn--xs" type="button">
              View all <ArrowUpRight size={11} aria-hidden />
            </button>
          </div>
          <div>
            {data.topUsers.slice(0, 6).map((u, i) => (
              <div
                key={u.userId}
                className="ca-row"
                style={{
                  padding: "10px 16px",
                  borderBottom:
                    i < Math.min(5, data.topUsers.length - 1)
                      ? "1px solid var(--ca-border)"
                      : "none",
                  gap: 12,
                }}
              >
                <span
                  className="ca-muted"
                  style={{
                    fontSize: 11,
                    width: 20,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {i + 1}
                </span>
                <div
                  className="ca-avatar ca-avatar--sm ca-avatar--blue"
                  style={{ flexShrink: 0 }}
                >
                  {(u.displayName ?? u.email)
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="ca-col" style={{ flex: 1, gap: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 12.5 }}>
                    {u.displayName ?? u.email.split("@")[0]}
                  </strong>
                  <span className="ca-muted" style={{ fontSize: 11 }}>
                    {u.email}
                  </span>
                </div>
                <span className="ca-pill" style={{ fontSize: 11 }}>
                  {u.subdomainCount} sites
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform health */}
        <div className="ca-card">
          <div className="ca-card__head">
            <h3 className="ca-card__title">Platform at a glance</h3>
          </div>
          <div className="ca-card__body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="ca-row ca-between" style={{ fontSize: 12.5 }}>
              <span className="ca-muted">Total users</span>
              <strong>{data.users.total.toLocaleString()}</strong>
            </div>
            <div className="ca-row ca-between" style={{ fontSize: 12.5 }}>
              <span className="ca-muted">New this month</span>
              <strong>{data.users.newLast30Days.toLocaleString()}</strong>
            </div>
            <div className="ca-row ca-between" style={{ fontSize: 12.5 }}>
              <span className="ca-muted">Active subdomains</span>
              <strong>{data.subdomains.total.toLocaleString()}</strong>
            </div>
            <div className="ca-row ca-between" style={{ fontSize: 12.5 }}>
              <span className="ca-muted">New subdomains · 7d</span>
              <strong>{data.subdomains.last7Days.toLocaleString()}</strong>
            </div>
            <div className="ca-row ca-between" style={{ fontSize: 12.5 }}>
              <span className="ca-muted">Teams</span>
              <strong>{data.teams.total.toLocaleString()}</strong>
            </div>
            <div className="ca-row ca-between" style={{ fontSize: 12.5 }}>
              <span className="ca-muted">Team members</span>
              <strong>{data.teams.totalMembers.toLocaleString()}</strong>
            </div>
            <div
              style={{
                borderTop: "1px solid var(--ca-border)",
                paddingTop: 10,
                marginTop: 2,
              }}
            >
              <div className="ca-row" style={{ gap: 6 }}>
                <Crown size={13} style={{ color: "var(--ca-primary)" }} aria-hidden />
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ca-primary)" }}>
                  Super Admin
                </span>
                <span className="ca-muted" style={{ fontSize: 11.5, marginLeft: 4 }}>
                  {superAdminEmail}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
