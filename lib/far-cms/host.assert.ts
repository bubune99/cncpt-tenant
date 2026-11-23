/**
 * The far-cms host wiring for CNCPT (card 10, c645e053, step 3).
 * Wiring (always): host.ts hands the package a site-scoped client and CNCPT's own access answer; middleware gives site
 * pages their site key. Live (when DATABASE_URL is a NON-production branch): the same scoped client built from the
 * generated far-cms client keeps two SAMPLE sites' customers apart; the SAMPLE rows are removed afterward.
 * Run from the repo root:
 *   DATABASE_URL=$(neonctl connection-string staging --project-id mute-mud-34170429) \
 *   node_modules/.bin/tsx lib/far-cms/host.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

let n = 0
const ok = async (name: string, fn: () => Promise<void> | void) => { await fn(); n++; console.log(`ok ${n} - ${name}`) }

async function main() {
  const host = readFileSync("lib/far-cms/host.ts", "utf8")
  const mw = readFileSync("middleware.ts", "utf8")
  await ok("the package gets a site-scoped client built from the far-cms schema's own client", () => {
    assert.match(host, /from "@\/lib\/generated\/far-cms-client"/)
    assert.match(host, /setHostClient\(scopedRequest\(baseClient\(\), \{ site: siteId, owned: OWNED_MODELS, uniques: SITE_UNIQUES \}\)\)/)
  })
  await ok("a request on a site host with no known site is refused (NO_SITE), never read across sites", () => {
    assert.match(host, /h\.get\("x-subdomain"\) \?\? NO_SITE/)
    assert.match(host, /return row\?\.id \?\? NO_SITE/)
  })
  await ok("access comes from CNCPT's own rule, mapped by site-permissions", () => {
    assert.match(host, /canAccessSubdomain\(stackUser\.id, key, "edit"\)/)
    assert.match(host, /sitePermissions\(access, superAdmin\)/)
  })
  await ok("site pages carry their site key, set after the caller's header was stripped", () => {
    assert.ok(mw.indexOf('requestHeaders.delete("x-subdomain")') < mw.indexOf("siteHeaders(requestHeaders, subdomain)"))
    assert.equal((mw.match(/siteHeaders\(requestHeaders, subdomain\)/g) || []).length, 3)
  })

  const url = process.env.DATABASE_URL ?? ""
  if (!url) { console.log(`${n} checks passed (live part skipped: no DATABASE_URL)`); return }
  assert.ok(!url.includes("ep-soft-lab-adomu3yn"), "refusing to run against CNCPT production")
  const { Pool } = await import("pg")
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../generated/far-cms-client")
  const { scopedRequest, NO_SITE } = await import("@far-cms/db")
  const { OWNED_MODELS, SITE_UNIQUES } = await import("./owned-models")
  const pool = new Pool({ connectionString: url, max: 2 })
  const base: any = new PrismaClient({ adapter: new PrismaPg(pool) })
  let current: number | null | typeof NO_SITE = null
  const db: any = scopedRequest(base, { site: async () => current, owned: OWNED_MODELS, uniques: SITE_UNIQUES })
  const tag = `sample-${Date.now()}`
  const sites: number[] = []
  try {
    for (const k of ["a", "b"]) sites.push((await base.subdomain.create({ data: { subdomain: `${tag}-${k}` } as any })).id)
    await ok("each site creates its own SAMPLE customer, stamped with its site", async () => {
      current = sites[0]; await db.customer.create({ data: { email: `${tag}-a@example.org`, firstName: "SAMPLE" } })
      current = sites[1]; await db.customer.create({ data: { email: `${tag}-b@example.org`, firstName: "SAMPLE" } })
      const rows = await base.customer.findMany({ where: { email: { startsWith: tag } }, select: { email: true, tenantId: true } })
      assert.deepEqual(rows.map((r: any) => [r.email.slice(-13, -12), r.tenantId]).sort(), [["a", sites[0]], ["b", sites[1]]])
    })
    await ok("a site lists only its own customers", async () => {
      current = sites[0]
      const seen = await db.customer.findMany({ where: { email: { startsWith: tag } }, select: { email: true } })
      assert.deepEqual(seen.map((r: any) => r.email), [`${tag}-a@example.org`])
    })
    await ok("a site cannot update another site's customer", async () => {
      current = sites[0]
      const r = await db.customer.updateMany({ where: { email: `${tag}-b@example.org` }, data: { firstName: "CHANGED" } })
      assert.equal(r.count, 0)
    })
    await ok("a lookup by email (unique per site) finds this site's customer only, as the Customers API does", async () => {
      current = sites[0]
      assert.equal((await db.customer.findUnique({ where: { email: `${tag}-a@example.org` } }))?.tenantId, sites[0])
      assert.equal(await db.customer.findUnique({ where: { email: `${tag}-b@example.org` } }), null)
    })
    await ok("the same email may be a customer on two sites", async () => {
      current = sites[1]; await db.customer.create({ data: { email: `${tag}-a@example.org`, firstName: "SAMPLE" } })
      assert.equal((await db.customer.findUnique({ where: { email: `${tag}-a@example.org` } }))?.tenantId, sites[1])
    })
    await ok("a request with no site is refused for site data", async () => {
      current = NO_SITE
      await assert.rejects(db.customer.findMany({ take: 1 }), /no site/)
    })
  } finally {
    const c = await base.customer.deleteMany({ where: { email: { startsWith: tag } } })
    const s = await base.subdomain.deleteMany({ where: { subdomain: { startsWith: tag } } })
    const left = (await base.customer.count({ where: { email: { startsWith: tag } } })) + (await base.subdomain.count({ where: { subdomain: { startsWith: tag } } }))
    console.log(`removed ${c.count} SAMPLE customers and ${s.count} SAMPLE sites; ${left} left`)
    await base.$disconnect(); await pool.end()
  }
  console.log(`${n} checks passed`)
}
main().catch((e) => { console.error(e); process.exit(1) })
