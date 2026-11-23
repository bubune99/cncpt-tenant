/**
 * What a person may do in the shared far-cms admin on a CNCPT site. Until the owner answers inbox 43e92144, only what
 * CNCPT's own site admin already allows there: customers. Card 10 (c645e053) step 3.
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
ok("the set is customers only until the owner widens it, and never the wildcard", () => {
  assert.ok(SITE_ADMIN_PERMISSIONS.every((p) => p.startsWith("customers.")))
  assert.ok(!SITE_ADMIN_PERMISSIONS.includes("*"))
})
console.log(`${n} checks passed`)
