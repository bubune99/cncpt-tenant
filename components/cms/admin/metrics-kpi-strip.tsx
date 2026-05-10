'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Repeat,
  Package,
  Receipt,
} from 'lucide-react';
import { KpiCard, type KpiDelta } from './kpi-card';
import { Card, CardContent, CardHeader } from '../ui/card';
import { cn } from '@/lib/cms/utils';

interface KpiPoint {
  value: number
  delta: KpiDelta
  newThisPeriod?: number
  lowStockCount?: number
}

interface KpisResponse {
  timeframe: string
  contextLabel: string
  generatedAt: string
  kpis: {
    monthlyRevenue: KpiPoint
    orders: KpiPoint
    customers: KpiPoint
    activeSubscriptions: KpiPoint
    products: KpiPoint
    avgOrderValue: KpiPoint
  }
}

export interface MetricsKpiStripProps {
  /** Timeframe value matching the API contract (today|7d|month|90d|year) */
  timeframe: string
  className?: string
}

/** Pure: format dollars with thousands separators. */
function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value)
}

/** Pure: format integer with thousands separators. */
function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 sm:pb-2">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="h-7 w-24 bg-muted rounded animate-pulse mb-2" />
        <div className="h-3 w-28 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

/**
 * 6-tile horizontal KPI strip. Replaces the legacy 8-tile MetricsGridWidget.
 *
 * Layout:
 *   - lg+: 6 across
 *   - md:  3 across
 *   - sm:  2 across
 *   - xs:  1 across (stacked)
 */
export function MetricsKpiStrip({ timeframe, className }: MetricsKpiStripProps) {
  const [data, setData] = useState<KpisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/cms/admin/dashboard/kpis?timeframe=${encodeURIComponent(timeframe)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: KpisResponse) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load KPIs:', err)
          setError('Could not load dashboard metrics')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [timeframe])

  const gridClass = cn(
    'grid gap-3 sm:gap-4',
    'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    className,
  )

  if (loading) {
    return (
      <div className={gridClass} data-tour-id="dashboard-kpi-strip">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={cn('rounded-lg border bg-card p-4 text-sm text-muted-foreground', className)}>
        {error || 'Unable to load metrics.'}
      </div>
    )
  }

  const { kpis, contextLabel } = data
  const withContext = (delta: KpiDelta): KpiDelta => ({ ...delta, context: contextLabel })

  return (
    <div className={gridClass} data-tour-id="dashboard-kpi-strip">
      <KpiCard
        label="Monthly Revenue"
        value={formatMoney(kpis.monthlyRevenue.value)}
        delta={withContext(kpis.monthlyRevenue.delta)}
        icon={DollarSign}
        tourId="kpi-revenue"
        helpKey="admin.dashboard.kpi.revenue"
      />
      <KpiCard
        label="Orders"
        value={formatCount(kpis.orders.value)}
        delta={withContext(kpis.orders.delta)}
        icon={ShoppingCart}
        tourId="kpi-orders"
        helpKey="admin.dashboard.kpi.orders"
      />
      <KpiCard
        label="Customers"
        value={formatCount(kpis.customers.value)}
        delta={withContext(kpis.customers.delta)}
        secondary={
          kpis.customers.newThisPeriod
            ? `${formatCount(kpis.customers.newThisPeriod)} new this period`
            : undefined
        }
        icon={Users}
        tourId="kpi-customers"
        helpKey="admin.dashboard.kpi.customers"
      />
      <KpiCard
        label="Active Subscriptions"
        value={formatCount(kpis.activeSubscriptions.value)}
        delta={withContext(kpis.activeSubscriptions.delta)}
        icon={Repeat}
        tourId="kpi-subscriptions"
        helpKey="admin.dashboard.kpi.subscriptions"
      />
      <KpiCard
        label="Products"
        value={formatCount(kpis.products.value)}
        delta={withContext(kpis.products.delta)}
        secondary={
          kpis.products.lowStockCount && kpis.products.lowStockCount > 0
            ? `${kpis.products.lowStockCount} need attention`
            : undefined
        }
        icon={Package}
        tourId="kpi-products"
        helpKey="admin.dashboard.kpi.products"
      />
      <KpiCard
        label="Avg Order Value"
        value={formatMoney(kpis.avgOrderValue.value)}
        delta={withContext(kpis.avgOrderValue.delta)}
        icon={Receipt}
        tourId="kpi-aov"
        helpKey="admin.dashboard.kpi.aov"
      />
    </div>
  )
}
