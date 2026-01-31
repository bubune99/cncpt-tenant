/**
 * Puck Permission System
 *
 * Role-based permissions for the Puck editor using
 * the resolvePermissions API.
 */

import type { Permissions } from '@puckeditor/core';

/**
 * User role types for Puck editor
 */
export type PuckUserRole = 'viewer' | 'editor' | 'admin' | 'super_admin';

/**
 * Permission context passed to Puck
 */
export interface PuckPermissionContext {
  /** User's role in the system */
  role: PuckUserRole;
  /** User's permission set from RBAC */
  permissions: Set<string>;
  /** Area being edited */
  areaId?: string;
  /** Whether user owns the page */
  isPageOwner?: boolean;
}

/**
 * Default permissions by role
 */
export const rolePermissions: Record<PuckUserRole, Permissions> = {
  viewer: {
    delete: false,
    drag: false,
    duplicate: false,
    edit: false,
    insert: false,
  },
  editor: {
    delete: true,
    drag: true,
    duplicate: true,
    edit: true,
    insert: true,
  },
  admin: {
    delete: true,
    drag: true,
    duplicate: true,
    edit: true,
    insert: true,
  },
  super_admin: {
    delete: true,
    drag: true,
    duplicate: true,
    edit: true,
    insert: true,
  },
};

/**
 * Component-specific permission overrides
 */
export interface ComponentPermissionOverride {
  /** Component ID */
  componentId: string;
  /** Minimum role required to use this component */
  minRole?: PuckUserRole;
  /** Specific permission required */
  requiredPermission?: string;
  /** Permission overrides for this component */
  permissions?: Partial<Permissions>;
}

/**
 * Component permission overrides
 */
export const componentPermissionOverrides: ComponentPermissionOverride[] = [
  // Templates require admin role
  {
    componentId: 'HeroSplitTemplate',
    minRole: 'admin',
  },
  {
    componentId: 'HeroCenteredTemplate',
    minRole: 'admin',
  },
  {
    componentId: 'FeaturesGridTemplate',
    minRole: 'admin',
  },
  {
    componentId: 'PricingTableTemplate',
    minRole: 'admin',
  },
  {
    componentId: 'TestimonialsTemplate',
    minRole: 'admin',
  },
  {
    componentId: 'CtaSectionTemplate',
    minRole: 'admin',
  },
  {
    componentId: 'HeaderTemplate',
    requiredPermission: 'pages.advanced',
  },
  {
    componentId: 'FooterTemplate',
    requiredPermission: 'pages.advanced',
  },
  // Header/Footer components require specific permissions
  {
    componentId: 'Header',
    requiredPermission: 'pages.advanced',
  },
  {
    componentId: 'Footer',
    requiredPermission: 'pages.advanced',
  },
  // Data components require advanced permissions
  {
    componentId: 'DataTable',
    requiredPermission: 'pages.advanced',
  },
  {
    componentId: 'StatsCard',
    minRole: 'admin',
  },
];

/**
 * Role hierarchy (higher index = higher privilege)
 */
const roleHierarchy: PuckUserRole[] = ['viewer', 'editor', 'admin', 'super_admin'];

/**
 * Check if a role meets the minimum requirement
 */
export function roleAtLeast(userRole: PuckUserRole, minRole: PuckUserRole): boolean {
  const userIndex = roleHierarchy.indexOf(userRole);
  const minIndex = roleHierarchy.indexOf(minRole);
  return userIndex >= minIndex;
}

/**
 * Get permissions for a specific component
 */
