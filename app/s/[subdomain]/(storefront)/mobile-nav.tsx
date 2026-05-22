'use client';

/**
 * Atlas White-Label Mobile Navigation
 * Hamburger-triggered full-screen nav with wl-* token theming.
 * Includes tab bar (Shop / Account / Bag) at the bottom.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

interface MobileNavProps {
  readonly links: ReadonlyArray<{ href: string; label: string }>;
}

export function MobileNav({ links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile top bar */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'var(--wl-bg)',
          borderBottom: '1px solid var(--wl-rule)',
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--wl-font-display)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--wl-text)',
            textDecoration: 'none',
          }}
        >
          Home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Cart icon */}
          <Link
            href="/cart"
            style={{ color: 'var(--wl-text)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              color: 'var(--wl-text)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Slide-down nav drawer */}
      {isOpen && (
        <nav
          style={{
            position: 'fixed',
            top: 56,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--wl-bg)',
            zIndex: 50,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '14px 20px',
                fontSize: 18,
                fontFamily: 'var(--wl-font-display)',
                fontWeight: 500,
                color: isActive(link.href) ? 'var(--wl-accent)' : 'var(--wl-text)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--wl-rule-soft)',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Account links */}
          <div
            style={{
              marginTop: 16,
              padding: '0 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--wl-text)',
                color: 'var(--wl-bg)',
                borderRadius: 'var(--wl-radius-sm)',
                textDecoration: 'none',
              }}
            >
              My Account
            </Link>
            <Link
              href="/handler/sign-in"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                border: '1px solid var(--wl-rule)',
                color: 'var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                textDecoration: 'none',
                background: 'transparent',
              }}
            >
              Sign in
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
