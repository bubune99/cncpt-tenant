/**
 * Permission Checking Utilities
 * Core RBAC logic for checking user permissions
 */

import { prisma } from '../db'
import { PERMISSIONS, BUILT_IN_ROLES } from './constants'
import type {
  UserWithPermissions,
  RoleData,
  PermissionOverride,
  PermissionCheckResult,
  AuditAction,
} from './types'

export { PERMISSIONS, PERMISSION_GROUPS, BUILT_IN_ROLES } from './constants'
export type { Permission, BuiltInRoleName } from './constants'
export type * from './types'

/**
 * Get a user's complete permission set (roles + overrides) — optionally
 * scoped to a specific tenant.
 *
 * When `tenantId` is provided:
 *   - Only role assignments and permission overrides where
 *     `tenantId === <provided>` OR `tenantId === null` (global) are returned.
 *   - This is the correct mode for HTTP request handlers — every API route
 *     that resolves a tenant context (via x-subdomain or AsyncLocalStorage)
 *     should pass the current tenant.
 *   - Only roles scoped to the same tenant (or global) contribute permissions,
 *     preventing cross-tenant role escalation where Tenant X's "admin" role
 *     would otherwise grant access to Tenant Y's data.
 *
 * When `tenantId` is undefined:
 *   - Returns all role assignments and overrides regardless of tenant.
 *   - This mode is for CLI tools and platform/super-admin views that need the
 *     full picture of a user across tenants. Do NOT use this in a tenant-
 *     scoped HTTP handler — it leaks cross-tenant permissions.
 *
 * If a caller in a request handler doesn't have a tenantId on hand, prefer
 * `getCurrentTenant()` from `@/lib/cms/db` (AsyncLocalStorage helper) over
 * passing `undefined`.
 */
export async function getUserPermissions(
  userId: string,
  tenantId?: number | null,
): Promise<UserWithPermissions | null> {
  // Build the tenant filter for roleAssignments + permissions.
  //   - tenantId provided  → match assignments for THIS tenant + global (null)
  //   - tenantId undefined → no filter (CLI / platform admin view)
  const tenantFilter =
    tenantId !== undefined
      ? { OR: [{ tenantId: tenantId }, { tenantId: null }] }
      : undefined

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: {
        where: tenantFilter,
        include: {
          role: true,
        },
      },
      permissions: {
        where: {
          AND: [
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
            ...(tenantFilter ? [tenantFilter] : []),
          ],
        },
      },
    },
  })

  if (!user) return null

  // Extract roles
  const roles: RoleData[] = user.roleAssignments.map((ra) => ({
    id: ra.role.id,
    name: ra.role.name,
    displayName: ra.role.displayName,
    description: ra.role.description,
    permissions: ra.role.permissions as string[],
    isSystem: ra.role.isSystem,
  }))

  // Extract overrides
  const overrides: PermissionOverride[] = user.permissions.map((p) => ({
    id: p.id,
    permission: p.permission,
    type: p.type as 'GRANT' | 'DENY',
    expiresAt: p.expiresAt,
    reason: p.reason,
  }))

  // Compute effective permissions
  const permissions = computeEffectivePermissions(roles, overrides)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    permissions,
    roles,
    overrides,
  }
}

/**
 * Compute effective permissions from roles and overrides
 * Order: Collect from roles → Apply DENY overrides → Apply GRANT overrides
 */
function computeEffectivePermissions(
  roles: RoleData[],
  overrides: PermissionOverride[]
): Set<string> {
  const permissions = new Set<string>()

  // 1. Collect all permissions from roles
  for (const role of roles) {
    for (const perm of role.permissions) {
      permissions.add(perm)
    }
  }

  // 2. Apply DENY overrides (remove permissions)
  for (const override of overrides) {
    if (override.type === 'DENY') {
      permissions.delete(override.permission)
    }
  }

  // 3. Apply GRANT overrides (add permissions)
  for (const override of overrides) {
    if (override.type === 'GRANT') {
      permissions.add(override.permission)
    }
  }

  return permissions
}

/**
 * Check if a permission matches (including wildcards)
 * Examples:
 * - "products.view" matches "products.view" exactly
 * - "products.*" matches "products.view", "products.edit", etc.
 * - "*" matches everything
 */
