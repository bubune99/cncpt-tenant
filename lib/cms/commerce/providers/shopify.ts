/**
 * Shopify Commerce Provider
 *
 * Full Storefront API GraphQL integration.
 * Maps Shopify's response types to the normalized Commerce* interfaces.
 */

import type {
  ICommerceProvider,
  CommerceProduct,
  CommerceVariant,
  CommerceCollection,
  CommerceCart,
  CommerceCartLineItem,
  CommerceImage,
  CommerceMoney,
  ShopifyConfig,
} from "../types"

/* ------------------------------------------------------------------ */
/*  Shopify Response Types (internal)                                  */
/* ------------------------------------------------------------------ */

interface ShopifyMoneyV2 {
  amount: string
  currencyCode: string
}

interface ShopifyImage {
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

interface ShopifyProductVariant {
  id: string
  title: string
  sku: string | null
  availableForSale: boolean
  price: ShopifyMoneyV2
  compareAtPrice: ShopifyMoneyV2 | null
  selectedOptions: { name: string; value: string }[]
  image: ShopifyImage | null
}

interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  images: { edges: { node: ShopifyImage }[] }
  variants: { edges: { node: ShopifyProductVariant }[] }
  priceRange: { minVariantPrice: ShopifyMoneyV2 }
  compareAtPriceRange: { minVariantPrice: ShopifyMoneyV2 | null }
  availableForSale: boolean
  tags: string[]
  vendor: string
  productType: string
}

interface ShopifyCollection {
  id: string
  handle: string
  title: string
  description: string
  image: ShopifyImage | null
  products: { edges: { node: ShopifyProduct }[] }
}

interface ShopifyCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: { id: string; title: string }
    image: ShopifyImage | null
    price: ShopifyMoneyV2
  }
}

interface ShopifyCart {
  id: string
  lines: { edges: { node: ShopifyCartLine }[] }
  cost: { totalAmount: ShopifyMoneyV2 }
  totalQuantity: number
  checkoutUrl: string
}

/* ------------------------------------------------------------------ */
/*  GraphQL Fragments                                                  */
/* ------------------------------------------------------------------ */

const IMAGE_FRAGMENT = `
  url
  altText
  width
  height
`

const VARIANT_FRAGMENT = `
  id
  title
  sku
  availableForSale
  price { amount currencyCode }
  compareAtPrice { amount currencyCode }
  selectedOptions { name value }
  image { ${IMAGE_FRAGMENT} }
`

const PRODUCT_FRAGMENT = `
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
  images(first: 10) { edges { node { ${IMAGE_FRAGMENT} } } }
  variants(first: 50) { edges { node { ${VARIANT_FRAGMENT} } } }
`

const CART_FRAGMENT = `
  id
  totalQuantity
  checkoutUrl
  cost { totalAmount { amount currencyCode } }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            product { id title }
            image { ${IMAGE_FRAGMENT} }
            price { amount currencyCode }
          }
        }
      }
    }
  }
`

/* ------------------------------------------------------------------ */
/*  Provider Implementation                                            */
/* ------------------------------------------------------------------ */

export class ShopifyProvider implements ICommerceProvider {
  readonly name = "shopify" as const
  private config: ShopifyConfig

  constructor(config: ShopifyConfig) {
    this.config = config
  }

  /* ── Private helpers ─────────────────────────────────────────── */

  private get apiVersion(): string {
    return this.config.apiVersion ?? "2024-01"
  }

  private get endpoint(): string {
    return `https://${this.config.storeDomain}/api/${this.apiVersion}/graphql.json`
  }

