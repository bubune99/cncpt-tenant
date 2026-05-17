'use client';

/**
 * Atlas admin notification drawer — faithful port of atlas-v2-chrome.jsx
 * `NotifDrawerAdmin` + `ADMIN_NOTIFS` + CSS classes from atlas.css.
 *
 * Usage:
 *   <NotifDrawerAdmin open={drawerOpen} onClose={() => setDrawerOpen(false)} />
 */

import { useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type NotifTone = 'accent' | 'gold' | 'moss' | 'ink';
type NotifState = 'unread' | 'read';
type NotifTab = 'all' | 'unread' | 'orders' | 'stock' | 'payments' | 'tickets';

interface AdminNotif {
  readonly id: string;
  readonly cat: string;
  readonly tone: NotifTone;
  readonly state: NotifState;
  readonly kbd?: string;
  readonly title: string;
  readonly body: string;
  readonly when: string;
  readonly cta: string;
}

// ─────────────────────────────────────────────
// Static notification data (design-faithful)
// ─────────────────────────────────────────────

export const ADMIN_NOTIFS: readonly AdminNotif[] = [
  {
    id: 'a1', cat: 'STOCK',    tone: 'accent', state: 'unread', kbd: 'R',
    title: 'Dahlia tee · size M is out of stock',
    body:  'Third time this month. Replenishment lead time is 9 days — suppliers reachable now.',
    when:  'just now',   cta: 'Restock →',
  },
  {
    id: 'a2', cat: 'ORDERS',   tone: 'gold',   state: 'unread', kbd: 'P',
    title: '12 orders waiting on fulfillment',
    body:  '$234.70 in pending labels. #4818 paid for expedite — pack first.',
    when:  '08:42 EST',  cta: 'Pack queue →',
  },
  {
    id: 'a3', cat: 'TICKET',   tone: 'accent', state: 'unread', kbd: 'O',
    title: 'Customer ticket · refund · 19h old',
    body:  'cs-22 · Lena Park · "ordered wrong size, want exchange not refund."',
    when:  'yesterday',  cta: 'Open →',
  },
  {
    id: 'a4', cat: 'JOURNAL',  tone: 'gold',   state: 'unread', kbd: 'A',
    title: 'Thursday letter scheduled · approve by 09:00',
    body:  '2,847 recipients · "Marigold spring · part II" · 4 blocks · 1 image.',
    when:  'today',      cta: 'Approve →',
  },
  {
    id: 'a5', cat: 'PAYMENT',  tone: 'moss',   state: 'read',
    title: 'Stripe payout · $4,820.40 deposited',
    body:  'To Capital One ····8821 · 38 charges from the past 7 days.',
    when:  '07:14 EST',  cta: 'Ledger →',
  },
  {
    id: 'a6', cat: 'REVIEW',   tone: 'ink',    state: 'read',
    title: 'Demetrius submitted "Lagos field report"',
    body:  '92% complete · sitting 12d in review · 1,840 words + 6 photos.',
    when:  'yesterday',  cta: 'Review →',
  },
  {
    id: 'a7', cat: 'PAYMENT',  tone: 'accent', state: 'read',
    title: 'Payment failed · order #4815 · $48.00',
    body:  'Card declined · contact retried 2× · customer notified by email.',
    when:  '14 May',     cta: 'Resolve →',
  },
  {
    id: 'a8', cat: 'CUSTOMER', tone: 'moss',   state: 'read',
    title: 'Maya Rodriguez reached Loyal',
    body:  '14th order since Mar 2024 · $612 lifetime · top 14% of roster.',
    when:  '16 May',     cta: 'Open profile →',
  },
] as const;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface NotifDrawerAdminProps {
  open: boolean;
  onClose: () => void;
}

export function NotifDrawerAdmin({ open, onClose }: NotifDrawerAdminProps) {
  const [activeTab, setActiveTab] = useState<NotifTab>('all');

  if (!open) return null;

  const unreadCount = ADMIN_NOTIFS.filter(n => n.state === 'unread').length;

  const tabItems: readonly [NotifTab, string, number][] = [
    ['all',      'All',      ADMIN_NOTIFS.length],
    ['unread',   'Unread',   unreadCount],
    ['orders',   'Orders',   ADMIN_NOTIFS.filter(n => n.cat === 'ORDERS').length],
    ['stock',    'Stock',    ADMIN_NOTIFS.filter(n => n.cat === 'STOCK').length],
    ['payments', 'Payments', ADMIN_NOTIFS.filter(n => n.cat === 'PAYMENT').length],
    ['tickets',  'Tickets',  ADMIN_NOTIFS.filter(n => n.cat === 'TICKET').length],
  ];

  const visibleItems = activeTab === 'all'
    ? ADMIN_NOTIFS
    : activeTab === 'unread'
    ? ADMIN_NOTIFS.filter(n => n.state === 'unread')
    : ADMIN_NOTIFS.filter(n => n.cat.toLowerCase() === activeTab || n.cat.toLowerCase().startsWith(activeTab));

  return (
    <div className="adm-drawer" role="dialog" aria-label="Notifications">
      {/* Caret marker */}
      <div
        style={{
          position: 'absolute', top: -6, right: 78,
          width: 11, height: 11,
          background: 'var(--paper)',
          borderTop: '1px solid var(--ink)',
          borderLeft: '1px solid var(--ink)',
          transform: 'rotate(45deg)',
        }}
        aria-hidden="true"
      />

      {/* Head */}
      <div className="adm-drawer-head">
        <div>
          <div className="eyebrow">Inbox · today</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 2 }}>
            <span className="display-i" style={{ color: 'var(--accent)' }}>{unreadCount}</span>{' '}need you
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingTop: 4 }}>
          <button
            className="fig"
            style={{ fontSize: 10, letterSpacing: '.04em', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="fig"
            style={{ fontSize: 10, letterSpacing: '.04em', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-drawer-tabs">
        {tabItems.map(([key, label, count]) => (
          <button
            key={key}
            className={'adm-tab' + (activeTab === key ? ' on' : '')}
            onClick={() => setActiveTab(key)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0' }}
          >
            {label}{' '}
            <span className="ct">{count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="adm-drawer-list">
        {visibleItems.map(n => (
          <div
            key={n.id}
            className={'adm-notif' + (n.state === 'unread' ? ' unread' : '')}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className={`adm-cat t-${n.tone}`}>{n.cat}</span>
              <span className="fig" style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-geist-mono)' }}>{n.when}</span>
            </div>
            <div className="adm-notif-title">{n.title}</div>
            <div className="adm-notif-body">{n.body}</div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 6, gap: 12 }}>
              <button
                className="adm-notif-cta"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {n.cta}
              </button>
              {n.kbd && (
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-geist-mono)', fontSize: 9.5, color: 'var(--ink-faint)' }}>
                  <span className="kbd">{n.kbd}</span>shortcut
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '9px 18px', borderTop: '1px solid var(--ink)',
          background: 'var(--paper-2)', display: 'flex', alignItems: 'center',
        }}
      >
        <button
          className="mono"
          style={{
            fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none',
            cursor: 'pointer', letterSpacing: '.04em', fontWeight: 600,
          }}
        >
          Open full inbox →
        </button>
        <span className="fig" style={{ fontSize: 11, marginLeft: 'auto' }}>auto-archives after 14d</span>
      </div>
    </div>
  );
}
