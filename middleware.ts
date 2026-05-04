import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/edge-config"

// Define rootDomain inline for Edge runtime compatibility
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"

/**
 * Look up which tenant a custom domain belongs to.
 *
 * Reads from Vercel Edge Config (P99 < 15ms). The custom-domain → subdomain
 * mapping is written by `verifyDomainDns` in `app/domain-actions.ts` once the
 * domain is verified. Keys are formatted as `domain:{hostname}` and values
 * are the tenant subdomain string.
 *
 * Returns null when the EDGE_CONFIG env var is missing (fail open so apex /
 * subdomain routing still works during initial setup) or when the hostname
 * has no mapping yet.
 */
async function lookupCustomDomain(hostname: string): Promise<string | null> {
  if (!process.env.EDGE_CONFIG) return null
  try {
    const normalized = hostname.toLowerCase().replace(/\.$/, "")
    const tenant = await get<string>(`domain:${normalized}`)
    if (tenant) return tenant
    if (normalized.startsWith("www.")) {
      const apex = normalized.replace(/^www\./, "")
      const tenantApex = await get<string>(`domain:${apex}`)
      if (tenantApex) return tenantApex
    }
    return null
  } catch (error) {
    console.error("[middleware] Edge Config lookup failed:", error)
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
      return sanitizeSubdomain(fullUrlMatch[1])
    }

    // Fallback to host header approach
    if (hostname.includes(".localhost")) {
      return sanitizeSubdomain(hostname.split(".")[0])
    }

    return null
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(":")[0]

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    const parts = hostname.split("---")
    return parts.length > 0 ? sanitizeSubdomain(parts[0]) : null
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`)

  if (!isSubdomain) return null

  const raw = hostname.replace(`.${rootDomainFormatted}`, "")
  return sanitizeSubdomain(raw)
}

/**
 * Sanitize extracted subdomain to only allow safe characters.
 * Returns null if the subdomain is empty or contains only invalid characters.
 */
function sanitizeSubdomain(raw: string): string | null {
  const sanitized = raw.toLowerCase().replace(/[^a-z0-9-]/g, "")
  return sanitized.length > 0 ? sanitized : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get("host") || ""
  const hostname = host.split(":")[0]

  // SECURITY: Strip any incoming x-subdomain header to prevent spoofing.
  // This header must ONLY be set by this middleware, never by the client.
  // EXCEPTION: Content delivery API routes (/api/cms/content/*) are designed
  // for external SDK/CLI access and accept client-supplied x-subdomain headers.
  // These routes authenticate via API key, so spoofing risk is mitigated.
  const requestHeaders = new Headers(request.headers)
  const isContentApiRoute = pathname.startsWith("/api/cms/content")
  if (!isContentApiRoute) {
    requestHeaders.delete("x-subdomain")
  }

  // Maintenance mode check
  if (process.env.MAINTENANCE_MODE === "true") {
    // Allow admin, API, and _next routes through
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && pathname !== '/login') {
      return new NextResponse(
        `<!DOCTYPE html>
<html><head><title>Maintenance</title><style>
body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0}
.container{text-align:center;max-width:500px;padding:2rem}
h1{font-size:2rem;margin-bottom:1rem}p{color:#94a3b8}
</style></head><body><div class="container">
<h1>We'll be right back</h1>
<p>We're performing scheduled maintenance. Please check back shortly.</p>
</div></body></html>`,
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html',
            'Retry-After': '3600',
          },
        }
      )
    }
  }

  // First try to extract subdomain from the root domain
  const subdomain = extractSubdomain(request)

  // For non-subdomain requests, skip static file paths
  // (e.g., /robots.txt, /sitemap.xml, /logo.png from /public)
  // Subdomain requests still proceed so favicon.ico/manifest.json get rewritten
  if (!subdomain && /^\/[\w-]+\.\w+$/.test(pathname)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Stack Auth will handle authentication redirects through its own system

  if (subdomain) {
    // All subdomain routes (including /admin, /handler) go to /s/[subdomain]/...
    // The route structure at app/s/[subdomain]/ handles:
    // - /admin/* -> CMS admin pages
    // - /handler/* -> Stack Auth handler
    // - /favicon.ico -> Per-tenant favicon
    // - /icon -> Per-tenant icon variants
    // - /manifest.json -> Per-tenant PWA manifest
    // - /* -> Storefront pages

    // For API routes: inject x-subdomain header so API handlers know the tenant
    // API routes are NOT rewritten (they stay at /api/...), but they receive
    // the tenant context via this header for tenant-scoped operations.
    // NOTE: Route-level validation against the Subdomain table is still needed
    // to confirm the subdomain actually exists. Middleware runs at the Edge and
    // cannot easily query Prisma, so that check happens in resolveCmsTenantContext().
    if (pathname.startsWith("/api")) {
      requestHeaders.set("x-subdomain", subdomain)
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    if (pathname === "/") {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url))
    }

    // Rewrite tenant-scoped asset routes (favicon, icons, manifest)
    const tenantAssetPaths = ['/favicon.ico', '/icon', '/manifest.json']
    if (tenantAssetPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.rewrite(new URL(`/s/${subdomain}${pathname}`, request.url))
    }

    // Rewrite all non-API paths to the subdomain namespace
    if (!pathname.startsWith("/_next")) {
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

        // For API routes on custom domains: inject x-subdomain header
        // (requestHeaders already has x-subdomain stripped from client input)
        if (pathname.startsWith("/api")) {
          requestHeaders.set("x-subdomain", tenantSubdomain)
          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
        }

        // Public site routes
        if (pathname === "/") {
          return NextResponse.rewrite(new URL(`/s/${tenantSubdomain}`, request.url))
        }

        if (!pathname.startsWith("/_next")) {
          return NextResponse.rewrite(new URL(`/s/${tenantSubdomain}${pathname}`, request.url))
        }
      }
    }
  }

  // On the root domain, allow normal access.
  // Pass cleaned headers (x-subdomain stripped) to prevent spoofing on root domain routes.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. root files inside /public EXCEPT favicon.ico, manifest.json, icon
     *    (those need rewriting for per-tenant branding on subdomains)
     *
     * Note: API routes ARE matched so we can inject x-subdomain header
     * for tenant-scoped API operations.
     */
    "/((?!_next).*)",
  ],
}
