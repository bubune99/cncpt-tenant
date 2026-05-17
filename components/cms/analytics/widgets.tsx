'use client';

/**
 * Atlas Analytics — Widget tile components
 * Ported from atlas-analytics-dashboard.jsx widget functions.
 * Each widget renders itself into whatever height/width its parent provides.
 */

import React from 'react';
import { Sparkline, LineChart, BarChart, Donut } from './charts';
import { DEMO_DATA } from '@/lib/cms/analytics/demo-data';

// ─── Shared sub-components ────────────────────────────────────────────────────

interface WidgetHeadProps {
  title: string;
  sub?: string;
  badge?: string;
  delta?: React.ReactNode;
}

export function WidgetHead({ title, sub, badge, delta }: WidgetHeadProps) {
  return (
    <div className="at-w-head">
      <span className="at-w-title">{title}</span>
      {sub && <span className="at-w-sub">{sub}</span>}
      {(badge ?? delta) && (
        <span className="at-w-right">
          {badge && <span className="at-badge">{badge}</span>}
          {delta}
          <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer', fontSize: 11 }}>⋯</span>
        </span>
      )}
    </div>
  );
}

// ─── KPI widget ───────────────────────────────────────────────────────────────

export interface KpiWidgetProps {
  title: string;
  value: string;
  delta: string;
  deltaDir?: 'up' | 'down';
  sparkData: readonly number[];
  sparkColor?: string;
  ctx?: string;
}

export function KpiWidget({ title, value, delta, deltaDir = 'up', sparkData, sparkColor, ctx }: KpiWidgetProps) {
  return (
    <>
      <WidgetHead title={title} badge="30d" />
      <div className="at-kpi-big">{value}</div>
      <div className="at-kpi-delta">
        <span className={`at-v${deltaDir === 'down' ? ' down' : ''}`}>
          {deltaDir === 'down' ? '↓' : '↑'} {delta}
        </span>
        <span>vs prev 30d</span>
        {ctx && (
          <span style={{ marginLeft: 'auto', color: 'var(--at-ink-faint)' }}>{ctx}</span>
        )}
      </div>
      <div className="at-kpi-spark">
        <Sparkline data={[...sparkData]} color={sparkColor ?? 'var(--at-accent)'} />
      </div>
    </>
  );
}

// ─── Revenue line chart widget ────────────────────────────────────────────────

export interface RevenueWidgetProps {
  chartHeight?: number;
}

export function RevenueWidget({ chartHeight = 170 }: RevenueWidgetProps) {
  return (
    <>
      <div className="at-w-head">
        <span className="at-w-title">Revenue</span>
        <span className="at-w-sub">last 30 days · daily</span>
        <span className="at-w-right">
          <span className="at-badge">$28,940</span>
          <span style={{ color: 'var(--at-moss)' }}>+24%</span>
          <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer', fontSize: 11 }}>⋯</span>
        </span>
      </div>
      <div className="at-chart-canvas">
        <LineChart
          series={[
            { name: 'this period', color: 'var(--at-accent)', data: [...DEMO_DATA.revenue30] },
            { name: 'prev period', color: 'var(--at-ink-faint)', data: [...DEMO_DATA.prevRevenue30] },
          ]}
          xLabels={[...DEMO_DATA.days]}
          dotted
          height={chartHeight}
        />
      </div>
      <div className="at-legend">
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span className="at-sw" style={{ background: 'var(--at-accent)' }}></span>
          this period · $28,940
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span className="at-sw" style={{ background: 'var(--at-ink-faint)' }}></span>
          prev 30d · $23,380
        </span>
      </div>
    </>
  );
}

// ─── Orders bar chart widget ──────────────────────────────────────────────────

export function OrdersBarWidget() {
  return (
    <>
      <div className="at-w-head">
        <span className="at-w-title">Orders / day</span>
        <span className="at-w-right">
          <span className="at-badge">1,124</span>
          <span style={{ color: 'var(--at-moss)' }}>+18%</span>
          <span style={{ color: 'var(--at-ink-faint)', cursor: 'pointer', fontSize: 11 }}>⋯</span>
        </span>
      </div>
      <div className="at-chart-canvas">
        <BarChart data={[...DEMO_DATA.ordersDays]} xLabels={[...DEMO_DATA.days]} height={170} color="var(--at-accent)" />
      </div>
    </>
  );
}

// ─── Channels donut widget ────────────────────────────────────────────────────

