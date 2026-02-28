'use client';

import { useEffect, useState, useCallback } from 'react';
import WidgetShell from '../WidgetShell';
import {
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  Package,
  ShoppingCart,
  Zap,
  UserCheck,
} from 'lucide-react';

interface Metrics {
  totalUsers: number;
  activeSubscriptions: number;
  trialsActive: number;
  totalCustomers: number;
  monthlyRevenue: number;
  totalProducts: number;
  totalOrders: number;
  apiCallsToday: number;
}

const ICONS = [Users, TrendingUp, Activity, UserCheck, DollarSign, Package, ShoppingCart, Zap];
const COLORS = [
  'text-blue-600',
  'text-green-600',
  'text-yellow-600',
  'text-purple-600',
  'text-green-600',
  'text-orange-600',
  'text-indigo-600',
  'text-pink-600',
];

export default function MetricsGridWidget({ editing }: { editing?: boolean }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard/metrics');
      if (!res.ok) throw new Error('Failed to fetch');
      setMetrics(await res.json());
    } catch {
      setError('Could not load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cards = metrics
    ? [
        { label: 'Total Users', value: metrics.totalUsers, helpKey: 'admin.dashboard.metric.users' },
        { label: 'Subscriptions', value: metrics.activeSubscriptions, helpKey: 'admin.dashboard.metric.subscriptions' },
        { label: 'Active Trials', value: metrics.trialsActive, helpKey: 'admin.dashboard.metric.trials' },
        { label: 'Customers', value: metrics.totalCustomers, helpKey: 'admin.dashboard.metric.customers' },
        { label: 'Monthly Revenue', value: `$${metrics.monthlyRevenue.toLocaleString()}`, helpKey: 'admin.dashboard.metric.revenue' },
        { label: 'Products', value: metrics.totalProducts, helpKey: 'admin.dashboard.metric.products' },
        { label: 'Orders (Month)', value: metrics.totalOrders, helpKey: 'admin.dashboard.metric.orders' },
        { label: 'API Calls Today', value: metrics.apiCallsToday.toLocaleString(), helpKey: 'admin.dashboard.metric.api-calls' },
      ]
    : [];

  return (
    <WidgetShell
      title="Metrics Overview"
      editing={editing}
      loading={loading}
      error={error}
      onRefresh={fetchData}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const Icon = ICONS[i];
          return (
            <div key={i} className="flex flex-col gap-1" data-help-key={c.helpKey}>
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${COLORS[i]}`} />
                <span className="text-xs text-muted-foreground truncate">
                  {c.label}
                </span>
              </div>
              <span className="text-lg font-bold">{c.value}</span>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}
