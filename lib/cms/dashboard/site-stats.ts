/**
 * The filters for a site's dashboard counts: always that site's rows, named explicitly rather than
 * left to the tenant middleware (which does not scope every table, and skips scoping outside a site).
 * Pure; check: site-stats.assert.ts.
 */
export function siteStatsQueries(tenantId: number) {
  if (!Number.isInteger(tenantId) || tenantId <= 0) throw new Error(`invalid tenant id: ${tenantId}`)
  const where = { tenantId }
  return { products: { where }, orders: { where }, customers: { where }, posts: { where } }
}
