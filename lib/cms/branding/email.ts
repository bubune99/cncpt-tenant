/**
 * Email Branding Resolver
 *
 * Provides tenant-scoped branding data for email templates.
 * Ensures each tenant's emails use their own logo, colors, and store name.
 */

import type { TenantBranding } from './types'
import type { BaseTemplateOptions } from '../email/templates/base'

/**
 * Build base email template options from tenant branding.
 * Merges tenant branding with any explicit overrides.
 */
export function buildEmailBrandingOptions(
  branding: TenantBranding,
  overrides?: Partial<BaseTemplateOptions>
): Partial<BaseTemplateOptions> {
  return {
    brandColor: branding.primaryColor || '#4F46E5',
    logoUrl: branding.logoUrl || undefined,
    storeName: branding.siteName,
    ...overrides,
  }
}
