"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Coins,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Zap,
  Gift,
  ArrowRight,
} from "lucide-react"

interface CreditBalance {
  monthly: number
  purchased: number
  total: number
  lifetimeAllocated: number
  lifetimePurchased: number
  lifetimeUsed: number
  monthlyAllocation: number
  rolloverCap: number
}

interface CreditPack {
  id: string
  name: string
  displayName: string
  description: string
  credits: number
  bonusCredits: number
  totalCredits: number
  priceCents: number
  priceFormatted: string
  badge: string | null
  isPopular: boolean
}

interface Transaction {
  id: string
  type: string
  amount: number
  feature: string | null
  description: string | null
  createdAt: string
}

export function Credits() {
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadData()

    // Check for success/cancelled query params
    const params = new URLSearchParams(window.location.search)
    if (params.get("credits") === "success") {
      setSuccessMessage("Credits purchased successfully! Your balance has been updated.")
      // Clean URL
      window.history.replaceState({}, "", "/dashboard")
      // Reload balance
      setTimeout(loadData, 1000)
    } else if (params.get("credits") === "cancelled") {
      setError("Purchase was cancelled.")
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [balanceRes, packsRes] = await Promise.all([
        fetch("/api/credits/balance"),
        fetch("/api/credits/purchase"),
      ])

      if (balanceRes.ok) {
        const data = await balanceRes.json()
        setBalance(data.balance)
        setTransactions(data.recentTransactions || [])
      }

      if (packsRes.ok) {
        const data = await packsRes.json()
        setPacks(data.packs || [])
      }
    } catch (e) {
      console.error("Failed to load credit data:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (packId: string) => {
    setPurchasingPack(packId)
    setError(null)

    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        setError(data.error || "Failed to start checkout")
      }
    } catch (e) {
      setError("Failed to start checkout")
    } finally {
      setPurchasingPack(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Credits</h1>
        <p className="text-muted-foreground">
          Manage your AI credits for content generation, chat, and more
        </p>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.total.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">credits available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Monthly Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.monthly.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance?.monthlyAllocation || 0}/month from plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Purchased Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.purchased.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">never expire</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      {balance && balance.lifetimeUsed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{balance.lifetimeAllocated.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{balance.lifetimePurchased.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Purchased</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{balance.lifetimeUsed.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Buy More Credits
          </CardTitle>
          <CardDescription>
            Purchased credits never expire and can be used anytime
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className={`relative border rounded-lg p-4 transition-all hover:border-primary ${
                  pack.isPopular ? "border-primary bg-primary/5" : ""
                }`}
              >
                {pack.isPopular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {pack.badge === "best_value" && (
                  <Badge variant="secondary" className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Best Value
                  </Badge>
                )}

                <div className="text-center pt-2">
                  <h3 className="font-semibold">{pack.displayName}</h3>
                  <div className="text-3xl font-bold mt-2">{pack.priceFormatted}</div>

                  <div className="mt-3 space-y-1">
                    <div className="text-lg font-medium">
                      {pack.credits.toLocaleString()} credits
                    </div>
                    {pack.bonusCredits > 0 && (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <Gift className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          +{pack.bonusCredits.toLocaleString()} bonus
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {pack.description}
                  </p>

                  <Button
                    className="w-full mt-4"
                    variant={pack.isPopular ? "default" : "outline"}
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchasingPack === pack.id}
                  >
                    {purchasingPack === pack.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Buy Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.amount > 0
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.type === "purchase"
                          ? "Credit Purchase"
                          : tx.type === "allocation"
                          ? "Monthly Allocation"
                          : tx.type === "usage"
                          ? `Used: ${tx.feature || "AI Feature"}`
                          : tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      tx.amount > 0 ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
