'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  Key,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/cms/ui/button'
import { Input } from '@/components/cms/ui/input'
import { Label } from '@/components/cms/ui/label'
import { Textarea } from '@/components/cms/ui/textarea'
import { Badge } from '@/components/cms/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/cms/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/cms/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/cms/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/cms/ui/avatar'
import { toast } from 'sonner'
import { PERMISSION_GROUPS } from '@/lib/cms/permissions/constants'

interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  permissions: string[]
  isSystem: boolean
}

interface PermissionOverride {
  id: string
  permission: string
  type: 'GRANT' | 'DENY'
  expiresAt: string | null
  reason: string | null
}

interface UserPermissions {
  userId: string
  email: string
  name: string | null
  image?: string | null
  roles: Role[]
  overrides: PermissionOverride[]
  effectivePermissions: string[]
  isSuperAdmin: boolean
}

interface AvailableRole {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function UserPermissionsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [userPerms, setUserPerms] = useState<UserPermissions | null>(null)
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  // Dialog states
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false)
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false)
  const [removeRoleId, setRemoveRoleId] = useState<string | null>(null)
  const [removeOverrideId, setRemoveOverrideId] = useState<string | null>(null)

  // Form states
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [overrideForm, setOverrideForm] = useState({
    permission: '',
    type: 'GRANT' as 'GRANT' | 'DENY',
    expiresAt: '',
    reason: '',
  })

  useEffect(() => {
    fetchUserPermissions()
    fetchAvailableRoles()
  }, [id])

  const fetchUserPermissions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${id}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setUserPerms(data)
      } else if (response.status === 404) {
        toast.error('User not found')
        router.push('/admin/admin-users')
      } else {
        toast.error('Failed to load user permissions')
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      toast.error('Failed to load user permissions')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setAvailableRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const assignRole = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      })

      if (response.ok) {
        toast.success('Role assigned successfully')
        setIsAssignRoleOpen(false)
        setSelectedRoleId('')
        fetchUserPermissions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to assign role')
      }
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Failed to assign role')
    }
  }

  const removeRole = async (roleId: string) => {
    try {
      const response = await fetch(
        `/api/admin/users/${id}/roles?roleId=${roleId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success('Role removed successfully')
        fetchUserPermissions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove role')
      }
    } catch (error) {
      console.error('Error removing role:', error)
      toast.error('Failed to remove role')
    } finally {
      setRemoveRoleId(null)
    }
  }

  const addOverride = async () => {
    if (!overrideForm.permission) {
      toast.error('Please select a permission')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission: overrideForm.permission,
          type: overrideForm.type,
          expiresAt: overrideForm.expiresAt || null,
          reason: overrideForm.reason || null,
        }),
      })

      if (response.ok) {
        toast.success(
          `Permission ${overrideForm.type === 'GRANT' ? 'granted' : 'denied'} successfully`
        )
        setIsAddOverrideOpen(false)
        setOverrideForm({
          permission: '',
          type: 'GRANT',
          expiresAt: '',
          reason: '',
        })
        fetchUserPermissions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add override')
      }
    } catch (error) {
      console.error('Error adding override:', error)
      toast.error('Failed to add override')
    }
  }

  const removeOverride = async (permission: string) => {
    try {
      const response = await fetch(
        `/api/admin/users/${id}/permissions?permission=${encodeURIComponent(permission)}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success('Override removed successfully')
        fetchUserPermissions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove override')
      }
    } catch (error) {
      console.error('Error removing override:', error)
      toast.error('Failed to remove override')
    } finally {
      setRemoveOverrideId(null)
    }
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    )
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'medium',
    })
  }

  const getPermissionLabel = (permissionKey: string) => {
    for (const group of Object.values(PERMISSION_GROUPS)) {
      const perm = group.permissions.find((p) => p.key === permissionKey)
      if (perm) return perm.label
    }
    return permissionKey
  }

  const unassignedRoles = availableRoles.filter(
    (role) => !userPerms?.roles.some((r) => r.id === role.id)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!userPerms) {
    return null
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/admin-users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userPerms.image || undefined} />
            <AvatarFallback>
              {getInitials(userPerms.name, userPerms.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {userPerms.name || userPerms.email}
              </h1>
              {userPerms.isSuperAdmin && (
                <Badge variant="destructive">Super Admin</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{userPerms.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Roles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Assigned Roles
              </CardTitle>
              <CardDescription>
                Roles provide bundles of permissions
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAssignRoleOpen(true)}
              disabled={unassignedRoles.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Assign Role
            </Button>
          </CardHeader>
          <CardContent>
            {userPerms.roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No roles assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userPerms.roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.displayName}</span>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.permissions.length} permissions
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoveRoleId(role.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permission Overrides */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Permission Overrides
              </CardTitle>
              <CardDescription>
                Individual grants or denials that override roles
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddOverrideOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Override
            </Button>
          </CardHeader>
          <CardContent>
            {userPerms.overrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No permission overrides</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userPerms.overrides.map((override) => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {override.type === 'GRANT' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <Badge
                          variant={
                            override.type === 'GRANT' ? 'default' : 'destructive'
                          }
                        >
                          {override.type}
                        </Badge>
                        <span className="font-mono text-sm">
                          {override.permission}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getPermissionLabel(override.permission)}
                      </p>
                      {override.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {override.reason}
                        </p>
                      )}
                      {override.expiresAt && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                          <Clock className="h-3 w-3" />
                          Expires: {formatDate(override.expiresAt)}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoveOverrideId(override.permission)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Effective Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Effective Permissions</CardTitle>
          <CardDescription>
            The final set of permissions after combining roles and overrides (
            {userPerms.effectivePermissions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userPerms.isSuperAdmin ? (
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">
                  Super Admin Access
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This user has the wildcard (*) permission, granting full access
                to all features.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                const groupPermissions = group.permissions.filter((p) =>
                  userPerms.effectivePermissions.includes(p.key)
                )
                if (groupPermissions.length === 0) return null

                return (
                  <Collapsible
                    key={key}
                    open={expandedGroups.includes(key)}
                    onOpenChange={() => toggleGroup(key)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 p-3 rounded-lg hover:bg-accent w-full text-left">
                        {expandedGroups.includes(key) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{group.label}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {groupPermissions.length}/{group.permissions.length}
                        </Badge>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-8 pb-3 flex flex-wrap gap-2">
                        {groupPermissions.map((permission) => (
                          <Badge key={permission.key} variant="outline">
                            {permission.label}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Select a role to assign to this user
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {unassignedRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <span className="font-medium">{role.displayName}</span>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={assignRole}>Assign Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Override Dialog */}
      <Dialog open={isAddOverrideOpen} onOpenChange={setIsAddOverrideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Permission Override</DialogTitle>
            <DialogDescription>
              Grant or deny a specific permission for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select
                value={overrideForm.permission}
                onValueChange={(v) =>
                  setOverrideForm({ ...overrideForm, permission: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a permission" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                    <div key={key}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {group.label}
                      </div>
                      {group.permissions.map((permission) => (
                        <SelectItem
                          key={permission.key}
                          value={permission.key}
                        >
                          {permission.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Override Type</Label>
              <Select
                value={overrideForm.type}
                onValueChange={(v) =>
                  setOverrideForm({
                    ...overrideForm,
                    type: v as 'GRANT' | 'DENY',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRANT">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Grant - Allow this permission
                    </div>
                  </SelectItem>
                  <SelectItem value="DENY">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      Deny - Block this permission
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expires At (Optional)</Label>
              <Input
                type="datetime-local"
                value={overrideForm.expiresAt}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, expiresAt: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for a permanent override
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="Why is this override being added?"
                value={overrideForm.reason}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, reason: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOverrideOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={addOverride}>Add Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Confirmation */}
      <AlertDialog
        open={!!removeRoleId}
        onOpenChange={() => setRemoveRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this role from the user? They will
              lose all permissions granted by this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeRoleId && removeRole(removeRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Override Confirmation */}
      <AlertDialog
        open={!!removeOverrideId}
        onOpenChange={() => setRemoveOverrideId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Override</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this permission override? The
              user&apos;s access will revert to what their roles provide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeOverrideId && removeOverride(removeOverrideId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
