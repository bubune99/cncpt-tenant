/**
 * Module Registry
 *
 * DB read with in-memory cache (60s TTL).
 * Reads CmsModule rows and resolves them into ResolvedModule objects.
 *
 * Tenant-aware: accepts optional tenantId to apply subscription tier
 * restrictions (allowed_modules in SubscriptionTier.limits).
 */

import type { ResolvedModule, ModuleManifest } from "./types"

/* ------------------------------------------------------------------ */
/*  Cache                                                              */
/* ------------------------------------------------------------------ */

let cache: ResolvedModule[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60_000 // 60 seconds

// Per-tenant cache for resolved modules (tenantId -> modules)
const tenantCache = new Map<number, { modules: ResolvedModule[]; ts: number }>()

export function clearModuleCache(): void {
  cache = null
  cacheTimestamp = 0
  tenantCache.clear()
}

/* ------------------------------------------------------------------ */
/*  Core Queries                                                       */
/* ------------------------------------------------------------------ */

/**
 * Get all modules (enabled and disabled) from the global CmsModule table.
 */
export async function getModuleRegistry(): Promise<ResolvedModule[]> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cache
  }

  const { prisma } = await import("../db")

  const rows = await prisma.cmsModule.findMany({
    orderBy: { sortOrder: "asc" },
  })

  const resolved: ResolvedModule[] = rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    enabled: row.enabled,
    builtIn: row.builtIn,
    manifest: (row.manifest ?? {}) as ModuleManifest,
    config: (row.config ?? {}) as Record<string, unknown>,
  }))

  cache = resolved
  cacheTimestamp = Date.now()
  return resolved
}

/**
 * Get only enabled modules (global, no tenant restriction).
 */
export async function getEnabledModules(): Promise<ResolvedModule[]> {
  const all = await getModuleRegistry()
  return all.filter((m) => m.enabled)
}

/**
 * Get enabled modules for a specific tenant, applying subscription tier
 * restrictions via allowed_modules in SubscriptionTier.limits.
 *
 * Resolution order:
 *   1. Global CmsModule.enabled must be true
 *   2. If tenant has a subscription tier with limits.allowed_modules,
 *      the module slug must be in that list
 *   3. Core module is always included regardless of restrictions
 *
 * @param tenantId - The subdomain ID (Subdomain.id)
 */
export async function getEnabledModulesForTenant(
  tenantId: number
): Promise<ResolvedModule[]> {
  // Check per-tenant cache
  const cached = tenantCache.get(tenantId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.modules
  }

  const globalModules = await getEnabledModules()

  // Look up the tenant's subscription tier to check allowed_modules
  const allowedSlugs = await getTenantAllowedModules(tenantId)

  let resolved: ResolvedModule[]

  if (allowedSlugs === null) {
    // No restriction - all globally enabled modules are available
    resolved = globalModules
  } else {
    // Filter to only modules allowed by the subscription tier
    // Core is always included
    resolved = globalModules.filter(
      (m) => m.slug === "core" || allowedSlugs.includes(m.slug)
    )
  }

  tenantCache.set(tenantId, { modules: resolved, ts: Date.now() })
  return resolved
}

/**
 * Check if a specific module is enabled (global check).
 */
export async function isModuleEnabled(slug: string): Promise<boolean> {
  const all = await getModuleRegistry()
  const mod = all.find((m) => m.slug === slug)
  // If module doesn't exist in DB, treat as enabled (backward compat)
  return mod ? mod.enabled : true
}

/**
 * Check if a specific module is enabled for a tenant.
 */
export async function isModuleEnabledForTenant(
  slug: string,
  tenantId: number
): Promise<boolean> {
  const modules = await getEnabledModulesForTenant(tenantId)
  const mod = modules.find((m) => m.slug === slug)
  return mod ? mod.enabled : true
}

/**
 * Get module config by slug.
 */
export async function getModuleConfig(
  slug: string
): Promise<Record<string, unknown> | null> {
  const all = await getModuleRegistry()
  const mod = all.find((m) => m.slug === slug)
  return mod?.config ?? null
}

/* ------------------------------------------------------------------ */
/*  Subscription Tier Resolution                                       */
/* ------------------------------------------------------------------ */

/**
 * Look up the tenant's subscription tier and extract allowed_modules.
 * Returns null if no restriction (all modules allowed).
 * Returns string[] of allowed module slugs if restricted.
 *
 * Chain: Subdomain -> TeamSubdomain -> Team -> SubscriptionTier -> limits.allowed_modules
 */
async function getTenantAllowedModules(
  tenantId: number
): Promise<string[] | null> {
  try {
    const { prisma } = await import("../db")

    // Find the subdomain
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: tenantId },
      select: { subdomain: true },
    })

    if (!subdomain) return null

    // Find the team that owns this subdomain
    const teamSubdomain = await prisma.teamSubdomain.findFirst({
      where: { subdomain: subdomain.subdomain },
      select: {
        team: {
          select: {
            tier: {
              select: { limits: true },
            },
          },
        },
      },
    })

    if (!teamSubdomain?.team?.tier?.limits) return null

    const limits = teamSubdomain.team.tier.limits as Record<string, unknown>
    const allowedModules = limits.allowed_modules

    if (!Array.isArray(allowedModules)) return null

    return allowedModules as string[]
  } catch {
    // If any lookup fails, don't restrict
    return null
  }
}
