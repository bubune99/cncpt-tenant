'use client';

/**
 * Customer dossier — main column. Activity timeline (built from real orders,
 * marketing consent and account-creation events) + the order-history table.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, Mail, UserPlus } from 'lucide-react';
import { Badge } from '@/components/cms/admin/grainy-ui';
import {
  fullDate,
  relativeTime,
  money,
  orderStatusTone,
  type ApiCustomerDetail,
} from './customers-model';
import { DossierCard } from './customer-detail-sidebar';

type TimelineIcon = typeof ShoppingBag;

interface TimelineEvent {
  readonly id: string;
  readonly icon: TimelineIcon;
  readonly tone: 'clay' | 'sage' | 'blue' | 'neutral';
  readonly title: string;
  readonly meta?: string;
  readonly when: string;
}

const TONE_BG: Record<TimelineEvent['tone'], string> = {
  clay: 'var(--clay-100)',
  sage: 'var(--sage-100)',
  blue: 'var(--blue-100)',
  neutral: 'var(--surface-sunken)',
};
const TONE_FG: Record<TimelineEvent['tone'], string> = {
  clay: 'var(--clay-700)',
  sage: 'var(--sage-700)',
  blue: 'var(--blue-700)',
  neutral: 'var(--text-secondary)',
};

export function CustomerDetailMain({
  customer,
  buildPath,
}: {
  readonly customer: ApiCustomerDetail;
  readonly buildPath: (path: string) => string;
}): React.ReactElement {
  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];
    customer.orders.slice(0, 5).forEach((o) => {
      list.push({
        id: `order-${o.id}`,
        icon: ShoppingBag,
        tone: 'clay',
        title: `Placed order #${o.orderNumber}`,
        meta: `${o.itemCount} item${o.itemCount === 1 ? '' : 's'} · ${money(o.total)}`,
        when: relativeTime(o.createdAt),
      });
    });
    if (customer.acceptsMarketing && customer.marketingOptInAt) {
      list.push({
        id: 'marketing',
        icon: Mail,
        tone: 'blue',
        title: 'Subscribed to marketing',
        when: fullDate(customer.marketingOptInAt),
      });
    }
    list.push({
      id: 'created',
      icon: UserPlus,
      tone: 'neutral',
      title: 'Account created',
      when: fullDate(customer.createdAt),
    });
    return list;
  }, [customer]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DossierCard title="Activity">
        {events.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No activity yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {events.map((e, i) => {
              const Icon = e.icon;
              const last = i === events.length - 1;
              return (
                <div key={e.id} style={{ display: 'flex', gap: 12, paddingBottom: last ? 0 : 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TONE_BG[e.tone], color: TONE_FG[e.tone] }}>
                      <Icon size={15} />
                    </span>
                    {!last && <span style={{ width: 1.5, flex: 1, background: 'var(--line)', marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingTop: 4, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</div>
                    {e.meta && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{e.meta}</div>}
                    <div className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{e.when}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DossierCard>

      <DossierCard title="Orders" meta={`${customer.totalOrders} lifetime`}>
        {customer.orders.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No orders placed yet.</div>
        ) : (
          <div className="table-wrap" style={{ margin: '-4px 0' }}>
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Date</th><th className="num">Items</th><th className="num">Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {customer.orders.map((o) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => { window.location.href = buildPath(`/admin/orders/${o.id}`); }}>
                    <td>
                      <Link href={buildPath(`/admin/orders/${o.id}`)} className="gr-num" style={{ fontWeight: 600, color: 'var(--clay-700)' }} onClick={(e) => e.stopPropagation()}>
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td><span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{fullDate(o.createdAt)}</span></td>
                    <td className="num">{o.itemCount}</td>
                    <td className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{money(o.total)}</td>
                    <td><Badge tone={orderStatusTone(o.status)}>{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DossierCard>
    </div>
  );
}
