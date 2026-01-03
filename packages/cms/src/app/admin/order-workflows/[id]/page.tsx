'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Truck,
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Switch } from '../../../../components/ui/switch'
import { Badge } from '../../../../components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog'
import { toast } from 'sonner'

// Shippo tracking event options
const SHIPPO_EVENTS = [
  { value: '', label: 'None (Manual only)' },
  { value: 'PRE_TRANSIT', label: 'Pre-Transit (Label created)' },
  { value: 'TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'FAILURE', label: 'Delivery Failed' },
]

// Stage color presets
const STAGE_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#6366F1', // indigo
]

interface WorkflowStage {
  id?: string
  name: string
  slug: string
  displayName: string
  customerMessage?: string | null
  icon?: string | null
  color?: string | null
  position: number
  isTerminal: boolean
  notifyCustomer: boolean
  estimatedDuration?: number | null
  shippoEventTrigger?: string | null
}

interface OrderWorkflow {
  id: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  enableShippoSync: boolean
  stages: WorkflowStage[]
}

export default function EditOrderWorkflowPage() {
  const router = useRouter()
  const params = useParams()
  const workflowId = params.id as string
  const isNew = workflowId === 'new'

  const [workflow, setWorkflow] = useState<OrderWorkflow>({
    id: '',
    name: '',
    slug: '',
    description: '',
    isDefault: false,
    isActive: true,
    enableShippoSync: true,
    stages: [],
  })
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null)
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null)

  const fetchWorkflow = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`)
      if (!response.ok) {
        throw new Error('Workflow not found')
      }
      const data = await response.json()
      setWorkflow(data.workflow)
    } catch (err) {
      toast.error('Failed to load workflow')
      router.push('/admin/order-workflows')
    } finally {
      setIsLoading(false)
    }
  }, [workflowId, router])

  useEffect(() => {
    if (!isNew) {
      fetchWorkflow()
    }
  }, [isNew, fetchWorkflow])

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function saveWorkflow() {
    if (!workflow.name || !workflow.slug) {
      toast.error('Name and slug are required')
      return
    }

    try {
      setIsSaving(true)

      if (isNew) {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflow.name,
            slug: workflow.slug,
            description: workflow.description,
            isDefault: workflow.isDefault,
            isActive: workflow.isActive,
            enableShippoSync: workflow.enableShippoSync,
            stages: workflow.stages.map((s, idx) => ({
              name: s.name,
              slug: s.slug,
              displayName: s.displayName,
              customerMessage: s.customerMessage,
              icon: s.icon,
              color: s.color,
              position: idx,
              isTerminal: s.isTerminal,
              notifyCustomer: s.notifyCustomer,
              estimatedDuration: s.estimatedDuration,
              shippoEventTrigger: s.shippoEventTrigger,
            })),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create workflow')
        }

        const data = await response.json()
        toast.success('Workflow created')
        router.push(`/admin/order-workflows/${data.workflow.id}`)
      } else {
        const response = await fetch(`/api/workflows/${workflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflow.name,
            slug: workflow.slug,
            description: workflow.description,
            isDefault: workflow.isDefault,
            isActive: workflow.isActive,
            enableShippoSync: workflow.enableShippoSync,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update workflow')
        }

        toast.success('Workflow updated')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

  function openAddStage() {
    setEditingStage({
      name: '',
      slug: '',
      displayName: '',
      customerMessage: '',
      icon: '',
      color: STAGE_COLORS[workflow.stages.length % STAGE_COLORS.length],
      position: workflow.stages.length,
      isTerminal: false,
      notifyCustomer: true,
      estimatedDuration: null,
      shippoEventTrigger: '',
    })
    setStageDialogOpen(true)
  }

  function openEditStage(stage: WorkflowStage) {
    setEditingStage({ ...stage })
    setStageDialogOpen(true)
  }

  async function saveStage() {
    if (!editingStage || !editingStage.name || !editingStage.displayName) {
      toast.error('Name and display name are required')
      return
    }

    const slug = editingStage.slug || generateSlug(editingStage.name)

    if (isNew) {
      // For new workflows, just update local state
      if (editingStage.id) {
        setWorkflow({
          ...workflow,
          stages: workflow.stages.map((s) =>
            s.id === editingStage.id ? { ...editingStage, slug } : s
          ),
        })
      } else {
        setWorkflow({
          ...workflow,
          stages: [
            ...workflow.stages,
            { ...editingStage, slug, id: `temp-${Date.now()}` },
          ],
        })
      }
      setStageDialogOpen(false)
      setEditingStage(null)
      return
    }

    try {
      if (editingStage.id && !editingStage.id.startsWith('temp-')) {
        // Update existing stage
        const response = await fetch(`/api/workflows/${workflowId}/stages`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stageId: editingStage.id,
            name: editingStage.name,
            slug,
            displayName: editingStage.displayName,
            customerMessage: editingStage.customerMessage,
            icon: editingStage.icon,
            color: editingStage.color,
            isTerminal: editingStage.isTerminal,
            notifyCustomer: editingStage.notifyCustomer,
            estimatedDuration: editingStage.estimatedDuration,
            shippoEventTrigger: editingStage.shippoEventTrigger || null,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update stage')
        }

        toast.success('Stage updated')
      } else {
        // Add new stage
        const response = await fetch(`/api/workflows/${workflowId}/stages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingStage.name,
            slug,
            displayName: editingStage.displayName,
            customerMessage: editingStage.customerMessage,
            icon: editingStage.icon,
            color: editingStage.color,
            position: workflow.stages.length,
            isTerminal: editingStage.isTerminal,
            notifyCustomer: editingStage.notifyCustomer,
            estimatedDuration: editingStage.estimatedDuration,
            shippoEventTrigger: editingStage.shippoEventTrigger || null,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to add stage')
        }

        toast.success('Stage added')
      }

      fetchWorkflow()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save stage')
    }

    setStageDialogOpen(false)
    setEditingStage(null)
  }

  async function deleteStage() {
    if (!deleteStageId) return

    if (isNew) {
      setWorkflow({
        ...workflow,
        stages: workflow.stages.filter((s) => s.id !== deleteStageId),
      })
      setDeleteStageId(null)
      return
    }

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/stages?stageId=${deleteStageId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete stage')
      }

      toast.success('Stage deleted')
      fetchWorkflow()
    } catch (err) {
      toast.error('Failed to delete stage')
    }

    setDeleteStageId(null)
  }

  async function moveStage(stageId: string, direction: 'up' | 'down') {
    const currentIndex = workflow.stages.findIndex((s) => s.id === stageId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= workflow.stages.length) return

    const newStages = [...workflow.stages]
    const [moved] = newStages.splice(currentIndex, 1)
    newStages.splice(newIndex, 0, moved)

    // Update positions
    const reorderedStages = newStages.map((s, idx) => ({ ...s, position: idx }))
    setWorkflow({ ...workflow, stages: reorderedStages })

    if (!isNew) {
      try {
        await fetch(`/api/workflows/${workflowId}/stages`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reorder',
            stageIds: reorderedStages.map((s) => s.id),
          }),
        })
      } catch (err) {
        toast.error('Failed to reorder stages')
        fetchWorkflow()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/order-workflows">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'New Order Workflow' : 'Edit Workflow'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isNew
                ? 'Create a new order progress workflow'
                : `Configure stages for "${workflow.name}"`}
            </p>
          </div>
        </div>
        <Button onClick={saveWorkflow} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workflow Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Workflow Settings</CardTitle>
            <CardDescription>Basic workflow configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={workflow.name}
                onChange={(e) => {
                  const name = e.target.value
                  setWorkflow({
                    ...workflow,
                    name,
                    slug: isNew ? generateSlug(name) : workflow.slug,
                  })
                }}
                placeholder="Standard Shipping"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={workflow.slug}
                onChange={(e) =>
                  setWorkflow({ ...workflow, slug: e.target.value })
                }
                placeholder="standard-shipping"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={workflow.description || ''}
                onChange={(e) =>
                  setWorkflow({ ...workflow, description: e.target.value })
                }
                placeholder="Standard shipping with tracking updates"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Allow this workflow to be used
                </p>
              </div>
              <Switch
                checked={workflow.isActive}
                onCheckedChange={(checked) =>
                  setWorkflow({ ...workflow, isActive: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Workflow</Label>
                <p className="text-sm text-muted-foreground">
                  Use for orders without specific workflow
                </p>
              </div>
              <Switch
                checked={workflow.isDefault}
                onCheckedChange={(checked) =>
                  setWorkflow({ ...workflow, isDefault: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <Label>Shippo Auto-Sync</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically update stages from tracking
                </p>
              </div>
              <Switch
                checked={workflow.enableShippoSync}
                onCheckedChange={(checked) =>
                  setWorkflow({ ...workflow, enableShippoSync: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Stages */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Progress Stages</CardTitle>
              <CardDescription>
                Define the stages customers see during fulfillment
              </CardDescription>
            </div>
            <Button onClick={openAddStage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stage
            </Button>
          </CardHeader>
          <CardContent>
            {workflow.stages.length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No stages defined yet. Add stages to create the order progress flow.
                </p>
                <Button variant="outline" onClick={openAddStage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Stage
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {workflow.stages
                  .sort((a, b) => a.position - b.position)
                  .map((stage, index) => (
                    <div
                      key={stage.id || index}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => stage.id && moveStage(stage.id, 'up')}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === workflow.stages.length - 1}
                          onClick={() => stage.id && moveStage(stage.id, 'down')}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <GripVertical className="h-4 w-4 text-muted-foreground" />

                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color || '#3B82F6' }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stage.displayName}</span>
                          {stage.isTerminal && (
                            <Badge variant="secondary" className="text-xs">
                              Terminal
                            </Badge>
                          )}
                          {stage.shippoEventTrigger && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Truck className="h-3 w-3" />
                              {stage.shippoEventTrigger}
                            </Badge>
                          )}
                        </div>
                        {stage.customerMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {stage.customerMessage}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditStage(stage)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteStageId(stage.id || null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stage Edit Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStage?.id ? 'Edit Stage' : 'Add Stage'}
            </DialogTitle>
            <DialogDescription>
              Configure how this stage appears to customers
            </DialogDescription>
          </DialogHeader>

          {editingStage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage-name">Internal Name</Label>
                  <Input
                    id="stage-name"
                    value={editingStage.name}
                    onChange={(e) =>
                      setEditingStage({
                        ...editingStage,
                        name: e.target.value,
                        slug: editingStage.slug || generateSlug(e.target.value),
                      })
                    }
                    placeholder="in_transit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage-display">Display Name</Label>
                  <Input
                    id="stage-display"
                    value={editingStage.displayName}
                    onChange={(e) =>
                      setEditingStage({
                        ...editingStage,
                        displayName: e.target.value,
                      })
                    }
                    placeholder="In Transit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage-message">Customer Message</Label>
                <Textarea
                  id="stage-message"
                  value={editingStage.customerMessage || ''}
                  onChange={(e) =>
                    setEditingStage({
                      ...editingStage,
                      customerMessage: e.target.value,
                    })
                  }
                  placeholder="Your order is on its way!"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {STAGE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          editingStage.color === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setEditingStage({ ...editingStage, color })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage-duration">Est. Duration (hours)</Label>
                  <Input
                    id="stage-duration"
                    type="number"
                    value={editingStage.estimatedDuration || ''}
                    onChange={(e) =>
                      setEditingStage({
                        ...editingStage,
                        estimatedDuration: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage-shippo">Shippo Tracking Trigger</Label>
                <Select
                  value={editingStage.shippoEventTrigger || ''}
                  onValueChange={(value) =>
                    setEditingStage({
                      ...editingStage,
                      shippoEventTrigger: value || null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger event" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPO_EVENTS.map((event) => (
                      <SelectItem key={event.value} value={event.value || 'none'}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically transition to this stage when Shippo tracking matches
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Terminal Stage</Label>
                  <p className="text-sm text-muted-foreground">
                    This is the final stage (e.g., Delivered)
                  </p>
                </div>
                <Switch
                  checked={editingStage.isTerminal}
                  onCheckedChange={(checked) =>
                    setEditingStage({ ...editingStage, isTerminal: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify Customer</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when order enters this stage
                  </p>
                </div>
                <Switch
                  checked={editingStage.notifyCustomer}
                  onCheckedChange={(checked) =>
                    setEditingStage({ ...editingStage, notifyCustomer: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveStage}>
              {editingStage?.id ? 'Update Stage' : 'Add Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog open={!!deleteStageId} onOpenChange={() => setDeleteStageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stage? Orders currently at this
              stage will need to be manually updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteStage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
