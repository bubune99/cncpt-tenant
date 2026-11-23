/** The dashboard greeting's name: a display name's first word, else the part of the email before @, else none.
 *  Run: npx tsx lib/dashboard/greeting.assert.ts */
import assert from "node:assert/strict"
import { firstName } from "./greeting"
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }
ok("a display name gives its first word", () => assert.equal(firstName({ displayName: "  Bubune Owusu " }), "Bubune"))
ok("no name: the email's part before @", () => assert.equal(firstName({ primaryEmail: "kofi@example.org" }), "kofi"))
ok("nothing usable: null, never 'undefined'", () => { assert.equal(firstName({}), null); assert.equal(firstName(null), null); assert.equal(firstName({ displayName: "  ", email: "no-at-sign" }), null) })
console.log(`\n${n} checks passed`)
