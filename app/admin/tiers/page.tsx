"use client"

import { useState, useEffect, useCallback } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CreditCard, Loader2 } from "lucide-react"
import { TierCard } from "./tier-card"
import { TierForm } from "./tier-form"
import { toggleTierActiveAction, deleteTierAction } from "@/lib/admin-actions"
import type { SubscriptionTier, FormState } from "@/types/admin"

interface TiersPageContentProps {
  initialTiers: (SubscriptionTier & { clientCount: number })[]
}

export function TiersPageContent({ initialTiers }: TiersPageContentProps) {
  const [tiers, setTiers] = useState(initialTiers)
  const [showForm, setShowForm] = useState(false)
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [toggleState, toggleAction] = useFormState<FormState, FormData>(
    toggleTierActiveAction,
    { success: false, message: "" }
  )
  const [deleteState, deleteAction] = useFormState<FormState, FormData>(
    deleteTierAction,
    { success: false, message: "" }
  )

  const refreshTiers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tiers")
      if (response.ok) {
        const data = await response.json()
        setTiers(data.tiers)
      }
    } catch (error) {
      console.error("Failed to refresh tiers:", error)
    }
  }, [])

  useEffect(() => {
    if (toggleState.success || deleteState.success) {
      refreshTiers()
      setTogglingId(null)
      setDeletingId(null)
    }
  }, [toggleState.success, deleteState.success, refreshTiers])

  const handleToggleActive = async (tierId: string) => {
    setTogglingId(tierId)
    const formData = new FormData()
    formData.set("tierId", tierId)
    await toggleAction(formData)
  }

  const handleDelete = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this tier?")) return
    setDeletingId(tierId)
    const formData = new FormData()
    formData.set("tierId", tierId)
    await deleteAction(formData)
  }

  const handleEdit = (tier: SubscriptionTier) => {
    setEditingTier(tier)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTier(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Subscription Tiers</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage pricing plans and features for your platform
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No subscription tiers configured yet.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Tier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              isToggling={togglingId === tier.id}
            />
          ))}
        </div>
      )}

      {(toggleState.message || deleteState.message) && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded shadow-md z-40 ${
            toggleState.success || deleteState.success
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {toggleState.message || deleteState.message}
        </div>
      )}

      {showForm && (
        <TierForm
          tier={editingTier}
          onClose={handleCloseForm}
          onSuccess={refreshTiers}
        />
      )}
    </div>
  )
}

// Server component wrapper - for now just export the client component
// The actual data fetching will be handled by integrating into the dashboard
export default function TiersPage() {
  const [tiers, setTiers] = useState<(SubscriptionTier & { clientCount: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTiers() {
      try {
        const response = await fetch("/api/admin/tiers")
        if (response.ok) {
          const data = await response.json()
          setTiers(data.tiers)
        }
      } catch (error) {
        console.error("Failed to load tiers:", error)
      } finally {
        setLoading(false)
      }
    }
    loadTiers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return <TiersPageContent initialTiers={tiers} />
}
