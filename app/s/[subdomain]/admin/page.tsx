'use client';

/**
 * Admin Overview — Grainy customizable widget dashboard.
 *
 * This page keeps the original auth/access/demo guards and tenancy wiring; it
 * only swaps the rendered screen for the Grainy <OverviewDashboard/>. Data is
 * fetched client-side (progressive, non-blocking) exactly as before and handed
 * to the widget registry as real, normalized values.
 *
 * Data sources:
 *  - counts        → /api/cms/admin/stats-simple
 *  - revenue chart → /api/cms/analytics?range=30d (summary + daily timeSeries)
 *  - orders        → /api/cms/orders?limit=12 (open queue + recent activity)
 *  - low stock     → /api/cms/products?limit=50&sortBy=stock&sortOrder=asc
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSubdomainAccess } from '@/hooks/use-subdomain-access';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { isDemoSubdomain } from '@/lib/demo';
import { OverviewDashboard } from '@/components/cms/admin/overview/overview-dashboard';
import type {
  OverviewData, OverviewStats, OverviewAnalytics, OverviewOrder, OverviewProduct, NavHandlers, Loaded,
} from '@/components/cms/admin/overview/overview-types';
import {
  toOverviewOrder, mergeOpenOrders, OPEN_ORDER_QUERIES, lowStockOf, analyticsFrom, type RawOrder, type RawProduct,
} from '@/lib/cms/admin/overview-rules';

// The Overview's rules (open orders, low stock, naming a customer, reading analytics) live in lib with a check.

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subdomain = params?.subdomain as string;
  const { buildPath, siteName } = useCMSConfig();

  const isDemo = isDemoSubdomain(subdomain);
  const { hasAccess, isLoading: accessLoading, error: accessError, isDemo: isDemoAccess } = useSubdomainAccess('admin');

  const [stats, setStats] = useState<OverviewStats | null>(null);
  // Each says whether it is still loading or failed, so a widget never shows 'none' before it knows.
  const [analytics, setAnalytics] = useState<Loaded<OverviewAnalytics>>('loading');
  const [orders, setOrders] = useState<Loaded<readonly OverviewOrder[]>>('loading');
  const [openOrders, setOpenOrders] = useState<Loaded<readonly OverviewOrder[]>>('loading');
  const [lowStock, setLowStock] = useState<Loaded<readonly OverviewProduct[]>>('loading');
  const [loading, setLoading] = useState(true);

  const isLoading = isDemo ? accessLoading : authLoading || accessLoading;

  const fetchDashboardData = useCallback(() => {
    setLoading(true);

    // Counts gate the first meaningful paint; the rest fill in progressively.
    fetch('/api/cms/admin/stats-simple')
      .then((res) => (res.ok ? (res.json() as Promise<{ stats: OverviewStats }>) : null))
      // Couldn't load: leave the figures unknown (shown as a dash), never zeros.
      .then((d) => setStats(d?.stats ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));

    fetch('/api/cms/analytics?range=30d')
      .then((res) => (res.ok ? (res.json() as Promise<Partial<OverviewAnalytics> & { error?: string }>) : null))
      .then((d) => setAnalytics(analyticsFrom(d)))
      .catch(() => setAnalytics('failed'));

    fetch('/api/cms/orders?limit=12')
      .then((res) => (res.ok ? (res.json() as Promise<{ orders?: readonly RawOrder[] }>) : null))
      .then((d) => setOrders(d && Array.isArray(d.orders) ? d.orders.map(toOverviewOrder) : 'failed'))
      .catch(() => setOrders('failed'));

    // Open orders by status, so an older order still waiting is never missed.
    Promise.all(OPEN_ORDER_QUERIES.map((q) =>
      fetch(`/api/cms/orders?${q}&limit=6`)
        .then((res) => (res.ok ? (res.json() as Promise<{ orders?: readonly RawOrder[] }>) : null))
        .then((d): Loaded<readonly OverviewOrder[]> => (d && Array.isArray(d.orders) ? d.orders.map(toOverviewOrder) : 'failed'))
        .catch((): Loaded<readonly OverviewOrder[]> => 'failed'),
    )).then((parts) => setOpenOrders(mergeOpenOrders(parts)));

    fetch('/api/cms/products?limit=50&sortBy=stock&sortOrder=asc')
      .then((res) => (res.ok ? (res.json() as Promise<{ products?: readonly RawProduct[] }>) : null))
      .then((d) => setLowStock(d && Array.isArray(d.products) ? lowStockOf(d.products) : 'failed'))
      .catch(() => setLowStock('failed'));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isDemo || isDemoAccess) { fetchDashboardData(); return; }
    if (!user) { router.push('/handler/sign-in?redirect=/admin'); return; }
    if (accessError === 'Not authenticated') { router.push('/handler/sign-in?redirect=/admin'); return; }
    if (!hasAccess) { router.push('/'); return; }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, hasAccess, accessError, isDemo, isDemoAccess]);

  const nav: NavHandlers = useMemo(() => ({
    onNav: (section) => router.push(buildPath(`/admin/${section === 'blog' ? 'blog' : section}`)),
    onOpenOrder: (id) => router.push(buildPath(`/admin/orders/${id}`)),
    onOpenProduct: (id) => router.push(buildPath(`/admin/products/${id}`)),
  }), [router, buildPath]);

  const data: OverviewData = useMemo(() => ({
    stats,
    analytics,
    openOrders,
    recentOrders: orders,
    lowStock,
  }), [stats, analytics, openOrders, orders, lowStock]);

  // Gate only on access resolution — the dashboard itself shows a light loading
  // hint and renders empty-safe widgets while data streams in.
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <span className="gr-eyebrow" style={{ color: 'var(--text-muted)' }}>Loading…</span>
      </div>
    );
  }

  const showDashboard = isDemo || isDemoAccess || (user && hasAccess);
  if (!showDashboard) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="gr-eyebrow" style={{ color: 'var(--text-muted)' }}>Access required</div>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: '4px 0 0' }}>Admin access.</h1>
        </div>
      </div>
    );
  }

  return (
    <div data-tour-id="admin-dashboard-page">
      <OverviewDashboard data={data} nav={nav} loading={loading} storeLabel={siteName} />
    </div>
  );
}
