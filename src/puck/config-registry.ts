/**
 * Puck Config Registry
 *
 * Central registry for all Puck configurations used in the CMS.
 * Used for template compatibility checking and config discovery.
 */

import type { Config } from '@measured/puck'
import { pagesPuckConfig } from './pages/config'
import { withBlocks, blocksComponents, blocksCategories } from './blocks'

// Re-export blocks for convenience
export { withBlocks, blocksComponents, blocksCategories } from './blocks'
export * from './blocks'

/**
 * All available Puck config names
 */
export const PUCK_CONFIG_NAMES = [
  'pages',
  'email',
  'ecommerce',
  'plugin',
  'layout',
  'dashboard',
] as const

export type PuckConfigName = (typeof PUCK_CONFIG_NAMES)[number]

/**
 * Human-readable labels for each config
 */
export const PUCK_CONFIG_LABELS: Record<PuckConfigName, string> = {
  pages: 'Pages',
  email: 'Email Templates',
  ecommerce: 'E-commerce',
  plugin: 'Plugin UI',
  layout: 'Layouts',
  dashboard: 'Dashboard',
}

/**
 * Config metadata for UI display
 */
export interface PuckConfigMeta {
  name: PuckConfigName
  label: string
  description: string
  icon?: string
}

export const PUCK_CONFIG_META: PuckConfigMeta[] = [
  {
    name: 'pages',
    label: 'Pages',
    description: 'Components for website pages',
    icon: 'layout',
  },
  {
    name: 'email',
    label: 'Email Templates',
    description: 'Components for email templates',
    icon: 'mail',
  },
  {
    name: 'ecommerce',
    label: 'E-commerce',
    description: 'Components for product pages and catalogs',
    icon: 'shopping-cart',
  },
  {
    name: 'plugin',
    label: 'Plugin UI',
    description: 'Components for plugin interfaces',
    icon: 'puzzle',
  },
  {
    name: 'layout',
    label: 'Layouts',
    description: 'Layout components for page structure',
    icon: 'columns',
  },
  {
    name: 'dashboard',
    label: 'Dashboard',
    description: 'Components for admin dashboards',
    icon: 'chart-bar',
  },
]

/**
 * Registry of all available Puck configs
 * Add new configs here as they are created
 */
const configRegistry: Partial<Record<PuckConfigName, Config>> = {
  pages: pagesPuckConfig,
  // Add other configs as they are implemented:
  // email: emailPuckConfig,
  // ecommerce: ecommercePuckConfig,
  // plugin: pluginPuckConfig,
  // layout: layoutPuckConfig,
  // dashboard: dashboardPuckConfig,
}

/**
 * Get a Puck config by name
 */
export function getConfigByName(name: PuckConfigName): Config | null {
  return configRegistry[name] || null
}

/**
 * Check if a config exists
 */
export function hasConfig(name: string): name is PuckConfigName {
  return PUCK_CONFIG_NAMES.includes(name as PuckConfigName)
}

/**
 * Get all available config names that have implementations
 */
export function getAvailableConfigs(): PuckConfigName[] {
  return Object.keys(configRegistry) as PuckConfigName[]
}

/**
 * Get config metadata by name
 */
export function getConfigMeta(name: PuckConfigName): PuckConfigMeta | null {
  return PUCK_CONFIG_META.find((meta) => meta.name === name) || null
}

/**
 * Check if a template is compatible with a given config
 * based on shared component types
 */
export function isTemplateCompatible(
  templateConfigs: string[],
  targetConfig: string
): boolean {
  return templateConfigs.includes(targetConfig)
}

/**
 * Get component names from a config
 */
export function getConfigComponentNames(name: PuckConfigName): string[] {
  const config = getConfigByName(name)
  if (!config) return []
  return Object.keys(config.components || {})
}

/**
 * Find configs that share components with the given config
 * Useful for suggesting template compatibility
 */
export function findCompatibleConfigs(name: PuckConfigName): PuckConfigName[] {
  const sourceComponents = new Set(getConfigComponentNames(name))
  const compatible: PuckConfigName[] = []

  for (const configName of getAvailableConfigs()) {
    if (configName === name) continue

    const targetComponents = getConfigComponentNames(configName)
    const hasSharedComponents = targetComponents.some((comp) =>
      sourceComponents.has(comp)
    )

    if (hasSharedComponents) {
      compatible.push(configName)
    }
  }

  return compatible
}

/**
 * Get a Puck config with pre-built blocks included
 */
export function getConfigWithBlocks(name: PuckConfigName): Config | null {
  const config = getConfigByName(name)
  if (!config) return null
  return withBlocks(config)
}

/**
 * Create a landing page config with all blocks
 */
export function createLandingPageConfig(): Config {
  return {
    components: blocksComponents,
    categories: blocksCategories,
  } as Config
}

export default configRegistry
