/**
 * Scoped Puck Configuration
 *
 * Creates area-specific Puck configurations with component restrictions
 * and permission-based filtering.
 */

import type { Config } from '@puckeditor/core';
import type { AuthenticatedAreaConfig } from '../authenticated-routes/types';
import { getAreaConfig } from '../authenticated-routes/config';

/**
 * Area-specific component restrictions
 */
export interface AreaComponentConfig {
  /** Components allowed in this area (empty = all allowed) */
  allowedComponents?: string[];
  /** Components explicitly denied in this area */
  deniedComponents?: string[];
  /** Component categories to show (empty = all shown) */
  allowedCategories?: string[];
  /** Categories to hide */
  deniedCategories?: string[];
  /** Custom category ordering for this area */
  categoryOrder?: string[];
  /** Additional components specific to this area */
  additionalComponents?: Record<string, Config['components'][string]>;
}

/**
 * Area component configurations
 */
const areaComponentConfigs: Record<string, AreaComponentConfig> = {
  // Dashboard area - user-facing, simpler components
  dashboard: {
    allowedCategories: ['content', 'layout', 'primitives'],
    deniedCategories: ['navigation', 'templates'], // No header/footer editing in dashboard pages
    deniedComponents: ['Header', 'Footer', 'NavMenu', 'NavMenuItem', 'NavLink'],
  },

  // App workspace - most components allowed
  app: {
    allowedCategories: ['content', 'layout', 'primitives', 'dashboard'],
    deniedCategories: ['navigation', 'templates'],
    deniedComponents: ['Header', 'Footer'],
  },

  // Admin area - full access to all components
  admin: {
    // No restrictions - admins can use everything
  },

  // Public pages - full access (managed by admins)
  public: {
    // No restrictions
  },
};

/**
 * Permission-based component restrictions
 */
export interface PermissionComponentRestrictions {
  /** Permission required to use this component */
  permission: string;
  /** Components that require this permission */
  components: string[];
}

/**
 * Components that require specific permissions
 */
const permissionRestrictions: PermissionComponentRestrictions[] = [
  {
    permission: 'pages.edit',
    components: [], // Base editing - no restrictions
  },
  {
    permission: 'pages.advanced',
    components: ['DataTable', 'StatsCard'], // Advanced components
  },
  {
    permission: 'puck-templates.edit',
    components: [
      'HeroSplitTemplate',
      'HeroCenteredTemplate',
      'FeaturesGridTemplate',
      'PricingTableTemplate',
      'TestimonialsTemplate',
      'CtaSectionTemplate',
      'HeaderTemplate',
      'FooterTemplate',
    ],
  },
];

/**
 * Get component restrictions for an area
 */
export function getAreaComponentConfig(areaId: string): AreaComponentConfig {
  return areaComponentConfigs[areaId] || {};
}

/**
 * Filter components based on area restrictions
 */
export function filterComponentsByArea(
  components: Config['components'],
  areaId: string
): Config['components'] {
  const config = getAreaComponentConfig(areaId);

  if (!config.allowedComponents && !config.deniedComponents) {
    return components;
  }

  const filtered: Config['components'] = {};

  for (const [name, component] of Object.entries(components)) {
    // Check if explicitly denied
    if (config.deniedComponents?.includes(name)) {
      continue;
    }

    // Check if must be in allowed list
    if (config.allowedComponents && !config.allowedComponents.includes(name)) {
      continue;
    }

    filtered[name] = component;
  }

  // Add any additional area-specific components
  if (config.additionalComponents) {
    Object.assign(filtered, config.additionalComponents);
  }

  return filtered;
}

/**
 * Filter categories based on area restrictions
 */
