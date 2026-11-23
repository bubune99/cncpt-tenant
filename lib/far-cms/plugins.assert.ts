/**
 * CNCPT runs only the far-cms plugins it installs (card 7). Every route mounted from @far-cms/cms must belong to one of
 * them, so a route of a plugin CNCPT does not have (initiatives, events, workflows ...) cannot be mounted by accident.
 * Run: tsx lib/far-cms/plugins.assert.ts
 */
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { resolvePlugins } from "@far-cms/contracts"
import { APP_INSTALLS, CATALOG, ownerOf } from "@far-cms/plugin-catalog"

const root = fileURLToPath(new URL("../../app/api", import.meta.url))
const walk = (d: string): string[] => readdirSync(d).flatMap((x) => { const p = join(d, x); return statSync(p).isDirectory() ? walk(p) : x === "route.ts" ? [p] : [] })
const mounted = walk(root).filter((f) => readFileSync(f, "utf8").startsWith("// Mounted from @far-cms/cms")).map((f) => "/api/" + relative(root, f).replace(/\\/g, "/").replace(/\/?route\.ts$/, ""))
const installed = new Set(resolvePlugins({ app: "cncpt", installed: APP_INSTALLS.cncpt, catalog: CATALOG }).map((p) => p.id))

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }
ok(`each of the ${mounted.length} mounted far-cms routes belongs to a plugin CNCPT installs`, () => {
  assert.ok(mounted.length > 50, "found the mounted routes")
  const outside = mounted.map((r) => [r, ownerOf(r) ?? "no owner"] as const).filter(([, o]) => !installed.has(o))
  assert.deepEqual(outside, [])
})
ok("initiatives is not among CNCPT's plugins", () => assert.ok(!installed.has("initiatives")))
console.log(`${n} checks passed`)
