"use client"

/**
 * Credit Balance Display Component
 * Shows user's AI credit balance with breakdown
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Users, ChevronRight, RefreshCw } from "lucide-react"

interface CreditBalanceData {
  balance: {
    monthly: number
    purchased: number
    total: number
    teamPool: number
    totalAvailable: number
  }
  stats: {
    lifetimeAllocated: number
    lifetimePurchased: number
    lifetimeUsed: number
  }
  allocation: {
    monthlyAmount: number
    rolloverCap: number
    lastAllocationDate: string | null
  }
  tier: {
    name: string
    displayName: string
    aiFeatures: string[] | string
  }
}

interface CreditBalanceProps {
  subdomainId?: string
  onPurchaseClick?: () => void
  compact?: boolean
  showTeamPool?: boolean
}

export function CreditBalance({
  subdomainId,
  onPurchaseClick,
  compact = false,
  showTeamPool = true,
}: CreditBalanceProps) {
  const [data, setData] = useState<CreditBalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (subdomainId) params.set("subdomain_id", subdomainId)

      const response = await fetch(`/api/dashboard/credits?${params}`)
      if (!response.ok) throw new Error("Failed to fetch balance")

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balance")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [subdomainId])

  if (loading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className="flex items-center justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className="py-6 text-center text-muted-foreground">
          {error || "Unable to load credit balance"}
        </CardContent>
      </Card>
    )
  }

  const { balance, allocation, tier } = data
  const monthlyUsagePercent = allocation.monthlyAmount > 0
    ? Math.round((balance.monthly / allocation.monthlyAmount) * 100)
    : 0

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{balance.totalAvailable.toLocaleString()} credits</p>
              <p className="text-xs text-muted-foreground">
                {balance.monthly} monthly + {balance.purchased + balance.teamPool} purchased
              </p>
            </div>
          </div>
          {onPurchaseClick && (
            <Button size="sm" variant="outline" onClick={onPurchaseClick}>
              <Zap className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Credits
          </CardTitle>
          <Badge variant="secondary">{tier.displayName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Available */}
        <div className="text-center py-2">
          <p className="text-4xl font-bold">{balance.totalAvailable.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">credits available</p>
        </div>

        {/* Balance Breakdown */}
        <div className="space-y-3">
          {/* Monthly Credits */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Credits</span>
              <span className="font-medium">
                {balance.monthly.toLocaleString()} / {allocation.monthlyAmount.toLocaleString()}
              </span>
            </div>
            <Progress value={monthlyUsagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Resets monthly. Unused credits roll over (up to {allocation.rolloverCap.toLocaleString()})
            </p>
          </div>

          {/* Purchased Credits */}
          <div className="flex justify-between items-center py-2 border-t">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Purchased Credits</span>
            </div>
            <span className="font-medium">{balance.purchased.toLocaleString()}</span>
          </div>

          {/* Team Pool */}
          {showTeamPool && balance.teamPool > 0 && (
            <div className="flex justify-between items-center py-2 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Team Pool</span>
              </div>
              <span className="font-medium">{balance.teamPool.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Purchase Button */}
        {onPurchaseClick && (
          <Button className="w-full" onClick={onPurchaseClick}>
            <Zap className="h-4 w-4 mr-2" />
            Buy More Credits
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        )}

        {/* Low Balance Warning */}
        {balance.totalAvailable < 20 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Running low on credits! Purchase more to continue using AI features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Inline credit display for headers/navbars
 */
export function CreditBalanceInline({
  subdomainId,
  onClick,
}: {
  subdomainId?: string
  onClick?: () => void
}) {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const params = new URLSearchParams()
        if (subdomainId) params.set("subdomain_id", subdomainId)

        const response = await fetch(`/api/dashboard/credits?${params}`)
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance.totalAvailable)
        }
      } catch {
        // Silently fail for inline display
      }
    }
    fetchBalance()
  }, [subdomainId])

  if (balance === null) return null

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="text-sm font-medium">{balance.toLocaleString()}</span>
    </button>
  )
}
