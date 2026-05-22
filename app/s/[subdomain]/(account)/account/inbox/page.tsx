'use client';

/**
 * Atlas Customer Inbox
 * Notification messages from the store. Tabs: All / Unread / Orders / Stock.
 * Uses --wl-* tokens exclusively.
 *
 * Data: real-time from GET /api/cms/notifications
 * Mark-read: PATCH /api/cms/notifications/[id] (on row click)
 * Mark-all-read: POST /api/cms/notifications/mark-all-read
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import useSWR, { mutate as globalMutate } from 'swr';

type InboxTab = 'all' | 'unread' | 'orders' | 'stock';
type MsgKind = 'order' | 'stock' | 'promo' | 'system';

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
// Display type (what the list renders)
// ─────────────────────────────────────────────

interface InboxMessage {
  readonly id: string;
  readonly kind: MsgKind;
  readonly title: string;
  readonly body: string;
  readonly date: string;
  readonly read: boolean;
}

// ─────────────────────────────────────────────
// SWR
// ─────────────────────────────────────────────

const NOTIFS_URL = '/api/cms/notifications?limit=100';
const UNREAD_URL = '/api/cms/notifications/unread-counts';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────

function deriveKind(type: string): MsgKind {
  if (type.startsWith('ORDER') || type.startsWith('SUBSCRIPTION')) return 'order';
  if (type === 'BACK_IN_STOCK' || type === 'PRICE_DROP' || type === 'WISHLIST_SALE') return 'stock';
  if (type === 'PAYMENT_RECEIVED' || type === 'PAYMENT_FAILED') return 'promo';
  return 'system';
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function mapApiToMessage(n: ApiNotification, localRead: boolean): InboxMessage {
  return {
    id: n.id,
    kind: deriveKind(n.type),
    title: n.title,
    body: n.message,
    date: formatDate(n.createdAt),
    read: localRead || n.read,
  };
}

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

function typeIcon(kind: MsgKind): string {
  switch (kind) {
    case 'order':  return '📦';
    case 'stock':  return '🔔';
    case 'promo':  return '🏷';
    case 'system': return '🔐';
  }
}

function typeDot(kind: MsgKind): string {
  switch (kind) {
    case 'order':  return 'var(--wl-accent)';
    case 'stock':  return 'var(--wl-success)';
    case 'promo':  return 'var(--wl-warning)';
    case 'system': return 'var(--wl-text-faint)';
  }
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────

export default function InboxPage() {
  const [tab, setTab] = useState<InboxTab>('all');
  const [localReadIds, setLocalReadIds] = useState<ReadonlySet<string>>(new Set());

  const { data, error, isLoading, mutate } =
    useSWR<NotificationsResponse>(NOTIFS_URL, fetcher, {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    });

  const messages: readonly InboxMessage[] = (data?.items ?? []).map((n) =>
    mapApiToMessage(n, localReadIds.has(n.id))
  );

  const unreadCount = messages.filter((m) => !m.read).length;

  const filtered = messages.filter((m) => {
    if (tab === 'unread') return !m.read;
    if (tab === 'orders') return m.kind === 'order';
    if (tab === 'stock')  return m.kind === 'stock';
    return true;
  });

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

  const tabDefs: ReadonlyArray<[InboxTab, string, number]> = [
    ['all',    'All',    messages.length],
    ['unread', 'Unread', unreadCount],
    ['orders', 'Orders', messages.filter((m) => m.kind === 'order').length],
    ['stock',  'Stock',  messages.filter((m) => m.kind === 'stock').length],
  ];

  return (
    <div>
      {/* Page head */}
      <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--wl-rule)' }}>
        <div
          style={{
            fontFamily: 'var(--wl-font-mono)',
            fontSize: 10.5,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--wl-text-soft)',
            marginBottom: 6,
          }}
        >
          <Link href="/account" style={{ color: 'var(--wl-text-soft)', textDecoration: 'none' }}>Account</Link>
          <span style={{ color: 'var(--wl-text-faint)', margin: '0 6px' }}>/</span>
          <span style={{ color: 'var(--wl-text)' }}>Inbox</span>
        </div>
        <h1
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontWeight: 500,
            fontSize: 38,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Your <em style={{ fontStyle: 'italic', fontWeight: 400 }}>inbox</em>
        </h1>
        <div
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontStyle: 'italic',
            color: 'var(--wl-text-soft)',
            fontSize: 14,
            marginTop: 4,
          }}
        >
          {isLoading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 14 }}>
        {tabDefs.map(([key, label, count]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                fontFamily: 'var(--wl-font-mono)',
                fontSize: 10.5,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: active ? 'var(--wl-accent-fg)' : 'var(--wl-text-soft)',
                background: active ? 'var(--wl-accent)' : 'transparent',
                border: `1px solid ${active ? 'var(--wl-accent)' : 'var(--wl-rule)'}`,
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >
              {label}
              {count > 0 && (
                <span
                  style={{
                    background: active ? 'rgba(255,255,255,.2)' : 'var(--wl-surface-2)',
                    padding: '1px 5px',
                    borderRadius: 999,
                    fontSize: 9,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Message list */}
      <div
        style={{
          background: 'var(--wl-surface)',
          border: '1px solid var(--wl-rule)',
          borderRadius: 'var(--wl-radius)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          /* Loading skeleton */
          [0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 18px',
                borderBottom: '1px solid var(--wl-rule-soft)',
                opacity: 0.45,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wl-surface-2)', flexShrink: 0, marginTop: 6 }} />
              <div style={{ fontSize: 18, flexShrink: 0 }}>·</div>
              <div style={{ flex: 1 }}>
                <div style={{ width: '55%', height: 13, background: 'var(--wl-surface-2)', borderRadius: 3, marginBottom: 6 }} />
                <div style={{ width: '80%', height: 11, background: 'var(--wl-surface-2)', borderRadius: 3 }} />
              </div>
            </div>
          ))
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', color: 'var(--wl-text-soft)' }}>
            Could not load messages. Please try refreshing.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', color: 'var(--wl-text-soft)' }}>
            No messages here.
          </div>
        ) : (
          filtered.map((msg, i) => {
            const isUnread = !msg.read;
            return (
              <div
                key={msg.id}
                onClick={() => { if (isUnread) void handleMarkRead(msg.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
                  background: isUnread ? 'color-mix(in srgb, var(--wl-accent) 5%, var(--wl-surface))' : 'transparent',
                  cursor: isUnread ? 'pointer' : 'default',
                }}
              >
                {/* Unread dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isUnread ? typeDot(msg.kind) : 'transparent',
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {typeIcon(msg.kind)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'space-between' }}>
                    <div
                      style={{
                        fontFamily: 'var(--wl-font-display)',
                        fontSize: 14,
                        fontWeight: isUnread ? 600 : 400,
                      }}
                    >
                      {msg.title}
                    </div>
                    <div style={{ fontFamily: 'var(--wl-font-mono)', fontSize: 10, color: 'var(--wl-text-faint)', flexShrink: 0 }}>
                      {msg.date}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--wl-text-soft)', marginTop: 2, lineHeight: 1.45 }}>
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
