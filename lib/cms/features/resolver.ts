/**
 * Feature Resolver (Server-Side)
 *
 * Resolves whether a feature is enabled for a given tenant.
 * Uses three layers:
 *   1. Feature definition defaults
 *   2. Global CmsModule enabled state (module-level only)
 *   3. Tenant-specific feature config override (Subdomain.featureConfig JSON)
 *   4. Subscription tier restrictions (SubscriptionTier.limits.allowed_modules)
 *
 * Results are cached per tenant for 60 seconds.
 */

import {
  ALL_FEATURES,
  buildDefaultFeatureConfig,
  getModuleFromFeatureKey,
  type FeatureDefinition,
} from "./definitions"

// ---------------------------------------------------------------------------
//  Cache
// ---------------------------------------------------------------------------

interface TenantFeatureCache {
  config: Record<string, boolean>
  ts: number
}

const cache = new Map<string, TenantFeatureCache>() // key = tenantId or "global"
const CACHE_TTL = 60_000

export function clearFeatureCache(tenantId?: number): void {
  if (tenantId !== undefined) {
    cache.delete(String(tenantId))
  } else {
    cache.clear()
  }
}

// ---------------------------------------------------------------------------
//  Core resolver
// ---------------------------------------------------------------------------

/**
 * Get the resolved feature config for a tenant.
 * Returns a Record<featureKey, boolean> with every known feature.
 */
export async function resolveFeatureConfig(
  tenantId?: number
): Promise<Record<string, boolean>> {
  const cacheKey = tenantId !== undefined ? String(tenantId) : "global"
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.config
  }

  // Start with definition defaults
  const config = buildDefaultFeatureConfig()

  // Layer 2: Apply global CmsModule enabled state
  try {
    const { prisma } = await import("../db")
    const modules = await prisma.cmsModule.findMany({
      select: { slug: true, enabled: true },
    })

    for (const mod of modules) {
      if (mod.slug in config) {
        config[mod.slug] = mod.enabled
      }
      // If a module is disabled globally, disable all its sub-features
      if (!mod.enabled) {
        for (const feature of ALL_FEATURES) {
          if (feature.module === mod.slug) {
            config[feature.key] = false
          }
        }
      }
    }
  } catch {
    // If DB is unavailable, continue with defaults
  }

  // Layer 3: Apply tenant-specific overrides
  if (tenantId !== undefined) {
    try {
      const { prisma } = await import("../db")
      const subdomain = await prisma.subdomain.findUnique({
        where: { id: tenantId },
        select: {
          featureConfig: true,
          subdomain: true,
        },
      })

      if (subdomain?.featureConfig) {
        const overrides = subdomain.featureConfig as Record<string, boolean>
        for (const [key, value] of Object.entries(overrides)) {
          if (key in config && typeof value === "boolean") {
            // Cannot override locked features to false
            const def = ALL_FEATURES.find((f) => f.key === key)
            if (def?.locked && value === false) continue
            config[key] = value
          }
        }
      }

      // Layer 4: Subscription tier restrictions
      const allowedModules = await getTenantAllowedModules(
        tenantId,
        subdomain?.subdomain
      )
      if (allowedModules !== null) {
        for (const feature of ALL_FEATURES) {
          if (feature.isModule && feature.key !== "core") {
            const moduleSlug = feature.moduleSlug || feature.key
            if (!allowedModules.includes(moduleSlug)) {
              config[feature.key] = false
              // Also disable sub-features
              for (const sub of ALL_FEATURES) {
                if (sub.module === feature.key) {
                  config[sub.key] = false
                }
              }
            }
          }
        }
      }
    } catch {
      // If tenant lookup fails, continue with global config
    }
  }

  // Enforce: if a module is off, all its sub-features must be off
  for (const feature of ALL_FEATURES) {
    if (feature.module && !config[feature.module]) {
      config[feature.key] = false
    }
  }

  // Cache
  cache.set(cacheKey, { config, ts: Date.now() })
  return config
}

/**
 * Check if a specific feature is enabled.
 *
 * @param key - Feature key like "commerce" or "commerce.reviews"
 * @param tenantId - Optional tenant ID for per-tenant resolution
 */
export async function hasFeature(
  key: string,
  tenantId?: number
): Promise<boolean> {
  const config = await resolveFeatureConfig(tenantId)

  // Direct match
  if (key in config) {
    return config[key]
  }

  // If the key is a sub-feature and the parent module is off, it's off
  const moduleKey = getModuleFromFeatureKey(key)
  if (moduleKey !== key && moduleKey in config) {
    return config[moduleKey]
  }

  // Unknown feature: default to enabled (backward compat)
  return true
}

/**
 * Check multiple features at once. Returns true only if ALL are enabled.
 */
export async function hasAllFeatures(
  keys: string[],
  tenantId?: number
): Promise<boolean> {
  const config = await resolveFeatureConfig(tenantId)
  return keys.every((key) => config[key] !== false)
}

/**
 * Check multiple features at once. Returns true if ANY is enabled.
 */
export async function hasAnyFeature(
  keys: string[],
  tenantId?: number
): Promise<boolean> {
  const config = await resolveFeatureConfig(tenantId)
  return keys.some((key) => config[key] !== false)
}

/**
 * Get all enabled feature keys for a tenant.
 */
export async function getEnabledFeatures(
  tenantId?: number
): Promise<string[]> {
  const config = await resolveFeatureConfig(tenantId)
  return Object.entries(config)
    .filter(([, v]) => v)
    .map(([k]) => k)
}

/**
 * Get all feature definitions with their resolved enabled state.
 */
export async function getResolvedFeatures(
  tenantId?: number
): Promise<(FeatureDefinition & { enabled: boolean })[]> {
  const config = await resolveFeatureConfig(tenantId)
  return ALL_FEATURES.map((def) => ({
    ...def,
    enabled: config[def.key] ?? def.defaultEnabled,
  }))
}

// ---------------------------------------------------------------------------
//  Subscription tier lookup (mirrors registry.ts but decoupled)
// ---------------------------------------------------------------------------

async function getTenantAllowedModules(
  tenantId: number,
  subdomainName?: string
): Promise<string[] | null> {
  try {
    const { prisma } = await import("../db")

    const name =
      subdomainName ??
      (
        await prisma.subdomain.findUnique({
          where: { id: tenantId },
          select: { subdomain: true },
        })
      )?.subdomain

    if (!name) return null

    const teamSubdomain = await prisma.teamSubdomain.findFirst({
      where: { subdomain: name },
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
    const allowed = limits.allowed_modules

    if (!Array.isArray(allowed)) return null
    return allowed as string[]
  } catch {
    return null
  }
}
