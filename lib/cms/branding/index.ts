/**
 * Tenant Branding Library
 *
 * Resolves per-tenant branding from the TenantSetting table.
 * Used by layouts, metadata generation, favicon routes, manifest routes,
 * email templates, and the admin panel.
 *
 * SECURITY: Every tenant's branding is isolated by tenantId.
 * Functions require an explicit subdomain/tenantId parameter --
 * there is no ambient "current tenant" that could leak across requests.
 */

import { prisma } from '../db'
import { generateThemeCss } from '../theme/color-utils'
import {
  sanitizeHexColor,
  sanitizeCustomCss,
  sanitizeImageUrl,
} from './sanitize'
import type { TenantBranding } from './types'
import { DEFAULT_TENANT_BRANDING } from './types'

// In-memory cache: subdomain -> { branding, timestamp }
const brandingCache = new Map<string, { data: TenantBranding; ts: number }>()
const CACHE_TTL = 60_000 // 1 minute

/**
 * Get branding for a specific tenant by subdomain.
 * Returns DEFAULT_TENANT_BRANDING values for any field not set by the tenant.
 */
export async function getTenantBranding(subdomain: string): Promise<TenantBranding> {
  // Check cache
  const cached = brandingCache.get(subdomain)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const tenant = await prisma.subdomain.findUnique({
    where: { subdomain },
    include: { tenantSettings: true },
  })

  if (!tenant || !tenant.tenantSettings) {
    return { ...DEFAULT_TENANT_BRANDING, siteName: subdomain }
  }

  const s = tenant.tenantSettings

  const branding: TenantBranding = {
    siteName: s.siteName || s.siteTitle || subdomain,
    siteTagline: s.siteTagline || s.siteDescription || DEFAULT_TENANT_BRANDING.siteTagline,
    logoUrl: sanitizeImageUrl(s.logoUrl) ?? undefined,
    logoDarkUrl: sanitizeImageUrl(s.logoDarkUrl) ?? undefined,
    logoAlt: s.logoAlt || undefined,
    faviconUrl: sanitizeImageUrl(s.faviconUrl) ?? undefined,
    faviconSvgUrl: sanitizeImageUrl(s.faviconSvgUrl) ?? undefined,
    appleTouchIconUrl: sanitizeImageUrl(s.appleTouchIconUrl) ?? undefined,
    ogImageUrl: sanitizeImageUrl(s.ogImageUrl) ?? undefined,
    primaryColor: sanitizeHexColor(s.primaryColor) || DEFAULT_TENANT_BRANDING.primaryColor,
    accentColor: sanitizeHexColor(s.accentColor) || DEFAULT_TENANT_BRANDING.accentColor,
    themeColor: sanitizeHexColor(s.themeColor) || DEFAULT_TENANT_BRANDING.themeColor,
    titleTemplate: s.titleTemplate || `%s | ${s.siteName || s.siteTitle || subdomain}`,
    metaDescription: s.metaDescription || s.siteDescription || '',
    hidePoweredBy: s.hidePoweredBy ?? false,
    customCss: sanitizeCustomCss(s.customCss),
  }

  // Update cache
  brandingCache.set(subdomain, { data: branding, ts: Date.now() })

  return branding
}

/**
 * Get branding by tenant ID (for API routes that already have the ID).
 */
export async function getTenantBrandingById(tenantId: number): Promise<TenantBranding> {
  const tenant = await prisma.subdomain.findUnique({
    where: { id: tenantId },
    select: { subdomain: true },
  })
  if (!tenant) return DEFAULT_TENANT_BRANDING
  return getTenantBranding(tenant.subdomain)
}

/**
 * Update branding for a specific tenant.
 * Validates and sanitizes all input before writing to the database.
 */
