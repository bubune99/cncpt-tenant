"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, Clock, CreditCard, X, Loader2 } from "lucide-react"
import { bulkClientAction } from "@/lib/admin-actions"
import type { SubscriptionTier, FormState } from "@/types/admin"

interface BulkActionsProps {
  selectedCount: number
  selectedIds: string[]
  adminUserId: string
  tiers: SubscriptionTier[]
  onClearSelection: () => void
  onSuccess: () => void
}

type BulkActionType = "extend_trial" | "change_tier" | null

export function BulkActions({
  selectedCount,
  selectedIds,
  adminUserId,
  tiers,
  onClearSelection,
  onSuccess,
}: BulkActionsProps) {
  const [activeAction, setActiveAction] = useState<BulkActionType>(null)
  const [days, setDays] = useState("7")
  const [selectedTier, setSelectedTier] = useState("")
  const [isPending, setIsPending] = useState(false)

  const [state, formAction] = useFormState<FormState, FormData>(bulkClientAction, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClearSelection()
      setActiveAction(null)
    }
  }, [state.success, onSuccess, onClearSelection])

  const handleSubmit = async (action: string) => {
    setIsPending(true)
    const formData = new FormData()
    formData.set("action", action)
    formData.set("adminUserId", adminUserId)
    formData.set("clientIds", JSON.stringify(selectedIds))

    if (action === "extend_trial") {
      formData.set("days", days)
    } else if (action === "change_tier") {
      formData.set("tierId", selectedTier)
    }

    await formAction(formData)
    setIsPending(false)
  }

  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-blue-700 font-medium">
          {selectedCount} client{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-blue-600"
        >
          Clear selection
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Bulk Actions
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveAction("extend_trial")}>
              <Clock className="h-4 w-4 mr-2" />
              Extend Trial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveAction("change_tier")}>
              <CreditCard className="h-4 w-4 mr-2" />
              Change Tier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Extend Trial Dialog */}
      {activeAction === "extend_trial" && (
        <BulkDialog
          title="Bulk Extend Trial"
          onClose={() => setActiveAction(null)}
          onSubmit={() => handleSubmit("extend_trial")}
          isPending={isPending}
          submitLabel={`Extend ${selectedCount} Trials`}
          error={state.message && !state.success ? state.message : undefined}
        >
          <p className="text-gray-600 mb-4">
            Extend trial for {selectedCount} selected client{selectedCount !== 1 ? "s" : ""}.
          </p>
          <div className="space-y-2">
            <Label htmlFor="bulk-days">Days to Add</Label>
            <Input
              id="bulk-days"
              type="number"
              min="1"
              max="90"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        </BulkDialog>
      )}

      {/* Change Tier Dialog */}
      {activeAction === "change_tier" && (
        <BulkDialog
          title="Bulk Change Tier"
          onClose={() => setActiveAction(null)}
          onSubmit={() => handleSubmit("change_tier")}
          isPending={isPending}
          submitLabel={`Update ${selectedCount} Clients`}
          submitDisabled={!selectedTier}
          error={state.message && !state.success ? state.message : undefined}
        >
          <p className="text-gray-600 mb-4">
            Change tier for {selectedCount} selected client{selectedCount !== 1 ? "s" : ""}.
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
        </BulkDialog>
      )}
    </div>
  )
}

function BulkDialog({
  title,
  children,
  onClose,
  onSubmit,
  isPending,
  submitLabel,
  submitDisabled,
  error,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  onSubmit: () => void
  isPending: boolean
  submitLabel: string
  submitDisabled?: boolean
  error?: string
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isPending || submitDisabled}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
