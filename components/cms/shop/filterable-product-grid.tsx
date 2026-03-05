"use client"

/**
 * FilterableProductGrid Component
 *
 * Client component that fetches products from the shop API with filter params,
 * renders a filter sidebar with collection/category, product type, tags,
 * price range, sort, and search. Products display in a responsive grid.
 * URL search params stay in sync so pages are shareable/bookmarkable.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { CommerceProduct } from "@/lib/cms/commerce/types"
import type {
  ProductFilters,
  AvailableFilters,
  PaginatedProducts,
  ProductSortKey,
  CollectionOption,
} from "@/lib/cms/commerce/filters"
import { parseFilterParams, buildFilterParams } from "@/lib/cms/commerce/filters"
import { ProductCard } from "./product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FilterableProductGridProps {
  /** Pre-set collection filter (e.g., from collection page) */
  initialCollection?: string
  /** Pre-set collection title (for display) */
  collectionTitle?: string
  /** Number of products per page */
  pageSize?: number
  /** Additional className for the grid container */
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function ProductSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-card animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/3 bg-muted rounded" />
      </div>
    </div>
  )
}

function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Filter Sidebar                                                     */
/* ------------------------------------------------------------------ */

interface FilterSidebarProps {
  filters: ProductFilters
  available: AvailableFilters
  collections: CollectionOption[]
  onFilterChange: (updates: Partial<ProductFilters>) => void
  onClearAll: () => void
}

