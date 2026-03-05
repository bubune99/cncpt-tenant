/**
 * Shopify Admin API Client
 *
 * Provides read access to the Shopify Admin GraphQL API for product sync,
 * order reading, inventory levels, and collection metadata.
 *
 * This is separate from the Storefront API provider (shopify.ts) which handles
 * public-facing reads and cart operations. The Admin API requires a different
 * access token with broader permissions.
 */

import type { ShopifyAdminConfig } from "../types"

/* ------------------------------------------------------------------ */
/*  Admin API Response Types                                           */
/* ------------------------------------------------------------------ */

export interface ShopifyAdminMoneyV2 {
  amount: string
  currencyCode: string
}

export interface ShopifyAdminImage {
  id: string
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export interface ShopifyAdminVariant {
  id: string
  title: string
  sku: string | null
  barcode: string | null
  price: string
  compareAtPrice: string | null
  inventoryQuantity: number | null
  availableForSale: boolean
  selectedOptions: { name: string; value: string }[]
  image: ShopifyAdminImage | null
  weight: number | null
  weightUnit: string | null
  requiresShipping: boolean
  taxable: boolean
  createdAt: string
  updatedAt: string
}

export interface ShopifyAdminProduct {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  status: "ACTIVE" | "ARCHIVED" | "DRAFT"
  vendor: string
  productType: string
  tags: string[]
  images: { edges: { node: ShopifyAdminImage }[] }
  variants: {
    edges: { node: ShopifyAdminVariant }[]
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
  priceRangeV2: {
    minVariantPrice: ShopifyAdminMoneyV2
    maxVariantPrice: ShopifyAdminMoneyV2
  }
  totalInventory: number | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  metafields: {
    edges: { node: { namespace: string; key: string; value: string; type: string } }[]
  }
}

export interface ShopifyAdminOrder {
  id: string
  name: string
  email: string | null
  displayFinancialStatus: string | null
  displayFulfillmentStatus: string | null
  totalPriceSet: { shopMoney: ShopifyAdminMoneyV2 }
  subtotalPriceSet: { shopMoney: ShopifyAdminMoneyV2 }
  totalShippingPriceSet: { shopMoney: ShopifyAdminMoneyV2 }
  totalTaxSet: { shopMoney: ShopifyAdminMoneyV2 }
  createdAt: string
  updatedAt: string
  lineItems: {
    edges: {
      node: {
        id: string
        title: string
        quantity: number
        variant: { id: string; sku: string | null } | null
        originalUnitPriceSet: { shopMoney: ShopifyAdminMoneyV2 }
      }
    }[]
  }
}

export interface ShopifyAdminCollection {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  image: ShopifyAdminImage | null
  productsCount: { count: number }
  sortOrder: string
  updatedAt: string
}

export interface ShopifyShopInfo {
  name: string
  email: string
  primaryDomain: { url: string }
  currencyCode: string
  plan: { displayName: string }
}

/* ------------------------------------------------------------------ */
/*  Pagination Types                                                   */
/* ------------------------------------------------------------------ */

export interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

export interface PaginatedResult<T> {
  nodes: T[]
  pageInfo: PageInfo
}

/* ------------------------------------------------------------------ */
/*  GraphQL Fragments                                                  */
/* ------------------------------------------------------------------ */

const ADMIN_IMAGE_FRAGMENT = `
  id
  url
  altText
  width
  height
`

const ADMIN_VARIANT_FRAGMENT = `
  id
  title
  sku
  barcode
  price
  compareAtPrice
  inventoryQuantity
  availableForSale
  selectedOptions { name value }
  image { ${ADMIN_IMAGE_FRAGMENT} }
  weight
  weightUnit
  requiresShipping
  taxable
  createdAt
  updatedAt
`

const ADMIN_PRODUCT_FRAGMENT = `
  id
  handle
  title
  description
  descriptionHtml
  status
  vendor
  productType
  tags
  totalInventory
  createdAt
  updatedAt
  publishedAt
  priceRangeV2 {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  images(first: 20) { edges { node { ${ADMIN_IMAGE_FRAGMENT} } } }
  variants(first: 100) {
    edges { node { ${ADMIN_VARIANT_FRAGMENT} } }
    pageInfo { hasNextPage endCursor }
  }
  metafields(first: 20) {
    edges { node { namespace key value type } }
  }
`

const ADMIN_ORDER_FRAGMENT = `
  id
  name
  email
  displayFinancialStatus
  displayFulfillmentStatus
  totalPriceSet { shopMoney { amount currencyCode } }
  subtotalPriceSet { shopMoney { amount currencyCode } }
  totalShippingPriceSet { shopMoney { amount currencyCode } }
  totalTaxSet { shopMoney { amount currencyCode } }
  createdAt
  updatedAt
  lineItems(first: 50) {
    edges {
      node {
        id
        title
        quantity
        variant { id sku }
        originalUnitPriceSet { shopMoney { amount currencyCode } }
      }
    }
  }
`

const ADMIN_COLLECTION_FRAGMENT = `
  id
  handle
  title
  description
  descriptionHtml
  image { ${ADMIN_IMAGE_FRAGMENT} }
  productsCount { count }
  sortOrder
  updatedAt
`

/* ------------------------------------------------------------------ */
/*  Client Implementation                                              */
/* ------------------------------------------------------------------ */

export class ShopifyAdminClient {
  private config: ShopifyAdminConfig

