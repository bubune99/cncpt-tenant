'use client';

/**
 * Admin dashboard — Atlas editorial style
 * Faithful port of atlas-v2-pages.jsx Dashboard()
 *
 * Preserves all existing data wiring:
 *  - auth / access check via useSubdomainAccess
 *  - stats fetch from /api/cms/admin/stats-simple
 *  - demo mode banner
 *  - useCMSConfig buildPath
 */

import { useEffect, useState } from 'react';
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Return current day label e.g. "Tuesday" */
function currentDay(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
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
  const [loadingStats, setLoadingStats] = useState(true);

  const isLoading = isDemo ? accessLoading : (authLoading || accessLoading);

  useEffect(() => {
    if (!isLoading) {
      if (isDemo || isDemoAccess) { void fetchStats(); return; }
      if (!user) { router.push('/handler/sign-in?redirect=/admin'); return; }
      if (accessError === 'Not authenticated') { router.push('/handler/sign-in?redirect=/admin'); return; }
      if (!hasAccess) { router.push('/'); return; }
      void fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, hasAccess, accessError, isDemo, isDemoAccess]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/cms/admin/stats-simple');
      if (!res.ok) throw new Error('stats fetch failed');
      const data = await res.json() as { stats: DashboardStats };
      setStats(data.stats);
    } catch {
      setStats({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalBlogPosts: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

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

  const kpis: readonly [string, string | number, string][] = [
    ['Orders',    stats?.totalOrders   ?? 0, buildPath('/admin/orders')],
    ['Products',  stats?.totalProducts ?? 0, buildPath('/admin/products')],
    ['Customers', stats?.totalUsers    ?? 0, buildPath('/admin/customers')],
    ['Blog posts',stats?.totalBlogPosts ?? 0, buildPath('/admin/blog')],
  ] as const;

  const plate: readonly [string, string, string, string][] = [
    ['ORDERS',  'Pack queue',      'Pending fulfillment',          'pill-solid-gold'],
    ['PAGES',   'Review pages',    'Check drafts & broken links',  'pill-out'],
    ['BLOG',    'Approve post',    'Awaiting review',              'pill-out'],
    ['STOCK',   'Restock low SKUs','Low-stock items need attention','pill-solid-accent'],
  ] as const;

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

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 32 }}>

        {/* Left — KPI strip + on-your-plate */}
        <div>
          {/* KPI bricks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0 }}>
            {kpis.map(([label, value, href]) => (
              <Link
                key={label}
                href={href}
                style={{ textDecoration: 'none', color: 'inherit', borderTop: '1px solid var(--ink)', padding: '10px 0 10px', paddingRight: 16 }}
                data-tour-id={`dashboard-stat-${label.toLowerCase().replace(' ','-')}`}
              >
                <div className="eyebrow-ink">{label}</div>
                <div className="display" style={{ fontSize: 52, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 2 }}>
                  {value}
                </div>
              </Link>
            ))}
          </div>

          {/* On your plate */}
          <div style={{ borderTop: '1px solid var(--ink)', marginTop: 22, paddingTop: 12 }}>
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

        {/* Right — quick nav + this-week */}
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
              Go to orders to manage fulfillment
            </div>
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
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

          {/* Week snapshot */}
          <div>
            <div className="eyebrow-ink" style={{ marginBottom: 6 }}>Snapshot</div>
            <table className="tbl" style={{ fontSize: 12 }}>
              <tbody>
                {[
                  ['Products',   stats?.totalProducts ?? 0],
                  ['Customers',  stats?.totalUsers    ?? 0],
                  ['Orders',     stats?.totalOrders   ?? 0],
                  ['Blog posts', stats?.totalBlogPosts ?? 0],
                ].map(([k, v], i) => (
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
