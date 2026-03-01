import Link from "next/link";
import Image from "next/image";
import { getTenantContext, shouldShowMaintenance } from '../lib/tenant-context';
import { getTenantBranding } from '@/lib/cms/branding';
import { MaintenancePage } from '@/components/cms/storefront';

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenantContext = await getTenantContext(subdomain);

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

  // Load tenant branding (server-side, no client fetch needed)
  const branding = await getTenantBranding(subdomain);

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
          <span className={`font-semibold ${size === 'sm' ? 'text-lg' : 'text-xl'}`}>
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
        <span className={`font-semibold ${size === 'sm' ? 'text-lg' : 'text-xl'}`}>
          {branding.siteName}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {renderLogo('md')}
          <nav className="flex items-center gap-6">
            <Link
              href="/posts"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/categories"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Categories
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">{renderLogo('sm')}</div>
              <p className="text-sm text-muted-foreground">
                {branding.siteTagline || 'A modern content platform.'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/posts"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    All Posts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Subscribe</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with our latest posts.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
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
                  CNCPT
                </a>
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
