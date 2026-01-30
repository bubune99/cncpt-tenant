import { type NextRequest, NextResponse } from "next/server"

// Define rootDomain inline for Edge runtime compatibility
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"

// Edge Config is optional - only used for custom domain mapping
// If EDGE_CONFIG env var is not set, skip Edge Config lookups
const edgeConfigEnabled = !!process.env.EDGE_CONFIG

/**
 * Look up which tenant a custom domain belongs to using Edge Config
 * Ultra-low latency: <15ms P99 (often <1ms) vs 50-200ms for DB lookup
 *
 * Edge Config data structure:
 * - Key: `domain:{hostname}` (e.g., "domain:acme.com")
 * - Value: subdomain/tenant identifier (e.g., "acme-store")
 */
async function lookupCustomDomain(hostname: string): Promise<string | null> {
  // Skip if Edge Config is not configured
  if (!edgeConfigEnabled) {
    return null
  }

  try {
    // Dynamic import to avoid errors when Edge Config is not configured
    const { get } = await import("@vercel/edge-config")

    const normalizedHost = hostname.toLowerCase().replace(/\.$/, "")

    // Try exact match first
    const tenant = await get<string>(`domain:${normalizedHost}`)
    if (tenant) return tenant

    // Try without www prefix
    if (normalizedHost.startsWith("www.")) {
      const withoutWww = normalizedHost.replace(/^www\./, "")
      const tenantWithoutWww = await get<string>(`domain:${withoutWww}`)
      if (tenantWithoutWww) return tenantWithoutWww
    }

    // Try with www prefix
    const withWww = `www.${normalizedHost}`
    const tenantWithWww = await get<string>(`domain:${withWww}`)
    if (tenantWithWww) return tenantWithWww

    return null
  } catch (error) {
    // Edge Config might not be configured - fail gracefully
    console.error("Edge Config lookup failed:", error)
    return null
  }
}

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url
  const host = request.headers.get("host") || ""
  const hostname = host.split(":")[0]

  // Local development environment
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/)
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1]
    }

    // Fallback to host header approach
    if (hostname.includes(".localhost")) {
      return hostname.split(".")[0]
    }

    return null
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(":")[0]

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    const parts = hostname.split("---")
    return parts.length > 0 ? parts[0] : null
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`)

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, "") : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get("host") || ""
  const hostname = host.split(":")[0]

  // First try to extract subdomain from the root domain
  const subdomain = extractSubdomain(request)

  // Stack Auth will handle authentication redirects through its own system

  if (subdomain) {
    // CMS admin routes on subdomains - rewrite to /cms/[subdomain]/...
    if (pathname.startsWith("/admin")) {
      const cmsPath = pathname.replace("/admin", "")
      return NextResponse.rewrite(
        new URL(`/cms/${subdomain}/admin${cmsPath}`, request.url)
      )
    }

    // For the root path on a subdomain, rewrite to the subdomain storefront
    if (pathname === "/") {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url))
    }

    // Other subdomain paths - rewrite to subdomain namespace
    if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      return NextResponse.rewrite(new URL(`/s/${subdomain}${pathname}`, request.url))
    }
  }

  // If no subdomain detected, check if this is a custom domain
  if (!subdomain) {
    const rootDomainFormatted = rootDomain.split(":")[0]

    // Skip custom domain lookup for root domain and www
    const isRootDomain =
      hostname === rootDomainFormatted ||
      hostname === `www.${rootDomainFormatted}` ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"

    if (!isRootDomain && !hostname.endsWith(".vercel.app")) {
      // This might be a custom domain - look it up
      const tenantSubdomain = await lookupCustomDomain(hostname)

      if (tenantSubdomain) {
        // Custom domain found - route to tenant's public site
        // Note: Admin routes are NOT supported on custom domains
        // Users must access admin via their subdomain

        if (pathname.startsWith("/admin")) {
          // Redirect admin requests on custom domains to subdomain admin
          const adminUrl = `https://${tenantSubdomain}.${rootDomainFormatted}/admin${pathname.replace("/admin", "")}`
          return NextResponse.redirect(new URL(adminUrl))
        }

        // Public site routes
        if (pathname === "/") {
          return NextResponse.rewrite(new URL(`/s/${tenantSubdomain}`, request.url))
        }

        if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
          return NextResponse.rewrite(new URL(`/s/${tenantSubdomain}${pathname}`, request.url))
        }
      }
    }
  }

  // On the root domain, allow normal access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api|_next|[\\w-]+\\.\\w+).*)",
  ],
}
