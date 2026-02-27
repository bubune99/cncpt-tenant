/**
 * Navigation Assembly
 *
 * Collects adminNav contributions from all enabled modules,
 * groups by group name, preserves sort order.
 */

import type { ResolvedModule } from "./types"

export interface NavItem {
  name: string
  href: string
  icon: string
  badgeKey?: string
  helpKey?: string
}

export interface NavGroup {
  name: string
  items: NavItem[]
}

/** Desired display order for nav groups */
const GROUP_ORDER: Record<string, number> = {
  Main: 0,
  "E-Commerce": 1,
  Content: 2,
  System: 3,
}

/**
 * Assemble navigation groups from enabled modules.
 *
 * Merges all adminNav contributions, deduplicates by item name within a group,
 * and returns sorted NavGroup[].
 */
export function assembleNavigation(modules: ResolvedModule[]): NavGroup[] {
  const groupMap = new Map<string, NavItem[]>()

  for (const mod of modules) {
    if (!mod.manifest.adminNav) continue

    for (const contribution of mod.manifest.adminNav) {
      const existing = groupMap.get(contribution.group) || []

      for (const item of contribution.items) {
        // Deduplicate by item name within a group
        if (!existing.some((e) => e.name === item.name)) {
          existing.push({
            name: item.name,
            href: item.href,
            icon: item.icon,
            badgeKey: item.badgeKey,
            helpKey: item.helpKey,
          })
        }
      }

      groupMap.set(contribution.group, existing)
    }
  }

  // Convert to array and sort by defined group order
  const groups: NavGroup[] = Array.from(groupMap.entries()).map(
    ([name, items]) => ({ name, items })
  )

  groups.sort(
    (a, b) => (GROUP_ORDER[a.name] ?? 99) - (GROUP_ORDER[b.name] ?? 99)
  )

  return groups
}
