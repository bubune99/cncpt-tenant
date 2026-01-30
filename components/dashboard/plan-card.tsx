"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SubscriptionTier, TierLimits } from "@/types/admin"

interface PlanCardProps {
  tier: SubscriptionTier
  isCurrentPlan?: boolean
  isRecommended?: boolean
  isLoading?: boolean
  onSelect?: (tierId: string) => void
  disabled?: boolean
  showSelectButton?: boolean
  compact?: boolean
}

export function PlanCard({
  tier,
  isCurrentPlan = false,
  isRecommended = false,
  isLoading = false,
  onSelect,
  disabled = false,
  showSelectButton = true,
  compact = false,
}: PlanCardProps) {
  const isFree = tier.priceMonthly === 0
  const isEnterprise = tier.name === "enterprise"

  const formatPrice = (price: number) => {
    if (price === 0) return "Free"
    return `$${price}/mo`
  }

  const formatLimit = (value: number) => {
    if (value === -1) return "Unlimited"
    return value.toString()
  }

  const getSubdomainLimit = (limits: TierLimits & { subdomains?: number }) => {
    if (typeof limits.subdomains === "number") {
      return formatLimit(limits.subdomains)
    }
    // Default mapping based on tier name
    switch (tier.name) {
      case "free":
        return "1"
      case "pro":
        return "5"
      case "enterprise":
        return "Unlimited"
      default:
        return "1"
    }
  }

  const handleSelect = () => {
    if (onSelect && !disabled && !isLoading) {
      onSelect(tier.id)
    }
  }

  return (
    <Card
      className={cn(
        "relative transition-all cursor-pointer hover:shadow-md",
        isCurrentPlan && "ring-2 ring-primary",
        isRecommended && "border-primary shadow-lg",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={handleSelect}
    >
      {/* Badges */}
      <div className="absolute -top-3 left-4 flex gap-2">
        {isCurrentPlan && (
          <Badge variant="default" className="bg-primary">
            Current Plan
          </Badge>
        )}
        {isRecommended && !isCurrentPlan && (
          <Badge variant="secondary" className="bg-amber-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        )}
      </div>

      <CardHeader className={cn("pb-4", compact && "pb-2")}>
        <CardTitle className="flex items-center justify-between">
          <span>{tier.displayName}</span>
        </CardTitle>
        <CardDescription>
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(tier.priceMonthly)}
          </span>
          {tier.priceYearly && tier.priceMonthly > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              (${tier.priceYearly}/yr saves{" "}
              {Math.round(((tier.priceMonthly * 12 - tier.priceYearly) / (tier.priceMonthly * 12)) * 100)}%)
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("space-y-4", compact && "space-y-2")}>
        {/* Key Limits */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">Subdomains:</span>
            <span className="text-muted-foreground">
              {getSubdomainLimit(tier.limits as TierLimits & { subdomains?: number })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Custom Domains:</span>
            <span className="text-muted-foreground">
              {formatLimit(tier.limits.custom_domains)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Team Members:</span>
            <span className="text-muted-foreground">
              {formatLimit(tier.limits.team_members)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Storage:</span>
            <span className="text-muted-foreground">
              {tier.limits.storage_gb === -1 ? "Unlimited" : `${tier.limits.storage_gb}GB`}
            </span>
          </div>
        </div>

        {/* Features List */}
        {!compact && tier.features.length > 0 && (
          <ul className="space-y-1.5">
            {tier.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
            {tier.features.length > 5 && (
              <li className="text-xs text-muted-foreground pl-6">
                +{tier.features.length - 5} more features
              </li>
            )}
          </ul>
        )}

        {/* Trial Badge */}
        {tier.trialDays > 0 && !isFree && !isCurrentPlan && (
          <p className="text-xs text-muted-foreground text-center">
            {tier.trialDays}-day free trial included
          </p>
        )}

        {/* Select Button */}
        {showSelectButton && (
          <Button
            className="w-full"
            variant={isCurrentPlan ? "outline" : isRecommended ? "default" : "secondary"}
            disabled={disabled || isLoading || isCurrentPlan}
            onClick={(e) => {
              e.stopPropagation()
              handleSelect()
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isCurrentPlan ? (
              "Current Plan"
            ) : isFree ? (
              "Select Free"
            ) : (
              `Upgrade to ${tier.displayName}`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface PlanComparisonProps {
  tiers: SubscriptionTier[]
  currentTierId?: string | null
  onSelectTier: (tierId: string) => void
  loadingTierId?: string | null
  disabled?: boolean
}

export function PlanComparison({
  tiers,
  currentTierId,
  onSelectTier,
  loadingTierId,
  disabled = false,
}: PlanComparisonProps) {
  // Sort tiers by sort order, then by price
  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.priceMonthly - b.priceMonthly
  })

  // Determine recommended tier (usually "pro" or the middle tier)
  const recommendedTier = sortedTiers.find((t) => t.name === "pro") || sortedTiers[1]

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {sortedTiers.map((tier) => (
        <PlanCard
          key={tier.id}
          tier={tier}
          isCurrentPlan={tier.id === currentTierId}
          isRecommended={tier.id === recommendedTier?.id}
          isLoading={tier.id === loadingTierId}
          onSelect={onSelectTier}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
