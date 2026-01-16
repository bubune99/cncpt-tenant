'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  MoreHorizontal,
  GitBranch,
  Trash2,
  Edit,
  Copy,
  Star,
  RefreshCw,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { toast } from 'sonner'

interface WorkflowStage {
  id: string
  name: string
  displayName: string
  position: number
  isTerminal: boolean
  color?: string | null
}

interface OrderWorkflow {
  id: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  enableShippoSync: boolean
  createdAt: string
  updatedAt: string
  stages: WorkflowStage[]
  _count?: {
    orders: number
    products: number
    categories: number
  }
}

export default function OrderWorkflowsPage() {
  const [workflows, setWorkflows] = useState<OrderWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  const fetchWorkflows = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/workflows?includeInactive=true')
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  async function seedDefaultWorkflows() {
    try {
      setIsSeeding(true)
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      })
      if (response.ok) {
        toast.success('Default workflows seeded successfully')
        fetchWorkflows()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to seed workflows')
      }
    } catch (err) {
      toast.error('Failed to seed workflows')
    } finally {
      setIsSeeding(false)
    }
  }

  async function toggleWorkflowActive(id: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (response.ok) {
        setWorkflows(
          workflows.map((w) => (w.id === id ? { ...w, isActive: !isActive } : w))
        )
        toast.success(`Workflow ${!isActive ? 'activated' : 'deactivated'}`)
      }
    } catch (err) {
      toast.error('Failed to update workflow')
    }
  }

  async function setAsDefault(id: string) {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      if (response.ok) {
        setWorkflows(
          workflows.map((w) => ({
            ...w,
            isDefault: w.id === id,
          }))
        )
        toast.success('Default workflow updated')
      }
    } catch (err) {
      toast.error('Failed to set default workflow')
    }
  }

  async function duplicateWorkflow(id: string, name: string) {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          newName: `${name} (Copy)`,
          newSlug: `${name.toLowerCase().replace(/\s+/g, '-')}-copy-${Date.now()}`,
        }),
      })
      if (response.ok) {
        toast.success('Workflow duplicated')
        fetchWorkflows()
      }
    } catch (err) {
      toast.error('Failed to duplicate workflow')
    }
  }

  async function deleteWorkflow() {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/workflows/${deleteId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setWorkflows(workflows.filter((w) => w.id !== deleteId))
        toast.success('Workflow deleted')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete workflow')
      }
    } catch (err) {
      toast.error('Failed to delete workflow')
    } finally {
      setDeleteId(null)
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
        <div>
          <h1 className="text-2xl font-bold">Order Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Configure progress stages customers see during order fulfillment
          </p>
        </div>
        <div className="flex items-center gap-2">
          {workflows.length === 0 && (
            <Button
              variant="outline"
              onClick={seedDefaultWorkflows}
              disabled={isSeeding}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isSeeding ? 'animate-spin' : ''}`}
              />
              Seed Defaults
            </Button>
          )}
          <Link href="/admin/order-workflows/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No order workflows yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Create workflows to define the progress stages customers see when
              tracking their orders. You can also seed default templates.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={seedDefaultWorkflows} disabled={isSeeding}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSeeding ? 'animate-spin' : ''}`} />
                Seed Defaults
              </Button>
              <Link href="/admin/order-workflows/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Workflows</CardTitle>
            <CardDescription>
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shippo Sync</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/order-workflows/${workflow.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {workflow.name}
                        </Link>
                        {workflow.isDefault && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {workflow.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {workflow.stages.length} stage{workflow.stages.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-0.5">
                          {workflow.stages.slice(0, 5).map((stage, idx) => (
                            <div
                              key={stage.id}
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: stage.color || `hsl(${idx * 60}, 70%, 50%)`,
                              }}
                              title={stage.displayName}
                            />
                          ))}
                          {workflow.stages.length > 5 && (
                            <span className="text-xs text-muted-foreground">
                              +{workflow.stages.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          toggleWorkflowActive(workflow.id, workflow.isActive)
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          workflow.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {workflow.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {workflow.enableShippoSync ? (
                        <Badge variant="outline" className="gap-1">
                          <Truck className="h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {workflow._count?.orders || 0} orders
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/order-workflows/${workflow.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateWorkflow(workflow.id, workflow.name)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {!workflow.isDefault && (
                            <DropdownMenuItem onClick={() => setAsDefault(workflow.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(workflow.id)}
                            className="text-red-600"
                            disabled={workflow.isDefault}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? Orders using this
              workflow will keep their current progress but won&apos;t be able to
              advance through stages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteWorkflow}
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
