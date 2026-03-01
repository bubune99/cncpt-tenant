"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/cms/ui/input"
import { Button } from "@/components/cms/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select"
import { Search, X, LayoutGrid, Globe, Puzzle } from "lucide-react"
import { cn } from "@/lib/cms/utils"
import type { MarketplaceFilters as Filters, MarketplaceSort, TemplateType } from "./types"

interface MarketplaceFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  categories: string[]
  sources: string[]
  totalCount: number
}

const TYPE_OPTIONS: { value: TemplateType | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <LayoutGrid size={14} /> },
  { value: "site", label: "Full Sites", icon: <Globe size={14} /> },
  { value: "component", label: "Components", icon: <Puzzle size={14} /> },
]

const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A-Z" },
]

export function MarketplaceFilters({
  filters,
  onFiltersChange,
  categories,
  sources,
  totalCount,
}: MarketplaceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters, onFiltersChange])

  const clearSearch = useCallback(() => {
    setSearchInput("")
    onFiltersChange({ ...filters, search: "" })
  }, [filters, onFiltersChange])

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      onFiltersChange({ ...filters, [key]: value })
    },
    [filters, onFiltersChange]
  )

  const hasActiveFilters =
    filters.search !== "" ||
    filters.type !== "all" ||
    filters.category !== "" ||
    filters.source !== ""

  const clearAllFilters = useCallback(() => {
    setSearchInput("")
    onFiltersChange({
      search: "",
      type: "all",
      category: "",
      source: "",
      sort: filters.sort,
    })
  }, [filters.sort, onFiltersChange])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search templates by name, description, or tags..."
          className="pl-10 pr-10 h-10"
        />
        {searchInput && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type toggle pills */}
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("type", option.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filters.type === option.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {/* Category select */}
        <Select
          value={filters.category || "__all__"}
          onValueChange={(v) => updateFilter("category", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="text-xs">
              All Categories
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source select */}
        <Select
          value={filters.source || "__all__"}
          onValueChange={(v) => updateFilter("source", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="text-xs">
              All Sources
            </SelectItem>
            {sources.map((src) => (
              <SelectItem key={src} value={src} className="text-xs">
                {src}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort select */}
        <Select
          value={filters.sort}
          onValueChange={(v) => updateFilter("sort", v as MarketplaceSort)}
        >
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X size={12} />
            Clear filters
          </Button>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-muted-foreground">
          {totalCount} template{totalCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}
