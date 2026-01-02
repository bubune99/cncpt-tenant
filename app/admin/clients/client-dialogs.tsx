"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import {
  approveClientAction,
  suspendClientAction,
  reactivateClientAction,
  extendTrialAction,
  changeClientTierAction,
} from "@/lib/admin-actions"
import type { PlatformClient, SubscriptionTier, FormState } from "@/types/admin"

interface BaseDialogProps {
  clientId: string
  adminUserId: string
  onClose: () => void
  onSuccess: () => void
}

// Approve Client Dialog
interface ApproveDialogProps extends BaseDialogProps {
  tiers: SubscriptionTier[]
  companyName: string
}

export function ApproveClientDialog({
  clientId,
  adminUserId,
  tiers,
  companyName,
  onClose,
  onSuccess,
}: ApproveDialogProps) {
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useFormState<FormState, FormData>(approveClientAction, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    formData.set("clientId", clientId)
    formData.set("adminUserId", adminUserId)
    if (selectedTier) formData.set("tierId", selectedTier)
    await formAction(formData)
    setIsPending(false)
  }

  return (
    <DialogWrapper title="Approve Client" icon={<CheckCircle className="text-green-600" />} onClose={onClose}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          Approve <strong>{companyName}</strong> and start their trial period.
        </p>

        <div className="space-y-2">
          <Label>Assign Tier (Optional)</Label>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tier..." />
            </SelectTrigger>
            <SelectContent>
              {tiers.filter((t) => t.isActive).map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  {tier.displayName} - ${tier.priceMonthly}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.message && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve Client
          </Button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// Suspend Client Dialog
interface SuspendDialogProps extends BaseDialogProps {
  companyName: string
}

export function SuspendClientDialog({
  clientId,
  adminUserId,
  companyName,
  onClose,
  onSuccess,
}: SuspendDialogProps) {
  const [reason, setReason] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useFormState<FormState, FormData>(suspendClientAction, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    formData.set("clientId", clientId)
    formData.set("adminUserId", adminUserId)
    formData.set("reason", reason)
    await formAction(formData)
    setIsPending(false)
  }

  return (
    <DialogWrapper title="Suspend Client" icon={<XCircle className="text-red-600" />} onClose={onClose}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          Suspend <strong>{companyName}</strong>. They will lose access until reactivated.
        </p>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Suspension</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for suspension..."
            rows={3}
          />
        </div>

        {state.message && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} variant="destructive">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Suspend Client
          </Button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// Extend Trial Dialog
interface ExtendTrialDialogProps extends BaseDialogProps {
  companyName: string
  currentTrialEndsAt?: Date | null
}

export function ExtendTrialDialog({
  clientId,
  adminUserId,
  companyName,
  currentTrialEndsAt,
  onClose,
  onSuccess,
}: ExtendTrialDialogProps) {
  const [days, setDays] = useState("7")
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useFormState<FormState, FormData>(extendTrialAction, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    formData.set("clientId", clientId)
    formData.set("adminUserId", adminUserId)
    formData.set("days", days)
    await formAction(formData)
    setIsPending(false)
  }

  const newEndDate = currentTrialEndsAt
    ? new Date(new Date(currentTrialEndsAt).getTime() + parseInt(days) * 24 * 60 * 60 * 1000)
    : null

  return (
    <DialogWrapper title="Extend Trial" icon={<Clock className="text-blue-600" />} onClose={onClose}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          Extend the trial period for <strong>{companyName}</strong>.
        </p>

        <div className="space-y-2">
          <Label htmlFor="days">Days to Add</Label>
          <Input
            id="days"
            type="number"
            min="1"
            max="90"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>

        {currentTrialEndsAt && (
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="text-gray-500">Current end date:</div>
            <div>{new Date(currentTrialEndsAt).toLocaleDateString()}</div>
            {newEndDate && (
              <>
                <div className="text-gray-500 mt-2">New end date:</div>
                <div className="font-medium text-green-600">
                  {newEndDate.toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        )}

        {state.message && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Extend by {days} Days
          </Button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// Reactivate Client Dialog
interface ReactivateDialogProps extends BaseDialogProps {
  companyName: string
}

export function ReactivateClientDialog({
  clientId,
  adminUserId,
  companyName,
  onClose,
  onSuccess,
}: ReactivateDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useFormState<FormState, FormData>(reactivateClientAction, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    formData.set("clientId", clientId)
    formData.set("adminUserId", adminUserId)
    await formAction(formData)
    setIsPending(false)
  }

  return (
    <DialogWrapper title="Reactivate Client" icon={<RefreshCw className="text-green-600" />} onClose={onClose}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          Reactivate <strong>{companyName}</strong>. They will regain access to their account.
        </p>

        {state.message && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reactivate Client
          </Button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// Change Tier Dialog
interface ChangeTierDialogProps extends BaseDialogProps {
  companyName: string
  currentTierId?: string | null
  tiers: SubscriptionTier[]
}

export function ChangeTierDialog({
  clientId,
  adminUserId,
  companyName,
  currentTierId,
  tiers,
  onClose,
  onSuccess,
}: ChangeTierDialogProps) {
  const [selectedTier, setSelectedTier] = useState(currentTierId || "")
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useFormState<FormState, FormData>(changeClientTierAction, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    formData.set("clientId", clientId)
    formData.set("adminUserId", adminUserId)
    formData.set("tierId", selectedTier)
    await formAction(formData)
    setIsPending(false)
  }

  return (
    <DialogWrapper title="Change Tier" onClose={onClose}>
      <form action={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          Change the subscription tier for <strong>{companyName}</strong>.
        </p>

        <div className="space-y-2">
          <Label>Select Tier</Label>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tier..." />
            </SelectTrigger>
            <SelectContent>
              {tiers.filter((t) => t.isActive).map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  {tier.displayName} - ${tier.priceMonthly}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.message && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {state.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !selectedTier}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Change Tier
          </Button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// Wrapper component for dialog styling
function DialogWrapper({
  title,
  icon,
  children,
  onClose,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
