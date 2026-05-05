import Link from "next/link";
import Image from "next/image";
import { getTenantContext, shouldShowMaintenance } from '../lib/tenant-context';
import { getTenantBranding } from '@/lib/cms/branding';
import { MaintenancePage } from '@/components/cms/storefront';
import { MobileNav } from './mobile-nav';
import { CartMergeOnLogin } from '@/components/cms/smart-blocks/commerce/CartMergeOnLogin';

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  // Run independent fetches in parallel. `getTenantContext` and
  // `getTenantBranding` don't depend on each other; the previous sequential
  // pattern paid two network round-trips when one would do. Both are wrapped
  // in React `cache()` so any other layouts/pages in the same request reuse
  // these results.
  const [tenantContext, branding] = await Promise.all([
    getTenantContext(subdomain),
    getTenantBranding(subdomain),
  ]);

  // Check maintenance mode for public storefront
  if (tenantContext && await shouldShowMaintenance(tenantContext)) {
    return (
      <MaintenancePage
        siteName={subdomain}
        message={tenantContext.maintenanceMessage}
        showBypass={true}
        bypassUrl={`?bypass=maintenance`}
      />
    );
  }

  const renderLogo = (size: 'sm' | 'md') => {
    const dimensions = size === 'sm' ? { w: 24, h: 24 } : { w: 32, h: 32 };
    if (branding.logoUrl) {
      return (
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src={branding.logoUrl}
            alt={branding.logoAlt || branding.siteName}
            width={dimensions.w}
            height={dimensions.h}
            className={`${size === 'sm' ? 'h-6' : 'h-8'} w-auto object-contain`}
            priority={size === 'md'}
          />
          <span className={`font-semibold ${size === 'sm' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
            {branding.siteName}
          </span>
        </Link>
      );
    }
    return (
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className={`${size === 'sm' ? 'h-6 w-6 text-sm' : 'h-8 w-8 text-base'} rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold`}>
          {branding.siteName.charAt(0).toUpperCase()}
        </div>
        <span className={`font-semibold ${size === 'sm' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
          {branding.siteName}
        </span>
      </Link>
    );
  };

  const navLinks = [
    { href: '/shop', label: 'Shop' },
    { href: '/posts', label: 'Blog' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          {renderLogo('md')}

          {/* Desktop navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile navigation */}
          <MobileNav links={navLinks} />
        </div>
      </header>

      {/* Merge anonymous cart into user cart on login */}
      <CartMergeOnLogin />

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="mb-4">{renderLogo('sm')}</div>
              <p className="text-sm text-muted-foreground">
                {branding.siteTagline || 'A modern content platform.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/shop"
                    className="text-muted-foreground hover:text-foreground inline-block py-1"
                  >
                    Shop
                  </Link>
                </li>
                <li>
                  <Link
                    href="/posts"
                    className="text-muted-foreground hover:text-foreground inline-block py-1"
                  >
                    All Posts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-muted-foreground hover:text-foreground inline-block py-1"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4">Subscribe</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with our latest posts.
              </p>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {branding.siteName}. All rights reserved.</p>
            {!branding.hidePoweredBy && (
              <p className="mt-1 text-xs text-muted-foreground/60">
                Powered by{' '}
                <a
                  href="https://cncpt.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  CNCPT Web
                </a>
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
