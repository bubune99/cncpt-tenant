/**
 * Atlas White-Label Storefront Footer
 * Colophon with logo glyph, link columns, social links, tagline, powered-by strip.
 * Link columns / social / copyright are CMS-configurable (SiteSettings.footer);
 * when not configured the component falls back to its built-in defaults so the
 * storefront looks unchanged until an owner customizes it. Uses --wl-* tokens.
 */

import Link from 'next/link';

interface FooterLink {
  readonly label: string;
  readonly href: string;
  readonly openInNewTab?: boolean;
}

interface FooterColumn {
  readonly title: string;
  readonly links: ReadonlyArray<FooterLink>;
}

interface StorefrontFooterProps {
  readonly siteName: string;
  readonly siteGlyph: string;
  readonly siteTagline?: string | null;
  readonly logoUrl?: string | null;
  readonly hidePoweredBy?: boolean;
  /** CMS-configured link columns (falls back to Explore + Legal defaults). */
  readonly columns?: ReadonlyArray<FooterColumn>;
  readonly socialLinks?: ReadonlyArray<{ platform: string; url: string }>;
  readonly copyrightText?: string;
}

const DEFAULT_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    title: 'Explore',
    links: [
      { label: 'Shop', href: '/shop' },
      { label: 'Journal', href: '/posts' },
      { label: 'Categories', href: '/categories' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Refunds', href: '/legal/refund' },
      { label: 'Shipping', href: '/legal/shipping' },
    ],
  },
];

// Minimal single-path glyphs keyed by platform; unknown platforms get a globe.
const SOCIAL_PATHS: Record<string, string> = {
  twitter: 'M18 4l-5.5 7L18 20h-3l-4-5-4 5H4l6-7.5L4 4h3l3.5 4.5L14 4z',
  x: 'M18 4l-5.5 7L18 20h-3l-4-5-4 5H4l6-7.5L4 4h3l3.5 4.5L14 4z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  facebook: 'M14 9h3V6h-3a3 3 0 0 0-3 3v2H8v3h3v7h3v-7h2.5l.5-3H14V9z',
  linkedin: 'M4 9h3v11H4zM5.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM10 9h3v1.5a3.3 3.3 0 0 1 3-1.5c2.2 0 4 1.5 4 4.5V20h-3v-6c0-1.4-.7-2-1.8-2S13 12.6 13 14v6h-3z',
  youtube: 'M22 12s0-3-.4-4.3a2.4 2.4 0 0 0-1.7-1.7C18.6 5.6 12 5.6 12 5.6s-6.6 0-7.9.4A2.4 2.4 0 0 0 2.4 7.7C2 9 2 12 2 12s0 3 .4 4.3a2.4 2.4 0 0 0 1.7 1.7c1.3.4 7.9.4 7.9.4s6.6 0 7.9-.4a2.4 2.4 0 0 0 1.7-1.7C22 15 22 12 22 12zM10 15V9l5 3z',
  tiktok: 'M16 4c.5 2 2 3.5 4 3.8V11a6.4 6.4 0 0 1-4-1.4V15a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V4z',
  github: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5a4 4 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6a4 4 0 0 1 1 2.7c0 3.9-2.4 4.8-4.6 5 .3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z',
};

export function StorefrontFooter({
  siteName,
  siteGlyph,
  siteTagline,
  logoUrl,
  hidePoweredBy = false,
  columns,
  socialLinks,
  copyrightText,
}: StorefrontFooterProps) {
  const year = new Date().getFullYear();
  const cols = columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;
  // Brand column (1.4fr) + one equal column per content column.
  const gridTemplateColumns = `1.4fr ${cols.map(() => '1fr').join(' ')}`;

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
          gridTemplateColumns,
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

          {socialLinks && socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              {socialLinks.map((s) => (
                <a
                  key={s.platform + s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  style={{
                    width: 30,
                    height: 30,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: '1px solid var(--wl-rule)',
                    color: 'var(--wl-text-soft)',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d={SOCIAL_PATHS[s.platform.toLowerCase()] ?? 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.7 0 3.3 2.6 3.8 6H8.2C8.7 6.6 10.3 4 12 4zm-5.7 6h3.5a16 16 0 0 0 0 4H6.3a8 8 0 0 1 0-4zm1 6h2.9c.5 2.3 1.5 3.7 1.8 4a8 8 0 0 1-4.7-4zm6.4 4c.3-.3 1.3-1.7 1.8-4h2.9a8 8 0 0 1-4.7 4zm3.5-6h-3.5a16 16 0 0 0 0-4h3.5a8 8 0 0 1 0 4z'} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Link columns */}
        {cols.map((col) => (
          <div key={col.title}>
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
              {col.title}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
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
        ))}
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
          {copyrightText || `© ${year} ${siteName}`}
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
