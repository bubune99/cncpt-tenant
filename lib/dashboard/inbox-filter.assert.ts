/** The Support inbox's status channels. Run: npx tsx lib/dashboard/inbox-filter.assert.ts */
import assert from "node:assert/strict"
import { CHANNELS, ticketsIn, channelCount } from "./inbox-filter"
let n = 0
const ok = (name: string, fn: () => void) => { fn(); n++; console.log("ok", n, "-", name) }
const t = (status: string) => ({ status })
const all = [t("open"), t("open"), t("in_progress"), t("resolved"), t("closed")]
ok("five channels, All first", () => assert.deepEqual(CHANNELS.map((c) => c.id), ["all", "open", "in_progress", "resolved", "closed"]))
ok("All keeps every ticket", () => assert.equal(ticketsIn(all, "all").length, 5))
ok("each status keeps only its own", () => { assert.equal(ticketsIn(all, "open").length, 2); assert.equal(ticketsIn(all, "in_progress").length, 1); assert.equal(ticketsIn(all, "closed").length, 1) })
ok("the input is not changed", () => { ticketsIn(all, "open"); assert.equal(all.length, 5) })
ok("counts come from the server's stats, unknown while loading", () => {
  const stats = { open: 2, inProgress: 1, resolved: 1, closed: 1, total: 5 }
  assert.equal(channelCount(stats, "all"), 5); assert.equal(channelCount(stats, "in_progress"), 1)
  assert.equal(channelCount(null, "open"), null)
})
console.log(`\n${n} checks passed`)
