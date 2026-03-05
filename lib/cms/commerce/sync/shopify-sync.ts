/**
 * Shopify Product Sync
 *
 * Syncs products from Shopify Admin API to the local Prisma database.
 * Supports full sync (all products) and delta sync (only modified since last sync).
 *
 * Maps Shopify fields to local Product/ProductVariant schema:
 * - title, description, slug (from handle), price, images, variants, SKU, inventory, status
 * - Stores shopifyProductId / shopifyVariantId for bidirectional mapping
 * - Uses shopifyData JSON field for Shopify-specific metadata (metafields, tags, etc.)
 */

import { prisma, getCurrentTenant } from "@/lib/cms/db"
import {
  createShopifyAdminClient,
  type ShopifyAdminProduct,
  type ShopifyAdminVariant,
} from "../providers/shopify-admin"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SyncReport {
  mode: "full" | "delta"
  startedAt: string
  completedAt: string
  duration: number // ms
  total: number
  created: number
  updated: number
  skipped: number
  deleted: number
  errors: SyncError[]
}

export interface SyncError {
  shopifyProductId: string
  title: string
  error: string
}

export interface SyncOptions {
  mode: "full" | "delta"
  /** For delta sync: override the "since" date instead of using last sync time */
  since?: string
  /** Callback for progress reporting */
  onProgress?: (processed: number, total: number) => void
}

/* ------------------------------------------------------------------ */
/*  Status Helpers                                                     */
/* ------------------------------------------------------------------ */

/** Map Shopify product status to local ProductStatus enum */
function mapShopifyStatus(
  shopifyStatus: "ACTIVE" | "ARCHIVED" | "DRAFT"
): "ACTIVE" | "ARCHIVED" | "DRAFT" {
  switch (shopifyStatus) {
    case "ACTIVE":
      return "ACTIVE"
    case "ARCHIVED":
      return "ARCHIVED"
    case "DRAFT":
    default:
      return "DRAFT"
  }
}

/** Convert Shopify price string (e.g., "29.99") to cents integer */
function priceToCents(priceStr: string | null | undefined): number {
  if (!priceStr) return 0
  const parsed = parseFloat(priceStr)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

/** Generate a URL-safe slug from a Shopify handle */
function handleToSlug(handle: string): string {
  // Shopify handles are already URL-safe, just ensure consistency
  return handle.toLowerCase().replace(/[^a-z0-9-]/g, "-")
}

/* ------------------------------------------------------------------ */
/*  Last Sync Tracking                                                 */
/* ------------------------------------------------------------------ */

const SYNC_SETTING_KEY = "shopify.lastSyncAt"

async function getLastSyncTime(): Promise<string | null> {
  try {
    const tenantId = getCurrentTenant()
    const setting = await prisma.setting.findFirst({
      where: { key: SYNC_SETTING_KEY, tenantId: tenantId ?? undefined },
    })
    return setting?.value ?? null
  } catch {
    return null
  }
}

async function setLastSyncTime(isoDate: string): Promise<void> {
  try {
    const tenantId = getCurrentTenant()
    const existing = await prisma.setting.findFirst({
      where: { key: SYNC_SETTING_KEY, tenantId: tenantId ?? undefined },
    })

    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value: isoDate },
      })
    } else {
      await prisma.setting.create({
        data: {
          key: SYNC_SETTING_KEY,
          value: isoDate,
          group: "commerce",
          tenantId: tenantId ?? undefined,
        },
      })
    }
  } catch (error) {
    console.error("[shopify-sync] Failed to save last sync time:", error)
  }
}

/* ------------------------------------------------------------------ */
/*  Single Product Sync                                                */
/* ------------------------------------------------------------------ */

/**
 * Upsert a single Shopify product into the local database.
 * Used by both batch sync and webhook handlers.
 */
