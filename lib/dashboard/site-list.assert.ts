/** The Client sites list: narrowing by name and ordering. Run: npx tsx lib/dashboard/site-list.assert.ts */
import assert from "node:assert/strict"
import { visibleSites, nextSort, SORT_LABEL } from "./site-list"
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }
const sites = [
  { subdomain: "dzidzor", created_at: "2026-03-01T00:00:00Z" },
  { subdomain: "sassy-dame", site_title: "Sassy Dame Designs", created_at: "2026-05-01T00:00:00Z" },
  { subdomain: "bubune", created_at: "2026-01-01T00:00:00Z" },
]
const names = (xs: { subdomain: string }[]) => xs.map((s) => s.subdomain)
ok("newest first by default", () => assert.deepEqual(names(visibleSites(sites, "", "newest")), ["sassy-dame", "dzidzor", "bubune"]))
ok("oldest first", () => assert.deepEqual(names(visibleSites(sites, "", "oldest")), ["bubune", "dzidzor", "sassy-dame"]))
ok("name A to Z uses the title when there is one", () => assert.deepEqual(names(visibleSites(sites, "", "name")), ["bubune", "dzidzor", "sassy-dame"]))
ok("narrowing matches title or address, any case, ignoring spaces around", () => {
  assert.deepEqual(names(visibleSites(sites, "  SASSY ", "newest")), ["sassy-dame"])
  assert.deepEqual(names(visibleSites(sites, "dz", "newest")), ["dzidzor"])
  assert.deepEqual(visibleSites(sites, "nothing", "newest"), [])
})
ok("the input list is not changed", () => { const before = names(sites); visibleSites(sites, "", "name"); assert.deepEqual(names(sites), before) })
ok("a site with no date sorts last either way", () => {
  const xs = [...sites, { subdomain: "aaa" }]
  assert.equal(names(visibleSites(xs, "", "newest")).at(-1), "aaa"); assert.equal(names(visibleSites(xs, "", "oldest")).at(-1), "aaa")
})
ok("sort cycles newest > oldest > name > newest, each with a label", () => {
  assert.equal(nextSort("newest"), "oldest"); assert.equal(nextSort("oldest"), "name"); assert.equal(nextSort("name"), "newest")
  assert.equal(SORT_LABEL.newest, "Newest first")
})
console.log(`\n${n} checks passed`)
