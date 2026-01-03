'use client'

/**
 * Client-side permission hook
 * Fetches and caches user permissions for UI rendering
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

interface PermissionData {
  userId: string
  email: string
  name: string | null
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
  permissions: string[]
  isSuperAdmin: boolean
}

interface UsePermissionsReturn {
  // Data
  permissions: string[]
  roles: PermissionData['roles']
  isSuperAdmin: boolean
  isLoading: boolean
  error: Error | null

  // Permission checks
  can: (permission: string) => boolean
  canAny: (permissions: string[]) => boolean
  canAll: (permissions: string[]) => boolean
  hasRole: (roleName: string) => boolean

  // Refresh
  refresh: () => Promise<void>
}

/**
 * Check if a permission matches (including wildcards)
 */
function permissionMatches(userPermission: string, requiredPermission: string): boolean {
  if (userPermission === requiredPermission) return true
  if (userPermission === '*') return true

  if (userPermission.endsWith('.*')) {
    const resource = userPermission.slice(0, -2)
    return requiredPermission.startsWith(resource + '.')
  }

  return false
}

export function usePermissions(): UsePermissionsReturn {
  const [data, setData] = useState<PermissionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/permissions')

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - that's ok, just no permissions
          setData(null)
          return
        }
        throw new Error('Failed to fetch permissions')
      }

      const permData = await response.json()
      setData(permData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Permission check functions
  const can = useCallback(
    (permission: string): boolean => {
      if (!data) return false
      if (data.isSuperAdmin) return true

      return data.permissions.some((p) => permissionMatches(p, permission))
    },
    [data]
  )

  const canAny = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((p) => can(p))
    },
    [can]
  )

  const canAll = useCallback(
    (permissions: string[]): boolean => {
      return permissions.every((p) => can(p))
    },
    [can]
  )

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (!data) return false
      return data.roles.some((r) => r.name === roleName)
    },
    [data]
  )

  return useMemo(
    () => ({
      permissions: data?.permissions ?? [],
      roles: data?.roles ?? [],
      isSuperAdmin: data?.isSuperAdmin ?? false,
      isLoading,
      error,
      can,
      canAny,
      canAll,
      hasRole,
      refresh: fetchPermissions,
    }),
    [data, isLoading, error, can, canAny, canAll, hasRole, fetchPermissions]
  )
}

/**
 * Permission gate component
 * Renders children only if user has the required permission
 */
interface PermissionGateProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps): React.ReactNode {
  const { can, canAny, canAll, isLoading } = usePermissions()

  if (isLoading) {
    return fallback
  }

  // Single permission check
  if (permission) {
    return can(permission) ? children : fallback
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? canAll(permissions)
      : canAny(permissions)

    return hasAccess ? children : fallback
  }

  // No permission specified - render children
  return children
}

export default usePermissions
