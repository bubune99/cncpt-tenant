/**
 * Commerce Data Fetchers
 *
 * Server-side Prisma queries for commerce smart blocks.
 * Registered as named fetchers in the data resolver.
 */

import { prisma } from '@/lib/cms/db'
import { registerFetcher } from './data-resolver'

// ---------------------------------------------------------------------------
// Types (serializable — passed to client components)
// ---------------------------------------------------------------------------

export interface SerializedProduct {
  id: string
  title: string
  slug: string
  description: string | null
  basePrice: number
  compareAtPrice: number | null
  status: string
  featured: boolean
  images: { url: string; alt: string | null }[]
  variants: {
    id: string
    sku: string | null
    price: number
    compareAtPrice: number | null
    enabled: boolean
    stock: number
    optionValues: { name: string; value: string }[]
  }[]
  categories: { id: string; name: string; slug: string }[]
}

export interface SerializedCategory {
  id: string
  name: string
  slug: string
  description: string | null
  productCount: number
  imageUrl: string | null
}

// ---------------------------------------------------------------------------
// Fetcher Implementations
// ---------------------------------------------------------------------------

async function fetchProducts(args: Record<string, unknown>): Promise<SerializedProduct[]> {
  const limit = (args.limit as number) || 12
  const categoryId = args.categoryId as string | undefined
  const categorySlug = args.categorySlug as string | undefined
  const featured = args.featured as boolean | undefined
  const sort = (args.sort as string) || 'CREATED_AT'
  const reverse = (args.reverse as boolean) ?? true
  const search = args.search as string | undefined

  const orderBy = buildOrderBy(sort, reverse)

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
  }

  if (featured !== undefined) {
    where.featured = featured
  }

  if (categoryId) {
    where.categories = { some: { categoryId } }
  } else if (categorySlug) {
    where.categories = { some: { category: { slug: categorySlug } } }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    take: limit,
    orderBy,
    include: {
      images: {
        orderBy: { position: 'asc' },
        include: { media: true },
      },
      variants: {
        where: { enabled: true },
        include: {
          optionValues: {
            include: {
              optionValue: {
                include: { option: true },
              },
            },
          },
        },
      },
      categories: {
        include: { category: true },
      },
    },
  })

  return products.map(serializeProduct)
}

async function fetchProduct(args: Record<string, unknown>): Promise<SerializedProduct | null> {
  const slug = args.slug as string
  if (!slug) {
    console.error('[fetchProduct] DIAG: no slug in args', JSON.stringify(args))
    return null
  }

  try {
    const product = await prisma.product.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: {
        images: {
          orderBy: { position: 'asc' },
          include: { media: true },
        },
        variants: {
          where: { enabled: true },
          include: {
            optionValues: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
        },
        categories: {
          include: { category: true },
        },
      },
    })

    console.error('[fetchProduct] DIAG slug=' + slug + ' found=' + (product ? product.id : 'NULL'))
    if (!product) return null
    return serializeProduct(product)
  } catch (e) {
    console.error('[fetchProduct] DIAG THREW for slug=' + slug + ': ' + (e instanceof Error ? e.message.replace(/\n/g, ' ') : String(e)))
    return null
  }
}

async function fetchCategories(_args: Record<string, unknown>): Promise<SerializedCategory[]> {
  const categories = await prisma.category.findMany({
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { products: true } },
      image: true,
    },
  })

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    productCount: cat._count.products,
    imageUrl: (cat.image as { url?: string } | null)?.url || null,
  }))
}

async function fetchFeaturedProducts(args: Record<string, unknown>): Promise<SerializedProduct[]> {
  return fetchProducts({ ...args, featured: true, limit: args.limit || 4 })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildOrderBy(sort: string, reverse: boolean): Record<string, string> {
  const direction = reverse ? 'desc' : 'asc'
  switch (sort) {
    case 'PRICE':
      return { basePrice: direction }
    case 'TITLE':
      return { title: direction }
    case 'BEST_SELLING':
      // Approximate — order by number of order items (simplified)
      return { createdAt: direction }
    case 'CREATED_AT':
    default:
      return { createdAt: direction }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function serializeProduct(product: any): SerializedProduct {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    status: product.status,
    featured: product.featured,
    images: (product.images || []).map((img: any) => ({
      url: img.media?.url || img.url || '',
      alt: img.media?.alt || img.alt || null,
    })),
    variants: (product.variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      enabled: v.enabled,
      stock: v.stock,
      optionValues: (v.optionValues || []).map((ov: any) => ({
        name: ov.optionValue?.option?.name || '',
        value: ov.optionValue?.value || '',
      })),
    })),
    categories: (product.categories || []).map((pc: any) => ({
      id: pc.category?.id || pc.categoryId,
      name: pc.category?.name || '',
      slug: pc.category?.slug || '',
    })),
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerCommerceFetchers(): void {
  registerFetcher('fetchProducts', fetchProducts)
  registerFetcher('fetchProduct', fetchProduct)
  registerFetcher('fetchCategories', fetchCategories)
  registerFetcher('fetchFeaturedProducts', fetchFeaturedProducts)
}
