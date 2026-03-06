/**
 * Content Delivery API - Site Configuration
 *
 * GET /api/cms/content/config - Get tenant site configuration
 *
 * Returns public site config including branding, navigation, and enabled features.
 * This endpoint is public (no API key needed) to allow client apps to bootstrap.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withContentAuth,
  corsPreflightResponse,
  type ContentAuthContext,
} from '@/lib/cms/api/content-auth'
import { resolveFeatureConfig } from '@/lib/cms/features'

export const dynamic = 'force-dynamic'

// CORS preflight
export function OPTIONS() {
  return corsPreflightResponse()
}

// GET - Get site configuration
export const GET = withContentAuth(
  async (_request: NextRequest, { tenant }: ContentAuthContext) => {
    try {
      // Fetch site settings and tenant settings in parallel
      // Prisma tenant middleware auto-injects tenantId since we're inside runWithTenant()
      const [siteSettings, tenantSetting, features] = await Promise.all([
        prisma.siteSettings.findFirst(),
        prisma.tenantSetting.findFirst(),
        resolveFeatureConfig(tenant.tenantId),
      ])

      // Build navigation from header config
      const navigation = siteSettings?.header
        ? (siteSettings.header as Record<string, unknown>)
        : null

      // Build the public site config
      const site: Record<string, unknown> = {
        name:
          tenantSetting?.siteName ||
          tenantSetting?.siteTitle ||
          siteSettings?.siteName ||
          tenant.subdomain,
        tagline:
          tenantSetting?.siteTagline ||
          tenantSetting?.siteDescription ||
          siteSettings?.siteTagline ||
          null,
        logo: {
          url: tenantSetting?.logoUrl || siteSettings?.logoUrl || null,
          darkUrl: tenantSetting?.logoDarkUrl || null,
          alt: tenantSetting?.logoAlt || siteSettings?.logoAlt || null,
        },
        favicon: tenantSetting?.faviconUrl || siteSettings?.faviconUrl || null,
        theme: {
          primaryColor: tenantSetting?.primaryColor || tenantSetting?.themeColor || null,
          accentColor: tenantSetting?.accentColor || null,
        },
        meta: {
          title:
            siteSettings?.defaultMetaTitle || null,
          description:
            tenantSetting?.metaDescription ||
            siteSettings?.defaultMetaDescription ||
            null,
          ogImage:
            tenantSetting?.ogImageUrl ||
            siteSettings?.defaultOgImage ||
            null,
        },
        navigation,
        footer: siteSettings?.footer || null,
        socialLinks: siteSettings?.socialLinks || null,
        contact: {
          email: siteSettings?.contactEmail || null,
          phone: siteSettings?.contactPhone || null,
          address: siteSettings?.businessAddress || null,
        },
        features: getPublicFeatures(features),
      }

      const response = NextResponse.json({ site })

      // Cache config for 60 seconds
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

      return response
    } catch (error) {
      console.error('[content-api] Get config error:', error)
      return NextResponse.json(
        { error: 'Failed to get site configuration' },
        { status: 500 }
      )
    }
  }
)

/**
 * Filter features to only expose public-facing feature flags.
 * Strips internal feature keys and returns a clean map.
 */
function getPublicFeatures(
  features: Record<string, boolean>
): Record<string, boolean> {
  // Only expose top-level module flags and selected sub-features
  const publicKeys = [
    'commerce',
    'commerce.reviews',
    'commerce.wishlist',
    'commerce.giftCards',
    'blog',
    'forms',
    'events',
    'analytics',
    'media',
  ]

  const publicFeatures: Record<string, boolean> = {}
  for (const key of publicKeys) {
    if (key in features) {
      publicFeatures[key] = features[key]
    }
  }

  return publicFeatures
}
