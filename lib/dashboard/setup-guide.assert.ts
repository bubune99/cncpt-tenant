/**
 * The workspace's setup guide and each site's setup checklist (owner, 2026-11-20: "cncptweb.com/dashboard needs a
 * better walkthrough and re-do"). Before this, the site page's checklist was hard-coded ("Branding applied" always
 * no, "Visibility set" always yes) and the Overview had no guide at all (walk dce2661a gave up).
 * Every tick comes from stored facts. Run: tsx lib/dashboard/setup-guide.assert.ts
 */
import assert from "node:assert/strict"
import { siteSetup, accountGuide, type SiteFacts } from "./setup-guide"

let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

const bare: SiteFacts = { subdomain: "bubune", title: null, branded: false, customDomain: null, visibility: "public", collaborators: 0 }
const dz: SiteFacts = { subdomain: "dzidzor", title: "Project Dzidzor", branded: true, customDomain: null, visibility: "public", collaborators: 0 }
const full: SiteFacts = { subdomain: "acme", title: "Acme", branded: true, customDomain: "www.acme.com", visibility: "public", collaborators: 2 }

ok("a site's checklist has four items, each from a fact", () => {
  const s = siteSetup(bare)
  assert.deepEqual(s.items.map((i) => i.id), ["brand", "domain", "invite", "public"])
  assert.deepEqual(s.items.map((i) => i.done), [false, false, false, true])
  assert.equal(s.done, 1)
  assert.equal(s.total, 4)
})
ok("branding counts when a logo or a brand color is stored", () => {
  assert.equal(siteSetup(dz).items[0].done, true)
})
ok("a private or maintenance site is not public", () => {
  assert.equal(siteSetup({ ...bare, visibility: "private" }).items[3].done, false)
  assert.equal(siteSetup({ ...bare, visibility: "maintenance" }).items[3].done, false)
})
ok("a fully set-up site is 4 of 4 and says so", () => {
  const s = siteSetup(full)
  assert.equal(s.done, 4)
  assert.equal(s.complete, true)
})
ok("no sites: only the first step, and it points at making one", () => {
  const g = accountGuide([])
  assert.equal(g.done, 0)
  assert.equal(g.steps[0].id, "site")
  assert.equal(g.steps[0].done, false)
  assert.equal(g.next?.id, "site")
  assert.equal(g.steps.slice(1).every((s) => !s.done && s.site === null), true)
})
ok("with sites: each step is done when any site has it, and names where", () => {
  const g = accountGuide([bare, dz])
  const by = Object.fromEntries(g.steps.map((s) => [s.id, s]))
  assert.equal(by.site.done, true)
  assert.match(by.site.detail, /2 sites/)
  assert.equal(by.brand.done, true)
  assert.match(by.brand.detail, /Project Dzidzor/)
  assert.equal(by.domain.done, false)
  assert.equal(by.invite.done, false)
  assert.equal(by.public.done, true)
  assert.equal(g.done, 3)
  assert.equal(g.total, 5)
})
ok("an undone step points at the first site that still needs it", () => {
  const g = accountGuide([dz, bare])
  const domain = g.steps.find((s) => s.id === "domain")!
  assert.equal(domain.site, "dzidzor")
  assert.equal(g.next?.id, "domain")
})
ok("the guide is complete only when every step is done", () => {
  assert.equal(accountGuide([full]).complete, true)
  assert.equal(accountGuide([dz]).complete, false)
})
ok("one site reads '1 site', not '1 sites'", () => {
  assert.match(accountGuide([bare]).steps[0].detail, /^1 site\b/)
})
console.log(`\n${n} checks passed`)
