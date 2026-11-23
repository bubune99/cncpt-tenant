/**
 * Uploading a client's logo or icon from the workspace's Branding tab (walk dce2661a: logos were URL text
 * boxes with no upload). The file rules, before anything is stored. Run: tsx lib/dashboard/brand-upload.assert.ts
 */
import assert from "node:assert/strict"
import { checkBrandImage, brandFileName, BRAND_SLOTS } from "./brand-upload"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("PNG, JPEG, WebP and GIF up to 2 MB are accepted", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
    assert.equal(checkBrandImage({ type, size: 200_000 }).ok, true, type)
  }
  assert.equal(checkBrandImage({ type: "image/png", size: 2 * 1024 * 1024 }).ok, true)
})
ok("SVG is refused (served inline it is stored XSS), as are other types", () => {
  assert.match(checkBrandImage({ type: "image/svg+xml", size: 1000 }).error!, /PNG, JPEG, WebP or GIF/)
  assert.match(checkBrandImage({ type: "application/pdf", size: 1000 }).error!, /PNG, JPEG, WebP or GIF/)
  assert.match(checkBrandImage({ type: "", size: 1000 }).error!, /PNG, JPEG, WebP or GIF/)
})
ok("too big and empty files are refused with the limit named", () => {
  assert.match(checkBrandImage({ type: "image/png", size: 2 * 1024 * 1024 + 1 }).error!, /2 MB/)
  assert.match(checkBrandImage({ type: "image/png", size: 0 }).error!, /empty/)
})
ok("the stored name comes from the slot and type, never from the uploaded name", () => {
  const a = brandFileName("logo", "image/png", 1_700_000_000_000)
  assert.equal(a, "brand-logo-1700000000000.png")
  assert.equal(brandFileName("favicon", "image/jpeg", 5), "brand-favicon-5.jpg")
  assert.equal(brandFileName("logo_dark", "image/webp", 5), "brand-logo_dark-5.webp")
})
ok("only known slots can be uploaded to", () => {
  assert.deepEqual([...BRAND_SLOTS], ["logo", "logo_dark", "favicon", "apple_touch_icon"])
  assert.throws(() => brandFileName("../../etc" as never, "image/png", 1))
})
console.log(`\n${n} checks passed`)
