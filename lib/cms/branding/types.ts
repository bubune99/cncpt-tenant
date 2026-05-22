/**
 * Tenant Branding Types
 *
 * Defines the shape of per-tenant white-label branding data.
 * Used throughout the system for metadata, favicons, manifests,
 * email templates, and CSS variable injection.
 */

export interface TenantBranding {
  /** Display name for the site/brand */
  siteName: string
  /** Short description / tagline */
  siteTagline: string
  /** Logo URL for light backgrounds */
  logoUrl?: string
  /** Logo URL for dark backgrounds */
  logoDarkUrl?: string
  /** Alt text for the logo */
  logoAlt?: string
  /** Favicon URL (ICO or PNG, 32x32) */
  faviconUrl?: string
  /** Favicon SVG URL (scalable, modern browsers) */
  faviconSvgUrl?: string
  /** Apple Touch Icon URL (180x180 PNG) */
  appleTouchIconUrl?: string
  /** Default Open Graph image URL (1200x630) */
  ogImageUrl?: string
  /** Primary brand color (hex, e.g. #0066cc) */
  primaryColor: string
  /** Accent brand color (hex, e.g. #6366f1) */
  accentColor: string
  /** Theme color for browser chrome & PWA (hex) */
  themeColor: string
  /** Title template for metadata, e.g. "%s | My Brand" */
  titleTemplate: string
  /** Default meta description */
  metaDescription: string
  /** Whether to hide "Powered by CNCPT" in footer */
  hidePoweredBy: boolean
  /** Custom CSS injected into the storefront */
  customCss?: string
  /** Atlas brand preset — the user-selectable design system */
  brandPreset: BrandPreset
  /** UI density for tenant surfaces */
  density: BrandDensity
}

/** The four selectable Atlas design-system presets. Marigold is the default. */
export type BrandPreset = 'marigold' | 'boreal' | 'obsidian' | 'meadow'

/** UI density for tenant admin/storefront surfaces. */
export type BrandDensity = 'compact' | 'regular' | 'spacious'

export const BRAND_PRESETS: readonly BrandPreset[] = [
  'marigold',
  'boreal',
  'obsidian',
  'meadow',
] as const

export const BRAND_DENSITIES: readonly BrandDensity[] = [
  'compact',
  'regular',
  'spacious',
] as const

/** Narrow an untrusted value to a valid BrandPreset (defaults to marigold). */
export function toBrandPreset(value: unknown): BrandPreset {
  return BRAND_PRESETS.includes(value as BrandPreset)
    ? (value as BrandPreset)
    : 'marigold'
}

/** Narrow an untrusted value to a valid BrandDensity (defaults to regular). */
export function toBrandDensity(value: unknown): BrandDensity {
  return BRAND_DENSITIES.includes(value as BrandDensity)
    ? (value as BrandDensity)
    : 'regular'
}

/** Default branding values for new tenants */
export const DEFAULT_TENANT_BRANDING: TenantBranding = {
  siteName: 'CNCPT Web',
  siteTagline: 'Build, manage, and scale your web presence',
  primaryColor: '#0066cc',
  accentColor: '#6366f1',
  themeColor: '#0891b2',
  titleTemplate: '%s | CNCPT Web',
  metaDescription: '',
  hidePoweredBy: false,
  brandPreset: 'marigold',
  density: 'regular',
}
