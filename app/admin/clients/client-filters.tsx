"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { ClientStatus, SubscriptionTier } from "@/types/admin"
import { CLIENT_STATUS_LABELS } from "@/types/admin"

interface ClientFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: ClientStatus | "all"
  onStatusChange: (value: ClientStatus | "all") => void
  tierFilter: string
  onTierChange: (value: string) => void
  tiers: SubscriptionTier[]
}

export function ClientFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  tierFilter,
  onTierChange,
  tiers,
}: ClientFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by company, email, or subdomain..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as ClientStatus | "all")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tierFilter} onValueChange={onTierChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          <SelectItem value="none">No Tier</SelectItem>
          {tiers.map((tier) => (
            <SelectItem key={tier.id} value={tier.id}>
              {tier.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
