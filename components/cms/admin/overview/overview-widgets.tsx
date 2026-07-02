'use client';

/**
 * Grainy Overview — widget registry + chart/row primitives.
 *
 * Each widget renders exclusively from the real OverviewData the admin page
 * fetches. Widgets degrade to a quiet empty state when their data is absent,
 * never to a fake number.
 */

import { type ReactNode } from 'react';
import {
  DollarSign, Activity, TrendingUp, LayoutGrid, ShoppingBag, AlertTriangle, Clock,
  ChevronRight, type LucideIcon,
} from 'lucide-react';
import {
  type OverviewData, type NavHandlers, type WidgetId, type WidgetSize,
  fmtUSD, fmtMoney, timeAgo, humanizeStatus,
} from './overview-types';

// ─────────────────────────────────────────────
// Definition shape
// ─────────────────────────────────────────────

export interface WidgetDef {
  readonly title: string;
  readonly icon: LucideIcon;
  readonly blurb: string;
  readonly defSize: WidgetSize;
  /** Optional header meta text (right-aligned) — hidden in customize mode. */
  readonly meta?: (data: OverviewData) => string | null;
  readonly render: (data: OverviewData, nav: NavHandlers) => ReactNode;
}

// ─────────────────────────────────────────────
// Chart + row primitives (token-colored, no chart lib)
// ─────────────────────────────────────────────

/**
 * Tiny responsive bar chart; the last bar is emphasised. `label` formats each
 * bar's tooltip (money for revenue, plain counts for orders); `hue` picks the
 * token color family so different series read distinctly.
 */
