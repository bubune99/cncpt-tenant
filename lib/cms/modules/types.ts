/**
 * CMS Module System Types
 *
 * DB-driven module definitions that control admin navigation,
 * block palette, API route access, and storefront rendering.
 */

export interface ModuleManifest {
  adminNav?: ModuleNavContribution[]
  apiPrefixes?: string[]
  blockCategories?: string[]
  settingsGroups?: string[]
  permissionNamespaces?: string[]
  storefrontPaths?: string[]
  dependencies?: string[]
}

export interface ModuleNavContribution {
  group: string // "Main", "E-Commerce", "Content", "System"
  items: ModuleNavItem[]
}

export interface ModuleNavItem {
  name: string
  href: string
  icon: string // Lucide icon name
  badgeKey?: string
  helpKey?: string
}

export interface ResolvedModule {
  slug: string
  name: string
  description?: string
  icon?: string
  enabled: boolean
  builtIn: boolean
  manifest: ModuleManifest
  config: Record<string, unknown>
}

export interface ModulePreset {
  id: string
  name: string
  description: string
  icon: string
  enabledModules: string[]
  moduleConfigs?: Record<string, Record<string, unknown>>
}
