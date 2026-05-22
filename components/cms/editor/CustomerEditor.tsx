/**
 * CustomerEditor — Atlas A2
 *
 * Customer dossier: 5-up KPI bricks, 14-month cadence chart, order history
 * table, notes/activity timeline, lifecycle stepper, contact/segments/marketing.
 *
 * Port of atlas-editors-customer.jsx.
 * Uses only Phase-0 atlas.css + local editor.css classes and --wl-* tokens.
 */

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import './editor.css';
import {
  Crumbs,
  EditorTabs,
  Sec,
  SaveBar,
  FieldRow,
  StatBrick,
  Pill,
  Avatar,
  TimelineItem,
} from './EditorPrimitives';

// ── Types ────────────────────────────────────────────────────────────────────

export type LifecycleStage = 'lead' | 'first' | 'repeat' | 'loyal' | 'vip';

export interface CustomerOrderRow {
  readonly id: string;
  readonly orderNumber: string;
  readonly when: string;
  readonly itemCount: number;
  readonly total: string;
  readonly status: string;
  readonly statusVariant: 'solid-ink' | 'solid-accent' | 'solid-gold' | 'solid-moss' | 'out' | 'soft';
  readonly isCurrent?: boolean;
}

export interface CustomerAddress {
  readonly id: string;
  readonly lines: readonly string[];
  readonly isDefault: boolean;
  readonly label?: string;
  readonly usedOnCount?: number;
}

export interface CustomerSegment {
  readonly id: string;
  readonly label: string;
  readonly variant: 'solid-moss' | 'out' | 'out-accent';
}

export interface ActivityEntry {
  readonly id: string;
  readonly when: string;
  readonly isCurrent?: boolean;
  readonly body: React.ReactNode;
}

export interface CustomerData {
  readonly id: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email: string;
  readonly phone?: string;
  readonly birthday?: string;
  readonly pronouns?: string;
  readonly initials: string;
  readonly avatarBg?: string;

  // KPI bricks
  readonly lifetimeValue: string;
  readonly orderCount: number;
  readonly orderFrequency: string;
  readonly avgBasket: string;
  readonly avgBasketDelta?: string;
  readonly retentionMonths: number;
  readonly retentionLabel?: string;
  readonly churnRisk: 'low' | 'medium' | 'high';
  readonly churnLabel?: string;

  // Cadence chart: 14 bars of spend values (0 = no order that month)
  readonly cadenceBars: readonly number[];

  readonly lifecycle: LifecycleStage;
  readonly lifecycleThreshold?: string;

  readonly orders: readonly CustomerOrderRow[];
  readonly activity: readonly ActivityEntry[];
  readonly addresses: readonly CustomerAddress[];
  readonly segments: readonly CustomerSegment[];

  // Marketing
  readonly newsletterStatus?: string;
  readonly smsStatus?: string;
  readonly consentDate?: string;
  readonly lastEmailSent?: string;
  readonly openRate?: string;

  readonly since?: string;
}

export interface CustomerEditorProps {
  readonly customer: CustomerData;
  readonly subdomain: string;
  readonly onUpdate: (updated: Partial<CustomerData>) => Promise<void>;
  readonly onMessage?: () => void;
  readonly onTag?: () => void;
}

// ── Cadence chart (SVG sparkline) ─────────────────────────────────────────────

interface CadenceChartProps {
  readonly bars: readonly number[];
}

