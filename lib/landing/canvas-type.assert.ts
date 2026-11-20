/**
 * The workspace dashboard's type and banner colors (walk 2026-11-20, "first client site", cncptweb.com/dashboard):
 * - site addresses, figures and labels were set in Geist Mono; the owner wants no monospace anywhere
 *   (sans with tabular figures instead).
 * - in dark mode the info banner kept its light-theme text, rgb(30,64,175) on a translucent blue over navy:
 *   "Finish setting up dzidzor" could hardly be read.
 * Run: tsx lib/landing/canvas-type.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const css = readFileSync(new URL("../../app/dashboard/canvas/canvas.css", import.meta.url), "utf8")
const monoVar = css.match(/--br-font-mono:\s*([^;]+);/)?.[1] ?? ""
assert.doesNotMatch(monoVar, /monospace|Mono/, "--br-font-mono no longer names a monospace face")
assert.match(css, /\.tnt-canvas \.mono\s*\{[^}]*tabular-nums/, ".mono keeps figures aligned with tabular-nums")
for (const kind of ["info", "warn", "err", "ok"]) {
  assert.match(css, new RegExp(`\\.dark \\.tnt-canvas \\.tnt__banner--${kind}\\s*\\{[^}]*color:`), `dark ${kind} banner sets its own text color`)
}
console.log("ok - no monospace in the workspace; dark banners readable\n\n1 checks passed")
