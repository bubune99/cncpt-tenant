/**
 * Every API wrapper's no-site branch goes through refuseUnscopedSiteAdmin, so a site's admin API is
 * never run across all sites for an ordinary signed-in user (rule and its cases: no-tenant.assert.ts).
 * Reads the wrapper source, since the wrappers need a live session to run.
 * Run: tsx lib/cms/permissions/middleware.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const src = readFileSync(join(__dirname, "middleware.ts"), "utf8")
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

for (const wrapper of ["withPermission", "withAnyPermission", "withAuth"]) {
  ok(`${wrapper}: the no-site branch refuses an unscoped site admin call before the handler`, () => {
    const start = src.indexOf(`export function ${wrapper}<`)
    assert.ok(start >= 0, `${wrapper} not found`)
    const end = src.indexOf("\nexport function ", start + 10)
    const body = src.slice(start, end < 0 ? undefined : end)
    const tail = body.slice(body.lastIndexOf("runWithTenant"))
    const afterScope = tail.slice(tail.indexOf("\n      }\n"))
    const refuse = afterScope.indexOf("refuseUnscopedSiteAdmin(request, authContext)")
    const handler = afterScope.indexOf("handler(request, authContext")
    assert.ok(refuse > 0 && handler > refuse, `${wrapper}: refuse must come before the handler outside the site scope`)
  })
}
console.log(`\n${n} checks passed`)
