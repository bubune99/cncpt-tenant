/**
 * Site Settings Service
 *
 * Provides functions to fetch and manage global site settings
 * including header, footer, and announcement bar configurations.
 */

import { prisma } from '../db';
import { cache } from 'react';

const DEFAULT_SITE_SETTINGS_ID = 'default';

export interface SiteSettingsData {
  id: string;
  header: Record<string, unknown> | null;
  footer: Record<string, unknown> | null;
  announcementBar: Record<string, unknown> | null;
  showAnnouncementBar: boolean;
  siteName: string | null;
  siteTagline: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
  faviconUrl: string | null;
  socialLinks: Record<string, unknown>[] | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImage: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  businessAddress: Record<string, unknown> | null;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
}

/**
 * Get site settings (cached per request)
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData | null> => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: DEFAULT_SITE_SETTINGS_ID },
    });

    if (!settings) {
      return null;
    }

    return {
      id: settings.id,
      header: settings.header as Record<string, unknown> | null,
      footer: settings.footer as Record<string, unknown> | null,
      announcementBar: settings.announcementBar as Record<string, unknown> | null,
      showAnnouncementBar: settings.showAnnouncementBar,
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      logoUrl: settings.logoUrl,
      logoAlt: settings.logoAlt,
      faviconUrl: settings.faviconUrl,
      socialLinks: settings.socialLinks as Record<string, unknown>[] | null,
      defaultMetaTitle: settings.defaultMetaTitle,
      defaultMetaDescription: settings.defaultMetaDescription,
      defaultOgImage: settings.defaultOgImage,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      businessAddress: settings.businessAddress as Record<string, unknown> | null,
      googleAnalyticsId: settings.googleAnalyticsId,
      facebookPixelId: settings.facebookPixelId,
    };
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
});

/**
 * Get or create default site settings
 */
export async function getOrCreateSiteSettings(): Promise<SiteSettingsData> {
  let settings = await getSiteSettings();

  if (!settings) {
    // Create default settings
    const created = await prisma.siteSettings.create({
      data: {
        id: DEFAULT_SITE_SETTINGS_ID,
        showAnnouncementBar: false,
      },
    });

    settings = {
      id: created.id,
      header: null,
      footer: null,
      announcementBar: null,
      showAnnouncementBar: created.showAnnouncementBar,
      siteName: null,
      siteTagline: null,
      logoUrl: null,
      logoAlt: null,
      faviconUrl: null,
      socialLinks: null,
      defaultMetaTitle: null,
      defaultMetaDescription: null,
      defaultOgImage: null,
      contactEmail: null,
      contactPhone: null,
      businessAddress: null,
      googleAnalyticsId: null,
      facebookPixelId: null,
    };
  }

  return settings;
}

/**
 * Update site settings
 */
export async function updateSiteSettings(
  data: Partial<Omit<SiteSettingsData, 'id'>>
): Promise<SiteSettingsData> {
  // Convert data to Prisma-compatible format
  const prismaData = {
    ...(data.header !== undefined && { header: data.header as object }),
    ...(data.footer !== undefined && { footer: data.footer as object }),
    ...(data.announcementBar !== undefined && { announcementBar: data.announcementBar as object }),
    ...(data.showAnnouncementBar !== undefined && { showAnnouncementBar: data.showAnnouncementBar }),
    ...(data.siteName !== undefined && { siteName: data.siteName }),
    ...(data.siteTagline !== undefined && { siteTagline: data.siteTagline }),
    ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
    ...(data.logoAlt !== undefined && { logoAlt: data.logoAlt }),
    ...(data.faviconUrl !== undefined && { faviconUrl: data.faviconUrl }),
    ...(data.socialLinks !== undefined && { socialLinks: data.socialLinks as object }),
    ...(data.defaultMetaTitle !== undefined && { defaultMetaTitle: data.defaultMetaTitle }),
    ...(data.defaultMetaDescription !== undefined && { defaultMetaDescription: data.defaultMetaDescription }),
    ...(data.defaultOgImage !== undefined && { defaultOgImage: data.defaultOgImage }),
    ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
    ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
    ...(data.businessAddress !== undefined && { businessAddress: data.businessAddress as object }),
    ...(data.googleAnalyticsId !== undefined && { googleAnalyticsId: data.googleAnalyticsId }),
    ...(data.facebookPixelId !== undefined && { facebookPixelId: data.facebookPixelId }),
  };

  const updated = await prisma.siteSettings.upsert({
    where: { id: DEFAULT_SITE_SETTINGS_ID },
    create: {
      id: DEFAULT_SITE_SETTINGS_ID,
      ...prismaData,
    },
    update: prismaData,
  });

  return {
    id: updated.id,
    header: updated.header as Record<string, unknown> | null,
    footer: updated.footer as Record<string, unknown> | null,
    announcementBar: updated.announcementBar as Record<string, unknown> | null,
    showAnnouncementBar: updated.showAnnouncementBar,
    siteName: updated.siteName,
    siteTagline: updated.siteTagline,
    logoUrl: updated.logoUrl,
    logoAlt: updated.logoAlt,
    faviconUrl: updated.faviconUrl,
    socialLinks: updated.socialLinks as Record<string, unknown>[] | null,
    defaultMetaTitle: updated.defaultMetaTitle,
    defaultMetaDescription: updated.defaultMetaDescription,
    defaultOgImage: updated.defaultOgImage,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    businessAddress: updated.businessAddress as Record<string, unknown> | null,
    googleAnalyticsId: updated.googleAnalyticsId,
    facebookPixelId: updated.facebookPixelId,
  };
}

/**
 * Update header configuration
 */
export async function updateHeaderConfig(
  headerData: Record<string, unknown>
): Promise<SiteSettingsData> {
  return updateSiteSettings({ header: headerData });
}

/**
 * Update footer configuration
 */
export async function updateFooterConfig(
  footerData: Record<string, unknown>
): Promise<SiteSettingsData> {
  return updateSiteSettings({ footer: footerData });
}

/**
 * Update announcement bar configuration
 */
export async function updateAnnouncementBarConfig(
  announcementData: Record<string, unknown>,
  showAnnouncementBar: boolean
): Promise<SiteSettingsData> {
  return updateSiteSettings({
    announcementBar: announcementData,
    showAnnouncementBar,
  });
}
