/**
 * Commerce Provider Types
 *
 * Provider-agnostic commerce abstraction following the IEmailProvider pattern.
 * Supports internal CMS products (generic), Shopify, Stripe, and Saleor.
 */

import type { CommerceBinding, CommerceProvider } from "../block-editor/types"

/* ------------------------------------------------------------------ */
/*  Normalized Commerce Data                                           */
/* ------------------------------------------------------------------ */

export interface CommerceImage {
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface CommerceMoney {
  amount: number
  currencyCode: string
}

export interface CommerceVariant {
  id: string
  title: string
  sku?: string
  price: CommerceMoney
  compareAtPrice?: CommerceMoney
  available: boolean
  options: Record<string, string>
  image?: CommerceImage
}

export interface CommerceProduct {
  id: string
  handle: string
  title: string
  description?: string
  images: CommerceImage[]
  variants: CommerceVariant[]
  price: CommerceMoney
  compareAtPrice?: CommerceMoney
  available: boolean
  tags?: string[]
  vendor?: string
  productType?: string
}

export interface CommerceCollection {
  id: string
  handle: string
  title: string
  description?: string
  image?: CommerceImage
  products: CommerceProduct[]
}

export interface CommerceCartLineItem {
  id: string
  variantId: string
  productId: string
  title: string
  quantity: number
  price: CommerceMoney
  image?: CommerceImage
}

export interface CommerceCart {
  id: string
  lines: CommerceCartLineItem[]
  totalAmount: CommerceMoney
  totalQuantity: number
  checkoutUrl?: string
}

/* ------------------------------------------------------------------ */
/*  Provider Interface                                                 */
/* ------------------------------------------------------------------ */

export interface ICommerceProvider {
  readonly name: CommerceProvider

  /** Verify provider configuration / connectivity */
  verify(): Promise<boolean>

  /** Get a single product by handle or ID */
  getProduct(handle: string): Promise<CommerceProduct | null>

  /** Get multiple products with optional filters */
  getProducts(options?: {
    limit?: number
    sortKey?: string
    reverse?: boolean
    query?: string
  }): Promise<CommerceProduct[]>

  /** Get a collection by handle */
  getCollection(handle: string): Promise<CommerceCollection | null>

  /** Get cart by ID */
  getCart(cartId: string): Promise<CommerceCart | null>

  /** Add item to cart (creates cart if cartId is null) */
  addToCart(
    cartId: string | null,
    variantId: string,
    quantity: number
  ): Promise<CommerceCart>

  /** Update line item quantity in cart */
  updateCart?(
    cartId: string,
    lineId: string,
    quantity: number
  ): Promise<CommerceCart>

  /** Remove line items from cart */
  removeFromCart?(cartId: string, lineIds: string[]): Promise<CommerceCart>
}

/* ------------------------------------------------------------------ */
/*  Provider Configs                                                   */
/* ------------------------------------------------------------------ */

export interface ShopifyConfig {
  storeDomain: string
  storefrontAccessToken: string
  apiVersion?: string
}

export interface StripeCommerceConfig {
  /** Stripe is configured globally via env — no extra config needed */
  mode?: "live" | "test"
}

export interface SaleorConfig {
  apiUrl: string
  channelSlug?: string
}

export type CommerceProviderConfig =
  | { provider: "generic" }
  | { provider: "shopify"; config: ShopifyConfig }
  | { provider: "stripe"; config: StripeCommerceConfig }
  | { provider: "saleor"; config: SaleorConfig }

/* ------------------------------------------------------------------ */
/*  Re-export binding type for convenience                             */
/* ------------------------------------------------------------------ */

export type { CommerceBinding, CommerceProvider }