function permissionMatches(userPermission: string, requiredPermission: string): boolean {
  // Exact match
  if (userPermission === requiredPermission) return true

  // Super admin wildcard
  if (userPermission === '*') return true

  // Resource wildcard (e.g., "products.*" matches "products.view")
  if (userPermission.endsWith('.*')) {
    const resource = userPermission.slice(0, -2) // Remove ".*"
    return requiredPermission.startsWith(resource + '.')
  }

  return false
}

/**
 * Check if user has a specific permission.
 *
 * Pass `tenantId` for tenant-scoped checks (recommended in request handlers).
 * Omit for platform-level / CLI checks. See getUserPermissions() for details.
 */
export async function hasPermission(
  userId: string,
  permission: string,
  tenantId?: number | null,
): Promise<PermissionCheckResult> {
  const userPerms = await getUserPermissions(userId, tenantId)

  if (!userPerms) {
    return { allowed: false, reason: 'User not found' }
  }

  return checkPermission(userPerms, permission)
}

/**
 * Check permission against a pre-loaded user permission set
 * (Use this in loops to avoid repeated DB queries)
 *
 * DENY overrides always take priority over any ALLOW, including wildcards.
 * A DENY on "products.view" blocks access even if the user has "*" from a role.
 */
export function checkPermission(
  userPerms: UserWithPermissions,
  requiredPermission: string
): PermissionCheckResult {
  // Check DENY overrides FIRST — they override everything including wildcards
  const denyOverride = userPerms.overrides.find(
    (o) => o.type === 'DENY' && (
      o.permission === requiredPermission ||
      // DENY with wildcards (e.g., "products.*" denies "products.view")
      permissionMatches(o.permission, requiredPermission)
    )
  )

  if (denyOverride) {
    return {
      allowed: false,
      reason: denyOverride.reason || 'Permission explicitly denied',
      source: {
        type: 'override',
        id: denyOverride.id,
      },
    }
  }

  // Check for super admin wildcard (only after confirming no DENY)
  if (userPerms.permissions.has('*')) {
    return {
      allowed: true,
      source: { type: 'super_admin' },
    }
  }

  // Check each user permission for a match
  for (const userPerm of userPerms.permissions) {
    if (permissionMatches(userPerm, requiredPermission)) {
      // Determine source (role or override)
      const grantOverride = userPerms.overrides.find(
        (o) => o.type === 'GRANT' && o.permission === userPerm
      )

      if (grantOverride) {
        return {
          allowed: true,
          source: {
            type: 'override',
            id: grantOverride.id,
          },
        }
      }

      // Find which role grants this
      for (const role of userPerms.roles) {
        if (role.permissions.some((p) => permissionMatches(p, requiredPermission))) {
          return {
            allowed: true,
            source: {
              type: 'role',
              id: role.id,
              name: role.displayName,
            },
          }
        }
      }

      return { allowed: true }
    }
  }

  return {
    allowed: false,
    reason: 'Permission not granted by any role',
  }
}

/**
 * Check multiple permissions at once
 * Returns true only if ALL permissions are granted
 */
export async function hasAllPermissions(
  userId: string,
  permissions: string[],
  tenantId?: number | null,
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId, tenantId)
  if (!userPerms) return false

  return permissions.every((p) => checkPermission(userPerms, p).allowed)
}

/**
 * Check multiple permissions at once
 * Returns true if ANY permission is granted
 */
export async function hasAnyPermission(
  userId: string,
  permissions: string[],
  tenantId?: number | null,
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId, tenantId)
  if (!userPerms) return false

  return permissions.some((p) => checkPermission(userPerms, p).allowed)
}

/**
 * Check if user is a CMS super admin (i.e. has the wildcard "*" permission
 * via a role or override). This is the *legacy CMS* notion of super admin
 * — it is distinct from the platform-level super admin tracked in the
 * `super_admins` table (see `lib/super-admin.ts → isSuperAdmin`).
 *
 * Both are valid bypass paths for tenant ownership checks; prefer the
 * platform helper for ownership/cross-tenant decisions.
 *
 * No `tenantId` argument: super-admin check inspects ALL of a user's
 * assignments to detect the wildcard regardless of tenant scope.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)
  return userPerms?.permissions.has('*') ?? false
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: {
  userId?: string
  userEmail?: string
  action: AuditAction
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: (params.details || {}) as any,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

/**
 * Seed built-in roles (run on app startup or migration)
 */
export async function seedBuiltInRoles(): Promise<void> {
  for (const [, roleData] of Object.entries(BUILT_IN_ROLES)) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: roleData.permissions,
        position: roleData.position,
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystem: roleData.isSystem,
        position: roleData.position,
      },
    })
  }
}

