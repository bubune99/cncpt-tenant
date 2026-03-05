/**
 * Feature Presets API
 *
 * GET  - List available presets
 * POST - Apply a preset to the current tenant
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma, getCurrentTenant } from "@/lib/cms/db"
import {
  FEATURE_PRESETS,
  getFeaturePreset,
  presetToFeatureConfig,
  clearFeatureCache,
  MODULE_FEATURES,
} from "@/lib/cms/features"
import { withTenant } from "@/lib/cms/api/tenant"

/**
 * GET /api/cms/admin/features/presets
 *
 * List all available vertical presets.
 */
export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  return NextResponse.json({
    ok: true,
    data: FEATURE_PRESETS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      enabledFeatures: p.enabledFeatures,
      tags: p.tags,
    })),
  })
  })
}

/**
 * POST /api/cms/admin/features/presets
 *
 * Apply a preset. Body: { presetId: string }
 */
export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
  const tenantId = getCurrentTenant()
  const body = await request.json()
  const { presetId } = body as { presetId: string }

  const preset = getFeaturePreset(presetId)
  if (!preset) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNKNOWN_PRESET",
          message: `Unknown preset: ${presetId}`,
        },
      },
      { status: 400 }
    )
  }

  const config = presetToFeatureConfig(preset)

  // Write to tenant
  if (tenantId) {
    await prisma.subdomain.update({
      where: { id: tenantId },
      data: { featureConfig: config },
    })
  }

  // Sync module table for backward compat
  for (const mod of MODULE_FEATURES) {
    if (mod.key in config && mod.moduleSlug) {
      try {
        await prisma.cmsModule.updateMany({
          where: { slug: mod.moduleSlug },
          data: { enabled: config[mod.key] },
        })
      } catch {
        // Module might not exist
      }
    }
  }

  // Clear all caches
  const { clearModuleCache } = await import("@/lib/cms/modules/registry")
  clearModuleCache()
  clearFeatureCache(tenantId ?? undefined)

  return NextResponse.json({
    ok: true,
    data: {
      preset: preset.name,
      config,
    },
  })
  })
}
