/**
 * Atlas White-Label Storefront Layout
 * Top chrome (logo glyph, search, bell, bag, account) + footer colophon.
 * All colours from --wl-* tokens; brand/density set by the subdomain layout.
 */

import { getTenantContext, shouldShowMaintenance } from '../lib/tenant-context';
import { getTenantBranding } from '@/lib/cms/branding';
import { MaintenancePage } from '@/components/cms/storefront';
import { StorefrontChrome } from '@/components/cms/storefront-wl/StorefrontChrome';
import { StorefrontFooter } from '@/components/cms/storefront-wl/StorefrontFooter';
import { CartMergeOnLogin } from '@/components/cms/smart-blocks/commerce/CartMergeOnLogin';
import { MobileNav } from './mobile-nav';

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const [tenantContext, branding] = await Promise.all([
    getTenantContext(subdomain),
    getTenantBranding(subdomain),
  ]);

  if (tenantContext && await shouldShowMaintenance(tenantContext)) {
    return (
      <MaintenancePage
        siteName={subdomain}
        message={tenantContext.maintenanceMessage}
        showBypass={true}
        bypassUrl="?bypass=maintenance"
      />
    );
  }

  const siteGlyph = branding.siteName.charAt(0).toUpperCase();

  const navLinks = [
    { href: '/shop',       label: 'Shop' },
    { href: '/posts',      label: 'Journal' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--wl-bg)',
        color: 'var(--wl-text)',
        fontFamily: 'var(--wl-font-body)',
      }}
    >
      {/* Desktop storefront chrome (hidden on mobile — MobileNav handles it) */}
      <div className="hidden sm:block">
        <StorefrontChrome
          siteName={branding.siteName}
          siteGlyph={siteGlyph}
          logoUrl={branding.logoUrl}
          unreadNotifCount={0}
          cartItemCount={0}
          isLoggedIn={false}
          userInitial=""
          userName=""
        />
      </div>

      {/* Mobile navigation */}
      <div className="sm:hidden">
        <MobileNav links={navLinks} />
      </div>

      {/* Cart merge */}
      <CartMergeOnLogin />

      {/* Main content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <StorefrontFooter
        siteName={branding.siteName}
        siteGlyph={siteGlyph}
        logoUrl={branding.logoUrl}
        siteTagline={branding.siteTagline}
        hidePoweredBy={branding.hidePoweredBy}
      />
    </div>
  );
}
