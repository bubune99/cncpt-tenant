'use client';

/**
 * Atlas Customer Notifications Drawer
 * Flyout from the bell icon in the storefront chrome.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { NotificationItem } from './types';

const SAMPLE_NOTIFS: readonly NotificationItem[] = [
  {
    id: 'n1', kind: 'order', state: 'unread',
    glyph: '📦', tone: 'accent',
    title: 'Your order has shipped',
    body: 'Tracking is now live. Arriving soon.',
    when: 'today', cta: 'Track →',
  },
  {
    id: 'n2', kind: 'stock', state: 'unread',
    glyph: '✓', tone: 'success',
    title: 'Item back in stock',
    body: 'An item you saved to your wishlist is available.',
    when: 'yesterday', cta: 'Shop now →',
  },
  {
    id: 'n3', kind: 'sub', state: 'unread',
    glyph: '↻', tone: 'gold',
    title: 'Subscription ships in 8 days',
    body: 'Your monthly order will be charged soon.',
    when: '3 days ago', cta: 'Manage →',
  },
  {
    id: 'n4', kind: 'review', state: 'read',
    glyph: '★', tone: 'gold',
    title: 'Leave a review',
    body: 'Help the next customer with a quick review.',
    when: '1 week ago', cta: 'Write →',
  },
  {
    id: 'n5', kind: 'order', state: 'read',
    glyph: '✓', tone: 'success',
    title: 'Order delivered',
    body: 'Signed for at front door.',
    when: '2 weeks ago', cta: 'View →',
  },
] as const;

type NotifTab = 'all' | 'unread' | 'orders' | 'stock';

interface NotifDrawerProps {
  readonly onClose: () => void;
}

export function NotifDrawer({ onClose }: NotifDrawerProps) {
  const [tab, setTab] = useState<NotifTab>('all');

  const unread = SAMPLE_NOTIFS.filter((n) => n.state === 'unread').length;

  const filtered = tab === 'unread'
    ? SAMPLE_NOTIFS.filter((n) => n.state === 'unread')
    : tab === 'orders'
      ? SAMPLE_NOTIFS.filter((n) => n.kind === 'order')
      : tab === 'stock'
        ? SAMPLE_NOTIFS.filter((n) => n.kind === 'stock')
        : SAMPLE_NOTIFS;

  const toneColor = (tone: NotificationItem['tone']): string => {
    switch (tone) {
      case 'accent':  return 'var(--wl-accent)';
      case 'success': return 'var(--wl-success)';
      case 'gold':    return 'var(--wl-warning)';
      default:        return 'var(--wl-text)';
    }
  };

  const tabs: ReadonlyArray<[NotifTab, string, number]> = [
    ['all',     'All',     SAMPLE_NOTIFS.length],
    ['unread',  'Unread',  unread],
    ['orders',  'Orders',  SAMPLE_NOTIFS.filter((n) => n.kind === 'order').length],
    ['stock',   'Stock',   SAMPLE_NOTIFS.filter((n) => n.kind === 'stock').length],
  ];

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
            {unread} new
          </span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              color: 'var(--wl-text-soft)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '.04em',
              padding: '2px 4px',
            }}
          >
            Mark all read
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
          {filtered.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid var(--wl-rule-soft)',
                background: n.state === 'unread' ? 'var(--wl-accent-soft)' : 'transparent',
                position: 'relative',
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
          ))}
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
