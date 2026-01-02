"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Loader2 } from "lucide-react"
import { createTierAction, updateTierAction } from "@/lib/admin-actions"
import type { SubscriptionTier, FormState, TierLimits } from "@/types/admin"

interface TierFormProps {
  tier?: SubscriptionTier | null
  onClose: () => void
  onSuccess: () => void
}

const defaultLimits: TierLimits = {
  storage_gb: 5,
  pages: 10,
  posts: 100,
  custom_domains: 1,
  team_members: 1,
}

export function TierForm({ tier, onClose, onSuccess }: TierFormProps) {
  const isEditing = !!tier
  const [features, setFeatures] = useState<string[]>(tier?.features || [])
  const [newFeature, setNewFeature] = useState("")
  const [limits, setLimits] = useState<TierLimits>(tier?.limits || defaultLimits)
  const [isPending, setIsPending] = useState(false)

  const action = isEditing ? updateTierAction : createTierAction
  const [state, formAction] = useFormState<FormState, FormData>(action, {
    success: false,
    message: "",
  })

  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    formData.set("features", JSON.stringify(features))
    formData.set("limits", JSON.stringify(limits))
    await formAction(formData)
    setIsPending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? "Edit Tier" : "Create New Tier"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {isEditing && <input type="hidden" name="tierId" value={tier.id} />}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Tier Name (slug)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., starter"
                  defaultValue={tier?.name}
                  disabled={isEditing}
                  required
                />
                <p className="text-xs text-gray-500">Unique identifier, cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="e.g., Starter Plan"
                  defaultValue={tier?.displayName}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of this tier..."
                defaultValue={tier?.description || ""}
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Monthly Price ($)</Label>
                <Input
                  id="priceMonthly"
                  name="priceMonthly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.00"
                  defaultValue={tier?.priceMonthly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceYearly">Yearly Price ($)</Label>
                <Input
                  id="priceYearly"
                  name="priceYearly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="144.00"
                  defaultValue={tier?.priceYearly || ""}
                />
                <p className="text-xs text-gray-500">Optional discount</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDays">Trial Days</Label>
                <Input
                  id="trialDays"
                  name="trialDays"
                  type="number"
                  min="0"
                  placeholder="14"
                  defaultValue={tier?.trialDays ?? 14}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                  >
                    <span className="text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Limits (-1 for unlimited)</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="storage_gb" className="text-sm text-gray-600">
                    Storage (GB)
                  </Label>
                  <Input
                    id="storage_gb"
                    type="number"
                    min="-1"
                    value={limits.storage_gb}
                    onChange={(e) =>
                      setLimits({ ...limits, storage_gb: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages" className="text-sm text-gray-600">
                    Pages
                  </Label>
                  <Input
                    id="pages"
                    type="number"
                    min="-1"
                    value={limits.pages}
                    onChange={(e) =>
                      setLimits({ ...limits, pages: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posts" className="text-sm text-gray-600">
                    Posts
                  </Label>
                  <Input
                    id="posts"
                    type="number"
                    min="-1"
                    value={limits.posts}
                    onChange={(e) =>
                      setLimits({ ...limits, posts: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_domains" className="text-sm text-gray-600">
                    Custom Domains
                  </Label>
                  <Input
                    id="custom_domains"
                    type="number"
                    min="-1"
                    value={limits.custom_domains}
                    onChange={(e) =>
                      setLimits({ ...limits, custom_domains: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team_members" className="text-sm text-gray-600">
                    Team Members
                  </Label>
                  <Input
                    id="team_members"
                    type="number"
                    min="-1"
                    value={limits.team_members}
                    onChange={(e) =>
                      setLimits({ ...limits, team_members: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            {state.message && !state.success && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {state.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Tier"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
