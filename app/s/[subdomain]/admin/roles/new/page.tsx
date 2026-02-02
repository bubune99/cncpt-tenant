'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCMSConfig } from '@/contexts/CMSConfigContext'
import {
  ArrowLeft,
  Save,
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react'
import { Button } from '@/components/cms/ui/button'
import { Input } from '@/components/cms/ui/input'
import { Label } from '@/components/cms/ui/label'
import { Textarea } from '@/components/cms/ui/textarea'
import { Checkbox } from '@/components/cms/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/cms/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/cms/ui/collapsible'
import { toast } from 'sonner'
import { PERMISSION_GROUPS } from '@/lib/cms/permissions/constants'

export default function NewRolePage() {
  const { buildPath } = useCMSConfig()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
  })

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    )
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleGroupPermissions = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS]
    const groupPermissions: string[] = group.permissions.map((p) => p.key)
    const allSelected = groupPermissions.every((p) =>
      formData.permissions.includes(p)
    )

    if (allSelected) {
      // Remove all permissions from this group
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter(
          (p) => !groupPermissions.includes(p)
        ),
      }))
    } else {
      // Add all permissions from this group
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

    if (!formData.name.trim()) {
      toast.error('Role name is required')
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
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Role created successfully')
        router.push('/admin/roles')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('Failed to create role')
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={buildPath('/admin/roles')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Role</h1>
          <p className="text-muted-foreground mt-1">
            Define a new role with custom permissions
          </p>
        </div>
      </div>

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
                    placeholder="e.g., marketing_manager"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, '_'),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and underscores only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., Marketing Manager"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this role is for..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{formData.permissions.length}</strong> permissions
                      selected
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  Create Role
                </>
              )}
            </Button>
          </div>

          {/* Permissions Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Select the permissions this role should have
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
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
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                            >
                              <Checkbox
                                checked={formData.permissions.includes(
                                  permission.key
                                )}
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