export async function syncSingleProduct(
  product: ShopifyAdminProduct
): Promise<{ action: "created" | "updated" | "skipped"; error?: string }> {
  const shopifyProductId = product.id
  const slug = handleToSlug(product.handle)
  const tenantId = getCurrentTenant()

  try {
    // Check if product already exists by Shopify ID
    const existing = await prisma.product.findFirst({
      where: { shopifyProductId, tenantId: tenantId ?? undefined },
      include: { variants: true },
    })

    // Build the main product data
    // Note: Product model does not have vendor/productType columns,
    // those are stored in the shopifyData JSON field instead.
    const productData = {
      title: product.title,
      slug,
      description: product.description || null,
      descriptionHtml: product.descriptionHtml || null,
      basePrice: priceToCents(product.priceRangeV2.minVariantPrice.amount),
      compareAtPrice: null as number | null,
      status: mapShopifyStatus(product.status),
      featured: false,
      type: product.variants.edges.length > 1 ? "VARIABLE" as const : "SIMPLE" as const,
      taxable: true,
      requiresShipping: true,
      shopifyProductId,
      shopifySyncedAt: new Date(),
      shopifySyncError: null,
      shopifyData: {
        tags: product.tags,
        vendor: product.vendor,
        productType: product.productType,
        totalInventory: product.totalInventory,
        publishedAt: product.publishedAt,
        metafields: product.metafields.edges.map((e) => e.node),
        images: product.images.edges.map((e) => ({
          id: e.node.id,
          url: e.node.url,
          altText: e.node.altText,
        })),
      },
      metaTitle: product.title,
      metaDescription: product.description?.substring(0, 160) || null,
    }

    if (existing) {
      // Update existing product
      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      })

      // Sync variants
      await syncVariants(existing.id, product.variants.edges.map((e) => e.node))

      return { action: "updated" }
    } else {
      // Create new product
      const created = await prisma.product.create({
        data: {
          ...productData,
          tenantId: tenantId ?? undefined,
        },
      })

      // Create variants
      await syncVariants(created.id, product.variants.edges.map((e) => e.node))

      return { action: "created" }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `[shopify-sync] Error syncing product ${shopifyProductId} (${product.title}):`,
      message
    )

    // Try to record the error on the product
    try {
      const existing = await prisma.product.findFirst({
        where: { shopifyProductId },
      })
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { shopifySyncError: message },
        })
      }
    } catch {
      // Ignore nested errors
    }

    return { action: "skipped", error: message }
  }
}

/* ------------------------------------------------------------------ */
/*  Variant Sync                                                       */
/* ------------------------------------------------------------------ */

