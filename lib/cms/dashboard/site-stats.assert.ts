/**
 * A site's CMS dashboard shows that site's figures (walk 2026-11-20 on dzidzor.cncptweb.com/admin):
 * the dashboard said Customers 3 while Customers said 0 people. /api/cms/admin/stats-simple counted
 * every user account on the platform (User has no tenant scoping) and showed it as Customers. Each
 * count now names the site explicitly. Run: tsx lib/cms/dashboard/site-stats.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { siteStatsQueries } from "./site-stats"

const q = siteStatsQueries(7)
for (const k of ["products", "orders", "customers", "posts"] as const) assert.deepEqual(q[k], { where: { tenantId: 7 } }, k)
assert.throws(() => siteStatsQueries(0)); assert.throws(() => siteStatsQueries(-1)); assert.throws(() => siteStatsQueries(1.5))

const route = readFileSync(new URL("../../../app/api/cms/admin/stats-simple/route.ts", import.meta.url), "utf8")
assert.match(route, /request\.headers\.get\('x-subdomain'\)/, "the site comes from the server-set header")
assert.match(route, /prisma\.customer\.count\(q\.customers\)/, "customers are counted from Customer")
assert.doesNotMatch(route, /prisma\.user\.count\(\)/, "staff accounts are not counted as customers")
const widgets = readFileSync(new URL("../../../components/cms/admin/overview/overview-widgets.tsx", import.meta.url), "utf8")
assert.doesNotMatch(widgets, /\['Customers', s\?\.totalUsers/, "Store snapshot's Customers is customers")
assert.doesNotMatch(widgets, /customers = data\.stats\?\.totalUsers/, "Sales summary's Customers is customers")
const page = readFileSync(new URL("../../../app/s/[subdomain]/admin/page.tsx", import.meta.url), "utf8")
assert.doesNotMatch(page, /setStats\(\{ totalUsers: 0/, "a failed load is not shown as zeros")
assert.match(widgets, /value === null \? '—'/, "unknown figures show a dash")
console.log("ok - a site's dashboard counts that site's products, orders, customers and posts\n\n1 checks passed")
