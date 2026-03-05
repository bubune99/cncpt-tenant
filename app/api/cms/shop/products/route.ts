/**
 * Shop Products API
 *
 * Public-facing API for querying products with filters, pagination, and sorting.
 * Works with both Shopify (Storefront API) and generic (Prisma) commerce providers.
 *
 * GET /api/cms/shop/products?collection=shoes&type=sneakers&tags=sale&minPrice=50&maxPrice=200&sort=price-asc&page=1&limit=24&search=nike
 *
 * Response: { products, total, page, totalPages, filters }
 */

import { NextRequest, NextResponse } from "next/server"
import { getCommerceProvider } from "@/lib/cms/commerce"
import type { CommerceProduct } from "@/lib/cms/commerce/types"
import {
  parseFilterParams,
  mapSortToShopify,
  mapSortToPrisma,
  buildShopifyQuery,
  type ProductFilters,
  type AvailableFilters,
  type PaginatedProducts,
} from "@/lib/cms/commerce/filters"
import { withTenant } from "@/lib/cms/api/tenant"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
    try {
    const { searchParams } = new URL(request.url)
    const filters = parseFilterParams(searchParams)
    const page = filters.page ?? 1
    const limit = Math.min(filters.limit ?? 24, 100)

    const provider = await getCommerceProvider()

    let result: PaginatedProducts

    if (provider.name === "generic") {
      result = await queryGenericProducts(filters, page, limit)
    } else if (provider.name === "shopify") {
      result = await queryShopifyProducts(provider, filters, page, limit)
    } else {
      // Fallback to generic for unknown providers
      result = await queryGenericProducts(filters, page, limit)
    }

    return NextResponse.json(result)
    } catch (error) {
      console.error("[shop/products] Error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to fetch products" },
        { status: 500 }
      )
    }
  })
}

/* ------------------------------------------------------------------ */
/*  Generic Provider (Prisma)                                          */
/* ------------------------------------------------------------------ */

async function queryGenericProducts(
  filters: ProductFilters,
  page: number,
  limit: number
): Promise<PaginatedProducts> {
  const { prisma } = await import("@/lib/cms/db")

  // Build where clause
  const where: Record<string, unknown> = { status: "ACTIVE" }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.type) {
    where.type = filters.type.toUpperCase()
  }

  if (filters.collection) {
    where.categories = {
      some: {
        category: { slug: filters.collection },
      },
    }
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const priceFilter: Record<string, number> = {}
    if (filters.minPrice != null) priceFilter.gte = Math.round(filters.minPrice * 100)
    if (filters.maxPrice != null) priceFilter.lte = Math.round(filters.maxPrice * 100)
    where.basePrice = priceFilter
  }

  // Tags filter — products don't have a direct tags field in Prisma,
  // but we can approximate with category names or use a contains search
  // For now, skip tag filtering on generic provider if no tags column exists

  const orderBy = mapSortToPrisma(filters.sort)
  const skip = (page - 1) * limit

  // Parallel: get filtered products + count + available filters
  const [products, total, availableFilters] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { position: "asc" },
          include: { media: true },
        },
        variants: {
          where: { enabled: true },
          include: {
            optionValues: {
              include: {
                optionValue: { include: { option: true } },
              },
            },
          },
        },
        categories: {
          include: { category: true },
        },
      },
    }),
    prisma.product.count({ where }),
    getGenericAvailableFilters(prisma),
  ])

  const mapped: CommerceProduct[] = products.map(mapPrismaProduct)

  return {
    products: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    filters: availableFilters,
  }
}