/**
 * Assign a role to a user
 */
export async function assignRole(params: {
  userId: string
  roleId: string
  assignedBy?: string
}): Promise<void> {
  await prisma.roleAssignment.create({
    data: {
      userId: params.userId,
      roleId: params.roleId,
      assignedBy: params.assignedBy,
    },
  })

  // Log the action
  if (params.assignedBy) {
    const assigner = await prisma.user.findUnique({
      where: { id: params.assignedBy },
      select: { email: true },
    })

    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
      select: { name: true },
    })

    await logAuditEvent({
      userId: params.assignedBy,
      userEmail: assigner?.email,
      action: 'role.assign',
      targetType: 'user',
      targetId: params.userId,
      details: {
        roleId: params.roleId,
        roleName: role?.name,
      },
    })
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(params: {
  userId: string
  roleId: string
  removedBy?: string
}): Promise<void> {
  await prisma.roleAssignment.delete({
    where: {
      userId_roleId: {
        userId: params.userId,
        roleId: params.roleId,
      },
    },
  })

  // Log the action
  if (params.removedBy) {
    const remover = await prisma.user.findUnique({
      where: { id: params.removedBy },
      select: { email: true },
    })

    const role = await prisma.role.findUnique({
      where: { id: params.roleId },
      select: { name: true },
    })

    await logAuditEvent({
      userId: params.removedBy,
      userEmail: remover?.email,
      action: 'role.remove',
      targetType: 'user',
      targetId: params.userId,
      details: {
        roleId: params.roleId,
        roleName: role?.name,
      },
    })
  }
}

/**
 * Grant a permission override to a user
 */
export async function grantPermission(params: {
  userId: string
  permission: string
  expiresAt?: Date
  reason?: string
  grantedBy?: string
}): Promise<void> {
  await prisma.userPermission.upsert({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission,
      },
    },
    update: {
      type: 'GRANT',
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.grantedBy,
    },
    create: {
      userId: params.userId,
      permission: params.permission,
      type: 'GRANT',
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.grantedBy,
    },
  })

  // Log the action
  if (params.grantedBy) {
    const granter = await prisma.user.findUnique({
      where: { id: params.grantedBy },
      select: { email: true },
    })

    await logAuditEvent({
      userId: params.grantedBy,
      userEmail: granter?.email,
      action: 'permission.grant',
      targetType: 'user',
      targetId: params.userId,
      details: {
        permission: params.permission,
        expiresAt: params.expiresAt?.toISOString(),
        reason: params.reason,
      },
    })
  }
}

/**
 * Deny a permission override to a user
 */
export async function denyPermission(params: {
  userId: string
  permission: string
  expiresAt?: Date
  reason?: string
  deniedBy?: string
}): Promise<void> {
  await prisma.userPermission.upsert({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission,
      },
    },
    update: {
      type: 'DENY',
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.deniedBy,
    },
    create: {
      userId: params.userId,
      permission: params.permission,
      type: 'DENY',
      expiresAt: params.expiresAt,
      reason: params.reason,
      grantedBy: params.deniedBy,
    },
  })

  // Log the action
  if (params.deniedBy) {
    const denier = await prisma.user.findUnique({
      where: { id: params.deniedBy },
      select: { email: true },
    })

    await logAuditEvent({
      userId: params.deniedBy,
      userEmail: denier?.email,
      action: 'permission.deny',
      targetType: 'user',
      targetId: params.userId,
      details: {
        permission: params.permission,
        expiresAt: params.expiresAt?.toISOString(),
        reason: params.reason,
      },
    })
  }
}

/**
 * Remove a permission override from a user
 */
export async function removePermissionOverride(params: {
  userId: string
  permission: string
  removedBy?: string
}): Promise<void> {
  const existing = await prisma.userPermission.findUnique({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission,
      },
    },
  })

  if (!existing) return

  await prisma.userPermission.delete({
    where: {
      userId_permission: {
        userId: params.userId,
        permission: params.permission,
      },
    },
  })

  // Log the action
  if (params.removedBy) {
    const remover = await prisma.user.findUnique({
      where: { id: params.removedBy },
      select: { email: true },
    })

    await logAuditEvent({
      userId: params.removedBy,
      userEmail: remover?.email,
      action: 'permission.remove',
      targetType: 'user',
      targetId: params.userId,
      details: {
        permission: params.permission,
        previousType: existing.type,
      },
    })
  }
}
