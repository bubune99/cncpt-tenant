/**
 * Permission System Types
 */

import type { Permission } from './constants'

// User with resolved permissions
export interface UserWithPermissions {
  id: string
  email: string
  name: string | null

  // Computed permissions (roles + overrides)
  permissions: Set<string>

  // Raw data for debugging
  roles: RoleData[]
  overrides: PermissionOverride[]
}

// Role data from database
export interface RoleData {
  id: string
  name: string
  displayName: string
  description: string | null
  permissions: string[]
  isSystem: boolean
}

// Permission override from database
export interface PermissionOverride {
  id: string
  permission: string
  type: 'GRANT' | 'DENY'
  expiresAt: Date | null
  reason: string | null
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  // Which role or override granted/denied this
  source?: {
    type: 'role' | 'override' | 'super_admin'
    id?: string
    name?: string
  }
}

// Audit log action types
export type AuditAction =
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'role.assign'
  | 'role.remove'
  | 'permission.grant'
  | 'permission.deny'
  | 'permission.remove'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'page.create'
  | 'page.update'
  | 'page.delete'
  | 'route.create'
  | 'route.update'
  | 'route.delete'
  | 'puck_template.create'
  | 'puck_template.update'
  | 'puck_template.delete'

// Audit log entry
export interface AuditLogEntry {
  id: string
  userId: string | null
  userEmail: string | null
  action: AuditAction
  targetType: string | null
  targetId: string | null
  details: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

// API request types
export interface AssignRoleRequest {
  userId: string
  roleId: string
}

export interface RemoveRoleRequest {
  userId: string
  roleId: string
}

export interface GrantPermissionRequest {
  userId: string
  permission: Permission | string
  expiresAt?: Date | string
  reason?: string
}

export interface DenyPermissionRequest {
  userId: string
  permission: Permission | string
  expiresAt?: Date | string
  reason?: string
}

export interface RemovePermissionOverrideRequest {
  userId: string
  permission: Permission | string
}

export interface CreateRoleRequest {
  name: string
  displayName: string
  description?: string
  permissions: string[]
  position?: number
}

export interface UpdateRoleRequest {
  displayName?: string
  description?: string
  permissions?: string[]
  position?: number
}

// API response types
export interface RoleWithAssignments extends RoleData {
  _count: {
    assignments: number
  }
}

export interface UserPermissionSummary {
  userId: string
  email: string
  name: string | null
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  overrides: PermissionOverride[]
  effectivePermissions: string[]
}
