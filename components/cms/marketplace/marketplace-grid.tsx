"use client"

import { TemplateCard } from "./template-card"
import { Skeleton } from "@/components/cms/ui/skeleton"
import { Button } from "@/components/cms/ui/button"
import { LayoutGrid, PackageSearch, Loader2 } from "lucide-react"
import type { MarketplaceTemplate } from "./types"

interface MarketplaceGridProps {
  templates: MarketplaceTemplate[]
  isLoading: boolean
  total: number
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
  onPreview: (template: MarketplaceTemplate) => void
  onUse: (template: MarketplaceTemplate) => void
}

/**
 * Template grid with loading states, empty states, and load-more.
 */
export function MarketplaceGrid({
  templates,
  isLoading,
  total,
  hasMore,
  onLoadMore,
  isLoadingMore,
  onPreview,
  onUse,
}: MarketplaceGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Empty state: no templates at all
  if (templates.length === 0 && total === 0) {
    return <EmptyState variant="no-templates" />
  }

  // Empty state: no results matching filters
  if (templates.length === 0) {
    return <EmptyState variant="no-results" />
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={onPreview}
            onUse={onUse}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <LayoutGrid size={14} />
                Load More ({total - templates.length} remaining)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-14 rounded-md" />
      </div>
    </div>
  )
}

function EmptyState({ variant }: { variant: "no-templates" | "no-results" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <PackageSearch size={28} className="text-muted-foreground" />
      </div>
      {variant === "no-results" ? (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No templates match your filters
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Try adjusting your search query or clearing some filters to see more results.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No templates available yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The template marketplace is empty. Templates will appear here once they
            are scraped from sources or uploaded by administrators.
          </p>
        </>
      )}
    </div>
  )
}
