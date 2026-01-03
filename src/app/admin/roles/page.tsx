'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  MoreVertical,
  Shield,
  Users,
  Key,
  RefreshCw,
  Copy,
  Trash2,
  Edit,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  permissions: string[]
  isSystem: boolean
  position: number
  _count: {
    assignments: number
  }
  createdAt: string
  updatedAt: string
}

interface RoleStats {
  totalRoles: number
  systemRoles: number
  customRoles: number
  totalAssignments: number
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [stats, setStats] = useState<RoleStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])

        // Calculate stats
        const systemRoles = data.roles.filter((r: Role) => r.isSystem).length
        const totalAssignments = data.roles.reduce(
          (sum: number, r: Role) => sum + r._count.assignments,
          0
        )
        setStats({
          totalRoles: data.roles.length,
          systemRoles,
          customRoles: data.roles.length - systemRoles,
          totalAssignments,
        })
      } else {
        toast.error('Failed to load roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setIsLoading(false)
    }
  }

  const seedRoles = async () => {
    try {
      setIsSeeding(true)
      const response = await fetch('/api/admin/roles/seed', {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Built-in roles seeded successfully')
        fetchRoles()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to seed roles')
      }
    } catch (error) {
      console.error('Error seeding roles:', error)
      toast.error('Failed to seed roles')
    } finally {
      setIsSeeding(false)
    }
  }

  const deleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Role deleted successfully')
        fetchRoles()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Failed to delete role')
    } finally {
      setDeleteRoleId(null)
    }
  }

  const duplicateRole = async (role: Role) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${role.name}_copy`,
          displayName: `${role.displayName} (Copy)`,
          description: role.description,
          permissions: role.permissions,
        }),
      })
      if (response.ok) {
        toast.success('Role duplicated successfully')
        fetchRoles()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to duplicate role')
      }
    } catch (error) {
      console.error('Error duplicating role:', error)
      toast.error('Failed to duplicate role')
    }
  }

  const filteredRoles = roles.filter((role) => {
    const query = searchQuery.toLowerCase()
    return (
      role.name.toLowerCase().includes(query) ||
      role.displayName.toLowerCase().includes(query) ||
      (role.description?.toLowerCase().includes(query) ?? false)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'medium',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and their permission bundles
          </p>
        </div>
        <div className="flex gap-2">
          {roles.length === 0 && (
            <Button
              variant="outline"
              onClick={seedRoles}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Seed Built-in Roles
            </Button>
          )}
          <Button variant="outline" onClick={fetchRoles} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/roles/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRoles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.systemRoles} system, {stats.customRoles} custom
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assignments
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">
                Users with assigned roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemRoles}</div>
              <p className="text-xs text-muted-foreground">
                Built-in role presets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customRoles}</div>
              <p className="text-xs text-muted-foreground">
                User-defined roles
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No roles found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {roles.length === 0
                  ? 'Get started by seeding the built-in roles or creating a custom role.'
                  : 'No roles match your search criteria.'}
              </p>
              {roles.length === 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={seedRoles} disabled={isSeeding}>
                    Seed Built-in Roles
                  </Button>
                  <Button asChild>
                    <Link href="/admin/roles/new">Create Custom Role</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRoles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {role.displayName}
                      </h3>
                      {role.isSystem && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      )}
                      {role.permissions.includes('*') && (
                        <Badge variant="destructive">Super Admin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {role.description || 'No description provided'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Key className="h-4 w-4" />
                        <span>{role.permissions.length} permissions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{role._count.assignments} users</span>
                      </div>
                      <span>Created {formatDate(role.createdAt)}</span>
                    </div>
                    {role.permissions.length > 0 && !role.permissions.includes('*') && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {role.permissions.slice(0, 5).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {role.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/roles/${role.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          {role.isSystem ? 'View Details' : 'Edit Role'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateRole(role)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        disabled={role.isSystem}
                        onClick={() => setDeleteRoleId(role.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteRoleId}
        onOpenChange={() => setDeleteRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be
              undone. All users assigned to this role will lose its permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && deleteRole(deleteRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Roles</strong> are bundles of permissions that can be
            assigned to users. They simplify access control by grouping related
            permissions together.
          </p>
          <p>
            <strong>System roles</strong> are built-in presets that cannot be
            deleted. You can duplicate them to create custom variations.
          </p>
          <p>
            <strong>Permission overrides</strong> can be applied to individual
            users to grant or deny specific permissions, regardless of their
            assigned roles.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
