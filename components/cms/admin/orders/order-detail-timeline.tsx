'use client';

/**
 * Order detail — Timeline tab. Built from the real OrderProgress history and
 * shipment events supplied by the controller, newest events last.
 */

import React from 'react';
import { ShoppingBag, Truck, GitBranch, StickyNote, CreditCard, Clock, type LucideIcon } from 'lucide-react';
import { dateTime } from './orders-model';
import type { DetailTimelineEntry } from './order-detail';

const ICONS: Record<DetailTimelineEntry['kind'], LucideIcon> = {
  placed: ShoppingBag,
  stage: GitBranch,
  ship: Truck,
  note: StickyNote,
  payment: CreditCard,
};

export function OrderTimeline({ entries }: { readonly entries: readonly DetailTimelineEntry[] }): React.ReactElement {
  if (entries.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No timeline events yet.</div>;
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, paddingBottom: 8, marginBottom: 10, borderBottom: '1px solid var(--line)' }}>
        <Clock size={15} style={{ color: 'var(--clay-600)', alignSelf: 'center' }} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Timeline</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {entries.length} events</span>
      </div>
      <div>
        {entries.map((e, i) => {
          const Icon = ICONS[e.kind];
          return (
            <div key={e.id} style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clay-600)' }}>
                  <Icon size={14} />
                </span>
                {i < entries.length - 1 && <span style={{ width: 1.5, flex: 1, background: 'var(--line)', margin: '4px 0' }} />}
              </div>
              <div style={{ paddingTop: 3, paddingBottom: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</span>
                  <span className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{dateTime(e.at)}</span>
                </div>
                {e.meta && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{e.meta}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
