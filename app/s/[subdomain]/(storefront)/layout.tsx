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
import { AnnouncementBar } from '@/components/cms/storefront-wl/AnnouncementBar';
import { CartMergeOnLogin } from '@/components/cms/smart-blocks/commerce/CartMergeOnLogin';
import { getSiteSettings } from '@/lib/cms/site-settings';
import { resolveHeader, resolveFooter, resolveAnnouncement } from '@/lib/cms/site-settings/chrome';
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

  // CMS-configurable header/footer/announcement (per tenant). Unset fields fall
  // back to the components' built-in defaults, so an unconfigured store is
  // visually unchanged.
  const siteSettings = tenantContext ? await getSiteSettings(tenantContext.id) : null;
  const header = resolveHeader(siteSettings);
  const footer = resolveFooter(siteSettings);
  const announcement = resolveAnnouncement(siteSettings);

  // Mobile nav reuses the configured header nav links (default set otherwise).
  const navLinks = header.navLinks ?? [
    { href: '/shop',       label: 'Shop' },
    { href: '/posts',      label: 'Journal' },
    { href: '/categories', label: 'Categories' },
  ];

  const headerLogoUrl = header.logoUrl ?? branding.logoUrl;
  const footerLogoUrl = footer.logoUrl ?? branding.logoUrl;

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
      {/* Announcement bar (CMS-configurable; only when enabled + has a message) */}
      {announcement && (
        <AnnouncementBar
          message={announcement.message}
          href={announcement.href}
          dismissible={announcement.dismissible}
          backgroundColor={announcement.backgroundColor}
          textColor={announcement.textColor}
        />
      )}

      {/* Desktop storefront chrome (hidden on mobile — MobileNav handles it) */}
      <div className="hidden sm:block">
        <StorefrontChrome
          siteName={branding.siteName}
          siteGlyph={siteGlyph}
          logoUrl={headerLogoUrl}
          unreadNotifCount={0}
          cartItemCount={0}
          isLoggedIn={false}
          userInitial=""
          userName=""
          navLinks={header.navLinks}
          showSearch={header.showSearch}
          showCart={header.showCart}
          showAccount={header.showAccount}
        />
      </div>

      {/* Mobile navigation */}
      <div className="sm:hidden">
        <MobileNav links={navLinks} siteName={branding.siteName} />
      </div>

      {/* Cart merge */}
      <CartMergeOnLogin />

      {/* Main content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <StorefrontFooter
        siteName={branding.siteName}
        siteGlyph={siteGlyph}
        logoUrl={footerLogoUrl}
        siteTagline={footer.tagline ?? branding.siteTagline}
        hidePoweredBy={branding.hidePoweredBy}
        columns={footer.columns}
        socialLinks={footer.socialLinks}
        copyrightText={footer.copyrightText}
      />
    </div>
  );
}
