import type { Metadata } from "next";
import { getBrandingSettings } from './settings';

/**
 * Generate dynamic metadata from branding settings
 */
export async function generateSiteMetadata(): Promise<Metadata> {
  const branding = await getBrandingSettings();

  const metadata: Metadata = {
    title: {
      default: branding.siteName,
      template: `%s | ${branding.siteName}`,
    },
    description: branding.siteTagline,
    icons: {
      icon: branding.faviconUrl || "/favicon.ico",
      apple: branding.appleTouchIconUrl,
    },
    openGraph: {
      siteName: branding.siteName,
      images: branding.ogImageUrl ? [branding.ogImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
    },
  };

  return metadata;
}

/**
 * Get branding for client-side use (cached)
 */
export async function getBrandingForClient() {
  const branding = await getBrandingSettings();

  return {
    siteName: branding.siteName,
    siteTagline: branding.siteTagline,
    logoUrl: branding.logoUrl,
    logoDarkUrl: branding.logoDarkUrl,
    logoAlt: branding.logoAlt,
    faviconUrl: branding.faviconUrl,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
  };
}
