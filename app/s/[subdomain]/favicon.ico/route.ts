/**
 * Dynamic Favicon Route
 *
 * Serves the per-tenant favicon. If the tenant has configured a custom
 * favicon URL, this proxies the image from that URL. Otherwise, falls
 * back to the default /favicon.ico from /public.
 *
 * The proxy approach ensures:
 * 1. Correct Content-Type headers for all favicon formats
 * 2. Caching at the edge (Cache-Control headers)
 * 3. No CORS issues with R2/S3 storage
 * 4. Tenant isolation (no cross-tenant leakage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTenantBranding } from '@/lib/cms/branding'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  try {
    const branding = await getTenantBranding(subdomain)

    if (branding.faviconUrl) {
      // Proxy the tenant's custom favicon
      const response = await fetch(branding.faviconUrl)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || 'image/x-icon'

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'X-Tenant': subdomain,
          },
        })
      }
    }

    // Fallback: serve default favicon from /public
    try {
      const defaultFavicon = await readFile(join(process.cwd(), 'public', 'favicon.ico'))
      return new NextResponse(new Uint8Array(defaultFavicon), {
        status: 200,
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      })
    } catch {
      // No default favicon exists
      return new NextResponse(null, { status: 404 })
    }
  } catch (error) {
    console.error(`Favicon error for ${subdomain}:`, error)
    return new NextResponse(null, { status: 500 })
  }
}
