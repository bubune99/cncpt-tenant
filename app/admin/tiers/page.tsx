"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { TiersPageContent } from "./tiers-content"
import type { SubscriptionTier } from "@/types/admin"

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
