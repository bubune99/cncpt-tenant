/**
 * Module Presets
 *
 * Code-defined presets (not DB-stored).
 * UI convenience that writes enabled values to CmsModule rows.
 */

import type { ModulePreset } from "./types"
import { clearModuleCache } from "./registry"

export const MODULE_PRESETS: ModulePreset[] = [
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    description: "Full online store with products, orders, shipping, and blog.",
    icon: "ShoppingCart",
    enabledModules: ["core", "pages", "commerce", "media", "blog"],
  },
  {
    id: "headless-shopify",
    name: "Headless Shopify",
    description: "Shopify-powered storefront with CMS pages and blog.",
    icon: "ShoppingBag",
    enabledModules: ["core", "pages", "commerce", "media", "blog"],
    moduleConfigs: {
      commerce: { provider: "shopify" },
    },
  },
  {
    id: "portfolio",
    name: "Portfolio / Agency",
    description: "Pages, blog, media library, and contact forms.",
    icon: "Palette",
    enabledModules: ["core", "pages", "blog", "media", "forms"],
  },
  {
    id: "blog-publication",
    name: "Blog / Publication",
    description: "Content-focused with blog, pages, and email marketing.",
    icon: "FileText",
    enabledModules: ["core", "pages", "blog", "media", "email-marketing"],
  },
  {
    id: "full-cms",
    name: "Full CMS",
    description: "All modules enabled for maximum flexibility.",
    icon: "Layers",
    enabledModules: [
      "core",
      "pages",
      "commerce",
      "blog",
      "forms",
      "media",
      "events",
      "email-marketing",
    ],
  },
]

/**
 * Apply a preset -- sets enabled state for all modules and optionally updates config.
 */
export async function applyPreset(presetId: string): Promise<void> {
  const preset = MODULE_PRESETS.find((p) => p.id === presetId)
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`)
  }

  const { prisma } = await import("../db")

  // Get all modules
  const allModules = await prisma.cmsModule.findMany()

  for (const mod of allModules) {
    // Core is always enabled
    if (mod.slug === "core") continue

    const shouldEnable = preset.enabledModules.includes(mod.slug)
    const presetConfig = preset.moduleConfigs?.[mod.slug]

    await prisma.cmsModule.update({
      where: { id: mod.id },
      data: {
        enabled: shouldEnable,
        ...(presetConfig
          ? { config: JSON.parse(JSON.stringify(presetConfig)) }
          : {}),
      },
    })
  }

  clearModuleCache()
}
