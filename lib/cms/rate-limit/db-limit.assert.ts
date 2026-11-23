/**
 * Live check of the database rate-limit count against a NON-production database (it refuses CNCPT production).
 * Uses only SAMPLE keys and removes them afterward.
 * Run from the repo root:
 *   DATABASE_URL=$(neonctl connection-string staging --project-id mute-mud-34170429) \
 *   DATABASE_URL_UNPOOLED=$DATABASE_URL node_modules/.bin/tsx lib/cms/rate-limit/db-limit.assert.ts
 */
import assert from "node:assert/strict"

const url = process.env.DATABASE_URL ?? ""
assert.ok(url, "set DATABASE_URL to the staging branch")
assert.ok(!url.includes("ep-soft-lab-adomu3yn"), "refusing to run against CNCPT production")

async function main() {
  const { dbLimit, deleteLimitKeys } = await import("./db-limit")
  const PREFIX = `SAMPLE-rate-limit-${Date.now()}`
  let n = 0
  const ok = async (name: string, fn: () => Promise<void>) => { await fn(); n++; console.log(`ok ${n} - ${name}`) }
  try {
    await ok("a limit of 3 lets 3 requests through and refuses the 4th until the window ends", async () => {
      const key = `${PREFIX}:seq`, t = Date.now()
      for (let i = 0; i < 3; i++) assert.equal((await dbLimit(key, 3, 60_000, t + i)).success, true, `request ${i + 1}`)
      const fourth = await dbLimit(key, 3, 60_000, t + 3)
      assert.equal(fourth.success, false)
      assert.equal(fourth.reset, t + 60_000)
    })
    await ok("after the window ends the count starts again", async () => {
      const key = `${PREFIX}:seq`
      const later = Date.now() + 61_000
      assert.equal((await dbLimit(key, 3, 60_000, later)).success, true)
    })
    await ok("12 requests at once against a limit of 5: exactly 5 get through", async () => {
      const key = `${PREFIX}:burst`, t = Date.now()
      const results = await Promise.all(Array.from({ length: 12 }, () => dbLimit(key, 5, 60_000, t)))
      assert.equal(results.filter((r) => r.success).length, 5)
    })
    await ok("two keys count separately", async () => {
      const t = Date.now()
      assert.equal((await dbLimit(`${PREFIX}:a`, 1, 60_000, t)).success, true)
      assert.equal((await dbLimit(`${PREFIX}:b`, 1, 60_000, t)).success, true)
      assert.equal((await dbLimit(`${PREFIX}:a`, 1, 60_000, t)).success, false)
    })
  } finally {
    const removed = await deleteLimitKeys(PREFIX)
    const left = await deleteLimitKeys(PREFIX)
    console.log(`removed ${removed} SAMPLE rows; ${left} left`)
  }
  console.log(`${n} checks passed`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