function BarChart({
  data,
  height = 118,
  label = fmtUSD,
  hue = 'clay',
}: {
  data: readonly number[];
  height?: number;
  label?: (v: number) => string;
  hue?: 'clay' | 'blue';
}) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <div
            key={i}
            title={label(v)}
            style={{
              flex: 1,
              height: (v / max) * 100 + '%',
              minHeight: 2,
              borderRadius: 3,
              background: last ? `var(--${hue}-600, var(--${hue}-700))` : `var(--${hue}-500)`,
              opacity: last ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

/** A clickable (or static) list row with the design's spacing/rule. */
function WRow({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
        borderBottom: '1px solid var(--line-faint)',
        cursor: onClick ? 'pointer' : 'default', fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function FootLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <span className="gr-link" style={{ fontSize: 12 }} onClick={onClick}>{label}</span>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <div style={{ color: 'var(--text-muted)', fontSize: 12.5, padding: '6px 0' }}>{children}</div>;
}

const stageTone: Readonly<Record<string, string>> = {
  PENDING: 'blue', PROCESSING: 'ochre', SHIPPED: 'sage', DELIVERED: 'sage',
  CANCELLED: 'rust', REFUNDED: 'neutral',
};

// ─────────────────────────────────────────────
// The registry
// ─────────────────────────────────────────────

export const WIDGETS: Readonly<Record<WidgetId, WidgetDef>> = {
  sales: {
    title: 'Sales summary', icon: DollarSign, defSize: 6,
    blurb: 'Revenue, orders, and customers for the last 30 days.',
    render: (data) => {
      const a = data.analytics;
      const revenue = a?.revenue ?? 0;
      const orders = a?.purchases ?? 0;
      const avg = orders > 0 ? revenue / orders : 0;
      const customers = data.stats?.totalUsers ?? 0;
      const cells: ReadonlyArray<readonly [string, string]> = [
        ['Revenue · 30d', revenue > 0 ? fmtUSD(revenue) : '—'],
        ['Orders · 30d', orders > 0 ? orders.toLocaleString('en-US') : '—'],
        ['Avg order', avg > 0 ? fmtMoney(avg) : '—'],
        ['Customers', customers.toLocaleString('en-US')],
      ];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14 }}>
          {cells.map(([label, value]) => (
            <div key={label}>
              <div className="gr-eyebrow" style={{ fontSize: 9 }}>{label}</div>
              <div className="gr-num" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
      );
    },
  },

  revenue: {
    title: 'Revenue · 30 days', icon: Activity, defSize: 4,
    blurb: 'Daily revenue bars for the last month.',
    meta: (data) => (data.analytics && data.analytics.revenue > 0 ? fmtUSD(data.analytics.revenue) + ' total' : null),
    render: (data) => {
      const series = data.analytics?.timeSeries ?? [];
      if (series.length === 0) return <EmptyNote>No revenue recorded in the last 30 days yet.</EmptyNote>;
      const values = series.map((p) => p.revenue);
      const lastVal = values[values.length - 1] ?? 0;
      return (
        <div>
          <BarChart data={values} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span className="gr-num" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{series.length} days ago</span>
            <span className="gr-num" style={{ fontSize: 10, color: 'var(--text-muted)' }}>today · {fmtUSD(lastVal)}</span>
          </div>
        </div>
      );
    },
  },

  orderstrend: {
    title: 'Orders · 30 days', icon: TrendingUp, defSize: 4,
    blurb: 'Daily order counts for the last month.',
    meta: (data) => {
      const total = (data.analytics?.timeSeries ?? []).reduce((sum, p) => sum + p.orders, 0);
      return total > 0 ? `${total.toLocaleString('en-US')} orders` : null;
    },
    render: (data) => {
      const series = data.analytics?.timeSeries ?? [];
      if (series.length === 0) return <EmptyNote>No orders in the last 30 days yet.</EmptyNote>;
      const values = series.map((p) => p.orders);
      const lastVal = values[values.length - 1] ?? 0;
      return (
        <div>
          <BarChart data={values} label={(v) => `${v} order${v === 1 ? '' : 's'}`} hue="blue" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span className="gr-num" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{series.length} days ago</span>
            <span className="gr-num" style={{ fontSize: 10, color: 'var(--text-muted)' }}>today · {lastVal}</span>
          </div>
        </div>
      );
    },
  },

  snapshot: {
    title: 'Store snapshot', icon: LayoutGrid, defSize: 2,
    blurb: 'Live totals across your catalog, customers, and content.',
    render: (data, nav) => {
      const s = data.stats;
      const rows: ReadonlyArray<readonly [string, number, () => void]> = [
        ['Products', s?.totalProducts ?? 0, () => nav.onNav('products')],
        ['Customers', s?.totalUsers ?? 0, () => nav.onNav('customers')],
        ['Orders', s?.totalOrders ?? 0, () => nav.onNav('orders')],
        ['Journal posts', s?.totalBlogPosts ?? 0, () => nav.onNav('blog')],
      ];
      return (
        <div>
          {rows.map(([label, value, go]) => (
            <WRow key={label} onClick={go}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
              <span className="gr-num" style={{ fontSize: 15, fontWeight: 700 }}>{value.toLocaleString('en-US')}</span>
            </WRow>
          ))}
        </div>
      );
    },
  },

  queue: {
    title: 'Open orders', icon: ShoppingBag, defSize: 3,
    blurb: 'Orders that are pending or in progress and need fulfillment.',
    meta: (data) => (data.openOrders.length > 0 ? data.openOrders.length + ' open' : null),
    render: (data, nav) => {
      if (data.openOrders.length === 0) return <EmptyNote>No orders waiting on fulfillment. Nice.</EmptyNote>;
      return (
        <div>
          {data.openOrders.slice(0, 6).map((o) => {
            const tone = stageTone[o.status] ?? 'neutral';
            const label = o.stageLabel ?? humanizeStatus(o.status);
            return (
              <WRow key={o.id} onClick={() => nav.onOpenOrder(o.id)}>
                <span className="gr-num" style={{ color: 'var(--clay-700)', fontWeight: 600, fontSize: 12 }}>#{o.orderNumber}</span>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{o.customerName}</span>
                <span className="gr-num" style={{ fontSize: 12 }}>{fmtMoney(o.total)}</span>
                <span className={`badge badge-${tone}`} style={{ fontSize: 9 }}>{label}</span>
              </WRow>
            );
          })}
          <FootLink label="All orders →" onClick={() => nav.onNav('orders')} />
        </div>
      );
    },
  },

  lowstock: {
    title: 'Low stock', icon: AlertTriangle, defSize: 3,
    blurb: 'Tracked products at or below their reorder point.',
    meta: (data) => (data.lowStock.length > 0 ? data.lowStock.length + ' items' : null),
    render: (data, nav) => {
      if (data.lowStock.length === 0) return <EmptyNote>Every tracked product is above its reorder point.</EmptyNote>;
      return (
        <div>
          {data.lowStock.slice(0, 6).map((p) => {
            const out = p.stock <= 0;
            return (
              <WRow key={p.id} onClick={() => nav.onOpenProduct(p.id)}>
                <span style={{ width: 8, height: 8, borderRadius: 999, flex: 'none', background: out ? 'var(--rust-500)' : 'var(--ochre-500)' }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {out ? 'Out of stock' : `${p.stock} left`} · reorder at {p.lowStockThreshold}
                  </span>
                </span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flex: 'none' }} aria-hidden="true" />
              </WRow>
            );
          })}
          <FootLink label="Open products →" onClick={() => nav.onNav('products')} />
        </div>
      );
    },
  },

  activity: {
    title: 'Recent activity', icon: Clock, defSize: 6,
    blurb: 'The latest orders as they come in.',
    render: (data, nav) => {
      if (data.recentOrders.length === 0) return <EmptyNote>No orders yet — activity will appear here.</EmptyNote>;
      return (
        <div>
          {data.recentOrders.slice(0, 6).map((o) => (
            <WRow key={o.id} onClick={() => nav.onOpenOrder(o.id)}>
              <span style={{ width: 26, height: 26, borderRadius: 7, flex: 'none', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clay-600)' }}>
                <ShoppingBag size={13} aria-hidden="true" />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 500, display: 'block', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Order #{o.orderNumber} placed</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{o.customerName} · {fmtMoney(o.total)}</span>
              </span>
              <span className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)', flex: 'none' }}>{timeAgo(o.createdAt)}</span>
            </WRow>
          ))}
        </div>
      );
    },
  },
};

export const WIDGET_IDS: readonly WidgetId[] = Object.keys(WIDGETS) as WidgetId[];