  constructor(config: ShopifyAdminConfig) {
    if (!config.storeDomain || !config.adminAccessToken) {
      throw new Error(
        "ShopifyAdminClient requires storeDomain and adminAccessToken"
      )
    }
    this.config = config
  }

  /* ── Private helpers ─────────────────────────────────────────── */

  private get apiVersion(): string {
    return this.config.apiVersion ?? "2024-01"
  }

  private get endpoint(): string {
    return `https://${this.config.storeDomain}/admin/api/${this.apiVersion}/graphql.json`
  }

  private async adminFetch<T>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.config.adminAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(
        `Shopify Admin API error: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`
      )
    }

    const json = await res.json()

    if (json.errors?.length) {
      throw new Error(
        `Shopify Admin GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`
      )
    }

    return json.data as T
  }

  /* ── Shop Info ─────────────────────────────────────────────── */

  async getShopInfo(): Promise<ShopifyShopInfo> {
    const query = `{
      shop {
        name
        email
        primaryDomain { url }
        currencyCode
        plan { displayName }
      }
    }`

    const data = await this.adminFetch<{ shop: ShopifyShopInfo }>(query)
    return data.shop
  }

  /** Verify the Admin API token works */
  async verify(): Promise<boolean> {
    try {
      await this.getShopInfo()
      return true
    } catch {
      return false
    }
  }

  /* ── Products ──────────────────────────────────────────────── */

  /**
   * Fetch products with cursor-based pagination.
   * Supports filtering by updated_at for delta sync.
   */
  async getProducts(options?: {
    first?: number
    after?: string | null
    query?: string
    updatedAtMin?: string // ISO date string for delta sync
  }): Promise<PaginatedResult<ShopifyAdminProduct>> {
    const first = options?.first ?? 50
    let queryFilter = options?.query ?? ""

    // Add updated_at filter for delta sync
    if (options?.updatedAtMin) {
      const dateFilter = `updated_at:>'${options.updatedAtMin}'`
      queryFilter = queryFilter ? `${queryFilter} AND ${dateFilter}` : dateFilter
    }

    const query = `
      query products($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          edges {
            node { ${ADMIN_PRODUCT_FRAGMENT} }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `

    const data = await this.adminFetch<{
      products: {
        edges: { node: ShopifyAdminProduct }[]
        pageInfo: PageInfo
      }
    }>(query, {
      first,
      after: options?.after ?? null,
      query: queryFilter || null,
    })

    return {
      nodes: data.products.edges.map((e) => e.node),
      pageInfo: data.products.pageInfo,
    }
  }

  /** Fetch all products, automatically paginating through all pages */
  async getAllProducts(options?: {
    query?: string
    updatedAtMin?: string
    onPage?: (products: ShopifyAdminProduct[], pageNumber: number) => void
  }): Promise<ShopifyAdminProduct[]> {
    const allProducts: ShopifyAdminProduct[] = []
    let cursor: string | null = null
    let pageNumber = 0

    do {
      const result = await this.getProducts({
        first: 50,
        after: cursor,
        query: options?.query,
        updatedAtMin: options?.updatedAtMin,
      })

      allProducts.push(...result.nodes)
      pageNumber++

      if (options?.onPage) {
        options.onPage(result.nodes, pageNumber)
      }

      cursor = result.pageInfo.hasNextPage
        ? result.pageInfo.endCursor
        : null
    } while (cursor)

    return allProducts
  }

