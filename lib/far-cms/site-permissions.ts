/**
 * What a person may do in the shared far-cms admin on a CNCPT site, from CNCPT's own access rule
 * (canAccessSubdomain: the site's owner, or a team with access). Until the owner answers inbox 43e92144 it is only
 * what CNCPT's current site admin already allows: customers. Pure. Checked in site-permissions.assert.ts.
 */

export const SITE_ADMIN_PERMISSIONS: readonly string[] = [
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.delete",
  "customers.export",
]

export interface SiteAccess {
  hasAccess: boolean
  accessType: "owner" | "team" | null
}

/** The permission list for this person on this site, or null for no access. */
export function sitePermissions(access: SiteAccess, superAdmin: boolean): readonly string[] | null {
  return access.hasAccess || superAdmin ? SITE_ADMIN_PERMISSIONS : null
}
