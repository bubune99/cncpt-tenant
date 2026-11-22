/**
 * What a CMS API request with no site in it may do. A site's admin API (/api/cms/admin/...) reads and
 * writes one site's data; without a site it would run across all of them, so only a platform super
 * admin may call it that way. Check: lib/cms/permissions/no-tenant.assert.ts
 */
export function noTenantVerdict(pathname: string, isPlatformSuperAdmin: boolean): "allow" | "refuse" {
  const isSiteAdminApi = /^\/api\/cms\/admin(\/|$)/i.test(pathname)
  if (!isSiteAdminApi) return "allow"
  return isPlatformSuperAdmin ? "allow" : "refuse"
}
