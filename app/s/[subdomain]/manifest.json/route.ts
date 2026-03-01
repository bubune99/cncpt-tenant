/**
 * Dynamic PWA Manifest Route
 *
 * Generates a per-tenant manifest.json for Progressive Web App support.
 * Includes the tenant's name, colors, and icon references.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTenantBranding } from '@/lib/cms/branding'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  try {
    const branding = await getTenantBranding(subdomain)

    const icons: Array<{
      src: string
      sizes: string
      type: string
      purpose?: string
    }> = []

    // Add favicon as 32x32 icon
    if (branding.faviconUrl) {
      icons.push({
        src: branding.faviconUrl,
        sizes: '32x32',
        type: 'image/png',
      })
    }

    // Add apple touch icon as 180x180
    if (branding.appleTouchIconUrl) {
      icons.push({
        src: branding.appleTouchIconUrl,
        sizes: '180x180',
        type: 'image/png',
      })
    }

    // Add SVG as any-size icon
    if (branding.faviconSvgUrl) {
      icons.push({
        src: branding.faviconSvgUrl,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      })
    }

    // If no icons configured, use the dynamic icon routes as fallback
    if (icons.length === 0) {
      icons.push({
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      })
    }

    const manifest = {
      name: branding.siteName,
      short_name: branding.siteName.length > 12
        ? branding.siteName.substring(0, 12)
        : branding.siteName,
      description: branding.siteTagline || branding.metaDescription,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: branding.themeColor || branding.primaryColor,
      icons,
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Tenant': subdomain,
      },
    })
  } catch (error) {
    console.error(`Manifest error for ${subdomain}:`, error)
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    )
  }
}