  private async storefrontFetch<T>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          this.config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!res.ok) {
      throw new Error(
        `Shopify Storefront API error: ${res.status} ${res.statusText}`
      )
    }

    const json = await res.json()

    if (json.errors?.length) {
      throw new Error(
        `Shopify GraphQL error: ${json.errors[0].message}`
      )
    }

    return json.data as T
  }

  /* ── Mappers ─────────────────────────────────────────────────── */

  private mapMoney(money: ShopifyMoneyV2): CommerceMoney {
    return {
      amount: parseFloat(money.amount),
      currencyCode: money.currencyCode,
    }
  }

  private mapImage(image: ShopifyImage): CommerceImage {
    return {
      url: image.url,
      alt: image.altText ?? undefined,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
    }
  }

  private mapVariant(variant: ShopifyProductVariant): CommerceVariant {
    const options: Record<string, string> = {}
    for (const opt of variant.selectedOptions) {
      options[opt.name] = opt.value
    }

    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku ?? undefined,
      price: this.mapMoney(variant.price),
      compareAtPrice: variant.compareAtPrice
        ? this.mapMoney(variant.compareAtPrice)
        : undefined,
      available: variant.availableForSale,
      options,
      image: variant.image ? this.mapImage(variant.image) : undefined,
    }
  }

  private mapProduct(product: ShopifyProduct): CommerceProduct {
    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      description: product.description || undefined,
      // Alt text fallback to product title (Vercel Commerce pattern)
      images: product.images.edges.map((e) => ({
        ...this.mapImage(e.node),
        alt: e.node.altText || product.title,
      })),
      variants: product.variants.edges.map((e) => this.mapVariant(e.node)),
      price: this.mapMoney(product.priceRange.minVariantPrice),
      compareAtPrice: product.compareAtPriceRange.minVariantPrice
        ? this.mapMoney(product.compareAtPriceRange.minVariantPrice)
        : undefined,
      available: product.availableForSale,
      tags: product.tags,
      vendor: product.vendor || undefined,
      productType: product.productType || undefined,
    }
  }

  private mapCartLine(line: ShopifyCartLine): CommerceCartLineItem {
    return {
      id: line.id,
      variantId: line.merchandise.id,
      productId: line.merchandise.product.id,
      title: `${line.merchandise.product.title} - ${line.merchandise.title}`,
      quantity: line.quantity,
      price: this.mapMoney(line.merchandise.price),
      image: line.merchandise.image
        ? this.mapImage(line.merchandise.image)
        : undefined,
    }
  }

  private mapCart(cart: ShopifyCart): CommerceCart {
    return {
      id: cart.id,
      lines: cart.lines.edges.map((e) => this.mapCartLine(e.node)),
      totalAmount: this.mapMoney(cart.cost.totalAmount),
      totalQuantity: cart.totalQuantity,
      checkoutUrl: cart.checkoutUrl,
    }
  }

  /* ── ICommerceProvider methods ───────────────────────────────── */

  async verify(): Promise<boolean> {
    if (!this.config.storeDomain || !this.config.storefrontAccessToken) {
      return false
    }

    try {
      await this.storefrontFetch<{ shop: { name: string } }>(
        "{ shop { name } }"
      )
      return true
    } catch {
      return false
    }
  }

  async getProduct(handle: string): Promise<CommerceProduct | null> {
    const query = `
      query productByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          ${PRODUCT_FRAGMENT}
        }
      }
    `

    const data = await this.storefrontFetch<{
      productByHandle: ShopifyProduct | null
    }>(query, { handle })

    return data.productByHandle
      ? this.mapProduct(data.productByHandle)
      : null
  }

  async getProducts(options?: {
    limit?: number
    sortKey?: string
    reverse?: boolean
    query?: string
  }): Promise<CommerceProduct[]> {
    const limit = options?.limit ?? 20
    const sortKey = options?.sortKey ?? "BEST_SELLING"
    const reverse = options?.reverse ?? false

    const query = `
      query products($first: Int!, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
        products(first: $first, sortKey: $sortKey, reverse: $reverse, query: $query) {
          edges {
            node {
              ${PRODUCT_FRAGMENT}
            }
          }
        }
      }
    `

    const data = await this.storefrontFetch<{
      products: { edges: { node: ShopifyProduct }[] }
    }>(query, {
      first: limit,
      sortKey,
      reverse,
      query: options?.query ?? null,
    })

    // Filter hidden products (Vercel Commerce pattern — admin can hide without deleting)
    return data.products.edges
      .map((e) => this.mapProduct(e.node))
      .filter((p) => !p.tags?.includes("hidden"))
  }

  async getCollection(handle: string): Promise<CommerceCollection | null> {
    const query = `
      query collectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          description
          image { ${IMAGE_FRAGMENT} }
          products(first: 50) {
            edges {
              node {
                ${PRODUCT_FRAGMENT}
              }
            }
          }
        }
      }
    `

    const data = await this.storefrontFetch<{
      collectionByHandle: ShopifyCollection | null
    }>(query, { handle })

    if (!data.collectionByHandle) return null

    const col = data.collectionByHandle
    return {
      id: col.id,
      handle: col.handle,
      title: col.title,
      description: col.description || undefined,
      image: col.image ? this.mapImage(col.image) : undefined,
      products: col.products.edges.map((e) => this.mapProduct(e.node)),
    }
  }

  async getCart(cartId: string): Promise<CommerceCart | null> {
    const query = `
      query cart($id: ID!) {
        cart(id: $id) {
          ${CART_FRAGMENT}
        }
      }
    `

    const data = await this.storefrontFetch<{
      cart: ShopifyCart | null
    }>(query, { id: cartId })

    return data.cart ? this.mapCart(data.cart) : null
  }

  async addToCart(
    cartId: string | null,
    variantId: string,
    quantity: number
  ): Promise<CommerceCart> {
    if (!cartId) {
      // Create new cart
      const mutation = `
        mutation cartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              ${CART_FRAGMENT}
            }
            userErrors { field message }
          }
        }
      `

      const data = await this.storefrontFetch<{
        cartCreate: {
          cart: ShopifyCart
          userErrors: { field: string[]; message: string }[]
        }
      }>(mutation, {
        input: {
          lines: [{ merchandiseId: variantId, quantity }],
        },
      })

      if (data.cartCreate.userErrors.length > 0) {
        throw new Error(data.cartCreate.userErrors[0].message)
      }

      return this.mapCart(data.cartCreate.cart)
    }

    // Add to existing cart
    const mutation = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            ${CART_FRAGMENT}
          }
          userErrors { field message }
        }
      }
    `

    const data = await this.storefrontFetch<{
      cartLinesAdd: {
        cart: ShopifyCart
        userErrors: { field: string[]; message: string }[]
      }
    }>(mutation, {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    })

    if (data.cartLinesAdd.userErrors.length > 0) {
      throw new Error(data.cartLinesAdd.userErrors[0].message)
    }

    return this.mapCart(data.cartLinesAdd.cart)
  }

  async updateCart(
    cartId: string,
    lineId: string,
    quantity: number
  ): Promise<CommerceCart> {
    const mutation = `
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            ${CART_FRAGMENT}
          }
          userErrors { field message }
        }
      }
    `

    const data = await this.storefrontFetch<{
      cartLinesUpdate: {
        cart: ShopifyCart
        userErrors: { field: string[]; message: string }[]
      }
    }>(mutation, {
      cartId,
      lines: [{ id: lineId, quantity }],
    })

    if (data.cartLinesUpdate.userErrors.length > 0) {
      throw new Error(data.cartLinesUpdate.userErrors[0].message)
    }

    return this.mapCart(data.cartLinesUpdate.cart)
  }

  async removeFromCart(
    cartId: string,
    lineIds: string[]
  ): Promise<CommerceCart> {
    const mutation = `
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            ${CART_FRAGMENT}
          }
          userErrors { field message }
        }
      }
    `

    const data = await this.storefrontFetch<{
      cartLinesRemove: {
        cart: ShopifyCart
        userErrors: { field: string[]; message: string }[]
      }
    }>(mutation, { cartId, lineIds })

    if (data.cartLinesRemove.userErrors.length > 0) {
      throw new Error(data.cartLinesRemove.userErrors[0].message)
    }

    return this.mapCart(data.cartLinesRemove.cart)
  }
}
