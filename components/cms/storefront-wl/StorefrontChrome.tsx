'use client';

/**
 * Atlas White-Label Storefront Chrome
 * Top navigation bar: logo glyph + site name, nav links, search pill,
 * bell (with notifications drawer), bag, account avatar.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotifDrawer } from '@/components/cms/account/NotifDrawer';

interface StorefrontChromeProps {
  readonly siteName: string;
  readonly siteGlyph: string;
  readonly logoUrl?: string | null;
  readonly unreadNotifCount?: number;
  readonly cartItemCount?: number;
  readonly userInitial?: string;
  readonly userName?: string;
  readonly isLoggedIn?: boolean;
}

const NAV_LINKS = [
  { href: '/shop',       label: 'Shop' },
  { href: '/posts',      label: 'Journal' },
  { href: '/categories', label: 'About' },
  { href: '/account',    label: 'Account' },
] as const;

export function StorefrontChrome({
  siteName,
  siteGlyph,
  logoUrl,
  unreadNotifCount = 0,
  cartItemCount = 0,
  userInitial = '',
  userName = '',
  isLoggedIn = false,
}: StorefrontChromeProps) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div style={{ position: 'relative' }}>
      <header
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 28,
          background: 'var(--wl-bg)',
          borderBottom: '1px solid var(--wl-rule)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--wl-font-display)',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--wl-text)',
            textDecoration: 'none',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={siteName}
              style={{ height: 28, width: 'auto', objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                width: 28,
                height: 28,
                background: 'var(--wl-accent)',
                color: 'var(--wl-accent-fg)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 'var(--wl-radius-sm)',
              }}
            >
              {siteGlyph}
            </span>
          )}
          <span>{siteName}</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: isActive(link.href) ? 'var(--wl-accent)' : 'var(--wl-text)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                padding: isActive(link.href) ? '6px 0 4px' : '6px 0',
                borderBottom: isActive(link.href)
                  ? '2px solid var(--wl-accent)'
                  : '2px solid transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Search pill */}
          <div
            style={{
              width: 220,
              height: 32,
              border: '1px solid var(--wl-rule)',
              borderRadius: 999,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--wl-text-faint)',
              background: 'var(--wl-surface)',
              cursor: 'text',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Search</span>
          </div>

          {/* Bell */}
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            style={{
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: notifOpen ? 'var(--wl-accent)' : 'var(--wl-text)',
              background: notifOpen ? 'var(--wl-surface-2)' : 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadNotifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 0,
                  background: 'var(--wl-accent)',
                  color: 'var(--wl-accent-fg)',
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 9,
                  lineHeight: 1,
                  padding: '2px 4px',
                  borderRadius: 999,
                  minWidth: 14,
                  textAlign: 'center',
                }}
              >
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Bag */}
          <Link
            href="/cart"
            aria-label="Shopping bag"
            style={{
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--wl-text)',
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
            {cartItemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 0,
                  background: 'var(--wl-accent)',
                  color: 'var(--wl-accent-fg)',
                  fontFamily: 'var(--wl-font-mono)',
                  fontSize: 9,
                  lineHeight: 1,
                  padding: '2px 4px',
                  borderRadius: 999,
                  minWidth: 14,
                  textAlign: 'center',
                }}
              >
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {isLoggedIn ? (
            <Link
              href="/account"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 4px',
                border: '1px solid var(--wl-rule)',
                borderRadius: 999,
                fontSize: 13,
                textDecoration: 'none',
                color: 'var(--wl-text)',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--wl-accent)',
                  color: 'var(--wl-accent-fg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--wl-font-display)',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {userInitial}
              </span>
              <span style={{ fontWeight: 500 }}>{userName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/handler/sign-in"
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 13,
                padding: '5px 10px',
                background: 'var(--wl-text)',
                color: 'var(--wl-bg)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Notifications flyout */}
      {notifOpen && (
        <NotifDrawer onClose={() => setNotifOpen(false)} />
      )}
    </div>
  );
}
