/**
 * The API backstop in middleware.ts lets a request through only when it carries a session cookie.
 * Stack Auth was renamed Hexclave and now sets `hexclave-access` and `__Host-hexclave-refresh-<project>`.
 * Found 2026-11-20 on cncpt-tester.com: signed in as super admin, every /api call answered 401
 * ("Failed to fetch analytics", "Activity log unavailable") because only stack-* names were accepted.
 * Run: tsx lib/public-api.assert.ts
 */
import assert from "node:assert/strict"
import { AUTH_COOKIE_RE } from "./public-api"

const yes = [
  "hexclave-access",
  "__Host-hexclave-refresh-b522fdad-e362-497d-9cab-688e9d94bfe0--default",
  "stack-access",
  "stack-refresh-b522fdad-e362-497d-9cab-688e9d94bfe0",
  "__Host-stack-refresh-b522fdad",
  "session",
]
const no = [
  "hexclave-is-https",
  "stack-is-https",
  "hexclave-oauth-outer-75tdZgeg",
  "stack-oauth-outer-75tdZgeg",
  "__stripe_mid",
  "hexclave-accessory",
  "sessionid-other",
]
for (const c of yes) assert.ok(AUTH_COOKIE_RE.test(c), `session cookie accepted: ${c}`)
for (const c of no) assert.ok(!AUTH_COOKIE_RE.test(c), `not a session cookie: ${c}`)
console.log(`ok - ${yes.length} session cookies accepted, ${no.length} others refused\n\n1 checks passed`)
