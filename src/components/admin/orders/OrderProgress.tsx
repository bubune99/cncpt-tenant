'use client'

import { useState } from 'react'
import {
  Check,
  ChevronRight,
  Clock,
  MoreHorizontal,
  RefreshCw,
  SkipForward,
  Undo2,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface WorkflowStage {
  id: string
  name: string
  displayName: string
  customerMessage?: string | null
  icon?: string | null
  color?: string | null
  position: number
  isTerminal: boolean
}

interface ProgressEntry {
  id: string
  stageId: string
  enteredAt: string
  exitedAt?: string | null
  source: string
  isOverride: boolean
  reason?: string | null
  notes?: string | null
  stage: WorkflowStage
  updatedBy?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
}

interface OrderProgressProps {
  orderId: string
  orderNumber: string
  workflow: {
    id: string
    name: string
    enableShippoSync: boolean
    stages: WorkflowStage[]
  } | null
  currentStage: WorkflowStage | null
  progress: ProgressEntry[]
  trackingAutoSync: boolean
  onUpdate?: () => void
}

export function OrderProgress({
  orderId,
  orderNumber,
  workflow,
  currentStage,
  progress,
  trackingAutoSync,
  onUpdate,
}: OrderProgressProps) {
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)
  const [targetStageId, setTargetStageId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [autoSync, setAutoSync] = useState(trackingAutoSync)

  if (!workflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
          <CardDescription>No workflow assigned to this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch(`/api/orders/${orderId}/progress`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'initialize' }),
                })
                if (response.ok) {
                  toast.success('Workflow initialized')
                  onUpdate?.()
                }
              } catch {
                toast.error('Failed to initialize workflow')
              }
            }}
          >
            Initialize Default Workflow
          </Button>
        </CardContent>
      </Card>
    )
  }

  const sortedStages = [...workflow.stages].sort((a, b) => a.position - b.position)
  const currentPosition = currentStage?.position ?? -1

  async function advanceToNext() {
    try {
      setIsAdvancing(true)
      const response = await fetch(`/api/orders/${orderId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      })

      if (response.ok) {
        toast.success('Order advanced to next stage')
        onUpdate?.()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to advance order')
      }
    } catch {
      toast.error('Failed to advance order')
    } finally {
      setIsAdvancing(false)
    }
  }

  async function syncWithShipment() {
    try {
      setIsSyncing(true)
      const response = await fetch(`/api/orders/${orderId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncShipment' }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.synced) {
          toast.success('Order synced with shipment tracking')
        } else {
          toast.info('No tracking updates available')
        }
        onUpdate?.()
      }
    } catch {
      toast.error('Failed to sync with shipment')
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleRevert() {
    if (!targetStageId || !reason) {
      toast.error('Target stage and reason are required')
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revert',
          targetStageId,
          reason,
          notes,
        }),
      })

      if (response.ok) {
        toast.success('Order reverted to previous stage')
        setRevertDialogOpen(false)
        setTargetStageId('')
        setReason('')
        setNotes('')
        onUpdate?.()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to revert order')
      }
    } catch {
      toast.error('Failed to revert order')
    }
  }

  async function handleSkip() {
    if (!targetStageId || !reason) {
      toast.error('Target stage and reason are required')
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skip',
          targetStageId,
          reason,
          notes,
        }),
      })

      if (response.ok) {
        toast.success('Order skipped to target stage')
        setSkipDialogOpen(false)
        setTargetStageId('')
        setReason('')
        setNotes('')
        onUpdate?.()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to skip stages')
      }
    } catch {
      toast.error('Failed to skip stages')
    }
  }

  async function toggleAutoSync(enabled: boolean) {
    try {
      const response = await fetch(`/api/orders/${orderId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleAutoSync',
          enabled,
        }),
      })

      if (response.ok) {
        setAutoSync(enabled)
        toast.success(`Auto-sync ${enabled ? 'enabled' : 'disabled'}`)
      }
    } catch {
      toast.error('Failed to toggle auto-sync')
    }
  }

  const canAdvance = currentStage && !currentStage.isTerminal
  const canRevert = currentPosition > 0
  const canSkip = currentStage && !currentStage.isTerminal && currentPosition < sortedStages.length - 1

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Order Progress</CardTitle>
          <CardDescription>
            {workflow.name} - Order #{orderNumber}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canRevert && (
              <DropdownMenuItem onClick={() => setRevertDialogOpen(true)}>
                <Undo2 className="h-4 w-4 mr-2" />
                Revert to Previous Stage
              </DropdownMenuItem>
            )}
            {canSkip && (
              <DropdownMenuItem onClick={() => setSkipDialogOpen(true)}>
                <SkipForward className="h-4 w-4 mr-2" />
                Skip to Stage
              </DropdownMenuItem>
            )}
            {workflow.enableShippoSync && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={syncWithShipment} disabled={isSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync with Shipment
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Timeline */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {sortedStages.map((stage, index) => {
              const isCompleted = stage.position < currentPosition
              const isCurrent = stage.id === currentStage?.id
              const isPending = stage.position > currentPosition

              return (
                <div key={stage.id} className="flex flex-col items-center relative flex-1">
                  {/* Connector Line */}
                  {index < sortedStages.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 ${
                        isCompleted || isCurrent ? 'bg-primary' : 'bg-muted'
                      }`}
                      style={{ transform: 'translateX(50%)' }}
                    />
                  )}

                  {/* Stage Circle */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background text-muted-foreground'
                    }`}
                    style={
                      isCurrent || isCompleted
                        ? { backgroundColor: stage.color || undefined }
                        : undefined
                    }
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`text-xs font-medium ${
                        isCurrent
                          ? 'text-foreground'
                          : isCompleted
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/50'
                      }`}
                    >
                      {stage.displayName}
                    </p>
                    {stage.isTerminal && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Final
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Stage Info */}
        {currentStage && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{currentStage.displayName}</p>
                {currentStage.customerMessage && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentStage.customerMessage}
                  </p>
                )}
              </div>
              {canAdvance && (
                <Button onClick={advanceToNext} disabled={isAdvancing}>
                  {isAdvancing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  Advance
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Shippo Sync Toggle */}
        {workflow.enableShippoSync && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auto-sync with Shippo</p>
                <p className="text-xs text-muted-foreground">
                  Automatically update progress from tracking
                </p>
              </div>
            </div>
            <Switch checked={autoSync} onCheckedChange={toggleAutoSync} />
          </div>
        )}

        {/* Progress History */}
        {progress.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {progress.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/30"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: entry.stage.color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.stage.displayName}</span>
                      {entry.isOverride && (
                        <Badge variant="outline" className="text-xs">
                          Override
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {entry.source}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.enteredAt).toLocaleString()}
                      {entry.updatedBy && ` by ${entry.updatedBy.name || entry.updatedBy.email}`}
                    </div>
                    {entry.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Revert Dialog */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert to Previous Stage</DialogTitle>
            <DialogDescription>
              Move this order back to a previous stage. This requires a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Stage</Label>
              <Select value={targetStageId} onValueChange={setTargetStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage to revert to" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStages
                    .filter((s) => s.position < currentPosition)
                    .map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you reverting this order?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRevert}>Revert Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip to Stage</DialogTitle>
            <DialogDescription>
              Skip this order ahead to a later stage. This requires a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Target Stage</Label>
              <Select value={targetStageId} onValueChange={setTargetStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage to skip to" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStages
                    .filter((s) => s.position > currentPosition)
                    .map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you skipping stages?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSkip}>Skip to Stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