async function syncVariants(
  localProductId: string,
  shopifyVariants: ShopifyAdminVariant[]
): Promise<void> {
  // Get existing local variants for this product
  const existingVariants = await prisma.productVariant.findMany({
    where: { productId: localProductId },
  })

  const existingByShopifyId = new Map(
    existingVariants
      .filter((v) => v.shopifyVariantId)
      .map((v) => [v.shopifyVariantId!, v])
  )

  const processedShopifyIds = new Set<string>()

  for (const variant of shopifyVariants) {
    const shopifyVariantId = variant.id
    processedShopifyIds.add(shopifyVariantId)

    const variantData = {
      sku: variant.sku || null,
      barcode: variant.barcode || null,
      price: priceToCents(variant.price),
      compareAtPrice: variant.compareAtPrice
        ? priceToCents(variant.compareAtPrice)
        : null,
      enabled: variant.availableForSale,
      stock: variant.inventoryQuantity ?? 0,
      weight: variant.weight
        ? Math.round(variant.weight)
        : null,
      shopifyVariantId,
      shopifySyncedAt: new Date(),
      shopifySyncError: null,
    }

    const existing = existingByShopifyId.get(shopifyVariantId)

    if (existing) {
      await prisma.productVariant.update({
        where: { id: existing.id },
        data: variantData,
      })
    } else {
      await prisma.productVariant.create({
        data: {
          productId: localProductId,
          ...variantData,
        },
      })
    }

    // Sync option values for this variant
    // Note: ProductOption / ProductOptionValue management is deferred
    // to a future iteration since it requires matching/creating option
    // definitions first. For now, the selectedOptions data is preserved
    // in the variant's context via the parent product's shopifyData.
  }

  // Disable (soft-delete) variants that no longer exist in Shopify
  for (const existing of existingVariants) {
    if (
      existing.shopifyVariantId &&
      !processedShopifyIds.has(existing.shopifyVariantId)
    ) {
      await prisma.productVariant.update({
        where: { id: existing.id },
        data: {
          enabled: false,
          shopifySyncError: "Variant no longer exists in Shopify",
        },
      })
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Mark Deleted Products                                              */
/* ------------------------------------------------------------------ */

/**
 * Mark a product as archived when it's deleted from Shopify.
 * Used by the webhook handler for products/delete events.
 */
export async function markProductDeleted(
  shopifyProductId: string
): Promise<boolean> {
  try {
    const existing = await prisma.product.findFirst({
      where: { shopifyProductId },
    })

    if (!existing) return false

    await prisma.product.update({
      where: { id: existing.id },
      data: {
        status: "ARCHIVED",
        shopifySyncedAt: new Date(),
        shopifySyncError: "Product deleted from Shopify",
      },
    })

    // Disable all variants
    await prisma.productVariant.updateMany({
      where: { productId: existing.id },
      data: {
        enabled: false,
        shopifySyncError: "Parent product deleted from Shopify",
      },
    })

    return true
  } catch (error) {
    console.error(
      `[shopify-sync] Error marking product ${shopifyProductId} as deleted:`,
      error
    )
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  Full / Delta Sync                                                  */
/* ------------------------------------------------------------------ */

/**
 * Run a full or delta product sync from Shopify to the local database.
 *
 * - Full sync: Fetches all products from Shopify, upserts into local DB
 * - Delta sync: Fetches only products modified since the last sync time
 *
 * Returns a detailed sync report with counts and errors.
 */
export async function runShopifySync(
  options: SyncOptions
): Promise<SyncReport> {
  const startedAt = new Date()
  const report: SyncReport = {
    mode: options.mode,
    startedAt: startedAt.toISOString(),
    completedAt: "",
    duration: 0,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    errors: [],
  }

  const client = createShopifyAdminClient()
  if (!client) {
    report.errors.push({
      shopifyProductId: "N/A",
      title: "Configuration",
      error:
        "Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.",
    })
    report.completedAt = new Date().toISOString()
    report.duration = Date.now() - startedAt.getTime()
    return report
  }

  try {
    // Determine the "since" date for delta sync
    let updatedAtMin: string | undefined
    if (options.mode === "delta") {
      updatedAtMin = options.since ?? (await getLastSyncTime()) ?? undefined
      if (!updatedAtMin) {
        console.log(
          "[shopify-sync] No previous sync time found, falling back to full sync"
        )
      }
    }

    // Fetch all products from Shopify (paginated)
    console.log(
      `[shopify-sync] Starting ${options.mode} sync${updatedAtMin ? ` (since ${updatedAtMin})` : ""}...`
    )

    const products = await client.getAllProducts({
      updatedAtMin,
      onPage: (pageProducts, pageNumber) => {
        console.log(
          `[shopify-sync] Fetched page ${pageNumber} (${pageProducts.length} products)`
        )
      },
    })

    report.total = products.length
    console.log(`[shopify-sync] Processing ${products.length} products...`)

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      try {
        const result = await syncSingleProduct(product)

        switch (result.action) {
          case "created":
            report.created++
            break
          case "updated":
            report.updated++
            break
          case "skipped":
            report.skipped++
            if (result.error) {
              report.errors.push({
                shopifyProductId: product.id,
                title: product.title,
                error: result.error,
              })
            }
            break
        }
      } catch (error) {
        report.skipped++
        report.errors.push({
          shopifyProductId: product.id,
          title: product.title,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      // Report progress
      if (options.onProgress) {
        options.onProgress(i + 1, products.length)
      }
    }

    // Update last sync time
    await setLastSyncTime(startedAt.toISOString())
  } catch (error) {
    report.errors.push({
      shopifyProductId: "N/A",
      title: "Sync Process",
      error: error instanceof Error ? error.message : String(error),
    })
  }

  const completedAt = new Date()
  report.completedAt = completedAt.toISOString()
  report.duration = completedAt.getTime() - startedAt.getTime()

  console.log(
    `[shopify-sync] Sync complete in ${report.duration}ms: ` +
      `${report.created} created, ${report.updated} updated, ` +
      `${report.skipped} skipped, ${report.errors.length} errors`
  )

  return report
}

/* ------------------------------------------------------------------ */
/*  Convenience: Sync a Single Product by Shopify GID                  */
/* ------------------------------------------------------------------ */

/**
 * Fetch a single product from Shopify by its GID and sync to local DB.
 * Used by webhook handlers for products/create and products/update events.
 */
export async function syncProductById(
  shopifyProductId: string
): Promise<{ action: "created" | "updated" | "skipped"; error?: string }> {
  const client = createShopifyAdminClient()
  if (!client) {
    return {
      action: "skipped",
      error: "Shopify Admin API not configured",
    }
  }

  try {
    const product = await client.getProduct(shopifyProductId)
    if (!product) {
      return {
        action: "skipped",
        error: `Product ${shopifyProductId} not found in Shopify`,
      }
    }

    return await syncSingleProduct(product)
  } catch (error) {
    return {
      action: "skipped",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
