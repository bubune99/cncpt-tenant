/**
 * Every color the skin gives must also be a Tailwind color here (@theme --color-<name>), or classes such as bg-success
 * produce nothing: the status badges for pending and delivered were transparent on staging (2026-11-23) because
 * success, warning and destructive-foreground were never mapped. Run: tsx lib/far-cms/skin-theme.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { SKIN_COLORS } from "@far-cms/contracts"

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8")
const theme = css.slice(css.indexOf("@theme inline {"), css.indexOf("\n}", css.indexOf("@theme inline {")))
const missing = SKIN_COLORS.filter((k) => !new RegExp(`--color-${k}:\\s*var\\(--${k}\\)`).test(theme))
assert.deepEqual(missing, [], "skin colors with no Tailwind color")
console.log(`ok 1 - all ${SKIN_COLORS.length} skin colors are Tailwind colors\n\n1 checks passed`)
