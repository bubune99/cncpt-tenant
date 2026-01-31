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
 */

import { getSiteSettings, type SiteSettingsData } from '@/lib/cms/site-settings';
import {
  Header,
  Footer,
  AnnouncementBar,
  type HeaderProps,
  type FooterProps,
  type AnnouncementBarProps,
} from '@/puck/layout/components';

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
  // Fetch global site settings
  const siteSettings = await getSiteSettings();

  // Determine what to render
  const {
    showHeader,
    headerProps,
    showFooter,
    footerProps,
    showAnnouncement,
    announcementProps,
  } = resolveLayoutComponents(pageSettings, siteSettings);

  return (
    <div className={`page-wrapper min-h-screen flex flex-col ${className}`}>
      {/* Announcement Bar */}
      {showAnnouncement && announcementProps && (
        <AnnouncementBar {...announcementProps} />
      )}

      {/* Header */}
      {showHeader && headerProps && <Header {...headerProps} />}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      {showFooter && footerProps && <Footer {...footerProps} />}
    </div>
  );
}

/**
 * Resolve which layout components to render based on page and site settings
 */
function resolveLayoutComponents(
  pageSettings?: PageLayoutSettings,
  siteSettings?: SiteSettingsData | null
): {
  showHeader: boolean;
  headerProps: HeaderProps | null;
  showFooter: boolean;
  footerProps: FooterProps | null;
  showAnnouncement: boolean;
  announcementProps: AnnouncementBarProps | null;
} {
  // Default values
  const headerMode = pageSettings?.headerMode ?? 'GLOBAL';
  const footerMode = pageSettings?.footerMode ?? 'GLOBAL';
  const pageShowAnnouncement = pageSettings?.showAnnouncement ?? true;

  // Resolve header
  let showHeader = false;
  let headerProps: HeaderProps | null = null;

  if (headerMode === 'GLOBAL' && siteSettings?.header) {
    showHeader = true;
    headerProps = siteSettings.header as unknown as HeaderProps;
  } else if (headerMode === 'CUSTOM' && pageSettings?.customHeader) {
    showHeader = true;
    headerProps = pageSettings.customHeader as unknown as HeaderProps;
  }
  // NONE mode: showHeader stays false

  // Resolve footer
  let showFooter = false;
  let footerProps: FooterProps | null = null;

  if (footerMode === 'GLOBAL' && siteSettings?.footer) {
    showFooter = true;
    footerProps = siteSettings.footer as unknown as FooterProps;
  } else if (footerMode === 'CUSTOM' && pageSettings?.customFooter) {
    showFooter = true;
    footerProps = pageSettings.customFooter as unknown as FooterProps;
  }
  // NONE mode: showFooter stays false

  // Resolve announcement bar
  let showAnnouncement = false;
  let announcementProps: AnnouncementBarProps | null = null;

  // Page can override global announcement visibility
  if (pageShowAnnouncement) {
    if (pageSettings?.customAnnouncement) {
      // Page has custom announcement
      showAnnouncement = true;
      announcementProps = pageSettings.customAnnouncement as unknown as AnnouncementBarProps;
    } else if (siteSettings?.showAnnouncementBar && siteSettings?.announcementBar) {
      // Use global announcement
      showAnnouncement = true;
      announcementProps = siteSettings.announcementBar as unknown as AnnouncementBarProps;
    }
  }

  return {
    showHeader,
    headerProps,
    showFooter,
    footerProps,
    showAnnouncement,
    announcementProps,
  };
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
