'use client';

/**
 * Atlas Customer Inbox
 * Notification messages from the store. Tabs: All / Unread / Orders / Stock.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';

type InboxTab = 'all' | 'unread' | 'orders' | 'stock';
type MsgType = 'order' | 'stock' | 'promo' | 'system';

interface InboxMessage {
  readonly id: string;
  readonly type: MsgType;
  readonly title: string;
  readonly body: string;
  readonly date: string;
  readonly read: boolean;
}

const MESSAGES: ReadonlyArray<InboxMessage> = [
  { id: 'm1', type: 'order',  title: 'Order #1042 shipped',           body: 'Your Heritage hoodie is on its way · Est. Tue 20 May',    date: '12 May', read: false },
  { id: 'm2', type: 'stock',  title: 'Seasonal tote is back in stock', body: 'Grab it before it sells out again.',                     date: '11 May', read: false },
  { id: 'm3', type: 'promo',  title: 'Members-only sale — 20% off',   body: 'Starts tonight at midnight. Use code ATLAS20.',           date: '10 May', read: true  },
  { id: 'm4', type: 'order',  title: 'Order #1038 delivered',          body: 'Your Field journal arrived. Leave a review?',            date: '06 May', read: true  },
  { id: 'm5', type: 'system', title: 'Email updated',                  body: 'Your account email was changed successfully.',           date: '04 May', read: true  },
  { id: 'm6', type: 'stock',  title: 'Linen apron now available',      body: 'The Natural linen apron you saved is back.',             date: '01 May', read: true  },
  { id: 'm7', type: 'order',  title: 'Return RET-0041 completed',      body: 'Store credit of $64 has been applied to your account.',  date: '12 Apr', read: true  },
] as const;

function typeIcon(type: MsgType) {
  switch (type) {
    case 'order':  return '📦';
    case 'stock':  return '🔔';
    case 'promo':  return '🏷';
    case 'system': return '🔐';
  }
}

function typeDot(type: MsgType): string {
  switch (type) {
    case 'order':  return 'var(--wl-accent)';
    case 'stock':  return 'var(--wl-success)';
    case 'promo':  return 'var(--wl-warning)';
    case 'system': return 'var(--wl-text-faint)';
  }
}

export default function InboxPage() {
  const [tab, setTab] = useState<InboxTab>('all');
  const [readSet, setReadSet] = useState<ReadonlySet<string>>(
    new Set(MESSAGES.filter((m) => m.read).map((m) => m.id))
  );

  const markRead = (id: string) => setReadSet((prev) => new Set([...prev, id]));

  const filtered = MESSAGES.filter((m) => {
    if (tab === 'unread') return !readSet.has(m.id);
    if (tab === 'orders') return m.type === 'order';
    if (tab === 'stock')  return m.type === 'stock';
    return true;
  });

  const unreadCount = MESSAGES.filter((m) => !readSet.has(m.id)).length;

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
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 14 }}>
        {(
          [
            ['all',    'All',    MESSAGES.length],
            ['unread', 'Unread', unreadCount],
            ['orders', 'Orders', MESSAGES.filter((m) => m.type === 'order').length],
            ['stock',  'Stock',  MESSAGES.filter((m) => m.type === 'stock').length],
          ] as [InboxTab, string, number][]
        ).map(([key, label, count]) => {
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
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', color: 'var(--wl-text-soft)' }}>
            No messages here.
          </div>
        ) : (
          filtered.map((msg, i) => {
            const isUnread = !readSet.has(msg.id);
            return (
              <div
                key={msg.id}
                onClick={() => markRead(msg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--wl-rule-soft)' : 'none',
                  background: isUnread ? 'color-mix(in srgb, var(--wl-accent) 5%, var(--wl-surface))' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {/* Unread dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isUnread ? typeDot(msg.type) : 'transparent',
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {typeIcon(msg.type)}
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