export function filterCategoriesByArea(
  categories: Config['categories'],
  areaId: string
): Config['categories'] {
  const config = getAreaComponentConfig(areaId);

  if (!categories) return categories;
  if (!config.allowedCategories && !config.deniedCategories) {
    return categories;
  }

  const filtered: NonNullable<Config['categories']> = {};

  for (const [name, category] of Object.entries(categories)) {
    // Check if explicitly denied
    if (config.deniedCategories?.includes(name)) {
      continue;
    }

    // Check if must be in allowed list
    if (config.allowedCategories && !config.allowedCategories.includes(name)) {
      continue;
    }

    filtered[name] = category;
  }

  return filtered;
}

/**
 * Filter components based on user permissions
 */
export function filterComponentsByPermissions(
  components: Config['components'],
  userPermissions: Set<string>
): Config['components'] {
  // Super admin has all permissions
  if (userPermissions.has('*')) {
    return components;
  }

  const filtered: Config['components'] = {};

  for (const [name, component] of Object.entries(components)) {
    // Check if this component requires a permission
    const restriction = permissionRestrictions.find((r) =>
      r.components.includes(name)
    );

    if (restriction && !userPermissions.has(restriction.permission)) {
      // Check for wildcard permission (e.g., 'pages.*')
      const [resource] = restriction.permission.split('.');
      if (!userPermissions.has(`${resource}.*`)) {
        continue; // User doesn't have required permission
      }
    }

    filtered[name] = component;
  }

  return filtered;
}

/**
 * Create a scoped Puck configuration for an area
 */
export function createScopedConfig(
  baseConfig: Config,
  options: {
    areaId: string;
    userPermissions?: Set<string>;
  }
): Config {
  const { areaId, userPermissions } = options;

  // Start with base config
  let components = { ...baseConfig.components };
  let categories = baseConfig.categories ? { ...baseConfig.categories } : undefined;

  // Apply area restrictions
  components = filterComponentsByArea(components, areaId);
  if (categories) {
    categories = filterCategoriesByArea(categories, areaId);
  }

  // Apply permission restrictions
  if (userPermissions) {
    components = filterComponentsByPermissions(components, userPermissions);
  }

  // Update category component lists to only include available components
  if (categories) {
    const availableComponentNames = new Set(Object.keys(components));
    for (const category of Object.values(categories)) {
      if (category.components) {
        category.components = category.components.filter((name) =>
          availableComponentNames.has(name)
        );
      }
    }

    // Remove empty categories
    const nonEmptyCategories: NonNullable<Config['categories']> = {};
    for (const [name, category] of Object.entries(categories)) {
      if (category.components && category.components.length > 0) {
        nonEmptyCategories[name] = category;
      }
    }
    categories = nonEmptyCategories;
  }

  return {
    ...baseConfig,
    components,
    categories,
  };
}

/**
 * Validate that a slug is allowed for an area
 */
export function validateSlugForArea(slug: string, areaId: string): { valid: boolean; error?: string } {
  const area = getAreaConfig(areaId);
  if (!area) {
    return { valid: false, error: `Unknown area: ${areaId}` };
  }

  if (!area.puckPagesPath) {
    return { valid: false, error: `Area ${areaId} does not allow Puck pages` };
  }

  const expectedPrefix = area.puckPagesPath.replace(/^\//, '');
  if (!slug.startsWith(expectedPrefix)) {
    return {
      valid: false,
      error: `Slug must start with "${expectedPrefix}" for area ${areaId}`,
    };
  }

  return { valid: true };
}

/**
 * Get allowed path prefixes for creating pages
 */
export function getAllowedPathPrefixes(): Array<{ areaId: string; prefix: string; label: string }> {
  const areas = ['dashboard', 'app'];
  const prefixes: Array<{ areaId: string; prefix: string; label: string }> = [];

  for (const areaId of areas) {
    const area = getAreaConfig(areaId);
    if (area?.puckPagesPath) {
      prefixes.push({
        areaId,
        prefix: area.puckPagesPath,
        label: `${area.name} Pages`,
      });
    }
  }

  // Also allow public pages (root level)
  prefixes.push({
    areaId: 'public',
    prefix: '',
    label: 'Public Pages',
  });

  return prefixes;
}
