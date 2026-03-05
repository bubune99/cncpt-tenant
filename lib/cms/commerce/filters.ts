/**
 * Product Filter Types
 *
 * Shared types used by both the shop API routes and the storefront
 * FilterableProductGrid component. Provider-agnostic — works with
 * Shopify, generic (Prisma), or any future commerce provider.
 */

import type { CommerceProduct } from "./types"

/* ------------------------------------------------------------------ */
/*  Filter Parameters                                                  */
/* ------------------------------------------------------------------ */

export type ProductSortKey =
  | "price-asc"
  | "price-desc"
  | "newest"
  | "best-selling"
  | "title-asc"
  | "title-desc"

export interface ProductFilters {
  collection?: string
  type?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  vendor?: string
  search?: string
  sort?: ProductSortKey
  page?: number
  limit?: number
}

/* ------------------------------------------------------------------ */
/*  Available Filters (returned from API for dynamic filter UI)        */
/* ------------------------------------------------------------------ */

export interface FilterOption {
  value: string
  count: number
}

export interface CollectionOption {
  handle: string
  title: string
  count: number
}

export interface AvailableFilters {
  collections: CollectionOption[]
  types: FilterOption[]
  tags: FilterOption[]
  vendors: FilterOption[]
  priceRange: { min: number; max: number }
}

/* ------------------------------------------------------------------ */
/*  Paginated Response                                                 */
/* ------------------------------------------------------------------ */

export interface PaginatedProducts {
  products: CommerceProduct[]
  total: number
  page: number
  totalPages: number
  filters: AvailableFilters
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parse filter params from a URLSearchParams object.
 * Used by both the API route and client component.
 */
export function parseFilterParams(searchParams: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {}

  const collection = searchParams.get("collection")
  if (collection) filters.collection = collection

  const type = searchParams.get("type")
  if (type) filters.type = type

  const tags = searchParams.get("tags")
  if (tags) filters.tags = tags.split(",").map((t) => t.trim()).filter(Boolean)

  const minPrice = searchParams.get("minPrice")
  if (minPrice) filters.minPrice = parseFloat(minPrice)

  const maxPrice = searchParams.get("maxPrice")
  if (maxPrice) filters.maxPrice = parseFloat(maxPrice)

  const vendor = searchParams.get("vendor")
  if (vendor) filters.vendor = vendor

  const search = searchParams.get("search")
  if (search) filters.search = search

  const sort = searchParams.get("sort") as ProductSortKey | null
  if (sort) filters.sort = sort

  const page = searchParams.get("page")
  if (page) filters.page = parseInt(page, 10)

  const limit = searchParams.get("limit")
  if (limit) filters.limit = parseInt(limit, 10)

  return filters
}

/**
 * Build a URLSearchParams string from a ProductFilters object.
 * Omits falsy/default values.
 */
export function buildFilterParams(filters: ProductFilters): string {
  const params = new URLSearchParams()

  if (filters.collection) params.set("collection", filters.collection)
  if (filters.type) params.set("type", filters.type)
  if (filters.tags?.length) params.set("tags", filters.tags.join(","))
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice))
  if (filters.vendor) params.set("vendor", filters.vendor)
  if (filters.search) params.set("search", filters.search)
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.page && filters.page > 1) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  return params.toString()
}

/**
 * Map our sort key to Shopify's ProductSortKeys + reverse flag.
 */
export function mapSortToShopify(sort?: ProductSortKey): {
  sortKey: string
  reverse: boolean
} {
  switch (sort) {
    case "price-asc":
      return { sortKey: "PRICE", reverse: false }
    case "price-desc":
      return { sortKey: "PRICE", reverse: true }
    case "newest":
      return { sortKey: "CREATED_AT", reverse: true }
    case "best-selling":
      return { sortKey: "BEST_SELLING", reverse: false }
    case "title-asc":
      return { sortKey: "TITLE", reverse: false }
    case "title-desc":
      return { sortKey: "TITLE", reverse: true }
    default:
      return { sortKey: "BEST_SELLING", reverse: false }
  }
}

/**
 * Map our sort key to Prisma orderBy clause.
 */
export function mapSortToPrisma(sort?: ProductSortKey): Record<string, "asc" | "desc"> {
  switch (sort) {
    case "price-asc":
      return { basePrice: "asc" }
    case "price-desc":
      return { basePrice: "desc" }
    case "newest":
      return { createdAt: "desc" }
    case "title-asc":
      return { title: "asc" }
    case "title-desc":
      return { title: "desc" }
    case "best-selling":
    default:
      return { createdAt: "desc" }
  }
}

/**
 * Build a Shopify query string from filters.
 * Shopify Storefront API supports:
 *   product_type:sneakers
 *   tag:sale
 *   vendor:Nike
 *   title:*search*
 *   variants.price:>=50
 *   variants.price:<=200
 */
export function buildShopifyQuery(filters: ProductFilters): string {
  const parts: string[] = []

  if (filters.type) {
    parts.push(`product_type:${filters.type}`)
  }

  if (filters.tags?.length) {
    for (const tag of filters.tags) {
      parts.push(`tag:${tag}`)
    }
  }

  if (filters.vendor) {
    parts.push(`vendor:${filters.vendor}`)
  }

  if (filters.search) {
    parts.push(`title:*${filters.search}*`)
  }

  if (filters.minPrice != null) {
    parts.push(`variants.price:>=${filters.minPrice}`)
  }

  if (filters.maxPrice != null) {
    parts.push(`variants.price:<=${filters.maxPrice}`)
  }

  return parts.join(" ")
}
