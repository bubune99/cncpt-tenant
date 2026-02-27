/**
 * Page Wrapper Component
 *
 * Wraps page content with the appropriate header and footer based on:
 * - Page-specific settings (headerMode, footerMode)
 * - Global site settings (default header/footer)
 *
 * Supports three modes:
 * - GLOBAL: Use the site-wide header/footer from SiteSettings
 * - CUSTOM: Use page-specific custom header/footer
 * - NONE: Don't render header/footer
 *
 * Header/Footer rendering will be implemented with the custom block editor.
 */

import { getSiteSettings, type SiteSettingsData } from '@/lib/cms/site-settings';

// Re-export defaults from client-safe module
export { defaultHeaderProps, defaultFooterProps } from './defaults';

// Re-export the PageLayoutMode type for convenience
export type PageLayoutMode = 'GLOBAL' | 'CUSTOM' | 'NONE';

export interface PageLayoutSettings {
  headerMode: PageLayoutMode;
  footerMode: PageLayoutMode;
  customHeader?: Record<string, unknown> | null;
  customFooter?: Record<string, unknown> | null;
  showAnnouncement?: boolean;
  customAnnouncement?: Record<string, unknown> | null;
}

export interface PageWrapperProps {
  children: React.ReactNode;
  pageSettings?: PageLayoutSettings;
  className?: string;
}

/**
 * Server Component that wraps content with header/footer
 */
export async function PageWrapper({
  children,
  pageSettings,
  className = '',
}: PageWrapperProps) {
  return (
    <div className={`page-wrapper min-h-screen flex flex-col ${className}`}>
      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

/**
 * Get page layout settings from a Page model
 */
export function getPageLayoutSettings(page: {
  headerMode?: string;
  footerMode?: string;
  customHeader?: unknown;
  customFooter?: unknown;
  showAnnouncement?: boolean;
  customAnnouncement?: unknown;
}): PageLayoutSettings {
  return {
    headerMode: (page.headerMode as PageLayoutMode) ?? 'GLOBAL',
    footerMode: (page.footerMode as PageLayoutMode) ?? 'GLOBAL',
    customHeader: page.customHeader as Record<string, unknown> | null,
    customFooter: page.customFooter as Record<string, unknown> | null,
    showAnnouncement: page.showAnnouncement ?? true,
    customAnnouncement: page.customAnnouncement as Record<string, unknown> | null,
  };
}

export default PageWrapper;
