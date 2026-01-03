'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Shield,
  ChevronDown,
  ChevronRight,
  Lock,
  Users,
  Key,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { PERMISSION_GROUPS } from '@/lib/permissions/constants'

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

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditRolePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    permissions: [] as string[],
  })

  useEffect(() => {
    fetchRole()
  }, [id])

  const fetchRole = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/roles/${id}`)
      if (response.ok) {
        const data = await response.json()
        setRole(data)
        setFormData({
          displayName: data.displayName,
          description: data.description || '',
          permissions: data.permissions,
        })
      } else if (response.status === 404) {
        toast.error('Role not found')
        router.push('/admin/roles')
      } else {
        toast.error('Failed to load role')
      }
    } catch (error) {
      console.error('Error fetching role:', error)
      toast.error('Failed to load role')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    )
  }

  const togglePermission = (permission: string) => {
    if (role?.isSystem) return
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleGroupPermissions = (groupKey: string) => {
    if (role?.isSystem) return
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS]
    const groupPermissions: string[] = group.permissions.map((p) => p.key)
    const allSelected = groupPermissions.every((p) =>
      formData.permissions.includes(p)
    )

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter(
          (p) => !groupPermissions.includes(p)
        ),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: [
          ...prev.permissions.filter((p) => !groupPermissions.includes(p)),
          ...groupPermissions,
        ],
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (role?.isSystem) {
      toast.error('System roles cannot be modified')
      return
    }

    if (!formData.displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    if (formData.permissions.length === 0) {
      toast.error('At least one permission is required')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Role updated successfully')
        router.push('/admin/roles')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGroupSelectionState = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS]
    const groupPermissions: string[] = group.permissions.map((p) => p.key)
    const selectedCount = groupPermissions.filter((p) =>
      formData.permissions.includes(p)
    ).length

    if (selectedCount === 0) return 'none'
    if (selectedCount === groupPermissions.length) return 'all'
    return 'partial'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!role) {
    return null
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {role.isSystem ? 'View Role' : 'Edit Role'}
            </h1>
            {role.isSystem && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                System Role
              </Badge>
            )}
            {formData.permissions.includes('*') && (
              <Badge variant="destructive">Super Admin</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{role.displayName}</p>
        </div>
      </div>

      {role.isSystem && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Lock className="h-5 w-5 text-yellow-600" />
            <p className="text-sm">
              This is a system role and cannot be modified. You can duplicate it
              to create a custom variation.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Role Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Details</CardTitle>
                <CardDescription>
                  Basic information about the role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name (Slug)</Label>
                  <Input
                    id="name"
                    value={role.name}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Role names cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    disabled={role.isSystem}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={role.isSystem}
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{formData.permissions.length}</strong> permissions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{role._count.assignments}</strong> users assigned
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Created {formatDate(role.createdAt)}</span>
                  </div>
                  {role.updatedAt !== role.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Updated {formatDate(role.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {!role.isSystem && (
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Permissions Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  {role.isSystem
                    ? 'View the permissions included in this role'
                    : 'Select the permissions this role should have'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Super Admin wildcard */}
                {formData.permissions.includes('*') && (
                  <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5 mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">
                        Super Admin Access
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      This role has the wildcard (*) permission, granting full
                      access to all features.
                    </p>
                  </div>
                )}

                {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                  const selectionState = getGroupSelectionState(key)
                  const isExpanded = expandedGroups.includes(key)

                  return (
                    <Collapsible
                      key={key}
                      open={isExpanded}
                      onOpenChange={() => toggleGroup(key)}
                    >
                      <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-accent">
                        <Checkbox
                          checked={selectionState === 'all'}
                          disabled={role.isSystem}
                          ref={(ref) => {
                            if (ref && selectionState === 'partial') {
                              ref.dataset.state = 'indeterminate'
                            }
                          }}
                          onCheckedChange={() => toggleGroupPermissions(key)}
                          className={
                            selectionState === 'partial'
                              ? 'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground'
                              : ''
                          }
                        />
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{group.label}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {
                                group.permissions.filter((p) =>
                                  formData.permissions.includes(p.key)
                                ).length
                              }
                              /{group.permissions.length}
                            </span>
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="ml-8 pb-3 space-y-1">
                          {group.permissions.map((permission) => (
                            <label
                              key={permission.key}
                              className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent ${
                                role.isSystem
                                  ? 'cursor-default'
                                  : 'cursor-pointer'
                              }`}
                            >
                              <Checkbox
                                checked={formData.permissions.includes(
                                  permission.key
                                )}
                                disabled={role.isSystem}
                                onCheckedChange={() =>
                                  togglePermission(permission.key)
                                }
                              />
                              <div className="flex-1">
                                <span className="text-sm">
                                  {permission.label}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({permission.key})
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
