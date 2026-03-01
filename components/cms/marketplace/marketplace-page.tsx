"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MarketplaceFilters } from "./marketplace-filters"
import { MarketplaceGrid } from "./marketplace-grid"
import { TemplatePreviewModal } from "./template-preview-modal"
import { Store } from "lucide-react"
import { toast } from "sonner"
import type {
  MarketplaceTemplate,
  MarketplaceFilters as FiltersType,
  MarketplacePageData,
} from "./types"

const PAGE_SIZE = 24

/**
 * Build query string from filters and pagination.
 */
function buildQuery(filters: FiltersType, page: number): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.type !== "all") params.set("type", filters.type)
  if (filters.category) params.set("category", filters.category)
  if (filters.source) params.set("source", filters.source)
  params.set("sort", filters.sort)
  params.set("page", String(page))
  params.set("pageSize", String(PAGE_SIZE))
  return params.toString()
}

export function MarketplacePage() {
  const router = useRouter()

  // Filter state
  const [filters, setFilters] = useState<FiltersType>({
    search: "",
    type: "all",
    category: "",
    source: "",
    sort: "popular",
  })

  // Data state
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<MarketplaceTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  /**
   * Fetch templates from the marketplace API.
   */
  const fetchTemplates = useCallback(
    async (currentFilters: FiltersType, pageNum: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const query = buildQuery(currentFilters, pageNum)
        const res = await fetch(`/api/cms/marketplace?${query}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch templates: ${res.statusText}`)
        }

        const data: MarketplacePageData = await res.json()

        if (append) {
          setTemplates((prev) => [...prev, ...data.templates])
        } else {
          setTemplates(data.templates)
        }

        setTotal(data.total)
        setPage(data.page)

        // Update filter options from the first load
        if (data.categories.length > 0) setCategories(data.categories)
        if (data.sources.length > 0) setSources(data.sources)
      } catch (error) {
        console.error("[Marketplace] Fetch error:", error)
        // If this is the initial load and API returns 404, set empty state gracefully
        if (!append) {
          setTemplates([])
          setTotal(0)
        }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTemplates(filters, 1, false)
  }, [filters, fetchTemplates])

  // Load more handler
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1
    fetchTemplates(filters, nextPage, true)
  }, [page, filters, fetchTemplates])

  // Preview handler
  const handlePreview = useCallback((template: MarketplaceTemplate) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }, [])

  // Use template: create a new page
  const handleCreatePage = useCallback(
    async (template: MarketplaceTemplate) => {
      try {
        const res = await fetch("/api/cms/marketplace/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: template.id,
            action: "create-page",
          }),
        })

        if (!res.ok) {
          throw new Error("Failed to create page from template")
        }

        const data = await res.json()
        toast.success(`Page "${template.name}" created`, {
          description: "Redirecting to the editor...",
        })

        // Navigate to editor for the new page
        if (data.pageId) {
          router.push(`/admin/pages/${data.pageId}/editor`)
        }
      } catch (error) {
        console.error("[Marketplace] Create page error:", error)
        toast.error("Failed to create page from template")
      }
    },
    [router]
  )

  // Use template shortcut (same as create page from card)
  const handleUse = useCallback(
    (template: MarketplaceTemplate) => {
      handleCreatePage(template)
    },
    [handleCreatePage]
  )

  const hasMore = templates.length < total

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-border bg-card/50">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Store size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Template Marketplace
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse and use professionally designed templates and components
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Filters */}
        <MarketplaceFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          sources={sources}
          totalCount={total}
        />

        {/* Template grid */}
        <MarketplaceGrid
          templates={templates}
          isLoading={isLoading}
          total={total}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          onPreview={handlePreview}
          onUse={handleUse}
        />
      </div>

      {/* Preview modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onCreatePage={handleCreatePage}
      />
    </div>
  )
}
