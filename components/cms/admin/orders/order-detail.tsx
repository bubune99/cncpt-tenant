'use client';

/**
 * OrderDetail — Grainy order detail layout.
 *
 * Header (back · #id · customer · status badges · actions), a tab row
 * (Order · Customer · Notes · Timeline), and a two-column Order body. Every
 * capability is backed by a real mutation supplied by the page controller:
 * sub-step toggles, ship, and add-note. The workflow stage stepper (existing
 * OrderProgress widget) is injected via `workflowSlot` so no stage functionality
 * is lost.
 */

import React, { useState } from 'react';
import { ChevronLeft, Printer, Scissors, Truck } from 'lucide-react';
import { Badge, Btn, Eyebrow } from './orders-ui';
import { OrderItemsPanel } from './order-detail-items';
import { OrderSidebar } from './order-detail-sidebar';
import { OrderTimeline } from './order-detail-timeline';
import {
  dateTime,
  paymentBadge,
  statusBadge,
  type OrderStatus,
  type PaymentStatus,
} from './orders-model';

// ── View model ───────────────────────────────────────────────────────────────

export interface DetailSubStep {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
  readonly hint?: string;
}
export interface DetailConfigOption {
  readonly key: string;
  readonly value: string;
}
export interface DetailAttachment {
  readonly id: string;
  readonly name: string;
  readonly size: string;
  readonly kind: string;
  readonly url?: string;
}
export interface DetailLineItem {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly qty: number;
  readonly lineTotalCents: number;
  readonly configOptions?: readonly DetailConfigOption[];
  readonly attachments?: readonly DetailAttachment[];
  readonly subSteps: readonly DetailSubStep[];
  readonly hasCustomWork: boolean;
}
export interface DetailShipment {
  readonly carrier?: string;
  readonly service?: string;
  readonly trackingNumber?: string;
  readonly trackingUrl?: string;
  readonly labelUrl?: string;
  readonly status: string;
}
export interface DetailTimelineEntry {
  readonly id: string;
  readonly at: string;
  readonly title: string;
  readonly meta?: string;
  readonly kind: 'placed' | 'stage' | 'ship' | 'note' | 'payment';
}
export interface OrderDetailModel {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId?: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly placedAt: string;
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly items: readonly DetailLineItem[];
  readonly totals: readonly { readonly label: string; readonly cents: number }[];
  readonly grandTotalCents: number;
  readonly hasCustomWork: boolean;
  readonly shipment?: DetailShipment;
  readonly timeline: readonly DetailTimelineEntry[];
  readonly internalNotes?: string;
  readonly customerNotes?: string;
}

type Tab = 'order' | 'customer' | 'notes' | 'timeline';

export function OrderDetail({
  order,
  buildPath,
  onBack,
  onToggleStep,
  onShip,
  onAddNote,
  workflowSlot,
}: {
  readonly order: OrderDetailModel;
  readonly buildPath: (p: string) => string;
  readonly onBack: () => void;
  readonly onToggleStep: (itemId: string, stepId: string) => Promise<void>;
  readonly onShip: () => Promise<void>;
  readonly onAddNote: (note: string) => Promise<void>;
  readonly workflowSlot?: React.ReactNode;
}): React.ReactElement {
  const [tab, setTab] = useState<Tab>('order');

  const allSteps = order.items.flatMap((it) => it.subSteps);
  const doneCount = allSteps.filter((s) => s.done).length;
  const totalSteps = allSteps.length;
  const hasSteps = totalSteps > 0;
  const readyToShip = !hasSteps || doneCount === totalSteps;

  const stage = statusBadge(order.status);
  const pay = paymentBadge(order.paymentStatus);
  const noteCount = (order.internalNotes ? 1 : 0) + (order.customerNotes ? 1 : 0);

  const tabs: readonly (readonly [Tab, string, number | undefined])[] = [
    ['order', 'Order', hasSteps ? doneCount : undefined],
    ['customer', 'Customer', undefined],
    ['notes', 'Notes', noteCount],
    ['timeline', 'Timeline', order.timeline.length],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '18px 26px 0', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <button
                type="button"
                onClick={onBack}
                className="gr-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={13} />Orders
              </button>
              <span className="gr-num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ placed {dateTime(order.placedAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="gr-num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--clay-700)' }}>#{order.orderNumber}</span>
              <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.02em' }}>{order.customerName}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
              <Badge tone={stage.tone}>{stage.label}</Badge>
              <Badge tone={pay.tone}>{pay.label}</Badge>
              {order.hasCustomWork && <Badge tone="clay">Has custom work</Badge>}
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {order.items.length} item{order.items.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7, flex: 'none', alignItems: 'center' }}>
            {hasSteps && !readyToShip && (
              <span className="gr-num" style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 3 }}>
                {totalSteps - doneCount} sub-tasks left
              </span>
            )}
            <Btn size="sm" icon={Printer} disabled title="Coming soon">Print slips</Btn>
            <Btn size="sm" icon={Scissors} disabled title="Coming soon">Split</Btn>
            <Btn
              size="sm"
              kind="primary"
              icon={Truck}
              disabled={!readyToShip || order.status === 'SHIPPED' || order.status === 'DELIVERED'}
              title={!readyToShip ? 'Complete all sub-tasks first' : undefined}
              onClick={() => void onShip()}
            >
              {order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'Shipped' : 'Ship'}
            </Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: '1px solid var(--line)' }}>
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '8px 12px',
                marginBottom: -1,
                fontSize: 13,
                fontWeight: 500,
                color: tab === key ? 'var(--text)' : 'var(--text-secondary)',
                borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              {label}
              {count != null && (
                <span className="gr-num" style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="gr-scroll" style={{ flex: 1, minHeight: 0, padding: '18px 26px 26px' }}>
        {tab === 'order' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <OrderItemsPanel
                items={order.items}
                totals={order.totals}
                grandTotalCents={order.grandTotalCents}
                doneCount={doneCount}
                totalSteps={totalSteps}
                hasSteps={hasSteps}
                onToggleStep={onToggleStep}
              />
              {workflowSlot}
            </div>
            <OrderSidebar order={order} buildPath={buildPath} onAddNote={onAddNote} compact />
          </div>
        )}
        {tab === 'customer' && (
          <div style={{ maxWidth: 520 }}>
            <OrderSidebar order={order} buildPath={buildPath} onAddNote={onAddNote} />
          </div>
        )}
        {tab === 'notes' && (
          <div style={{ maxWidth: 560 }}>
            <Eyebrow>Notes</Eyebrow>
            <div style={{ marginTop: 10 }}>
              <OrderSidebar order={order} buildPath={buildPath} onAddNote={onAddNote} notesOnly />
            </div>
          </div>
        )}
        {tab === 'timeline' && <OrderTimeline entries={order.timeline} />}
      </div>
    </div>
  );
}
