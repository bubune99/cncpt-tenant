/**
 * The public stock-image library (GET /api/cms/images) never lists a site's own uploads.
 * Found by the Phase 0 map 2026-11-22: with no category it listed the whole bucket, tenants/* included.
 * Run: tsx lib/cms/r2/library-keys.assert.ts
 */
import assert from "node:assert/strict"
import { isLibraryKey, isLibraryCategory } from "./library-keys"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("library images are listed", () => {
  assert.equal(isLibraryKey("heroes/beach.jpg"), true)
  assert.equal(isLibraryKey("team/a.png"), true)
})
ok("a site's own files never are", () => {
  assert.equal(isLibraryKey("tenants/dzidzor/media/images/x.png"), false)
  assert.equal(isLibraryKey("Tenants/dzidzor/x.png"), false)
  assert.equal(isLibraryKey("/tenants/dzidzor/x.png"), false)
})
ok("the tenants folder is not offered as a category, nor reachable as one", () => {
  assert.equal(isLibraryCategory("tenants"), false)
  assert.equal(isLibraryCategory("tenants/dzidzor"), false)
  assert.equal(isLibraryCategory("heroes"), true)
})
console.log(`\n${n} checks passed`)