  /** Fetch a single product by Admin API GID */
  async getProduct(id: string): Promise<ShopifyAdminProduct | null> {
    const query = `
      query product($id: ID!) {
        product(id: $id) { ${ADMIN_PRODUCT_FRAGMENT} }
      }
    `

    const data = await this.adminFetch<{
      product: ShopifyAdminProduct | null
    }>(query, { id })

    return data.product
  }

  /** Get the total product count for status reporting */
  async getProductCount(): Promise<number> {
    const query = `{
      productsCount { count }
    }`

    const data = await this.adminFetch<{
      productsCount: { count: number }
    }>(query)

    return data.productsCount.count
  }

  /* ── Orders ────────────────────────────────────────────────── */

  async getOrders(options?: {
    first?: number
    after?: string | null
    query?: string
  }): Promise<PaginatedResult<ShopifyAdminOrder>> {
    const first = options?.first ?? 50

    const query = `
      query orders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query) {
          edges {
            node { ${ADMIN_ORDER_FRAGMENT} }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `

    const data = await this.adminFetch<{
      orders: {
        edges: { node: ShopifyAdminOrder }[]
        pageInfo: PageInfo
      }
    }>(query, {
      first,
      after: options?.after ?? null,
      query: options?.query ?? null,
    })

    return {
      nodes: data.orders.edges.map((e) => e.node),
      pageInfo: data.orders.pageInfo,
    }
  }

  async getOrder(id: string): Promise<ShopifyAdminOrder | null> {
    const query = `
      query order($id: ID!) {
        order(id: $id) { ${ADMIN_ORDER_FRAGMENT} }
      }
    `

    const data = await this.adminFetch<{
      order: ShopifyAdminOrder | null
    }>(query, { id })

    return data.order
  }

  /* ── Collections ───────────────────────────────────────────── */

  async getCollections(options?: {
    first?: number
    after?: string | null
    query?: string
  }): Promise<PaginatedResult<ShopifyAdminCollection>> {
    const first = options?.first ?? 50

    const query = `
      query collections($first: Int!, $after: String, $query: String) {
        collections(first: $first, after: $after, query: $query) {
          edges {
            node { ${ADMIN_COLLECTION_FRAGMENT} }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    `

    const data = await this.adminFetch<{
      collections: {
        edges: { node: ShopifyAdminCollection }[]
        pageInfo: PageInfo
      }
    }>(query, {
      first,
      after: options?.after ?? null,
      query: options?.query ?? null,
    })

    return {
      nodes: data.collections.edges.map((e) => e.node),
      pageInfo: data.collections.pageInfo,
    }
  }

  /* ── Inventory ─────────────────────────────────────────────── */

  async getInventoryLevels(inventoryItemIds: string[]): Promise<
    {
      id: string
      inventoryItemId: string
      available: number | null
      location: { name: string; id: string }
    }[]
  > {
    if (inventoryItemIds.length === 0) return []

    const query = `
      query inventoryLevels($inventoryItemIds: [ID!]!) {
        inventoryItems(first: 50, query: "") {
          edges {
            node {
              id
              inventoryLevels(first: 10) {
                edges {
                  node {
                    id
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                    location {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      const data = await this.adminFetch<{
        inventoryItems: {
          edges: {
            node: {
              id: string
              inventoryLevels: {
                edges: {
                  node: {
                    id: string
                    quantities: { name: string; quantity: number }[]
                    location: { id: string; name: string }
                  }
                }[]
              }
            }
          }[]
        }
      }>(query, { inventoryItemIds })

      const levels: {
        id: string
        inventoryItemId: string
        available: number | null
        location: { name: string; id: string }
      }[] = []

      for (const item of data.inventoryItems.edges) {
        for (const level of item.node.inventoryLevels.edges) {
          const availableQty = level.node.quantities.find(
            (q) => q.name === "available"
          )
          levels.push({
            id: level.node.id,
            inventoryItemId: item.node.id,
            available: availableQty?.quantity ?? null,
            location: level.node.location,
          })
        }
      }

      return levels
    } catch (error) {
      console.error("[shopify-admin] Failed to fetch inventory levels:", error)
      return []
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Factory Helper                                                     */
/* ------------------------------------------------------------------ */

/**
 * Create a ShopifyAdminClient from environment variables.
 * Returns null if required env vars are missing.
 */
export function createShopifyAdminClient(): ShopifyAdminClient | null {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
  const adminAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  const apiVersion = process.env.SHOPIFY_API_VERSION

  if (!storeDomain || !adminAccessToken) {
    return null
  }

  return new ShopifyAdminClient({
    storeDomain,
    adminAccessToken,
    apiVersion,
  })
}
