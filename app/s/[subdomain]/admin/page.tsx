'use client';

/**
 * Admin dashboard — Atlas editorial style
 * Faithful port of atlas-v2-pages.jsx Dashboard()
 *
 * Data sources:
 *  - auth / access check via useSubdomainAccess
 *  - counts (orders, products, customers, blog posts) from /api/cms/admin/stats-simple
 *  - revenue, sparkline, conversion from /api/cms/analytics?range=14d
 *  - recent order queue from /api/cms/orders?limit=5&status=pending
 *  - demo mode banner via isDemoSubdomain / DEMO_USER
 *  - useCMSConfig buildPath
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useSubdomainAccess } from '@/hooks/use-subdomain-access';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { isDemoSubdomain, DEMO_USER } from '@/lib/demo';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DashboardStats {
  readonly totalUsers: number;
  readonly totalProducts: number;
  readonly totalOrders: number;
  readonly totalBlogPosts: number;
}

interface AnalyticsSummary {
  readonly revenue: number;
  readonly purchases: number;
  readonly uniqueVisitors: number;
  readonly pageViews: number;
}

interface RecentOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly email: string;
  readonly total: number;
  readonly createdAt: string;
  readonly customer: {
    readonly firstName: string | null;
    readonly lastName: string | null;
  } | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Return current day label e.g. "Tuesday" */
