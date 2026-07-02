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
  OverviewData, OverviewStats, OverviewAnalytics, OverviewOrder, OverviewProduct, NavHandlers,
} from '@/components/cms/admin/overview/overview-types';

// ─────────────────────────────────────────────
// Raw API response shapes (only the fields we read)
// ─────────────────────────────────────────────

interface RawOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly email: string | null;
  readonly total: number;
  readonly status: string;
  readonly createdAt: string;
  readonly customer: { readonly firstName: string | null; readonly lastName: string | null; readonly email: string | null } | null;
  readonly currentStage: { readonly displayName: string | null; readonly color: string | null } | null;
}

interface RawProduct {
  readonly id: string;
  readonly title: string;
  readonly stock: number;
  readonly lowStockThreshold: number;
  readonly trackInventory: boolean;
  readonly status: string;
}

const OPEN_STATUSES = new Set(['PENDING', 'PROCESSING']);

function orderName(o: RawOrder): string {
  const full = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ').trim();
  return full || o.customer?.email || o.email || 'Guest';
}

function toOverviewOrder(o: RawOrder): OverviewOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    total: o.total ?? 0,
    createdAt: o.createdAt,
    status: (o.status ?? '').toUpperCase(),
    customerName: orderName(o),
    stageLabel: o.currentStage?.displayName ?? null,
    stageColor: o.currentStage?.color ?? null,
  };
}

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
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [orders, setOrders] = useState<readonly OverviewOrder[]>([]);
  const [lowStock, setLowStock] = useState<readonly OverviewProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoading = isDemo ? accessLoading : authLoading || accessLoading;

  const fetchDashboardData = useCallback(() => {
    setLoading(true);

    // Counts gate the first meaningful paint; the rest fill in progressively.
    fetch('/api/cms/admin/stats-simple')
      .then((res) => (res.ok ? (res.json() as Promise<{ stats: OverviewStats }>) : null))
      .then((d) => setStats(d?.stats ?? { totalUsers: 0, totalProducts: 0, totalOrders: 0, totalBlogPosts: 0 }))
      .catch(() => setStats({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalBlogPosts: 0 }))
      .finally(() => setLoading(false));

    fetch('/api/cms/analytics?range=30d')
      .then((res) => (res.ok ? (res.json() as Promise<Partial<OverviewAnalytics> & { error?: string }>) : null))
      .then((d) => {
        if (d && !d.error) {
          setAnalytics({
            revenue: d.revenue ?? 0,
            purchases: d.purchases ?? 0,
            uniqueVisitors: d.uniqueVisitors ?? 0,
            pageViews: d.pageViews ?? 0,
            timeSeries: d.timeSeries ?? [],
          });
        }
      })
      .catch(() => {});

    fetch('/api/cms/orders?limit=12')
      .then((res) => (res.ok ? (res.json() as Promise<{ orders?: readonly RawOrder[] }>) : null))
      .then((d) => setOrders((d?.orders ?? []).map(toOverviewOrder)))
      .catch(() => {});

    fetch('/api/cms/products?limit=50&sortBy=stock&sortOrder=asc')
      .then((res) => (res.ok ? (res.json() as Promise<{ products?: readonly RawProduct[] }>) : null))
      .then((d) => {
        const low = (d?.products ?? [])
          .filter((p) => p.trackInventory && p.stock <= p.lowStockThreshold)
          .map<OverviewProduct>((p) => ({
            id: p.id, title: p.title, stock: p.stock, lowStockThreshold: p.lowStockThreshold, status: p.status,
          }));
        setLowStock(low);
      })
      .catch(() => {});
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
    openOrders: orders.filter((o) => OPEN_STATUSES.has(o.status)),
    recentOrders: orders,
    lowStock,
  }), [stats, analytics, orders, lowStock]);

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
