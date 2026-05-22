'use client';

/**
 * Atlas Customer Account Sidebar
 * Left rail navigation with section groups and user footer.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AccountSection, NavGroup } from './types';

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Account',
    items: [
      { key: 'overview',   label: 'Overview',       count: null },
      { key: 'orders',     label: 'Orders',         count: null },
      { key: 'inbox',      label: 'Inbox',          count: null },
      { key: 'subs',       label: 'Subscriptions',  count: null },
      { key: 'wishlist',   label: 'Wishlist',       count: null },
      { key: 'returns',    label: 'Returns',        count: null },
      { key: 'reviews',    label: 'My reviews',     count: null },
    ],
  },
  {
    label: 'Settings',
    items: [
      { key: 'addresses',     label: 'Addresses',          count: null },
      { key: 'payment',       label: 'Payment',            count: null },
      { key: 'loyalty',       label: 'Loyalty & credit',   count: null },
      { key: 'comms',         label: 'Email & SMS',        count: null },
      { key: 'notifications', label: 'Notifications',      count: null },
      { key: 'profile',       label: 'Profile · password', count: null },
    ],
  },
] as const;

const SECTION_ROUTES: Record<AccountSection, string> = {
  overview:      '/account',
  orders:        '/account/orders',
  inbox:         '/account/inbox',
  subs:          '/account/subscriptions',
  wishlist:      '/account/wishlist',
  returns:       '/account/returns',
  reviews:       '/account/reviews',
  addresses:     '/account/addresses',
  payment:       '/account/payment',
  loyalty:       '/account/loyalty',
  comms:         '/account/communications',
  notifications: '/account/notifications',
  profile:       '/account/profile',
};

interface AccountSidebarProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly userInitial: string;
}

export function AccountSidebar({ userName, userEmail, userInitial }: AccountSidebarProps) {
  const pathname = usePathname();

  const isActive = (section: AccountSection): boolean => {
    const route = SECTION_ROUTES[section];
    if (section === 'overview') {
      return pathname.endsWith('/account') || pathname.endsWith('/account/');
    }
    return pathname.includes(route.split('/account/')[1] ?? '');
  };

  return (
    <aside
      style={{
        width: 224,
        borderRight: '1px solid var(--wl-rule)',
        background: 'var(--wl-bg)',
        padding: '22px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div
            style={{
              padding: '0 22px 8px',
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-faint)',
            }}
          >
            {group.label}
          </div>

          {group.items.map((item) => {
            const active = isActive(item.key);
            return (
              <Link
                key={item.key}
                href={SECTION_ROUTES[item.key]}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 22px',
                  color: active ? 'var(--wl-accent)' : 'var(--wl-text)',
                  textDecoration: 'none',
                  fontSize: 13.5,
                  borderLeft: active ? '2px solid var(--wl-accent)' : '2px solid transparent',
                  background: active ? 'var(--wl-surface-2)' : 'transparent',
                  fontWeight: active ? 500 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count && (
                  <span
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 10,
                      color: active ? 'var(--wl-accent)' : 'var(--wl-text-faint)',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}

          <div style={{ height: 18 }} />
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          padding: '14px 22px',
          borderTop: '1px solid var(--wl-rule-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--wl-accent)',
            color: 'var(--wl-accent-fg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--wl-font-display)',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {userInitial}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, lineHeight: 1.15, fontWeight: 500 }}>{userName}</div>
          <div
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              color: 'var(--wl-text-faint)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {userEmail}
          </div>
        </div>
      </div>
    </aside>
  );
}