function CadenceChart({ bars }: CadenceChartProps): React.ReactElement {
  const maxVal = Math.max(...bars, 1);
  const barWidth = 28;
  const barGap = 20; // total slot = 48
  const totalW = bars.length * 48;
  const chartH = 70;
  const baseline = 60;

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH}`} className="spark" style={{ marginTop: 6 }}>
      <line x1="0" x2={totalW} y1={baseline} y2={baseline} stroke="var(--rule)" />
      {bars.map((v, i) => {
        const barH = (v / maxVal) * baseline * 0.9;
        const isLast = i === bars.length - 1;
        return (
          <rect
            key={i}
            x={i * 48 + 4}
            y={baseline - barH}
            width={barWidth}
            height={barH}
            fill={isLast ? 'var(--accent)' : 'var(--ink)'}
          />
        );
      })}
      <text
        x={totalW - 2}
        y={baseline - 2}
        fontFamily="var(--font-geist-mono), Geist Mono, monospace"
        fontSize="9"
        fill="var(--ink-soft)"
        textAnchor="end"
      >
        now
      </text>
    </svg>
  );
}

// ── Lifecycle stepper ─────────────────────────────────────────────────────────

interface LifecycleStepperProps {
  readonly current: LifecycleStage;
  readonly threshold?: string;
}

const LIFECYCLE_STAGES: readonly LifecycleStage[] = ['lead', 'first', 'repeat', 'loyal', 'vip'];

function LifecycleStepper({ current, threshold }: LifecycleStepperProps): React.ReactElement {
  const currentIdx = LIFECYCLE_STAGES.indexOf(current);

  return (
    <>
      <div className="lifecycle">
        {LIFECYCLE_STAGES.map((stage, i) => {
          const isCurrent = i === currentIdx;
          const isPast = i < currentIdx;
          return (
            <div key={stage} className="lifecycle-step">
              <div
                className="lifecycle-dot"
                style={{
                  background: isCurrent ? 'var(--accent)' : isPast ? 'var(--ink)' : 'var(--paper)',
                  borderColor: 'var(--ink)',
                }}
              />
              <div
                className="lifecycle-label"
                style={{
                  color: isCurrent ? 'var(--accent)' : isPast ? 'var(--ink)' : 'var(--ink-faint)',
                }}
              >
                {stage}
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div
                  className="lifecycle-connector"
                  style={{ background: isPast || isCurrent ? 'var(--ink)' : 'var(--rule)' }}
                />
              )}
            </div>
          );
        })}
      </div>
      {threshold && (
        <div className="fig" style={{ fontSize: 12, marginTop: 6 }}>{threshold}</div>
      )}
    </>
  );
}

// ── Order history table ───────────────────────────────────────────────────────

interface OrderHistoryProps {
  readonly orders: readonly CustomerOrderRow[];
  readonly customerId: string;
}

function OrderHistoryTable({ orders, customerId }: OrderHistoryProps): React.ReactElement {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: 70 }}>Order</th>
          <th style={{ width: 130 }}>Placed</th>
          <th className="num" style={{ width: 50 }}>Items</th>
          <th className="num" style={{ width: 80 }}>Total</th>
          <th style={{ width: 100 }}>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className={o.isCurrent ? 'sel' : ''}>
            <td><span className="mono accent">{o.orderNumber}</span></td>
            <td><span className="meta">{o.when}</span></td>
            <td className="num">{o.itemCount}</td>
            <td className="num">{o.total}</td>
            <td>
              <Pill variant={o.statusVariant} style={{ fontSize: 9 }}>
                {o.status}
              </Pill>
            </td>
            <td>
              <Link
                href={`/admin/orders/${o.id}`}
                className="fig"
                style={{ fontSize: 11, color: 'var(--accent)' }}
              >
                → open
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CustomerEditor({
  customer,
  subdomain,
  onUpdate,
  onMessage,
  onTag,
}: CustomerEditorProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);
  const [isPending, startTransition] = useTransition();

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email;

  const churnColor =
    customer.churnRisk === 'low'
      ? 'var(--moss)'
      : customer.churnRisk === 'high'
      ? 'var(--accent)'
      : 'var(--gold)';

  const tabs = [
    { label: 'Overview', active: true },
    { label: 'Orders', count: customer.orderCount },
    { label: 'Notes', count: customer.activity.filter((a) => a.isCurrent === false).length || undefined },
    { label: 'Activity' },
    { label: 'Comms', count: undefined },
    { label: 'Segments', count: customer.segments.length },
  ];

  const currentOrderId = customer.orders.find((o) => o.isCurrent)?.id;

  return (
    <div
      className="atlas"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '0 32px 18px',
      }}
    >
      <Crumbs
        items={[
          { label: 'CMS' },
          { label: 'Customers', href: '/admin/customers' },
          { label: customer.lifecycle === 'loyal' || customer.lifecycle === 'vip' ? customer.lifecycle.charAt(0).toUpperCase() + customer.lifecycle.slice(1) : 'All', href: '/admin/customers' },
          { label: customerName },
        ]}
      />

      {/* Editor masthead */}
      <div className="editor-head">
        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <Avatar
            initials={customer.initials}
            size={60}
            bg={customer.avatarBg ?? '#c8443a'}
            fontSize={22}
            style={{ flexShrink: 0, marginTop: 6 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">
              Customer · {customer.lifecycle} · since {customer.since ?? 'unknown'}
            </div>
            <h1>
              {customer.firstName ?? ''}{' '}
              <span className="display-i">{customer.lastName ?? customer.email}</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {customer.email}
              </span>
              <Pill variant="solid-moss">
                {customer.lifecycle.toUpperCase()} · {customer.orderCount} orders
              </Pill>
              <span className="fig" style={{ fontSize: 13 }}>
                {customer.orders[0]?.isCurrent && (
                  <>last seen <span style={{ color: 'var(--accent)' }}>recently · placed {customer.orders[0].orderNumber}</span></>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={onMessage}>
            <span className="kbd">M</span>Message
          </button>
          <button className="btn" onClick={onTag}>
            <span className="kbd">T</span>Tag
          </button>
          {currentOrderId && (
            <Link href={`/admin/orders/${currentOrderId}`} className="btn btn-solid">
              <span className="kbd">↵</span>Open {customer.orders[0]?.orderNumber ?? 'last order'}
            </Link>
          )}
        </div>
      </div>

      <EditorTabs
        items={tabs}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
        right={<span>customer id · {customer.id.slice(0, 10)}</span>}
      />

      {/* Two-column body */}
      <div className="editor-body" style={{ flex: 1, overflow: 'hidden' }}>
        {/* LEFT — KPIs, cadence, orders, activity */}
        <div className="editor-col" style={{ overflow: 'auto', paddingRight: 4 }}>
          {/* At a glance */}
          <div>
            <Sec n="§1" h="At a glance" meta="lifetime" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              <StatBrick
                label="lifetime value"
                value={customer.lifetimeValue}
                delta="top 14% of roster"
                valueStyle={{ fontSize: 26, color: 'var(--accent)' }}
              />
              <StatBrick
                label="orders"
                value={customer.orderCount}
                delta={customer.orderFrequency}
              />
              <StatBrick
                label="avg basket"
                value={customer.avgBasket}
                delta={customer.avgBasketDelta}
              />
              <StatBrick
                label="retention"
                value={`${customer.retentionMonths} mo`}
                delta={customer.retentionLabel ?? 'no gaps'}
              />
              <StatBrick
                label="churn risk"
                value={<span style={{ color: churnColor }}>{customer.churnRisk}</span>}
                delta={customer.churnLabel ?? 'healthy cadence'}
              />
            </div>

            {/* Cadence sparkline */}
            <div style={{ marginTop: 14, borderTop: '1px solid var(--rule)', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="eyebrow-ink">Order cadence — {customer.cadenceBars.length} months</span>
                <span className="fig" style={{ fontSize: 12 }}>each bar = one month · height = spend</span>
              </div>
              <CadenceChart bars={customer.cadenceBars} />
            </div>
          </div>

          {/* Orders */}
          <div>
            <Sec
              n="§2"
              h="Orders"
              meta={`${customer.orderCount} lifetime · showing ${Math.min(customer.orders.length, 7)}`}
              right={<Link href={`/admin/customers/${customer.id}`} style={{ color: 'var(--accent)' }}>see all →</Link>}
            />
            <OrderHistoryTable orders={customer.orders.slice(0, 7)} customerId={customer.id} />
          </div>

          {/* Notes & activity */}
          <div>
            <Sec n="§3" h="Notes &amp; activity" meta="internal" right="+ note" />
            <div className="tl">
              {customer.activity.map((entry) => (
                <TimelineItem key={entry.id} when={entry.when} current={entry.isCurrent}>
                  {entry.body}
                </TimelineItem>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — contact, addresses, segments, marketing, lifecycle */}
        <div className="editor-col" style={{ overflow: 'auto' }}>
          {/* Contact */}
          <div>
            <Sec h="Contact" />
            <FieldRow label="email">
              <span className="mono">{customer.email}</span>
            </FieldRow>
            {customer.phone && (
              <FieldRow label="phone">
                <span className="mono">{customer.phone}</span>
              </FieldRow>
            )}
            <FieldRow label="birthday">
              <span>{customer.birthday ?? '— not given —'}</span>
            </FieldRow>
            <FieldRow label="pronouns">
              <span>{customer.pronouns ?? '— not given —'}</span>
            </FieldRow>
          </div>

          {/* Addresses */}
          {customer.addresses.length > 0 && (
            <div>
              <Sec h="Addresses" meta={`${customer.addresses.length} saved`} right="+ add" />
              {customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--rule-soft)',
                  }}
                >
                  {addr.isDefault && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                      DEFAULT · {addr.label ?? 'SHIPPING + BILLING'}
                    </div>
                  )}
                  {addr.lines.map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))}
                  {addr.usedOnCount != null && (
                    <span className="fig" style={{ fontSize: 11 }}>
                      used on {addr.usedOnCount} order{addr.usedOnCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Segments */}
          {customer.segments.length > 0 && (
            <div>
              <Sec h="Segments" meta={`${customer.segments.length} of 12`} right="manage" />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {customer.segments.map((seg) => (
                  <Pill key={seg.id} variant={seg.variant}>{seg.label}</Pill>
                ))}
              </div>
            </div>
          )}

          {/* Marketing */}
          <div>
            <Sec h="Marketing" />
            <FieldRow label="newsletter">
              <span>{customer.newsletterStatus ?? '— not subscribed —'}</span>
            </FieldRow>
            <FieldRow label="sms">
              <span className="fig">{customer.smsStatus ?? '— unknown —'}</span>
            </FieldRow>
            {customer.consentDate && (
              <FieldRow label="consent">
                <span>explicit · {customer.consentDate}</span>
              </FieldRow>
            )}
            {customer.lastEmailSent && (
              <FieldRow label="last sent">
                <span>{customer.lastEmailSent}</span>
              </FieldRow>
            )}
            {customer.openRate && (
              <FieldRow label="open rate">
                <span className="accent" style={{ fontWeight: 500 }}>{customer.openRate}</span>
              </FieldRow>
            )}
          </div>

          {/* Lifecycle */}
          <div>
            <Sec h="Lifecycle" />
            <LifecycleStepper
              current={customer.lifecycle}
              threshold={customer.lifecycleThreshold}
            />
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="profile up to date"
        hints={[
          { key: 'M', label: 'message' },
          { key: 'T', label: 'tag' },
          { key: 'E', label: 'export' },
          { key: 'B', label: 'block' },
          { key: '↵', label: 'open last order' },
        ]}
      />
    </div>
  );
}
