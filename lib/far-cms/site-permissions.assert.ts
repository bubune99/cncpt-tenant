/**
 * What a person may do in the shared far-cms admin on a CNCPT site. The set is the owner's answer to inbox 43e92144: "Run their own site". Card 10 (c645e053) step 3.
 * Run from the repo root: node_modules/.bin/tsx lib/far-cms/site-permissions.assert.ts
 */
import assert from "node:assert/strict"
import { sitePermissions, SITE_ADMIN_PERMISSIONS } from "./site-permissions"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

ok("the site's owner gets the site-admin set", () => {
  assert.deepEqual(sitePermissions({ hasAccess: true, accessType: "owner" }, false), SITE_ADMIN_PERMISSIONS)
})
ok("a team member with access gets the same set", () => {
  assert.deepEqual(sitePermissions({ hasAccess: true, accessType: "team" }, false), SITE_ADMIN_PERMISSIONS)
})
ok("someone without access to this site gets nothing", () => {
  assert.equal(sitePermissions({ hasAccess: false, accessType: null }, false), null)
})
ok("a platform super admin gets the same site set here, not more", () => {
  assert.deepEqual(sitePermissions({ hasAccess: false, accessType: null }, true), SITE_ADMIN_PERMISSIONS)
})
ok("the set is the owner's 'Run their own site': every area he named, nothing platform-wide, never the wildcard", () => {
  for (const area of ["pages", "blog", "media", "forms", "email", "products", "categories", "inventory", "orders", "customers", "analytics", "partial", "discounts"]) {
    assert.ok(SITE_ADMIN_PERMISSIONS.includes(`${area}.*`), area)
  }
  assert.ok(SITE_ADMIN_PERMISSIONS.includes("settings.general"))
  for (const p of SITE_ADMIN_PERMISSIONS) assert.ok(!/^(users|roles|plugins|routes|workflows|audit|puck_templates|agent)\b/.test(p), p)
  // Help tours can be read (every screen's help loads them), never edited: tour content is shared by every site.
  assert.ok(SITE_ADMIN_PERMISSIONS.includes("tours.view"))
  assert.ok(!SITE_ADMIN_PERMISSIONS.some((p) => p === "tours.*" || p === "tours.manage"))
  for (const p of ["settings.*", "settings.payments", "settings.storage", "settings.ai", "*"]) assert.ok(!SITE_ADMIN_PERMISSIONS.includes(p), p)
  assert.ok(!SITE_ADMIN_PERMISSIONS.some((p) => p.endsWith(".agent")))
})
console.log(`${n} checks passed`)
