import type { Metadata } from "next"
import { getSubdomainAuthConfigPublic } from "@/lib/subdomain-stack-auth"
import { SubdomainStackProvider } from "./components/subdomain-stack-provider"
import { getTenantBranding, generateTenantThemeCss } from "@/lib/cms/branding"

/**
 * Generate per-tenant metadata (favicon, title, OG tags).
 * Next.js calls this at request time for dynamic routes.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const { subdomain } = await params

  try {
    const branding = await getTenantBranding(subdomain)

    return {
      title: {
        default: branding.siteName,
        template: branding.titleTemplate,
      },
      description: branding.metaDescription || branding.siteTagline,
      icons: {
        icon: [
          branding.faviconUrl
            ? { url: branding.faviconUrl, sizes: '32x32', type: 'image/png' }
            : { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
          ...(branding.faviconSvgUrl
            ? [{ url: branding.faviconSvgUrl, type: 'image/svg+xml' }]
            : []),
        ],
        apple: branding.appleTouchIconUrl
          ? [{ url: branding.appleTouchIconUrl, sizes: '180x180' }]
          : undefined,
      },
      manifest: '/manifest.json',
      openGraph: {
        siteName: branding.siteName,
        description: branding.metaDescription || branding.siteTagline,
        images: branding.ogImageUrl ? [branding.ogImageUrl] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
      },
      other: {
        'theme-color': branding.themeColor || branding.primaryColor,
      },
    }
  } catch {
    // Fallback metadata if branding fails to load
    return {
      title: subdomain,
    }
  }
}

export default async function SubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  // Run auth-config and branding lookups in parallel — they are independent.
  // After the missing-table fast path is tripped, `getSubdomainAuthConfigPublic`
  // resolves synchronously to null and adds zero latency.
  const [authConfig, brandingResult] = await Promise.all([
    getSubdomainAuthConfigPublic(subdomain),
    getTenantBranding(subdomain).catch(() => null),
  ])

  // Branding may legitimately be null if the DB is unreachable; in that case
  // we silently skip the theme injection.
  const themeCss = brandingResult ? generateTenantThemeCss(brandingResult) : ''

  const content = (
    <>
      {/* Per-tenant CSS variable overrides (server-rendered, zero JS) */}
      {themeCss && (
        <style
          id={`tenant-theme-${subdomain}`}
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      )}
      {children}
    </>
  )

  // If no auth config exists, allow anonymous browsing only
  if (!authConfig) {
    return content
  }

  return (
    <SubdomainStackProvider config={authConfig}>
      {content}
    </SubdomainStackProvider>
  )
}
