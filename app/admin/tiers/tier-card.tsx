"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, Users, Check } from "lucide-react"
import type { SubscriptionTier } from "@/types/admin"
import { formatLimit } from "@/types/admin"

interface TierCardProps {
  tier: SubscriptionTier & { clientCount?: number }
  onEdit: (tier: SubscriptionTier) => void
  onToggleActive: (tierId: string) => void
  onDelete: (tierId: string) => void
  isToggling?: boolean
}

export function TierCard({
  tier,
  onEdit,
  onToggleActive,
  onDelete,
  isToggling,
}: TierCardProps) {
  return (
    <Card className={`relative ${!tier.isActive ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{tier.displayName}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{tier.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={tier.isActive}
              onCheckedChange={() => onToggleActive(tier.id)}
              disabled={isToggling}
            />
            <Badge variant={tier.isActive ? "default" : "secondary"}>
              {tier.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tier.description && (
          <p className="text-sm text-gray-600">{tier.description}</p>
        )}

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${tier.priceMonthly}</span>
          <span className="text-gray-500">/month</span>
          {tier.priceYearly && (
            <span className="text-sm text-gray-400 ml-2">
              (${tier.priceYearly}/year)
            </span>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Features</h4>
          <ul className="space-y-1">
            {tier.features.slice(0, 5).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
            {tier.features.length > 5 && (
              <li className="text-sm text-gray-400">
                +{tier.features.length - 5} more features
              </li>
            )}
          </ul>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Limits</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">
              Storage: <span className="font-medium">{formatLimit(tier.limits.storage_gb)} GB</span>
            </div>
            <div className="text-gray-600">
              Pages: <span className="font-medium">{formatLimit(tier.limits.pages)}</span>
            </div>
            <div className="text-gray-600">
              Posts: <span className="font-medium">{formatLimit(tier.limits.posts)}</span>
            </div>
            <div className="text-gray-600">
              Domains: <span className="font-medium">{formatLimit(tier.limits.custom_domains)}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{tier.clientCount ?? 0} clients</span>
            </div>
            <div>Trial: {tier.trialDays} days</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(tier)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(tier.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={(tier.clientCount ?? 0) > 0}
            title={(tier.clientCount ?? 0) > 0 ? "Cannot delete tier with active clients" : "Delete tier"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
