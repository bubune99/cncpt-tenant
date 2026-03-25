/**
 * Feature Configuration API
 *
 * GET   - Get resolved feature config (all features with their enabled state)
 * PATCH - Toggle a feature or set multiple features at once
 * PUT   - Replace the entire feature config (used by presets)
 */

import { NextResponse } from "next/server"
import { prisma, getCurrentTenant } from "@/lib/cms/db"
import {
  resolveFeatureConfig,
  clearFeatureCache,
  ALL_FEATURES,
  getResolvedFeatures,
  getSubFeatures,
  MODULE_FEATURES,
} from "@/lib/cms/features"
import { withPermission } from "@/lib/cms/permissions/middleware"

/**
 * GET /api/cms/admin/features
 *
 * Returns the resolved feature config for the current tenant
 * plus metadata about each feature for the settings UI.
 */
export const GET = withPermission('settings.view', async () => {
  const tenantId = getCurrentTenant()
  const config = await resolveFeatureConfig(tenantId ?? undefined)
  const features = await getResolvedFeatures(tenantId ?? undefined)

  // Group features for the UI
  const modules = features.filter((f) => f.isModule)
  const grouped: Record<
    string,
    { module: (typeof modules)[0]; subFeatures: (typeof features)[0][] }
  > = {}

  for (const mod of modules) {
    grouped[mod.key] = {
      module: mod,
      subFeatures: features.filter((f) => f.module === mod.key),
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      config,
      features: grouped,
    },
  })
})

/**
 * PATCH /api/cms/admin/features
 *
 * Toggle one or more features.
 * Body: { key: string, enabled: boolean } | { features: Record<string, boolean> }
 */
export const PATCH = withPermission('settings.edit', async (request) => {
  const tenantId = getCurrentTenant()
  const body = await request.json()

  let updates: Record<string, boolean>

  if ("key" in body && "enabled" in body) {
    // Single feature toggle
    const { key, enabled } = body as { key: string; enabled: boolean }

    // Validate feature exists
    const feature = ALL_FEATURES.find((f) => f.key === key)
    if (!feature) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "UNKNOWN_FEATURE", message: `Unknown feature: ${key}` },
        },
        { status: 400 }
      )
    }

    // Cannot disable locked features
    if (feature.locked && !enabled) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FEATURE_LOCKED",
            message: `${feature.name} cannot be disabled`,
          },
        },
        { status: 400 }
      )
    }

    updates = { [key]: enabled }

    // If disabling a module, also disable its sub-features
    if (feature.isModule && !enabled) {
      const subs = getSubFeatures(key)
      for (const sub of subs) {
        updates[sub.key] = false
      }
    }

    // If enabling a sub-feature, ensure its parent module is enabled
    if (!feature.isModule && feature.module && enabled) {
      updates[feature.module] = true
    }
  } else if ("features" in body) {
    // Bulk update
    updates = body.features as Record<string, boolean>
  } else {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_BODY",
          message: "Expected { key, enabled } or { features: {...} }",
        },
      },
      { status: 400 }
    )
  }

  // Write the feature config to the tenant
  await writeFeatureConfig(tenantId, updates)

  // Also sync module-level changes to CmsModule table for backward compat
  await syncModuleTable(updates)

  // Clear cache
  clearFeatureCache(tenantId ?? undefined)

  // Return updated config
  const newConfig = await resolveFeatureConfig(tenantId ?? undefined)

  return NextResponse.json({
    ok: true,
    data: { config: newConfig },
  })
})

/**
 * PUT /api/cms/admin/features
 *
 * Replace the entire feature config (preset application).
 * Body: { config: Record<string, boolean> }
 */
export const PUT = withPermission('settings.edit', async (request) => {
  const tenantId = getCurrentTenant()
  const body = await request.json()
  const { config } = body as { config: Record<string, boolean> }

  if (!config || typeof config !== "object") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_BODY", message: "Expected { config: {...} }" },
      },
      { status: 400 }
    )
  }

  // Write full config
  if (tenantId) {
    await prisma.subdomain.update({
      where: { id: tenantId },
      data: { featureConfig: config },
    })
  }

  // Sync to CmsModule table
  await syncModuleTable(config)

  clearFeatureCache(tenantId ?? undefined)

  const newConfig = await resolveFeatureConfig(tenantId ?? undefined)

  return NextResponse.json({
    ok: true,
    data: { config: newConfig },
  })
})

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

/**
 * Merge updates into the tenant's featureConfig JSON field.
 */
async function writeFeatureConfig(
  tenantId: number | null,
  updates: Record<string, boolean>
): Promise<void> {
  if (!tenantId) {
    // If no tenant context, update the CmsModule table directly
    await syncModuleTable(updates)
    return
  }

  // Read current config
  const subdomain = await prisma.subdomain.findUnique({
    where: { id: tenantId },
    select: { featureConfig: true },
  })

  const existing = (subdomain?.featureConfig as Record<string, boolean>) ?? {}
  const merged = { ...existing, ...updates }

  await prisma.subdomain.update({
    where: { id: tenantId },
    data: { featureConfig: merged },
  })
}

/**
 * Sync module-level feature changes to the CmsModule table.
 * This maintains backward compatibility with the existing module system.
 */
async function syncModuleTable(
  updates: Record<string, boolean>
): Promise<void> {
  for (const mod of MODULE_FEATURES) {
    if (mod.key in updates && mod.moduleSlug) {
      try {
        await prisma.cmsModule.updateMany({
          where: { slug: mod.moduleSlug },
          data: { enabled: updates[mod.key] },
        })
      } catch {
        // Module might not exist in DB yet
      }
    }
  }

  // Clear the module system cache too
  const { clearModuleCache } = await import("@/lib/cms/modules/registry")
  clearModuleCache()
}
