'use client';

/**
 * Atlas Customer Notifications Drawer
 * Flyout from the bell icon in the storefront chrome.
 * Uses --wl-* tokens exclusively.
 *
 * Data: real-time from GET /api/cms/notifications
 * Mark-all-read: POST /api/cms/notifications/mark-all-read
 * Mark-read: PATCH /api/cms/notifications/[id] (on item click)
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import useSWR, { mutate as globalMutate } from 'swr';
import type { NotificationItem } from './types';

// ─────────────────────────────────────────────
// API types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// SWR
// ─────────────────────────────────────────────

const NOTIFS_URL = '/api/cms/notifications?limit=30';
const UNREAD_URL = '/api/cms/notifications/unread-counts';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────

function deriveKind(type: string): NotificationItem['kind'] {
  if (type.startsWith('ORDER') || type === 'SUBSCRIPTION_RENEWAL' || type === 'SUBSCRIPTION_CANCELLED') return 'order';
  if (type === 'BACK_IN_STOCK' || type === 'PRICE_DROP' || type === 'WISHLIST_SALE') return 'stock';
  if (type === 'REVIEW_APPROVED' || type === 'REVIEW_RESPONSE') return 'review';
  return 'editorial';
}

function deriveTone(type: string): NotificationItem['tone'] {
  if (type.startsWith('ORDER_PLACED') || type === 'ORDER_SHIPPED') return 'accent';
  if (type === 'ORDER_DELIVERED' || type === 'BACK_IN_STOCK') return 'success';
  if (type === 'PRICE_DROP' || type === 'WISHLIST_SALE' || type.startsWith('SUBSCRIPTION')) return 'gold';
  return 'ink';
}

function deriveGlyph(type: string): string {
  if (type === 'ORDER_SHIPPED') return '📦';
  if (type === 'ORDER_DELIVERED') return '✓';
  if (type === 'ORDER_PLACED') return '🛒';
  if (type === 'ORDER_CANCELLED') return '✕';
  if (type === 'BACK_IN_STOCK' || type === 'PRICE_DROP' || type === 'WISHLIST_SALE') return '✓';
  if (type.startsWith('SUBSCRIPTION')) return '↻';
  if (type === 'REVIEW_APPROVED' || type === 'REVIEW_RESPONSE') return '★';
  if (type === 'PAYMENT_RECEIVED') return '✓';
  if (type === 'PAYMENT_FAILED') return '!';
  return '◆';
}

function deriveCta(type: string): string {
  if (type.startsWith('ORDER')) return 'Track →';
  if (type === 'BACK_IN_STOCK' || type === 'PRICE_DROP' || type === 'WISHLIST_SALE') return 'Shop now →';
  if (type.startsWith('SUBSCRIPTION')) return 'Manage →';
  if (type === 'REVIEW_APPROVED' || type === 'REVIEW_RESPONSE') return 'View →';
  return 'View →';
}

function formatWhen(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 2) return 'today';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function mapApiToNotif(n: ApiNotification): NotificationItem {
  return {
    id: n.id,
    kind: deriveKind(n.type),
    state: n.read ? 'read' : 'unread',
    glyph: deriveGlyph(n.type),
    tone: deriveTone(n.type),
    title: n.title,
    body: n.message,
    when: formatWhen(n.createdAt),
    cta: deriveCta(n.type),
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

type NotifTab = 'all' | 'unread' | 'orders' | 'stock';

interface NotifDrawerProps {
  readonly onClose: () => void;
}

const toneColor = (tone: NotificationItem['tone']): string => {
  switch (tone) {
    case 'accent':  return 'var(--wl-accent)';
    case 'success': return 'var(--wl-success)';
    case 'gold':    return 'var(--wl-warning)';
    default:        return 'var(--wl-text)';
  }
};

export function NotifDrawer({ onClose }: NotifDrawerProps) {
  const [tab, setTab] = useState<NotifTab>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [localReadIds, setLocalReadIds] = useState<ReadonlySet<string>>(new Set());

  const { data, error, isLoading, mutate } =
    useSWR<NotificationsResponse>(NOTIFS_URL, fetcher, {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    });

  const notifs: readonly NotificationItem[] = (data?.items ?? []).map((n) =>
    mapApiToNotif(localReadIds.has(n.id) ? { ...n, read: true } : n)
  );

  const unread = notifs.filter((n) => n.state === 'unread').length;

  const filtered = tab === 'unread'
    ? notifs.filter((n) => n.state === 'unread')
    : tab === 'orders'
      ? notifs.filter((n) => n.kind === 'order')
      : tab === 'stock'
        ? notifs.filter((n) => n.kind === 'stock')
        : notifs;

  const tabs: ReadonlyArray<[NotifTab, string, number]> = [
    ['all',    'All',    notifs.length],
    ['unread', 'Unread', unread],
    ['orders', 'Orders', notifs.filter((n) => n.kind === 'order').length],
    ['stock',  'Stock',  notifs.filter((n) => n.kind === 'stock').length],
  ];

  const handleMarkRead = useCallback(async (id: string) => {
    setLocalReadIds(prev => new Set([...prev, id]));
    try {
      await fetch(`/api/cms/notifications/${id}`, { method: 'PATCH' });
      await mutate();
      await globalMutate(UNREAD_URL);
    } catch {
      setLocalReadIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [mutate]);

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll) return;
    setMarkingAll(true);
    const allIds = notifs.map(n => n.id);
    setLocalReadIds(prev => new Set([...prev, ...allIds]));
    try {
      await fetch('/api/cms/notifications/mark-all-read', { method: 'POST' });
      await mutate();
      await globalMutate(UNREAD_URL);
    } catch {
      setLocalReadIds(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, notifs, mutate]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        style={{
          position: 'absolute',
          top: 72,
          right: 24,
          width: 380,
          maxHeight: 560,
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          boxShadow: '0 18px 48px rgba(0,0,0,.22)',
          zIndex: 11,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Head */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 16px 10px',
            borderBottom: '1px solid var(--wl-rule-soft)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: '-0.01em',
            }}
          >
            Notifications
          </span>
          <span
            style={{
              border: '1px solid var(--wl-accent)',
              color: 'var(--wl-accent)',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 9.5,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 999,
              marginLeft: 4,
            }}
          >
            {isLoading ? '…' : `${unread} new`}
          </span>
          <button
            onClick={() => { void handleMarkAllRead(); }}
            disabled={markingAll || unread === 0}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              color: 'var(--wl-text-soft)',
              background: 'none',
              border: 'none',
              cursor: unread === 0 ? 'default' : 'pointer',
              letterSpacing: '.04em',
              padding: '2px 4px',
              opacity: unread === 0 ? 0.4 : 1,
            }}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 16px 0',
            borderBottom: '1px solid var(--wl-rule-soft)',
            gap: 2,
          }}
        >
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '6px 10px',
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 10.5,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: tab === key ? 'var(--wl-accent)' : 'var(--wl-text-soft)',
                background: 'none',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--wl-accent)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: -1,
              }}
            >
              {label}
              <span
                style={{
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 9,
                  color: tab === key ? 'var(--wl-accent)' : 'var(--wl-text-faint)',
                }}
              >
                {count}
              </span>
            </button>
          ))}
          <Link
            href="/account/notifications"
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              color: 'var(--wl-text-soft)',
              textDecoration: 'none',
              letterSpacing: '.04em',
              paddingBottom: 6,
            }}
          >
            Settings ⚙
          </Link>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            /* Loading skeleton rows */
            [0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--wl-rule-soft)',
                  opacity: 0.45,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--wl-surface-2)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '65%', height: 13, background: 'var(--wl-surface-2)', borderRadius: 3, marginBottom: 6 }} />
                  <div style={{ width: '90%', height: 11, background: 'var(--wl-surface-2)', borderRadius: 3 }} />
                </div>
              </div>
            ))
          ) : error ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: 'var(--wl-font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--wl-text-soft)',
              }}
            >
              Could not load notifications.
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: 'var(--wl-font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--wl-text-soft)',
              }}
            >
              No notifications here.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => { if (n.state === 'unread') void handleMarkRead(n.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--wl-rule-soft)',
                  background: n.state === 'unread' ? 'var(--wl-accent-soft)' : 'transparent',
                  position: 'relative',
                  cursor: n.state === 'unread' ? 'pointer' : 'default',
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--wl-surface-2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: toneColor(n.tone),
                    flexShrink: 0,
                  }}
                >
                  {n.glyph}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{n.title}</div>
                  <div
                    style={{
                      fontFamily: 'var(--wl-font-display)',
                      fontStyle: 'italic',
                      fontSize: 12,
                      color: 'var(--wl-text-soft)',
                      marginTop: 2,
                      lineHeight: 1.35,
                    }}
                  >
                    {n.body}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 10,
                        color: 'var(--wl-text-faint)',
                      }}
                    >
                      {n.when}
                    </span>
                    <a
                      href="#"
                      onClick={(e) => { e.stopPropagation(); if (n.state === 'unread') void handleMarkRead(n.id); }}
                      style={{
                        fontFamily: 'var(--wl-font-mono)',
                        fontSize: 10.5,
                        color: 'var(--wl-accent)',
                        textDecoration: 'none',
                      }}
                    >
                      {n.cta}
                    </a>
                  </div>
                </div>
                {n.state === 'unread' && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--wl-accent)',
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--wl-rule-soft)',
            textAlign: 'center',
          }}
        >
          <Link
            href="/account/inbox"
            onClick={onClose}
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 11,
              color: 'var(--wl-accent)',
              textDecoration: 'none',
              letterSpacing: '.04em',
            }}
          >
            See full inbox →
          </Link>
        </div>
      </div>
    </>
  );
}
