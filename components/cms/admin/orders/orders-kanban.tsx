'use client';

/**
 * OrdersKanban — four fulfillment lanes (New · In progress · Shipped · Delivered)
 * mapped onto the real OrderStatus enum. Dragging a card calls the real
 * status-update mutation. A pack-before-ship guard blocks jumping a brand-new
 * order straight to Shipped — it must pass through In progress first.
 */

import React, { useState } from 'react';
import { OrderCard } from './order-card';
import {
  STAGES,
  STAGE_ACCENT,
  statusToStage,
  type OrderRow,
  type Stage,
} from './orders-model';

export function OrdersKanban({
  rows,
  onOpen,
  onMove,
}: {
  readonly rows: readonly OrderRow[];
  readonly onOpen: (id: string) => void;
  /** Persist a stage change. Returns false if a guard rejected the move. */
  readonly onMove: (id: string, from: Stage, to: Stage) => boolean;
}): React.ReactElement {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Stage | null>(null);

  const laneOf = (o: OrderRow): Stage | null => statusToStage(o.status);

  return (
    <div className="gr-scroll" style={{ flex: 1, minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: 14, height: '100%', minHeight: 420 }}>
        {STAGES.map((st) => {
          const laneRows = rows.filter((o) => laneOf(o) === st);
          return (
            <div
              key={st}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(st);
              }}
              onDragLeave={() => setOverCol((c) => (c === st ? null : c))}
              onDrop={() => {
                if (dragId) {
                  const card = rows.find((o) => o.id === dragId);
                  const from = card ? laneOf(card) : null;
                  if (card && from && from !== st) onMove(dragId, from, st);
                }
                setDragId(null);
                setOverCol(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                borderRadius: 'var(--r-lg)',
                background:
                  overCol === st ? 'color-mix(in srgb, var(--clay-100) 35%, var(--surface))' : 'var(--surface)',
                border: `1px solid ${overCol === st ? 'var(--clay-500)' : 'var(--line)'}`,
                transition: 'background .12s, border-color .12s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', borderBottom: '1px solid var(--line-faint)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: STAGE_ACCENT[st] }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{st}</span>
                <span className="gr-num" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{laneRows.length}</span>
              </div>
              <div className="gr-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {laneRows.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    style={{ opacity: dragId === o.id ? 0.4 : 1, cursor: 'grab' }}
                  >
                    <OrderCard order={o} mini onClick={() => onOpen(o.id)} />
                  </div>
                ))}
                {laneRows.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