async function getGenericAvailableFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any
): Promise<AvailableFilters> {
  const [categories, typeGroups, priceAgg] = await Promise.all([
    // Collections = categories
    prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    }),
    // Types
    prisma.product.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
    // Price range
    prisma.product.aggregate({
      where: { status: "ACTIVE" },
      _min: { basePrice: true },
      _max: { basePrice: true },
    }),
  ])

  return {
    collections: categories.map((cat: { slug: string; name: string; _count: { products: number } }) => ({
      handle: cat.slug,
      title: cat.name,
      count: cat._count.products,
    })),
    types: typeGroups.map((g: { type: string; _count: number }) => ({
      value: g.type,
      count: g._count,
    })),
    tags: [], // Generic provider doesn't have product-level tags
    vendors: [], // Generic provider doesn't have vendor field
    priceRange: {
      min: (priceAgg._min?.basePrice ?? 0) / 100,
      max: (priceAgg._max?.basePrice ?? 10000) / 100,
    },
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPrismaProduct(p: any): CommerceProduct {
  return {
    id: p.id,
    handle: p.slug,
    title: p.title,
    description: p.description ?? undefined,
    images: (p.images || []).map((img: any) => ({
      url: img.media?.url || "",
      alt: img.media?.alt || img.alt || undefined,
    })),
    variants: (p.variants || []).map((v: any) => {
      const options: Record<string, string> = {}
      for (const ov of v.optionValues || []) {
        if (ov.optionValue?.option?.name) {
          options[ov.optionValue.option.name] = ov.optionValue.value
        }
      }
      return {
        id: v.id,
        title: Object.values(options).join(" / ") || v.sku || v.id,
        sku: v.sku ?? undefined,
        price: { amount: v.price / 100, currencyCode: "USD" },
        compareAtPrice: v.compareAtPrice
          ? { amount: v.compareAtPrice / 100, currencyCode: "USD" }
          : undefined,
        available: v.stock > 0,
        options,
      }
    }),
    price: { amount: p.basePrice / 100, currencyCode: "USD" },
    compareAtPrice: p.compareAtPrice
      ? { amount: p.compareAtPrice / 100, currencyCode: "USD" }
      : undefined,
    available: p.stock > 0 || (p.variants || []).some((v: any) => v.stock > 0),
    tags: (p.categories || []).map((pc: any) => pc.category?.name).filter(Boolean),
    vendor: undefined,
    productType: p.type,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/*  Shopify Provider                                                   */
/* ------------------------------------------------------------------ */

async function queryShopifyProducts(
  provider: { getProducts: (opts?: { limit?: number; sortKey?: string; reverse?: boolean; query?: string }) => Promise<CommerceProduct[]>; getCollection: (handle: string) => Promise<{ products: CommerceProduct[] } | null> },
  filters: ProductFilters,
  page: number,
  limit: number
): Promise<PaginatedProducts> {
  let allProducts: CommerceProduct[]

  if (filters.collection) {
    // Fetch from collection
    const collection = await provider.getCollection(filters.collection)
    allProducts = collection?.products ?? []

    // Apply additional query filters to collection products
    allProducts = applyClientSideFilters(allProducts, filters)
  } else {
    // Build Shopify query string
    const query = buildShopifyQuery(filters)
    const { sortKey, reverse } = mapSortToShopify(filters.sort)

    // Fetch more than we need to handle client-side pagination
    // (Shopify doesn't support offset-based pagination in Storefront API)
    allProducts = await provider.getProducts({
      limit: Math.min(limit * page + limit, 250),
      sortKey,
      reverse,
      query: query || undefined,
    })

    // Apply price filters client-side (Shopify query syntax for price is limited)
    if (filters.minPrice != null || filters.maxPrice != null) {
      allProducts = allProducts.filter((p) => {
        const price = p.price.amount
        if (filters.minPrice != null && price < filters.minPrice) return false
        if (filters.maxPrice != null && price > filters.maxPrice) return false
        return true
      })
    }
  }

  // Derive available filters from the full product set
  const availableFilters = deriveAvailableFilters(allProducts)

  // Paginate
  const total = allProducts.length
  const start = (page - 1) * limit
  const paginatedProducts = allProducts.slice(start, start + limit)

  return {
    products: paginatedProducts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    filters: availableFilters,
  }
}

/**
 * Client-side filtering for Shopify products (used when fetching from collection).
 */
function applyClientSideFilters(
  products: CommerceProduct[],
  filters: ProductFilters
): CommerceProduct[] {
  let result = products

  if (filters.type) {
    result = result.filter(
      (p) => p.productType?.toLowerCase() === filters.type!.toLowerCase()
    )
  }

  if (filters.tags?.length) {
    result = result.filter((p) =>
      filters.tags!.every((tag) =>
        p.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
      )
    )
  }

  if (filters.vendor) {
    result = result.filter(
      (p) => p.vendor?.toLowerCase() === filters.vendor!.toLowerCase()
    )
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }

  if (filters.minPrice != null) {
    result = result.filter((p) => p.price.amount >= filters.minPrice!)
  }

  if (filters.maxPrice != null) {
    result = result.filter((p) => p.price.amount <= filters.maxPrice!)
  }

  // Sort
  if (filters.sort) {
    result = [...result]
    switch (filters.sort) {
      case "price-asc":
        result.sort((a, b) => a.price.amount - b.price.amount)
        break
      case "price-desc":
        result.sort((a, b) => b.price.amount - a.price.amount)
        break
      case "newest":
        // No createdAt on CommerceProduct, keep original order
        break
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
    }
  }

  return result
}

/**
 * Derive available filter options from a set of products.
 */
function deriveAvailableFilters(products: CommerceProduct[]): AvailableFilters {
  const typeCounts = new Map<string, number>()
  const tagCounts = new Map<string, number>()
  const vendorCounts = new Map<string, number>()
  let minPrice = Infinity
  let maxPrice = -Infinity

  for (const p of products) {
    // Types
    if (p.productType) {
      typeCounts.set(p.productType, (typeCounts.get(p.productType) || 0) + 1)
    }

    // Tags
    if (p.tags) {
      for (const tag of p.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    // Vendors
    if (p.vendor) {
      vendorCounts.set(p.vendor, (vendorCounts.get(p.vendor) || 0) + 1)
    }

    // Price range
    if (p.price.amount < minPrice) minPrice = p.price.amount
    if (p.price.amount > maxPrice) maxPrice = p.price.amount
  }

  return {
    collections: [], // Collections need separate API call
    types: Array.from(typeCounts.entries()).map(([value, count]) => ({ value, count })),
    tags: Array.from(tagCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    vendors: Array.from(vendorCounts.entries()).map(([value, count]) => ({ value, count })),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === -Infinity ? 1000 : maxPrice,
    },
  }
}