export async function updateTenantBranding(
  tenantId: number,
  updates: Partial<TenantBranding>
): Promise<TenantBranding> {
  const data: Record<string, unknown> = {}

  if (updates.siteName !== undefined) {
    data.siteName = updates.siteName.substring(0, 255)
  }
  if (updates.siteTagline !== undefined) {
    data.siteTagline = updates.siteTagline.substring(0, 500)
  }
  if (updates.logoUrl !== undefined) {
    data.logoUrl = sanitizeImageUrl(updates.logoUrl)
  }
  if (updates.logoDarkUrl !== undefined) {
    data.logoDarkUrl = sanitizeImageUrl(updates.logoDarkUrl)
  }
  if (updates.logoAlt !== undefined) {
    data.logoAlt = updates.logoAlt.substring(0, 255)
  }
  if (updates.faviconUrl !== undefined) {
    data.faviconUrl = sanitizeImageUrl(updates.faviconUrl)
  }
  if (updates.faviconSvgUrl !== undefined) {
    data.faviconSvgUrl = sanitizeImageUrl(updates.faviconSvgUrl)
  }
  if (updates.appleTouchIconUrl !== undefined) {
    data.appleTouchIconUrl = sanitizeImageUrl(updates.appleTouchIconUrl)
  }
  if (updates.ogImageUrl !== undefined) {
    data.ogImageUrl = sanitizeImageUrl(updates.ogImageUrl)
  }
  if (updates.primaryColor !== undefined) {
    const safe = sanitizeHexColor(updates.primaryColor)
    if (safe) data.primaryColor = safe
  }
  if (updates.accentColor !== undefined) {
    const safe = sanitizeHexColor(updates.accentColor)
    if (safe) data.accentColor = safe
  }
  if (updates.themeColor !== undefined) {
    const safe = sanitizeHexColor(updates.themeColor)
    if (safe) data.themeColor = safe
  }
  if (updates.titleTemplate !== undefined) {
    data.titleTemplate = updates.titleTemplate.substring(0, 255)
  }
  if (updates.metaDescription !== undefined) {
    data.metaDescription = updates.metaDescription.substring(0, 2000)
  }
  if (updates.hidePoweredBy !== undefined) {
    data.hidePoweredBy = Boolean(updates.hidePoweredBy)
  }
  if (updates.customCss !== undefined) {
    data.customCss = sanitizeCustomCss(updates.customCss)
  }

  await prisma.tenantSetting.upsert({
    where: { tenantId },
    update: data,
    create: {
      tenantId,
      ...data,
    },
  })

  // Invalidate cache for this tenant
  const tenant = await prisma.subdomain.findUnique({
    where: { id: tenantId },
    select: { subdomain: true },
  })
  if (tenant) {
    brandingCache.delete(tenant.subdomain)
  }

  return tenant
    ? getTenantBranding(tenant.subdomain)
    : DEFAULT_TENANT_BRANDING
}

/**
 * Generate CSS variable overrides for a specific tenant.
 * Used by TenantThemeInjector to inject into <style> tags.
 */
export function generateTenantThemeCss(branding: TenantBranding): string {
  const parts: string[] = []

  // Use the existing theme color utility for primary/accent
  const themeCss = generateThemeCss(branding.primaryColor, branding.accentColor)
  if (themeCss) parts.push(themeCss)

  // Add custom CSS (already sanitized)
  if (branding.customCss) {
    parts.push(branding.customCss)
  }

  return parts.join('\n')
}

/**
 * Clear branding cache for a specific subdomain (or all).
 */
export function clearBrandingCache(subdomain?: string): void {
  if (subdomain) {
    brandingCache.delete(subdomain)
  } else {
    brandingCache.clear()
  }
}

// Re-exports
export type { TenantBranding } from './types'
export { DEFAULT_TENANT_BRANDING } from './types'
export {
  sanitizeHexColor,
  sanitizeCustomCss,
  sanitizeImageUrl,
  validateImageContentType,
  validateSvgContent,
} from './sanitize'
