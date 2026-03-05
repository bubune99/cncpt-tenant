/**
 * Shop Collections API
 *
 * Returns all available collections/categories for building navigation and filter UI.
 *
 * GET /api/cms/shop/collections
 *
 * Response: { collections: CommerceCollection[] }
 *
 * For Shopify: fetches collections via Storefront API.
 * For generic: returns categories from Prisma with product counts.
 */

import { NextRequest, NextResponse } from "next/server"
import { getCommerceProvider } from "@/lib/cms/commerce"
import type { CommerceCollection, CommerceProduct } from "@/lib/cms/commerce/types"
import { withTenant } from "@/lib/cms/api/tenant"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
    try {
    const provider = await getCommerceProvider()

    let collections: CommerceCollection[]

    if (provider.name === "generic") {
      collections = await getGenericCollections()
    } else if (provider.name === "shopify") {
      collections = await getShopifyCollections(provider)
    } else {
      collections = await getGenericCollections()
    }

    return NextResponse.json({ collections })
    } catch (error) {
      console.error("[shop/collections] Error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to fetch collections" },
        { status: 500 }
      )
    }
  })
}

/* ------------------------------------------------------------------ */
/*  Generic Provider (Prisma)                                          */
/* ------------------------------------------------------------------ */

async function getGenericCollections(): Promise<CommerceCollection[]> {
  const { prisma } = await import("@/lib/cms/db")

  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      image: true,
      products: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: "asc" },
                take: 1,
                include: { media: true },
              },
            },
          },
        },
        take: 4,
      },
    },
  })

  return categories.map((cat) => ({
    id: cat.id,
    handle: cat.slug,
    title: cat.name,
    description: cat.description ?? undefined,
    image: cat.image
      ? { url: (cat.image as { url: string }).url, alt: cat.name }
      : undefined,
    products: cat.products.map((pc) => mapPrismaCategoryProduct(pc.product)),
  }))
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPrismaCategoryProduct(p: any): CommerceProduct {
  return {
    id: p.id,
    handle: p.slug,
    title: p.title,
    description: p.description ?? undefined,
    images: (p.images || []).map((img: any) => ({
      url: img.media?.url || "",
      alt: img.media?.alt || undefined,
    })),
    variants: [],
    price: { amount: p.basePrice / 100, currencyCode: "USD" },
    compareAtPrice: p.compareAtPrice
      ? { amount: p.compareAtPrice / 100, currencyCode: "USD" }
      : undefined,
    available: p.stock > 0,
    productType: p.type,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/*  Shopify Provider                                                   */
/* ------------------------------------------------------------------ */

async function getShopifyCollections(
  provider: { getCollection: (handle: string) => Promise<CommerceCollection | null> } & { name: string }
): Promise<CommerceCollection[]> {
  // The Shopify provider doesn't have a "list all collections" method,
  // so we use the underlying config to make a direct Storefront API call.
  try {
    const { getCommerceProvider: _ } = await import("@/lib/cms/commerce")

    // Access the Shopify provider's internal fetch method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopifyProvider = provider as any

    if (typeof shopifyProvider.storefrontFetch === "function") {
      const query = `
        query collections {
          collections(first: 50) {
            edges {
              node {
                id
                handle
                title
                description
                image {
                  url
                  altText
                  width
                  height
                }
                products(first: 4) {
                  edges {
                    node {
                      id
                      handle
                      title
                      description
                      availableForSale
                      tags
                      vendor
                      productType
                      priceRange { minVariantPrice { amount currencyCode } }
                      compareAtPriceRange { minVariantPrice { amount currencyCode } }
                      images(first: 1) { edges { node { url altText width height } } }
                      variants(first: 1) { edges { node { id title sku availableForSale price { amount currencyCode } compareAtPrice { amount currencyCode } selectedOptions { name value } } } }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const data = await shopifyProvider.storefrontFetch(query)
      const edges = data?.collections?.edges || []

      return edges.map((edge: any) => {
        const col = edge.node
        return {
          id: col.id,
          handle: col.handle,
          title: col.title,
          description: col.description || undefined,
          image: col.image
            ? {
                url: col.image.url,
                alt: col.image.altText ?? undefined,
                width: col.image.width ?? undefined,
                height: col.image.height ?? undefined,
              }
            : undefined,
          products: (col.products?.edges || []).map((pe: any) => {
            const p = pe.node
            return {
              id: p.id,
              handle: p.handle,
              title: p.title,
              description: p.description || undefined,
              images: (p.images?.edges || []).map((ie: any) => ({
                url: ie.node.url,
                alt: ie.node.altText ?? undefined,
              })),
              variants: (p.variants?.edges || []).map((ve: any) => ({
                id: ve.node.id,
                title: ve.node.title,
                sku: ve.node.sku ?? undefined,
                price: {
                  amount: parseFloat(ve.node.price.amount),
                  currencyCode: ve.node.price.currencyCode,
                },
                compareAtPrice: ve.node.compareAtPrice
                  ? {
                      amount: parseFloat(ve.node.compareAtPrice.amount),
                      currencyCode: ve.node.compareAtPrice.currencyCode,
                    }
                  : undefined,
                available: ve.node.availableForSale,
                options: Object.fromEntries(
                  (ve.node.selectedOptions || []).map((o: any) => [o.name, o.value])
                ),
              })),
              price: {
                amount: parseFloat(p.priceRange.minVariantPrice.amount),
                currencyCode: p.priceRange.minVariantPrice.currencyCode,
              },
              compareAtPrice: p.compareAtPriceRange?.minVariantPrice
                ? {
                    amount: parseFloat(p.compareAtPriceRange.minVariantPrice.amount),
                    currencyCode: p.compareAtPriceRange.minVariantPrice.currencyCode,
                  }
                : undefined,
              available: p.availableForSale,
              tags: p.tags,
              vendor: p.vendor || undefined,
              productType: p.productType || undefined,
            }
          }),
        }
      })
    }
  } catch (error) {
    console.warn("[shop/collections] Shopify collections fetch failed:", error)
  }

  // Fallback: return empty
  return []
}
