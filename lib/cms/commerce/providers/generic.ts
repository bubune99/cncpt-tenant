/**
 * Generic Commerce Provider
 *
 * Default provider that reads from the CMS Product model via Prisma.
 * Used for server-side rendering of commerce blocks without external API calls.
 */

import { prisma } from "../../db"
import type {
  ICommerceProvider,
  CommerceProduct,
  CommerceCollection,
  CommerceCart,
  CommerceVariant,
  CommerceImage,
} from "../types"

/* ------------------------------------------------------------------ */
/*  Prisma → Normalized Mapping                                        */
/* ------------------------------------------------------------------ */

type PrismaProduct = Awaited<ReturnType<typeof findProduct>>
type PrismaVariant = NonNullable<PrismaProduct>["variants"][number]
type PrismaImage = NonNullable<PrismaProduct>["images"][number]

function findProduct(idOrSlug: string) {
  return prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      images: {
        orderBy: { position: "asc" },
        include: { media: true },
      },
      variants: {
        include: {
          optionValues: {
            include: {
              optionValue: { include: { option: true } },
            },
          },
        },
      },
    },
  })
}

function mapImage(img: PrismaImage): CommerceImage {
  return {
    url: img.media.url,
    alt: img.alt ?? img.media.alt ?? undefined,
  }
}

function mapVariant(v: PrismaVariant): CommerceVariant {
  // Build options map from variant option values: { "Color": "Red", "Size": "M" }
  const options: Record<string, string> = {}
  for (const ov of v.optionValues) {
    options[ov.optionValue.option.name] = ov.optionValue.value
  }

  // Build title from option values: "Red / M"
  const title = Object.values(options).join(" / ") || v.sku || v.id

  return {
    id: v.id,
    title,
    sku: v.sku ?? undefined,
    price: { amount: v.price, currencyCode: "USD" },
    compareAtPrice: v.compareAtPrice
      ? { amount: v.compareAtPrice, currencyCode: "USD" }
      : undefined,
    available: v.stock > 0,
    options,
  }
}

function mapProduct(p: NonNullable<PrismaProduct>): CommerceProduct {
  return {
    id: p.id,
    handle: p.slug,
    title: p.title,
    description: p.description ?? undefined,
    images: p.images.map(mapImage),
    variants: p.variants.map(mapVariant),
    price: { amount: p.basePrice, currencyCode: "USD" },
    compareAtPrice: p.compareAtPrice
      ? { amount: p.compareAtPrice, currencyCode: "USD" }
      : undefined,
    available: p.stock > 0 || p.variants.some((v) => v.stock > 0),
    productType: p.type,
  }
}

/* ------------------------------------------------------------------ */
/*  Provider Implementation                                            */
/* ------------------------------------------------------------------ */

export class GenericProvider implements ICommerceProvider {
  readonly name = "generic" as const

  async verify(): Promise<boolean> {
    try {
      await prisma.product.count()
      return true
    } catch {
      return false
    }
  }

  async getProduct(handle: string): Promise<CommerceProduct | null> {
    const p = await findProduct(handle)
    return p ? mapProduct(p) : null
  }

  async getProducts(options?: {
    limit?: number
    sortKey?: string
    reverse?: boolean
    query?: string
  }): Promise<CommerceProduct[]> {
    const orderBy: Record<string, string> = {}
    switch (options?.sortKey) {
      case "PRICE":
        orderBy.basePrice = options?.reverse ? "desc" : "asc"
        break
      case "TITLE":
        orderBy.title = options?.reverse ? "desc" : "asc"
        break
      case "CREATED_AT":
        orderBy.createdAt = options?.reverse ? "desc" : "asc"
        break
      default:
        orderBy.createdAt = "desc"
    }

    const where: Record<string, unknown> = { status: "ACTIVE" }
    if (options?.query) {
      where.OR = [
        { title: { contains: options.query, mode: "insensitive" } },
        { description: { contains: options.query, mode: "insensitive" } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: options?.limit ?? 20,
      include: {
        images: {
          orderBy: { position: "asc" },
          include: { media: true },
        },
        variants: {
          include: {
            optionValues: {
              include: {
                optionValue: { include: { option: true } },
              },
            },
          },
        },
      },
    })

    return products.map(mapProduct)
  }

  async getCollection(_handle: string): Promise<CommerceCollection | null> {
    // CMS doesn't have a dedicated collection model — return null
    // Future: could map ProductCategory to collection
    return null
  }

  async getCart(_cartId: string): Promise<CommerceCart | null> {
    // Cart is handled client-side via src/lib/cart/
    return null
  }

  async addToCart(
    _cartId: string | null,
    _variantId: string,
    _quantity: number
  ): Promise<CommerceCart> {
    throw new Error(
      "GenericProvider.addToCart: Use client-side cart (src/lib/cart/) instead"
    )
  }
}
