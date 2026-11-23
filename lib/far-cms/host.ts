/**
 * CNCPT hosts the shared far-cms code. Import this module FIRST in every route file that re-exports a far-cms page or
 * route (before anything from @far-cms/cms), so the package's database client and permissions are CNCPT's:
 *  - the client is generated from prisma/far-cms/schema.prisma and adds the request's site to every query on a
 *    site-owned model (@far-cms/db scopedRequest); a request on a site host that names no known site is refused;
 *  - who may do what comes from CNCPT's own rule (site owner or team, canAccessSubdomain) mapped by
 *    ./site-permissions.
 * Card 10 (c645e053) step 3.
 */
import "server-only"
import { headers } from "next/headers"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/lib/generated/far-cms-client"
import { scopedRequest, NO_SITE } from "@far-cms/db"
import { setHostClient, setHostMultiSite } from "@far-cms/cms/src/lib/db/host-client"
import { setHostPermissions, permissionSet } from "@far-cms/cms/src/lib/permissions/host-permissions"
import { stackServerApp } from "@/lib/cms/stack"
import { canAccessSubdomain } from "@/lib/team-auth"
import { isSuperAdmin } from "@/lib/super-admin"
import { OWNED_MODELS, SITE_RELATIONS, SITE_UNIQUES } from "./owned-models"
import { sitePermissions } from "./site-permissions"

const g = globalThis as unknown as { __cncptFarCms?: { base: PrismaClient } }

function baseClient(): PrismaClient {
  if (g.__cncptFarCms) return g.__cncptFarCms.base
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, idleTimeoutMillis: 5_000 })
  const base = new PrismaClient({ adapter: new PrismaPg(pool) })
  g.__cncptFarCms = { base }
  return base
}

const SITE_TTL_MS = 60_000
const siteIds = new Map<string, { id: number | null; until: number }>()

/** The request's site key (x-subdomain, set by middleware and stripped from anything a caller sends), or null outside a request. */
async function siteKey(): Promise<string | null | typeof NO_SITE> {
  let h: Headers
  try { h = await headers() } catch { return null }
  return h.get("x-subdomain") ?? NO_SITE
}

async function siteId(): Promise<number | null | typeof NO_SITE> {
  const key = await siteKey()
  if (key === null || key === NO_SITE) return key
  const hit = siteIds.get(key)
  if (hit && hit.until > Date.now()) return hit.id ?? NO_SITE
  const row = await baseClient().subdomain.findUnique({ where: { subdomain: key }, select: { id: true } })
  siteIds.set(key, { id: row?.id ?? null, until: Date.now() + SITE_TTL_MS })
  return row?.id ?? NO_SITE
}

// Many sites share this server: the package must not answer site settings from a server-wide cache.
setHostMultiSite()
setHostClient(scopedRequest(baseClient(), { site: siteId, owned: OWNED_MODELS, uniques: SITE_UNIQUES, relations: SITE_RELATIONS }))

setHostPermissions(async (userId) => {
  const key = await siteKey()
  if (key === null || key === NO_SITE) return null
  const stackUser = await stackServerApp.getUser()
  if (!stackUser) return null
  const [access, superAdmin] = await Promise.all([canAccessSubdomain(stackUser.id, key, "edit"), isSuperAdmin(stackUser.id)])
  const list = sitePermissions(access, superAdmin)
  return list ? permissionSet(userId, stackUser.primaryEmail ?? "", list, stackUser.displayName ?? null) : null
})
