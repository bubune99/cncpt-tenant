/**
 * Dynamic Icon Route
 *
 * Serves per-tenant icons in various formats:
 *   ?type=svg          -> SVG favicon (modern browsers)
 *   ?type=apple-touch  -> Apple Touch Icon (180x180 PNG)
 *   ?type=png          -> PNG favicon (32x32, default)
 *
 * Falls back to proxying the tenant's faviconUrl if no specific icon
 * type is configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTenantBranding } from '@/lib/cms/branding'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'png'

  try {
    const branding = await getTenantBranding(subdomain)

    let iconUrl: string | undefined
    let contentType: string

    switch (type) {
      case 'svg':
        iconUrl = branding.faviconSvgUrl
        contentType = 'image/svg+xml'
        break
      case 'apple-touch':
        iconUrl = branding.appleTouchIconUrl
        contentType = 'image/png'
        break
      case 'png':
      default:
        iconUrl = branding.faviconUrl
        contentType = 'image/png'
        break
    }

    if (!iconUrl) {
      // Try fallback to main favicon
      iconUrl = branding.faviconUrl
      if (!iconUrl) {
        return new NextResponse(null, { status: 404 })
      }
    }

    // Proxy the icon
    const response = await fetch(iconUrl)
    if (!response.ok) {
      return new NextResponse(null, { status: 404 })
    }

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Tenant': subdomain,
      },
    })
  } catch (error) {
    console.error(`Icon error for ${subdomain} (type=${type}):`, error)
    return new NextResponse(null, { status: 500 })
  }
}