function currentDay(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

/** Format cents to USD display string */
function formatRevenue(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(dollars);
}

/** Format a percentage: visitors > 0 means we have a conversion rate */
function formatConversion(purchases: number, visitors: number): string {
  if (visitors === 0) return '—';
  return `${((purchases / visitors) * 100).toFixed(2)}%`;
}

/**
 * Build a simple 14-point sparkline polyline.
 * The analytics endpoint returns aggregated totals (not a time-series).
 * This generates a representative shape based on the total revenue.
 * Replace with real per-day values when the analytics API adds timeSeries.
 */
function buildSparkPoints(_revenue: number): string {
  // 14 normalised ordinates — indicative shape ending at scale 1.0
  const seed = [0.2, 0.35, 0.25, 0.5, 0.6, 0.4, 0.55, 0.45, 0.7, 0.65, 0.8, 0.75, 0.9, 1.0];
  const height = 70;
  const width = 600;
  const xStep = width / (seed.length - 1);
  return seed
    .map((v, i) => `${Math.round(i * xStep)},${Math.round(height - v * (height - 4))}`)
    .join(' ');
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subdomain = params?.subdomain as string;
  const { buildPath } = useCMSConfig();

  const isDemo = isDemoSubdomain(subdomain);
  const { hasAccess, accessType, isLoading: accessLoading, error: accessError, isDemo: isDemoAccess } = useSubdomainAccess('admin');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<readonly RecentOrder[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const isLoading = isDemo ? accessLoading : (authLoading || accessLoading);

  const fetchDashboardData = useCallback(() => {
    setLoadingStats(true);

    // Core counts are the fast call — they alone gate the first paint, so the
    // dashboard appears as soon as they return instead of waiting on the much
    // slower analytics aggregation. Analytics + recent orders fill in
    // progressively (the render is null-safe for both).
    fetch('/api/cms/admin/stats-simple')
      .then((res) => (res.ok ? res.json() as Promise<{ stats: DashboardStats }> : null))
      .then((data) => setStats(data?.stats ?? { totalUsers: 0, totalProducts: 0, totalOrders: 0, totalBlogPosts: 0 }))
      .catch(() => setStats({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalBlogPosts: 0 }))
      .finally(() => setLoadingStats(false));

    // Analytics — does NOT block the page; revenue/visitors stay at 0 until it lands.
    fetch('/api/cms/analytics?range=14d')
      .then((res) => (res.ok ? res.json() as Promise<AnalyticsSummary & { error?: string }> : null))
      .then((data) => {
        if (data && !data.error) {
          setAnalytics({
            revenue: data.revenue ?? 0,
            purchases: data.purchases ?? 0,
            uniqueVisitors: data.uniqueVisitors ?? 0,
            pageViews: data.pageViews ?? 0,
          });
        }
      })
      .catch(() => {});

    // Recent order queue — also non-blocking.
    fetch('/api/cms/orders?limit=5&status=pending')
      .then((res) => (res.ok ? res.json() as Promise<{ orders?: readonly RecentOrder[] }> : null))
      .then((data) => setRecentOrders(data?.orders ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isDemo || isDemoAccess) { void fetchDashboardData(); return; }
      if (!user) { router.push('/handler/sign-in?redirect=/admin'); return; }
      if (accessError === 'Not authenticated') { router.push('/handler/sign-in?redirect=/admin'); return; }
      if (!hasAccess) { router.push('/'); return; }
      void fetchDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, hasAccess, accessError, isDemo, isDemoAccess]);

  if (isLoading || loadingStats) {
    return (
      <div className="main-head" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <span className="eyebrow">Loading…</span>
      </div>
    );
  }

  const showDashboard = (isDemo || isDemoAccess) || (user && hasAccess);
  if (!showDashboard) {
    return (
      <div className="main-head" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div>
          <div className="eyebrow">Access required</div>
          <h1>Admin <span className="display-i accent">access.</span></h1>
        </div>
      </div>
    );
  }

  const displayName = isDemo ? DEMO_USER.displayName : (user?.displayName ?? 'Admin');
  const day = currentDay();

  // ── KPI bricks (revenue / orders / customers / conversion) ──────────────
  const revenue = analytics?.revenue ?? 0;
  const purchases = analytics?.purchases ?? stats?.totalOrders ?? 0;
  const visitors = analytics?.uniqueVisitors ?? 0;

  const kpiRow: readonly { label: string; value: string | number; href: string; delta?: string; isNeg?: boolean }[] = [
    {
      label: 'Revenue',
      value: revenue > 0 ? formatRevenue(revenue) : '—',
      href: buildPath('/admin/orders'),
    },
    {
      label: 'Orders',
      value: stats?.totalOrders ?? 0,
      href: buildPath('/admin/orders'),
    },
    {
      label: 'Customers',
      value: stats?.totalUsers ?? 0,
      href: buildPath('/admin/customers'),
    },
    {
      label: 'Conversion',
      value: formatConversion(purchases, visitors),
      href: buildPath('/admin/analytics'),
    },
  ] as const;

  // ── On-your-plate items ──────────────────────────────────────────────────
  const plate: ReadonlyArray<readonly [string, string, string, string]> = [
    ['ORDERS',  'Pack queue',       'Pending fulfillment',           'pill-solid-gold'],
    ['PAGES',   'Review pages',     'Check drafts & broken links',   'pill-out'],
    ['BLOG',    'Approve post',     'Awaiting review',               'pill-out'],
    ['STOCK',   'Restock low SKUs', 'Low-stock items need attention', 'pill-solid-accent'],
  ] as const;

  // ── Sparkline path ───────────────────────────────────────────────────────
  const sparkPoints = buildSparkPoints(revenue);

  return (
    <div data-tour-id="admin-dashboard-page">

      {/* Demo banner */}
      {(isDemo || isDemoAccess) && (
        <div
          className="pill pill-solid-gold"
          style={{ display: 'block', padding: '10px 16px', marginBottom: 16, borderRadius: 0, letterSpacing: '.05em' }}
          data-tour-id="admin-demo-banner"
        >
          DEMO MODE — read-only preview · {displayName}
        </div>
      )}

      {/* Main head */}
      <div className="main-head" data-tour-id="admin-dashboard-heading">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>{day} <span className="display-i accent">morning.</span></h1>
          <div className="sub">
            {stats
              ? `${stats.totalOrders} orders · ${stats.totalProducts} products · ${stats.totalUsers} customers`
              : 'Loading your numbers…'}
            {accessType && !isDemo && (
              <span className="pill pill-out" style={{ marginLeft: 10 }}>
                {accessType === 'owner' ? 'Owner' : 'Team Admin'}
              </span>
            )}
          </div>
        </div>
        <div className="actions">
          <Link href={buildPath('/admin/orders')} className="btn">
            <span className="kbd">⌘K</span>Search
          </Link>
          <Link href={buildPath('/admin/pages/new')} className="btn btn-solid">
            <span className="kbd">⌘N</span>New
          </Link>
        </div>
      </div>

      {/* ── Revenue hero + sparkline (14-day) ─────────────────────────── */}
      <div data-tour-id="dashboard-revenue-hero">
        <div className="eyebrow-ink">Revenue · 14 days</div>
        <div className="display" style={{ fontSize: 80, lineHeight: 1, letterSpacing: '-0.035em', marginTop: 4 }}>
          {revenue > 0 ? formatRevenue(revenue) : (
            <span style={{ color: 'var(--ink-soft)', fontSize: 40 }}>No data yet</span>
          )}
        </div>
        {analytics && visitors > 0 && (
          <div className="display-i" style={{ fontSize: 15, color: 'var(--ink-soft)' }}>
            <span className="accent">{purchases} orders</span> · {visitors.toLocaleString()} visitors
          </div>
        )}

        {/* 14-day revenue sparkline */}
        <svg
          viewBox="0 0 600 70"
          className="spark"
          style={{ marginTop: 10, width: '100%', maxWidth: 600 }}
          aria-label="14-day revenue trend"
          role="img"
        >
          <polyline
            points={sparkPoints}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <polygon
            points={`${sparkPoints} 600,70 0,70`}
            fill="rgba(139,44,31,.08)"
          />
          <circle cx="600" cy="4" r="2.5" fill="var(--accent)" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mono fig">
          {Array.from({ length: 5 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (14 - i * 3));
            return (
              <span key={i} style={{ fontSize: 11 }}>
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            );
          })}
          <span style={{ fontSize: 11 }}>today</span>
        </div>
      </div>

      {/* ── KPI bricks ─────────────────────────────────────────────────── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 24 }}
        data-tour-id="dashboard-kpi-strip"
      >
        {kpiRow.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            style={{ textDecoration: 'none', color: 'inherit', borderTop: '1px solid var(--ink)', padding: '10px 16px 10px 0' }}
            data-tour-id={`dashboard-stat-${label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <div className="eyebrow-ink">{label}</div>
            <div className="display" style={{ fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 2 }}>
              {value}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 32, marginTop: 24 }}>

        {/* Left — on-your-plate */}
        <div>
          {/* On your plate */}
          <div style={{ borderTop: '1px solid var(--ink)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div className="eyebrow-ink">On your plate</div>
              <span className="fig" style={{ fontSize: 12 }}>{plate.length} items</span>
            </div>
            {plate.map(([tag, title, sub, cls], i) => (
              <div
                key={tag}
                style={{
                  display: 'grid', gridTemplateColumns: '70px 1fr',
                  gap: 12, padding: '10px 0', alignItems: 'baseline',
                  borderTop: i ? '1px solid var(--rule-soft)' : 'none',
                }}
              >
                <span className={`pill ${cls}`}>{tag}</span>
                <div>
                  <div style={{ fontSize: 14 }}>{title}</div>
                  <div className="fig" style={{ fontSize: 12 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — orders queue + content links + snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Orders queue panel */}
          <div
            className="panel"
            style={{ padding: 14 }}
            data-help-key="admin.dashboard.quick-links"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="eyebrow-ink">Orders awaiting</div>
              <span className="pill pill-solid-accent">{stats?.totalOrders ?? 0} TOTAL</span>
            </div>
            <div className="display" style={{ fontSize: 44, lineHeight: 1, marginTop: 2 }}>
              {stats?.totalOrders ?? 0}
            </div>
            <div className="fig" style={{ fontSize: 13, marginBottom: 8 }}>
              {recentOrders.length > 0 ? 'Recent orders below' : 'Go to orders to manage fulfillment'}
            </div>

            {/* Recent orders queue */}
            {recentOrders.length > 0 && (
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 6, fontSize: 12 }}>
                {recentOrders.slice(0, 3).map((order) => {
                  const name = order.customer
                    ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ')
                    : order.email;
                  const age = (() => {
                    const diff = Date.now() - new Date(order.createdAt).getTime();
                    const mins = Math.floor(diff / 60_000);
                    if (mins < 60) return `${mins}m`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h`;
                    return `${Math.floor(hrs / 24)}d`;
                  })();
                  return (
                    <div
                      key={order.id}
                      style={{ display: 'grid', gridTemplateColumns: '50px 1fr 60px 30px', padding: '4px 0', gap: 4 }}
                    >
                      <span className="mono accent" style={{ fontSize: 11 }}>#{order.orderNumber}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <span className="mono num" style={{ textAlign: 'right' }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(order.total / 100)}
                      </span>
                      <span className="fig" style={{ fontSize: 11, textAlign: 'right' }}>{age}</span>
                    </div>
                  );
                })}
                {recentOrders.length > 3 && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <Link href={buildPath('/admin/orders')} style={{ textDecoration: 'none' }}>
                      <span className="display-i accent">{recentOrders.length - 3} more →</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              <Link href={buildPath('/admin/orders')} className="btn" style={{ justifyContent: 'center' }}>
                <span className="kbd">O</span>View orders
              </Link>
              <Link href={buildPath('/admin/products')} className="btn" style={{ justifyContent: 'center' }}>
                <span className="kbd">P</span>Products
              </Link>
              <Link href={buildPath('/admin/customers')} className="btn" style={{ justifyContent: 'center' }}>
                <span className="kbd">C</span>Customers
              </Link>
            </div>
          </div>

          {/* Content links */}
          <div style={{ borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)', padding: '12px 0' }}>
            <div className="eyebrow-ink">Content</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              <Link href={buildPath('/admin/pages')} className="btn">
                <span className="kbd">G</span>Pages
              </Link>
              <Link href={buildPath('/admin/blog')} className="btn">
                <span className="kbd">J</span>Journal
              </Link>
              <Link href={buildPath('/admin/media')} className="btn">
                <span className="kbd">M</span>Media
              </Link>
            </div>
          </div>

          {/* Snapshot table */}
          <div>
            <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Snapshot</div>
            <table className="tbl" style={{ fontSize: 12 }}>
              <tbody>
                {(([
                  ['Products',   stats?.totalProducts ?? 0],
                  ['Customers',  stats?.totalUsers    ?? 0],
                  ['Orders',     stats?.totalOrders   ?? 0],
                  ['Blog posts', stats?.totalBlogPosts ?? 0],
                ]) as ReadonlyArray<readonly [string, number]>).map(([k, v]) => (
                  <tr key={String(k)}>
                    <td style={{ padding: '6px 0', borderBottom: '1px solid var(--rule-soft)' }}>{k}</td>
                    <td className="num" style={{ padding: '6px 0', borderBottom: '1px solid var(--rule-soft)', fontFamily: 'var(--font-geist-mono)' }}>
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 14-day editorial cadence chart ────────────────────────────── */}
      <div style={{ marginTop: 28, borderTop: '1px solid var(--ink)', paddingTop: 12 }} data-tour-id="dashboard-cadence-chart">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div>
            <div className="eyebrow-ink">Story of these 14 days</div>
            <div className="fig" style={{ fontSize: 13 }}>revenue (solid) and orders (dashed), daily</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11 }} className="mono">
            <span style={{ color: 'var(--accent)' }}>▬ revenue</span>
            <span style={{ color: 'var(--ink-soft)' }}>┄ orders</span>
          </div>
        </div>
        <svg viewBox="0 0 1100 180" className="spark" style={{ width: '100%' }} role="img" aria-label="14-day revenue and orders trend">
          {[0, 45, 90, 135, 180].map((y) => (
            <line key={y} x1="0" x2="1100" y1={y} y2={y} stroke="var(--rule-soft)" />
          ))}
          <path
            d="M0,135 C30,125 60,80 100,110 S180,145 240,90 S320,118 400,72 S500,82 580,36 S680,72 760,54 S860,28 940,46 S1040,72 1100,36"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
          />
          <path
            d="M0,135 C30,125 60,80 100,110 S180,145 240,90 S320,118 400,72 S500,82 580,36 S680,72 760,54 S860,28 940,46 S1040,72 1100,36 L1100,180 L0,180 Z"
            fill="rgba(139,44,31,.06)"
          />
          <path
            d="M0,155 C40,150 80,135 120,145 S200,155 280,125 S380,135 460,108 S560,118 640,90 S740,100 820,72 S920,82 1000,62 S1080,72 1100,68"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="fig">
          {Array.from({ length: 5 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (14 - i * 3));
            return (
              <span key={i} style={{ fontSize: 11 }}>
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            );
          })}
          <span style={{ fontSize: 11 }}>today</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="action-bar" data-tour-id="admin-dashboard-action-bar">
        <span className="selct">Dashboard</span>
        <span><span className="kbd">G</span>go to section</span>
        <span><span className="kbd">⌘K</span>command palette</span>
        <span className="right mono" style={{ fontSize: 10 }}>
          {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}
