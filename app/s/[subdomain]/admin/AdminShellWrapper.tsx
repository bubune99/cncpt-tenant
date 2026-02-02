'use client';

import { useParams } from 'next/navigation';
import { AdminShell } from './AdminShell';
import { isDemoSubdomain, DEMO_CONFIG } from '@/lib/demo';

/**
 * AdminShellWrapper
 *
 * Wraps the admin shell with subdomain-specific configuration.
 * All features are enabled by default - no feature toggling.
 */
export function AdminShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const subdomain = params?.subdomain as string;

  // Check if this is demo mode
  const isDemo = isDemoSubdomain(subdomain);

  // Build config - all features enabled, no hidden items
  const config = {
    basePath: `/s/${subdomain}`,
    siteUrl: `/${subdomain}`,
    siteName: isDemo ? DEMO_CONFIG.siteName : subdomain,
    hiddenItems: [], // All features visible
    showChat: true,  // AI chat always enabled
    isDemo,
  };

  return (
    <AdminShell config={config}>
      {children}
    </AdminShell>
  );
}