function FilterSidebar({
  filters,
  available,
  collections,
  onFilterChange,
  onClearAll,
}: FilterSidebarProps) {
  const allCollections =
    collections.length > 0 ? collections : available.collections
  const hasActiveFilters =
    !!filters.collection ||
    !!filters.type ||
    (filters.tags?.length ?? 0) > 0 ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    !!filters.vendor

  return (
    <div className="space-y-6">
      {/* Clear all */}
      {hasActiveFilters && (
        <div>
          <Button variant="outline" size="sm" onClick={onClearAll} className="w-full">
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Collections / Categories */}
      {allCollections.length > 0 && (
        <FilterSection title="Collections">
          <div className="space-y-1">
            <button
              onClick={() => onFilterChange({ collection: undefined })}
              className={cn(
                "block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                !filters.collection
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All Products
            </button>
            {allCollections.map((col) => (
              <button
                key={col.handle}
                onClick={() =>
                  onFilterChange({
                    collection:
                      filters.collection === col.handle ? undefined : col.handle,
                  })
                }
                className={cn(
                  "block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                  filters.collection === col.handle
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {col.title}
                <span className="text-xs ml-1 text-muted-foreground">
                  ({col.count})
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Product Type */}
      {available.types.length > 0 && (
        <FilterSection title="Product Type">
          <div className="space-y-1">
            {available.types.map((t) => (
              <button
                key={t.value}
                onClick={() =>
                  onFilterChange({
                    type: filters.type === t.value ? undefined : t.value,
                  })
                }
                className={cn(
                  "block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                  filters.type === t.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t.value}
                <span className="text-xs ml-1 text-muted-foreground">
                  ({t.count})
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Tags */}
      {available.tags.length > 0 && (
        <FilterSection title="Tags">
          <div className="space-y-2">
            {available.tags.slice(0, 15).map((tag) => {
              const isChecked = filters.tags?.includes(tag.value) ?? false
              return (
                <label
                  key={tag.value}
                  className="flex items-center gap-2 text-sm cursor-pointer group"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const currentTags = filters.tags || []
                      const newTags = checked
                        ? [...currentTags, tag.value]
                        : currentTags.filter((t) => t !== tag.value)
                      onFilterChange({
                        tags: newTags.length > 0 ? newTags : undefined,
                      })
                    }}
                  />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {tag.value}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    ({tag.count})
                  </span>
                </label>
              )
            })}
          </div>
        </FilterSection>
      )}

      {/* Vendors */}
      {available.vendors.length > 0 && (
        <FilterSection title="Brand">
          <div className="space-y-1">
            {available.vendors.map((v) => (
              <button
                key={v.value}
                onClick={() =>
                  onFilterChange({
                    vendor: filters.vendor === v.value ? undefined : v.value,
                  })
                }
                className={cn(
                  "block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                  filters.vendor === v.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {v.value}
                <span className="text-xs ml-1 text-muted-foreground">
                  ({v.count})
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range */}
      {available.priceRange.max > 0 && (
        <FilterSection title="Price Range">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={`$${available.priceRange.min.toFixed(0)}`}
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  onFilterChange({
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="h-8 text-sm"
                min={0}
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                placeholder={`$${available.priceRange.max.toFixed(0)}`}
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  onFilterChange({
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="h-8 text-sm"
                min={0}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() =>
                onFilterChange({
                  minPrice: undefined,
                  maxPrice: undefined,
                })
              }
            >
              Reset Price
            </Button>
          </div>
        </FilterSection>
      )}
    </div>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Active Filter Badges                                               */
/* ------------------------------------------------------------------ */

interface ActiveFilterBadgesProps {
  filters: ProductFilters
  collections: CollectionOption[]
  onRemove: (updates: Partial<ProductFilters>) => void
}

function ActiveFilterBadges({ filters, collections, onRemove }: ActiveFilterBadgesProps) {
  const badges: { label: string; onRemove: () => void }[] = []

  if (filters.collection) {
    const col = collections.find((c) => c.handle === filters.collection)
    badges.push({
      label: `Collection: ${col?.title || filters.collection}`,
      onRemove: () => onRemove({ collection: undefined }),
    })
  }

  if (filters.type) {
    badges.push({
      label: `Type: ${filters.type}`,
      onRemove: () => onRemove({ type: undefined }),
    })
  }

  if (filters.tags?.length) {
    for (const tag of filters.tags) {
      badges.push({
        label: `Tag: ${tag}`,
        onRemove: () =>
          onRemove({
            tags: filters.tags!.filter((t) => t !== tag),
          }),
      })
    }
  }

  if (filters.vendor) {
    badges.push({
      label: `Brand: ${filters.vendor}`,
      onRemove: () => onRemove({ vendor: undefined }),
    })
  }

  if (filters.minPrice != null) {
    badges.push({
      label: `Min: $${filters.minPrice}`,
      onRemove: () => onRemove({ minPrice: undefined }),
    })
  }

  if (filters.maxPrice != null) {
    badges.push({
      label: `Max: $${filters.maxPrice}`,
      onRemove: () => onRemove({ maxPrice: undefined }),
    })
  }

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1">
          {badge.label}
          <button
            onClick={badge.onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
            aria-label={`Remove ${badge.label} filter`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </Badge>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function FilterableProductGrid({
  initialCollection,
  collectionTitle,
  pageSize = 24,
  className,
}: FilterableProductGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Parse current filters from URL
  const currentFilters: ProductFilters = {
    ...parseFilterParams(searchParams),
    ...(initialCollection ? { collection: initialCollection } : {}),
  }

  // State
  const [products, setProducts] = useState<CommerceProduct[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    collections: [],
    types: [],
    tags: [],
    vendors: [],
    priceRange: { min: 0, max: 0 },
  })
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(currentFilters.search || "")
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const page = currentFilters.page || 1

  // Fetch collections on mount
  useEffect(() => {
    fetch("/api/cms/shop/collections")
      .then((res) => res.json())
      .then((data) => {
        if (data.collections) {
          setCollections(
            data.collections.map(
              (c: { handle: string; title: string; products?: unknown[] }) => ({
                handle: c.handle,
                title: c.title,
                count: Array.isArray(c.products) ? c.products.length : 0,
              })
            )
          )
        }
      })
      .catch(console.error)
  }, [])

  // Fetch products whenever filters/page change
  useEffect(() => {
    setLoading(true)

    const params = buildFilterParams({
      ...currentFilters,
      limit: pageSize,
      page,
    })

    fetch(`/api/cms/shop/products?${params}`)
      .then((res) => res.json())
      .then((data: PaginatedProducts) => {
        setProducts(data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setAvailableFilters(data.filters)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err)
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), initialCollection, pageSize])

  // Update URL when filters change
  const updateFilters = useCallback(
    (updates: Partial<ProductFilters>) => {
      const merged: ProductFilters = { ...currentFilters, ...updates }

      // Reset page when filters change (unless page was explicitly set)
      if (!("page" in updates)) {
        merged.page = 1
      }

      // Don't include collection in URL if it matches initialCollection
      if (initialCollection && merged.collection === initialCollection) {
        delete merged.collection
      }

      startTransition(() => {
        const qs = buildFilterParams(merged)
        router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFilters, pathname, router, initialCollection]
  )

  const clearAllFilters = useCallback(() => {
    setSearchInput("")
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [pathname, router])

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
      searchDebounceRef.current = setTimeout(() => {
        updateFilters({ search: value || undefined })
      }, 400)
    },
    [updateFilters]
  )

  const sortOptions: { label: string; value: ProductSortKey }[] = [
    { label: "Best Selling", value: "best-selling" },
    { label: "Newest", value: "newest" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Name: A-Z", value: "title-asc" },
    { label: "Name: Z-A", value: "title-desc" },
  ]

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar: Search, Sort, Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <Input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
          {/* Result count */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {loading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""}`}
          </span>

          {/* Sort */}
          <Select
            value={currentFilters.sort || "best-selling"}
            onValueChange={(value) =>
              updateFilters({ sort: value as ProductSortKey })
            }
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mobile Filter Toggle */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden h-9">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
                    clipRule="evenodd"
                  />
                </svg>
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar
                  filters={currentFilters}
                  available={availableFilters}
                  collections={collections}
                  onFilterChange={(updates) => {
                    updateFilters(updates)
                    setMobileFiltersOpen(false)
                  }}
                  onClearAll={() => {
                    clearAllFilters()
                    setMobileFiltersOpen(false)
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filter badges */}
      <ActiveFilterBadges
        filters={currentFilters}
        collections={collections}
        onRemove={updateFilters}
      />

      {/* Main content area: sidebar + grid */}
      <div className="flex gap-8 mt-4">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <FilterSidebar
            filters={currentFilters}
            available={availableFilters}
            collections={collections}
            onFilterChange={updateFilters}
            onClearAll={clearAllFilters}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <GridSkeleton count={pageSize > 8 ? 8 : pageSize} />
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
                className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No products found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search terms.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateFilters({ page: page - 1 })}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {generatePageNumbers(page, totalPages).map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="w-8 text-center text-sm text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => updateFilters({ page: p as number })}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => updateFilters({ page: page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pagination Helper                                                  */
/* ------------------------------------------------------------------ */

function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "...")[] = [1]

  if (current > 3) {
    pages.push("...")
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push("...")
  }

  pages.push(total)

  return pages
}
