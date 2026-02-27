/**
 * Block Palette Integration
 *
 * Collects blockCategories from enabled modules into a Set
 * for filtering the block palette.
 */

import type { ResolvedModule } from "./types"

/**
 * Collect all block category IDs from enabled modules.
 *
 * When no modules have blockCategories defined, returns null
 * to indicate "show all" (backward compatible).
 */
export function getEnabledBlockCategories(
  modules: ResolvedModule[]
): Set<string> | null {
  const categories = new Set<string>()
  let anyDefined = false

  for (const mod of modules) {
    if (mod.manifest.blockCategories) {
      anyDefined = true
      for (const cat of mod.manifest.blockCategories) {
        categories.add(cat)
      }
    }
  }

  return anyDefined ? categories : null
}
