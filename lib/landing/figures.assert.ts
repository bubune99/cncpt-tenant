/**
 * The home page's figures and reviews (walk 2026-11-20 on cncptweb.com):
 * - the figures band ('99.9% Uptime SLA', '<100ms', '50+ Integrations', '24/7 Support') made promises
 *   nobody had committed to, and showed only '%', '<ms', '+'. Owner, 2026-11-20 (question 0d704cca):
 *   "Remove the figures band entirely."
 * - six invented testimonials were shown as real reviews.
 * Run: tsx lib/landing/figures.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
const gone = (p: string) => !existsSync(new URL(`../../${p}`, import.meta.url))
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("no figures band on the home page", () => {
  assert.doesNotMatch(read("app/page.tsx"), /StatsSection/)
  assert.ok(gone("components/landing/stats-section.tsx"))
})
ok("no invented testimonials on the home page", () => {
  assert.doesNotMatch(read("app/page.tsx"), /Testimonials/)
  assert.ok(gone("components/landing/testimonials-section.tsx"))
})
ok("no page anywhere still claims an uptime SLA", () => {
  for (const p of ["app/page.tsx", "components/landing/hero-section.tsx", "components/landing/cta-section.tsx", "components/landing/features-section.tsx"]) {
    assert.doesNotMatch(read(p), /Uptime SLA|99\.9%/, p)
  }
})
ok("no promise that a trial needs no card (paid plans start in Stripe Checkout, which asks for one)", () => {
  for (const p of ["app/page.tsx", "components/landing/hero-section.tsx", "components/landing/cta-section.tsx", "components/landing/pricing-section.tsx", "app/pricing/page.tsx", "app/(public)/pricing/page.tsx"]) {
    if (!existsSync(new URL(`../../${p}`, import.meta.url))) continue
    assert.doesNotMatch(read(p), /no credit card/i, p)
  }
})
console.log(`\n${n} checks passed`)
