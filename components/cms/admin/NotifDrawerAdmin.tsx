'use client';

/**
 * Atlas admin notification drawer — faithful port of atlas-v2-chrome.jsx
 * `NotifDrawerAdmin` + CSS classes from atlas.css.
 *
 * Data: real-time from GET /api/cms/notifications and
 *       GET /api/cms/notifications/unread-counts.
 * Mark-read: PATCH /api/cms/notifications/[id]
 * Mark-all-read: POST /api/cms/notifications/mark-all-read
 *
 * Usage:
 *   <NotifDrawerAdmin open={drawerOpen} onClose={() => setDrawerOpen(false)} />
 */

import { useState, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

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

/** Shape returned by GET /api/cms/notifications */
interface ApiNotification {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly link: string | null;
  readonly entityType: string | null;
  readonly read: boolean;
  readonly createdAt: string;
}

interface NotificationsResponse {
  readonly items: readonly ApiNotification[];
  readonly unreadCount: number;
  readonly total: number;
}

interface UnreadCountsResponse {
  readonly counts: Readonly<Record<string, number>>;
  readonly total: number;
}

// ─────────────────────────────────────────────
// SWR fetcher
// ─────────────────────────────────────────────

const NOTIFS_URL = '/api/cms/notifications?limit=50';
const UNREAD_URL = '/api/cms/notifications/unread-counts';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────

function deriveCat(type: string): string {
  if (type.startsWith('ORDER')) return 'ORDERS';
  if (type === 'BACK_IN_STOCK' || type === 'PRICE_DROP' || type === 'WISHLIST_SALE') return 'STOCK';
  if (type.startsWith('PAYMENT')) return 'PAYMENT';
  if (type === 'REVIEW_APPROVED' || type === 'REVIEW_RESPONSE') return 'REVIEW';
  if (type.startsWith('SUBSCRIPTION')) return 'JOURNAL';
  if (type === 'ACCOUNT_SECURITY') return 'CUSTOMER';
  return 'SYSTEM';
}

function deriveTone(type: string): NotifTone {
  if (type.startsWith('ORDER') || type === 'BACK_IN_STOCK' || type === 'WISHLIST_SALE') return 'accent';
  if (type.startsWith('PAYMENT') || type.startsWith('SUBSCRIPTION') || type === 'PRICE_DROP') return 'gold';
  if (type === 'REVIEW_APPROVED' || type === 'REVIEW_RESPONSE' || type === 'ACCOUNT_SECURITY') return 'moss';
  return 'ink';
}

function deriveCta(type: string): string {
  if (type.startsWith('ORDER')) return 'View order →';
  if (type === 'BACK_IN_STOCK' || type === 'PRICE_DROP' || type === 'WISHLIST_SALE') return 'Shop now →';
  if (type.startsWith('PAYMENT')) return 'Ledger →';
  if (type.startsWith('SUBSCRIPTION')) return 'Manage →';
  if (type === 'REVIEW_APPROVED' || type === 'REVIEW_RESPONSE') return 'Review →';
  return 'View →';
}

function formatWhen(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' });
  }
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function mapApiToAdminNotif(n: ApiNotification): AdminNotif {
  return {
    id: n.id,
    cat: deriveCat(n.type),
    tone: deriveTone(n.type),
    state: n.read ? 'read' : 'unread',
    title: n.title,
    body: n.message,
    when: formatWhen(n.createdAt),
    cta: n.link ? (deriveCta(n.type)) : deriveCta(n.type),
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface NotifDrawerAdminProps {
  open: boolean;
  onClose: () => void;
}

export function NotifDrawerAdmin({ open, onClose }: NotifDrawerAdminProps) {
  const [activeTab, setActiveTab] = useState<NotifTab>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const { data: notifsData, error: notifsError, isLoading, mutate: mutateNotifs } =
    useSWR<NotificationsResponse>(open ? NOTIFS_URL : null, fetcher, {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    });

  // Optimistic read-state local overlay: set of ids marked read during this session
  const [localReadIds, setLocalReadIds] = useState<ReadonlySet<string>>(new Set());

  const notifs: readonly AdminNotif[] = (notifsData?.items ?? []).map((n) =>
    mapApiToAdminNotif(localReadIds.has(n.id) ? { ...n, read: true } : n)
  );

  const unreadCount = notifs.filter((n) => n.state === 'unread').length;

  const tabItems: readonly [NotifTab, string, number][] = [
    ['all',      'All',      notifs.length],
    ['unread',   'Unread',   unreadCount],
    ['orders',   'Orders',   notifs.filter(n => n.cat === 'ORDERS').length],
    ['stock',    'Stock',    notifs.filter(n => n.cat === 'STOCK').length],
    ['payments', 'Payments', notifs.filter(n => n.cat === 'PAYMENT').length],
    ['tickets',  'Tickets',  notifs.filter(n => n.cat === 'TICKET').length],
  ];

  const visibleItems: readonly AdminNotif[] = activeTab === 'all'
    ? notifs
    : activeTab === 'unread'
    ? notifs.filter(n => n.state === 'unread')
    : notifs.filter(n => n.cat.toLowerCase() === activeTab || n.cat.toLowerCase().startsWith(activeTab));

  const handleMarkRead = useCallback(async (id: string) => {
    // Optimistic update
    setLocalReadIds(prev => new Set([...prev, id]));
    try {
      await fetch(`/api/cms/notifications/${id}`, { method: 'PATCH' });
      await mutateNotifs();
      await globalMutate(UNREAD_URL);
    } catch {
      // Revert on failure
      setLocalReadIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [mutateNotifs]);

  const handleMarkAllRead = useCallback(async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    // Optimistic: mark all visible as read
    const allIds = notifs.map(n => n.id);
    setLocalReadIds(prev => new Set([...prev, ...allIds]));
    try {
      await fetch('/api/cms/notifications/mark-all-read', { method: 'POST' });
      await mutateNotifs();
      await globalMutate(UNREAD_URL);
    } catch {
      // Revert
      setLocalReadIds(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } finally {
      setMarkingAllRead(false);
    }
  }, [markingAllRead, notifs, mutateNotifs]);

  if (!open) return null;

  return (
    <div className="adm-drawer" role="dialog" aria-label="Notifications" aria-modal="true">
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
            {isLoading ? (
              <span className="display-i" style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Loading…</span>
            ) : (
              <>
                <span className="display-i" style={{ color: 'var(--accent)' }}>{unreadCount}</span>{' '}need you
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingTop: 4 }}>
          <button
            className="fig"
            onClick={handleMarkAllRead}
            disabled={markingAllRead || unreadCount === 0}
            style={{ fontSize: 10, letterSpacing: '.04em', background: 'none', border: 'none', cursor: unreadCount === 0 ? 'default' : 'pointer', color: 'var(--ink-soft)', opacity: unreadCount === 0 ? 0.4 : 1 }}
          >
            {markingAllRead ? 'Marking…' : 'Mark all read'}
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
        {isLoading ? (
          /* Loading skeleton */
          [0, 1, 2].map(i => (
            <div key={i} className="adm-notif" style={{ opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="adm-cat t-ink" style={{ width: 48, height: 10, background: 'var(--paper-2)', borderRadius: 2 }} />
                <span className="fig" style={{ width: 36, height: 10, background: 'var(--paper-2)', borderRadius: 2 }} />
              </div>
              <div className="adm-notif-title" style={{ width: '70%', height: 13, background: 'var(--paper-2)', borderRadius: 2, marginBottom: 4 }} />
              <div className="adm-notif-body" style={{ width: '90%', height: 11, background: 'var(--paper-2)', borderRadius: 2 }} />
            </div>
          ))
        ) : notifsError ? (
          <div className="adm-notif" style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 12, textAlign: 'center', padding: '18px 0' }}>
            Could not load notifications.
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="adm-notif" style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 12, textAlign: 'center', padding: '18px 0' }}>
            No notifications here.
          </div>
        ) : (
          visibleItems.map(n => (
            <div
              key={n.id}
              className={'adm-notif' + (n.state === 'unread' ? ' unread' : '')}
              onClick={() => { if (n.state === 'unread') void handleMarkRead(n.id); }}
              style={{ cursor: n.state === 'unread' ? 'pointer' : 'default' }}
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
                  onClick={(e) => { e.stopPropagation(); if (n.state === 'unread') void handleMarkRead(n.id); }}
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
          ))
        )}
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
