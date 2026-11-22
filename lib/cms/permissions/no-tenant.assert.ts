/**
 * A site's admin API asked without a site (the main domain, no x-subdomain) is for platform super
 * admins only; it never runs unscoped for any signed-in user. Found by the Phase 0 map 2026-11-22
 * (card 6b361b6a): withAuth/withPermission ran /api/cms/admin/* across every site after a login check.
 * Run: tsx lib/cms/permissions/no-tenant.assert.ts
 */
import assert from "node:assert/strict"
import { noTenantVerdict } from "./no-tenant"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("site admin routes without a site: refused unless platform super admin", () => {
  for (const p of ["/api/cms/admin/dashboard/metrics", "/api/cms/admin/dashboard/time-series", "/api/cms/admin/stats-simple", "/api/cms/admin"]) {
    assert.equal(noTenantVerdict(p, false), "refuse", p)
    assert.equal(noTenantVerdict(p, true), "allow", p)
  }
})
ok("per-person and catalogue routes keep working without a site", () => {
  for (const p of ["/api/cms/canva/auth/status", "/api/cms/marketplace", "/api/cms/auth/permissions"]) {
    assert.equal(noTenantVerdict(p, false), "allow", p)
  }
})
ok("a look-alike path is not mistaken for the admin API", () => {
  assert.equal(noTenantVerdict("/api/cms/administrators-guide", false), "allow")
  assert.equal(noTenantVerdict("/API/CMS/ADMIN/x", false), "refuse")
})
console.log(`\n${n} checks passed`)
