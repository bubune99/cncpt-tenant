/**
 * What a person may do in the shared far-cms admin on a CNCPT site, from CNCPT's own access rule
 * (canAccessSubdomain: the site's owner, or a team with access). The set is the owner's answer to inbox 43e92144. Pure. Checked in site-permissions.assert.ts.
 */

/** Owner, inbox 43e92144 (2026-11-23): "Run their own site". Platform-only areas stay out: users, roles, plugins,
 * routes, workflows, audit, templates, the assistant's data access, and the payments, storage and AI settings (they
 * hold platform keys). */
export const SITE_ADMIN_PERMISSIONS: readonly string[] = [
  "pages.*", "blog.*", "media.*", "forms.*", "email.*",
  "products.*", "variants.*", "categories.*", "inventory.*", "orders.*", "customers.*", "analytics.*",
  "settings.view", "settings.general", "settings.shipping", "settings.taxes", "settings.email",
  "privacy.customers.see", "privacy.submissions.see", "privacy.orders.see",
  // Reading help tours: every screen's help loads them (403 on all seven mounted screens without it). Not editing them.
  "tours.view",
]

export interface SiteAccess {
  hasAccess: boolean
  accessType: "owner" | "team" | null
}

/** The permission list for this person on this site, or null for no access. */
export function sitePermissions(access: SiteAccess, superAdmin: boolean): readonly string[] | null {
  return access.hasAccess || superAdmin ? SITE_ADMIN_PERMISSIONS : null
}
