/**
 * A client site's address (<address>.cncptweb.com): the rules the server enforces, shared with the
 * New client site panel so it can say what is wrong before anything is sent, and suggest an address
 * from the site's name. Run: tsx lib/dashboard/site-address.assert.ts
 */
import assert from "node:assert/strict"
import { checkAddress, addressFromName } from "./site-address"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("good addresses pass", () => {
  for (const a of ["acme", "acme-co", "a1b", "client-2026"]) assert.equal(checkAddress(a).valid, true, a)
})
ok("too short, too long, bad characters and edge hyphens are refused with a reason", () => {
  assert.match(checkAddress("").error!, /required/)
  assert.match(checkAddress("ab").error!, /at least 3/)
  assert.match(checkAddress("a".repeat(64)).error!, /at most 63/)
  assert.match(checkAddress("Acme").error!, /lowercase/)
  assert.match(checkAddress("-acme").error!, /lowercase/)
  assert.match(checkAddress("acme-").error!, /lowercase/)
  assert.match(checkAddress("ac me").error!, /lowercase/)
})
ok("reserved words are refused", () => {
  for (const a of ["www", "admin", "dashboard", "api", "staging"]) assert.match(checkAddress(a).error!, /reserved/, a)
})
ok("an address is suggested from the name", () => {
  assert.equal(addressFromName("Acme Coffee Co."), "acme-coffee-co")
  assert.equal(addressFromName("  Café São Paulo  "), "cafe-sao-paulo")
  assert.equal(addressFromName("Dr. Smith & Sons"), "dr-smith-sons")
  assert.equal(addressFromName("---"), "")
  assert.equal(addressFromName("x".repeat(80)).length, 63)
})
ok("a suggestion never ends in a hyphen after trimming to length", () => {
  const s = addressFromName("a".repeat(62) + " b")
  assert.ok(!s.endsWith("-"), s)
})
console.log(`\n${n} checks passed`)
