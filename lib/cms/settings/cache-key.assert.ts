/**
 * The settings cache never hands one site another site's settings (email, storage, AI keys).
 * Found by the Phase 0 map 2026-11-22: lib/cms/settings getSettings cached by group only.
 * Run: tsx lib/cms/settings/cache-key.assert.ts
 */
import assert from "node:assert/strict"
import { settingsCacheKey, keysForGroup } from "./cache-key"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("two sites asking for the same group get different keys", () => {
  assert.notEqual(settingsCacheKey(1, "email"), settingsCacheKey(2, "email"))
})
ok("no site (platform request) has its own key, never a site's", () => {
  assert.notEqual(settingsCacheKey(null, "email"), settingsCacheKey(1, "email"))
  assert.equal(settingsCacheKey(null, "email"), settingsCacheKey(null, "email"))
})
ok("clearing a group clears it for every site and no other group", () => {
  const keys = [settingsCacheKey(1, "email"), settingsCacheKey(2, "email"), settingsCacheKey(null, "email"), settingsCacheKey(1, "storage")]
  assert.deepEqual(keysForGroup(keys, "email").sort(), keys.slice(0, 3).sort())
})
console.log(`\n${n} checks passed`)
