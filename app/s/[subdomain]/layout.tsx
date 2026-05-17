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
  const authConfig = await getSubdomainAuthConfigPublic(subdomain)

  // Load branding for theme CSS injection
  let themeCss = ''
  try {
    const branding = await getTenantBranding(subdomain)
    themeCss = generateTenantThemeCss(branding)
  } catch {
    // Silently skip theme injection if branding fails
  }

  // Resolve the tenant's Atlas brand preset + density (default: marigold/regular).
  // `display: contents` so the wrapper provides the brand CSS variables to the
  // whole tenant subtree without introducing a layout box. Server-rendered,
  // zero client JS. Tenant primary/accent overrides still apply on top.
  let brandPreset = 'marigold'
  let density = 'regular'
  try {
    const branding = await getTenantBranding(subdomain)
    brandPreset = branding.brandPreset
    density = branding.density
  } catch {
    // keep defaults
  }

  const content = (
    <div data-brand={brandPreset} data-density={density} style={{ display: 'contents' }}>
      {/* Per-tenant CSS variable overrides (server-rendered, zero JS) */}
      {themeCss && (
        <style
          id={`tenant-theme-${subdomain}`}
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      )}
      {children}
    </div>
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