export function ChannelsWidget() {
  return (
    <>
      <WidgetHead title="By channel" badge="5 sources" />
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ width: 130, position: 'relative', flexShrink: 0 }}>
          <Donut segments={DEMO_DATA.channels.map(c => ({ name: c.name, value: c.value, color: c.color }))} size={130} stroke={20} />
          <div className="at-donut-center">
            <div className="at-donut-v">12.8k</div>
            <div className="at-donut-l">visits</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          {DEMO_DATA.channels.map((c) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11.5 }}>
              <span style={{ width: 10, height: 10, background: c.color, borderRadius: 2, flexShrink: 0 }}></span>
              <span style={{ fontFamily: 'var(--font-display, Spectral, serif)' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10.5, color: 'var(--at-ink-soft)' }}>
                {c.value}
              </span>
              <span style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, color: 'var(--at-ink-faint)', minWidth: 24, textAlign: 'right' }}>
                {c.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Top products table widget ────────────────────────────────────────────────

export function TopProductsWidget() {
  return (
    <>
      <WidgetHead title="Top products" sub="by revenue" badge="6 of 142" />
      <div className="at-w-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Units</th>
              <th className="num">Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DEMO_DATA.topProducts.map((p) => (
              <tr key={p.sku}>
                <td>
                  <div style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontSize: 13, lineHeight: 1.1 }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 9.5, color: 'var(--at-ink-soft)', letterSpacing: '.02em', marginTop: 1 }}>{p.sku}</div>
                </td>
                <td className="num">{p.units}</td>
                <td className="num">${p.rev.toLocaleString()}</td>
                <td style={{ width: 80, paddingLeft: 8 }}>
                  <span className="at-mini-bar" style={{ width: `${p.pct}%` }}></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Conversion funnel widget ─────────────────────────────────────────────────

export function FunnelWidget() {
  return (
    <>
      <div className="at-w-head">
        <span className="at-w-title">Conversion funnel</span>
        <span className="at-w-sub">visits → purchase · 30d</span>
        <span className="at-w-right">
          <span className="at-badge">1.84%</span>
          <span style={{ color: 'var(--at-moss)' }}>+0.3pp</span>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {DEMO_DATA.funnel.map((f) => (
          <div key={f.label} className="at-funnel-row">
            <span className="at-funnel-label">{f.label}</span>
            <div className="at-bar-track">
              <div className={`at-bar-fill ${f.colorCls}`} style={{ width: `${f.pct}%` }}></div>
            </div>
            <span className="at-funnel-v">{f.v.toLocaleString()}</span>
            <span className="at-funnel-pct">{f.pct}%</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Live activity feed widget ────────────────────────────────────────────────

export function ActivityWidget() {
  return (
    <>
      <div className="at-w-head">
        <span className="at-w-title">Live activity</span>
        <span className="at-w-sub">last hour</span>
        <span className="at-w-right">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--at-moss)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--at-moss)', display: 'inline-block' }}></span>
            live
          </span>
        </span>
      </div>
      <div className="at-w-feed">
        {DEMO_DATA.activity.map((a, i) => (
          <div key={i} className="at-feed-item">
            <span className={`at-dot ${a.cls}`}></span>
            <span style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontSize: 12.5 }}>{a.text}</span>
            <span className="at-when">{a.when}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Alerts widget ────────────────────────────────────────────────────────────

export function AlertsWidget() {
  return (
    <>
      <WidgetHead title="Needs attention" badge="4" />
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', marginTop: 2 }}>
        {DEMO_DATA.alerts.map((a, i) => (
          <div key={i} className="at-alert-item">
            <span className={`at-alert-bar ${a.bar}`}></span>
            <div>
              <div className="at-alert-title">{a.title}</div>
              <div className="at-alert-sub">{a.sub}</div>
            </div>
            <span className="at-alert-cta">{a.cta} →</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Heatmap widget ───────────────────────────────────────────────────────────

export function HeatmapWidget() {
  const rows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getLevel = (r: number, c: number): number => {
    const eve = c >= 19 && c <= 22 ? 2 : 0;
    const mid = c >= 11 && c <= 14 ? 1 : 0;
    const day = r >= 2 && r <= 4 ? 1 : 0;
    const wknd = (r === 0 || r === 6) && c >= 10 && c <= 14 ? 2 : 0;
    const noise = (r * 7 + c * 3) % 5;
    return Math.min(5, Math.max(0, eve + mid + day + wknd + (noise > 3 ? 1 : 0)));
  };

  return (
    <>
      <div className="at-w-head">
        <span className="at-w-title">Visits · hour × day</span>
        <span className="at-w-sub">Eastern · last 30d</span>
        <span className="at-w-right"><span className="at-badge">peak Tue 20:00</span></span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px repeat(24, 1fr)',
        gridTemplateRows: 'auto repeat(7, 1fr)',
        gap: 1,
        fontFamily: 'var(--font-geist-mono, monospace)',
        flex: 1,
      }}>
        <span></span>
        {Array.from({ length: 24 }, (_, c) => (
          <span key={c} style={{ fontSize: 8.5, color: 'var(--at-ink-faint)', textAlign: 'center' }}>
            {c % 4 === 0 ? c : ''}
          </span>
        ))}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <span style={{ fontSize: 9, color: 'var(--at-ink-soft)', display: 'flex', alignItems: 'center' }}>{r}</span>
            {Array.from({ length: 24 }, (_, c) => {
              const v = getLevel(ri, c);
              const opacity = v === 0 ? undefined : [0.14, 0.28, 0.52, 0.78, 1][v - 1];
              return (
                <span
                  key={c}
                  style={{
                    height: 14,
                    background: v > 0 ? `rgba(139, 44, 31, ${opacity})` : 'var(--at-paper-3)',
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
