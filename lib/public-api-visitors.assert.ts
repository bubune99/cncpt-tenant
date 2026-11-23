/**
 * The shared far-cms visitor routes open to the public on each site: owner, inbox 2fcd4cdd (2026-11-23):
 * "Yes, open all three" (sending a form, the newsletter sign-up, the cart). Exactly those paths and methods,
 * nothing wider. Run: tsx lib/public-api-visitors.assert.ts
 */
import assert from "node:assert/strict"
import { isPublicApi } from "./public-api"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

ok("sending a form: its time token (GET) and the submit (POST) are open; nothing else about forms", () => {
  assert.ok(isPublicApi("/api/forms/volunteer/token", "GET"))
  assert.ok(isPublicApi("/api/forms/abc123/submit", "POST"))
  assert.ok(!isPublicApi("/api/forms/abc123/submit", "GET"))
  assert.ok(!isPublicApi("/api/forms/abc123/submissions", "GET"))
  assert.ok(!isPublicApi("/api/forms", "GET"))
  assert.ok(!isPublicApi("/api/forms/abc123", "PUT"))
})
ok("the captcha settings a form needs are readable (GET only)", () => {
  assert.ok(isPublicApi("/api/captcha/config", "GET"))
  assert.ok(!isPublicApi("/api/captcha/config", "POST"))
})
ok("the newsletter sign-up is open (POST only); the admin's /api/emails is not", () => {
  assert.ok(isPublicApi("/api/email/subscribe", "POST"))
  assert.ok(!isPublicApi("/api/email/subscribe", "GET"))
  assert.ok(!isPublicApi("/api/emails/campaigns", "GET"))
})
ok("the cart is open, every route under it; checkout is not part of this answer", () => {
  for (const p of ["/api/cart", "/api/cart/items", "/api/cart/items/x1", "/api/cart/discount", "/api/cart/recover/tok"]) assert.ok(isPublicApi(p, "POST"), p)
  assert.ok(!isPublicApi("/api/checkout", "POST"))
  assert.ok(!isPublicApi("/api/cartography", "GET"))
})
console.log(`${n} checks passed`)
