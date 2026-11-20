/**
 * The home page's figures and reviews (walk 2026-11-20 on cncptweb.com):
 * - the figures band showed only '%', '<ms', '+' because the number was written only by an animation;
 * - six invented testimonials were shown as real reviews.
 * Run: node_modules/.bin/tsx lib/landing/figures.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { formatFigure } from "./figures"

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }

ok("a figure is formatted the same on the server and in the browser", () => {
  assert.equal(formatFigure(99.9, 1), "99.9")
  assert.equal(formatFigure(100, 0), "100")
  assert.equal(formatFigure(1500, 0), "1,500")
})
ok("the ticker renders the figure itself in the HTML, animation only on top", () => {
  const t = read("components/ui/number-ticker.tsx")
  assert.match(t, /\{formatFigure\(value, decimalPlaces\)\}/, "the span's children are the formatted value")
  assert.match(t, /prefers-reduced-motion/, "no count-up for people who asked for less motion")
})
ok("no invented testimonials on the home page", () => {
  assert.doesNotMatch(read("app/page.tsx"), /Testimonials/)
  assert.ok(!existsSync(new URL("../../components/landing/testimonials-section.tsx", import.meta.url)))
})
console.log(`\n${n} checks passed`)
