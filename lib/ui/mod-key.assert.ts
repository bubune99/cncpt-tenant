/**
 * The owner is not on a Mac: shortcuts read "Ctrl K", and the Mac symbol shows only when a Mac is detected
 * (planner statement "No Mac key symbols", owner 2026-11-16; seen as ⌘K and ⌘J on the CNCPT dashboard 2026-11-22).
 * Run: tsx lib/ui/mod-key.assert.ts
 */
import assert from "node:assert/strict"
import { isMacPlatform, shortcutLabel } from "./mod-key"

assert.equal(isMacPlatform("Win32"), false)
assert.equal(isMacPlatform("Linux x86_64"), false)
assert.equal(isMacPlatform(""), false)
assert.equal(isMacPlatform("MacIntel"), true)
assert.equal(isMacPlatform("iPhone"), true)

assert.equal(shortcutLabel("K", false), "Ctrl K")
assert.equal(shortcutLabel("K", true), "⌘K")
assert.equal(shortcutLabel("J", false), "Ctrl J")
console.log("mod-key: 3 checks passed")
