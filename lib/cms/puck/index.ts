/**
 * Puck Library Module
 *
 * Utilities for working with Puck in authenticated areas.
 */

// Scoped configuration
export {
  type AreaComponentConfig,
  type PermissionComponentRestrictions,
  getAreaComponentConfig,
  filterComponentsByArea,
  filterCategoriesByArea,
  filterComponentsByPermissions,
  createScopedConfig,
  validateSlugForArea,
  getAllowedPathPrefixes,
} from './scoped-config';

// Permission system
export {
  type PuckUserRole,
  type PuckPermissionContext,
  type ComponentPermissionOverride,
  rolePermissions,
  componentPermissionOverrides,
  roleAtLeast,
  getComponentPermissions,
  createResolvePermissions,
  getGlobalPermissions,
  determineUserRole,
  createPuckUiState,
} from './permissions';
