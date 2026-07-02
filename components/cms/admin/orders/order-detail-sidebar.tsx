'use client';

/**
 * Order detail — customer / shipping / notes sidebar.
 *
 * Three presentation modes share this component: `compact` (Order-tab right
 * column, everything), `notesOnly` (Notes tab), and the default (Customer tab:
 * customer + shipping). Only fields the order payload actually carries are
 * shown — no fabricated LTV / lifecycle / tags.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Avatar, Badge, Btn } from './orders-ui';
import { avatarColor, initialsOf } from './orders-model';
import type { OrderDetailModel } from './order-detail';

function SectionHead({ title, meta, right }: { readonly title: string; readonly meta?: string; readonly right?: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, paddingBottom: 8, marginBottom: 10, borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      {meta && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {meta}</span>}
      {right && <span style={{ marginLeft: 'auto', fontSize: 12 }}>{right}</span>}
    </div>
  );
}

function DField({ label, children }: { readonly label: string; readonly children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: 10, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--line-faint)' }}>
      <span className="gr-eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{children}</span>
    </div>
  );
}

function NotesBlock({
  order,
  onAddNote,
}: {
  readonly order: OrderDetailModel;
  readonly onAddNote: (note: string) => Promise<void>;
}): React.ReactElement {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const notes: readonly { label: string; body: string }[] = [
    ...(order.internalNotes ? [{ label: 'Internal', body: order.internalNotes }] : []),
    ...(order.customerNotes ? [{ label: 'From customer', body: order.customerNotes }] : []),
  ];

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onAddNote(text);
      setDraft('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionHead title="Notes" meta={notes.length === 1 ? '1 note' : `${notes.length} notes`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notes.map((nt) => (
          <div key={nt.label} className="gr-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{nt.body}</div>
            <div className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>{nt.label}</div>
          </div>
        ))}
        {notes.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No notes yet.</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Add an internal note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
          />
          <Btn kind="primary" size="sm" disabled={!draft.trim() || busy} onClick={() => void submit()}>Add</Btn>
        </div>
      </div>
    </div>
  );
}

export function OrderSidebar({
  order,
  buildPath,
  onAddNote,
  compact,
  notesOnly,
}: {
  readonly order: OrderDetailModel;
  readonly buildPath: (p: string) => string;
  readonly onAddNote: (note: string) => Promise<void>;
  readonly compact?: boolean;
  readonly notesOnly?: boolean;
}): React.ReactElement {
  if (notesOnly) {
    return <NotesBlock order={order} onAddNote={onAddNote} />;
  }

  const ship = order.shipment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <SectionHead
          title="Customer"
          right={
            order.customerId ? (
              <Link className="gr-link" href={buildPath(`/admin/customers/${order.customerId}`)}>Open dossier →</Link>
            ) : undefined
          }
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <Avatar initials={initialsOf(order.customerName)} color={avatarColor(order.customerName)} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customerName}</div>
            <div className="gr-num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.customerEmail}</div>
          </div>
        </div>
      </div>

      <div>
        <SectionHead title="Shipping" />
        {ship ? (
          <>
            {ship.carrier && <DField label="carrier">{[ship.carrier, ship.service].filter(Boolean).join(' · ')}</DField>}
            <DField label="status">{ship.status}</DField>
            <DField label="tracking">
              {ship.trackingNumber ? (
                ship.trackingUrl ? (
                  <a className="gr-link" href={ship.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <span className="gr-num">{ship.trackingNumber}</span>
                  </a>
                ) : (
                  <span className="gr-num">{ship.trackingNumber}</span>
                )
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>— not yet —</span>
              )}
            </DField>
            {ship.labelUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={ship.labelUrl} target="_blank" rel="noopener noreferrer">
                  <Btn size="sm">View label</Btn>
                </a>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No shipment created yet.</div>
        )}
      </div>

      {compact && <NotesBlock order={order} onAddNote={onAddNote} />}
    </div>
  );
}