export function getComponentPermissions(
  componentId: string,
  context: PuckPermissionContext,
  basePermissions: Permissions
): Permissions {
  // Start with base permissions
  let permissions = { ...basePermissions };

  // Check for component-specific overrides
  const override = componentPermissionOverrides.find(
    (o) => o.componentId === componentId
  );

  if (override) {
    // Check minimum role
    if (override.minRole && !roleAtLeast(context.role, override.minRole)) {
      // User doesn't meet minimum role - deny all
      permissions = {
        delete: false,
        drag: false,
        duplicate: false,
        edit: false,
        insert: false,
      };
    }

    // Check required permission
    if (override.requiredPermission) {
      const hasPermission =
        context.permissions.has('*') ||
        context.permissions.has(override.requiredPermission) ||
        context.permissions.has(`${override.requiredPermission.split('.')[0]}.*`);

      if (!hasPermission) {
        permissions = {
          delete: false,
          drag: false,
          duplicate: false,
          edit: false,
          insert: false,
        };
      }
    }

    // Apply any specific permission overrides
    if (override.permissions) {
      const op = override.permissions;
      permissions = {
        delete: op.delete ?? permissions.delete,
        drag: op.drag ?? permissions.drag,
        duplicate: op.duplicate ?? permissions.duplicate,
        edit: op.edit ?? permissions.edit,
        insert: op.insert ?? permissions.insert,
      };
    }
  }

  return permissions;
}

/**
 * Create a resolvePermissions function for Puck components
 *
 * This is the main function you pass to component configs.
 * It dynamically determines permissions based on user role and context.
 *
 * Usage in component config:
 * ```ts
 * const componentConfig = {
 *   resolvePermissions: createResolvePermissions('MyComponent'),
 *   // ... other config
 * }
 * ```
 */
export function createResolvePermissions(componentId: string) {
  return (
    data: { props: Record<string, unknown>; readOnly?: Record<string, boolean> },
    params: {
      appState: {
        ui?: {
          userRole?: PuckUserRole;
          userPermissions?: string[];
          areaId?: string;
          isPageOwner?: boolean;
        };
      };
      permissions: Permissions;
      lastPermissions?: Permissions;
    }
  ): Permissions => {
    const { appState, permissions: basePermissions } = params;
    const ui = appState.ui || {};

    // Build context from app state
    const context: PuckPermissionContext = {
      role: ui.userRole || 'viewer',
      permissions: new Set(ui.userPermissions || []),
      areaId: ui.areaId,
      isPageOwner: ui.isPageOwner,
    };

    // Get role-based permissions
    const roleBasedPermissions = rolePermissions[context.role];

    // Merge with base permissions (base permissions come from global/component static permissions)
    const mergedBase: Permissions = {
      delete: basePermissions.delete ?? roleBasedPermissions.delete,
      drag: basePermissions.drag ?? roleBasedPermissions.drag,
      duplicate: basePermissions.duplicate ?? roleBasedPermissions.duplicate,
      edit: basePermissions.edit ?? roleBasedPermissions.edit,
      insert: basePermissions.insert ?? roleBasedPermissions.insert,
    };

    // Apply component-specific permissions
    return getComponentPermissions(componentId, context, mergedBase);
  };
}

/**
 * Get global Puck permissions for a user
 */
export function getGlobalPermissions(context: PuckPermissionContext): Permissions {
  return rolePermissions[context.role];
}

/**
 * Determine user role from RBAC permissions
 */
export function determineUserRole(permissions: Set<string>, roles: string[]): PuckUserRole {
  // Super admin check
  if (permissions.has('*') || roles.includes('super_admin')) {
    return 'super_admin';
  }

  // Admin check
  if (
    roles.includes('admin') ||
    roles.includes('store_manager') ||
    permissions.has('pages.*')
  ) {
    return 'admin';
  }

  // Editor check
  if (
    roles.includes('content_editor') ||
    permissions.has('pages.edit') ||
    permissions.has('pages.create')
  ) {
    return 'editor';
  }

  // Default to viewer
  return 'viewer';
}

/**
 * Create UI state for Puck with permission context
 */
export function createPuckUiState(
  permissions: Set<string>,
  roles: string[],
  options: {
    areaId?: string;
    isPageOwner?: boolean;
  } = {}
): {
  userRole: PuckUserRole;
  userPermissions: string[];
  areaId?: string;
  isPageOwner?: boolean;
} {
  return {
    userRole: determineUserRole(permissions, roles),
    userPermissions: Array.from(permissions),
    areaId: options.areaId,
    isPageOwner: options.isPageOwner,
  };
}
