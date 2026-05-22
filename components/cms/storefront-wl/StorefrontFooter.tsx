/**
 * Atlas White-Label Storefront Footer
 * Colophon with logo glyph, nav links, tagline, powered-by strip.
 * Uses --wl-* tokens exclusively.
 */

import Link from 'next/link';

interface StorefrontFooterProps {
  readonly siteName: string;
  readonly siteGlyph: string;
  readonly siteTagline?: string | null;
  readonly logoUrl?: string | null;
  readonly hidePoweredBy?: boolean;
}

const FOOTER_LINKS = [
  { label: 'Shop',       href: '/shop' },
  { label: 'Journal',    href: '/posts' },
  { label: 'Categories', href: '/categories' },
] as const;

const LEGAL_LINKS = [
  { label: 'Privacy',  href: '/legal/privacy' },
  { label: 'Terms',    href: '/legal/terms' },
  { label: 'Refunds',  href: '/legal/refund' },
  { label: 'Shipping', href: '/legal/shipping' },
] as const;

export function StorefrontFooter({
  siteName,
  siteGlyph,
  siteTagline,
  logoUrl,
  hidePoweredBy = false,
}: StorefrontFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--wl-rule)',
        background: 'var(--wl-surface-2)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'var(--wl-pad) 32px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: 'var(--wl-gap)',
        }}
      >
        {/* Brand */}
        <div>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'var(--wl-font-display)',
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--wl-text)',
              textDecoration: 'none',
              marginBottom: 10,
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} style={{ height: 26, width: 'auto' }} />
            ) : (
              <span
                style={{
                  width: 24,
                  height: 24,
                  background: 'var(--wl-accent)',
                  color: 'var(--wl-accent-fg)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--wl-font-display)',
                  fontWeight: 600,
                  fontSize: 12,
                  borderRadius: 'var(--wl-radius-sm)',
                  flexShrink: 0,
                }}
              >
                {siteGlyph}
              </span>
            )}
            {siteName}
          </Link>
          {siteTagline && (
            <p
              style={{
                fontFamily: 'var(--wl-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--wl-text-soft)',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {siteTagline}
            </p>
          )}
        </div>

        {/* Links */}
        <div>
          <div
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-faint)',
              marginBottom: 12,
            }}
          >
            Explore
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontSize: 13,
                    color: 'var(--wl-text-soft)',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <div
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-faint)',
              marginBottom: 12,
            }}
          >
            Legal
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontSize: 13,
                    color: 'var(--wl-text-soft)',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: '1px solid var(--wl-rule-soft)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--wl-font-mono)',
            fontSize: 11,
            color: 'var(--wl-text-faint)',
            letterSpacing: '.04em',
          }}
        >
          © {year} {siteName}
        </span>

        {!hidePoweredBy && (
          <a
            href="https://cncpt.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10,
              color: 'var(--wl-text-faint)',
              textDecoration: 'none',
              letterSpacing: '.08em',
            }}
          >
            Powered by CNCPT
          </a>
        )}
      </div>
    </footer>
  );
}
