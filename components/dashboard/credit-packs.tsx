"use client"

/**
 * Credit Packs Selection Component
 * Displays available credit packs for purchase
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Zap, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditPack {
  id: string
  name: string
  displayName: string
  description: string | null
  credits: number
  bonusCredits: number
  totalCredits: number
  priceCents: number
  currency: string
  badge: string | null
  isPopular: boolean
  sortOrder: number
}

interface CreditPacksProps {
  subdomainId?: string
  onboardingMode?: boolean
  selectedPackId?: string | null
  onSelect?: (pack: CreditPack | null) => void
  onPurchase?: (pack: CreditPack) => Promise<void>
  returnUrl?: string
  allowSkip?: boolean
}

export function CreditPacks({
  subdomainId,
  onboardingMode = false,
  selectedPackId,
  onSelect,
  onPurchase,
  returnUrl,
  allowSkip = true,
}: CreditPacksProps) {
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const params = new URLSearchParams()
        if (onboardingMode) params.set("onboarding", "true")

        const response = await fetch(`/api/dashboard/credits/purchase?${params}`)
        if (!response.ok) throw new Error("Failed to fetch credit packs")

        const data = await response.json()
        setPacks(data.packs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load credit packs")
      } finally {
        setLoading(false)
      }
    }
    fetchPacks()
  }, [onboardingMode])

  const handlePurchase = async (pack: CreditPack) => {
    if (onPurchase) {
      await onPurchase(pack)
      return
    }

    try {
      setPurchasing(pack.id)
      setError(null)

      const response = await fetch("/api/dashboard/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          subdomainId,
          returnUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create checkout")
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed")
      setPurchasing(null)
    }
  }

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getPricePerCredit = (pack: CreditPack) => {
    const pricePerCredit = pack.priceCents / pack.totalCredits
    return `$${(pricePerCredit / 100).toFixed(3)}/credit`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onboardingMode && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Boost Your AI Power</h2>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your plan includes monthly AI credits. Get more credits now to supercharge your content creation.
          </p>
        </div>
      )}

      <div className={cn(
        "grid gap-4",
        packs.length <= 3 ? "md:grid-cols-3" : "md:grid-cols-4"
      )}>
        {packs.map((pack) => {
          const isSelected = selectedPackId === pack.id
          const isPurchasing = purchasing === pack.id

          return (
            <Card
              key={pack.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary",
                pack.isPopular && "border-primary"
              )}
              onClick={() => onSelect?.(isSelected ? null : pack)}
            >
              {/* Popular Badge */}
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    className={cn(
                      "px-3 py-1",
                      pack.badge === "popular" && "bg-primary text-primary-foreground",
                      pack.badge === "best_value" && "bg-green-600 text-white"
                    )}
                  >
                    {pack.badge === "popular" ? "Most Popular" : "Best Value"}
                  </Badge>
                </div>
              )}

              <CardHeader className={cn("pb-2", pack.badge && "pt-6")}>
                <CardTitle className="text-lg">{pack.displayName}</CardTitle>
                {pack.description && (
                  <CardDescription>{pack.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Credits */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-3xl font-bold">{pack.credits.toLocaleString()}</span>
                  </div>
                  {pack.bonusCredits > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      +{pack.bonusCredits.toLocaleString()} bonus!
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {getPricePerCredit(pack)}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center">
                  <span className="text-2xl font-bold">
                    {formatPrice(pack.priceCents, pack.currency)}
                  </span>
                  <p className="text-xs text-muted-foreground">one-time purchase</p>
                </div>

                {/* Select/Purchase Button */}
                {onSelect ? (
                  <div className="flex items-center justify-center h-10">
                    {isSelected ? (
                      <div className="flex items-center gap-2 text-primary">
                        <Check className="h-5 w-5" />
                        <span className="font-medium">Selected</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Click to select</span>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={pack.isPopular ? "default" : "outline"}
                    disabled={!!purchasing}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePurchase(pack)
                    }}
                  >
                    {isPurchasing ? (
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
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Skip Option */}
      {onboardingMode && allowSkip && onSelect && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => onSelect(null)}
            className="text-muted-foreground"
          >
            Skip for now - I'll use my monthly credits
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Purchased credits never expire</p>
            <p className="text-muted-foreground">
              Unlike monthly credits, purchased credits stay in your account forever.
              Use them anytime for AI content generation, chat, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact credit pack selector for inline use
 */
export function CreditPackSelector({
  selectedPackId,
  onSelect,
  onboardingMode = false,
}: {
  selectedPackId?: string | null
  onSelect: (pack: CreditPack | null) => void
  onboardingMode?: boolean
}) {
  return (
    <CreditPacks
      selectedPackId={selectedPackId}
      onSelect={onSelect}
      onboardingMode={onboardingMode}
      allowSkip={true}
    />
  )
}
