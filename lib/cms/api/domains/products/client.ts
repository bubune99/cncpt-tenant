/**
 * Products API Client
 *
 * Typed client for /api/admin/products routes.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiList } from "../../client"
import type { PaginatedResult } from "../../client"
import type {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
  ListProductsParams,
} from "./types"

const BASE = "/api/cms/products"

export const productsClient = {
  /** List products with pagination and filters */
  list(params?: ListProductsParams): Promise<PaginatedResult<ProductDto>> {
    return apiList<ProductDto>(BASE, params as Record<string, unknown>, "products")
  },

  /** Get a single product by ID */
  get(id: string): Promise<ProductDto> {
    return apiGet<ProductDto>(`${BASE}/${id}`)
  },

  /** Create a new product */
  create(input: CreateProductInput): Promise<ProductDto> {
    return apiPost<ProductDto>(BASE, input)
  },

  /** Update an existing product */
  update(id: string, input: UpdateProductInput): Promise<ProductDto> {
    return apiPut<ProductDto>(`${BASE}/${id}`, input)
  },

  /** Delete a product */
  delete(id: string): Promise<{ success: boolean }> {
    return apiDelete(`${BASE}/${id}`)
  },

  /** Sync product to Stripe */
  syncStripe(id: string): Promise<{ stripeProductId: string }> {
    return apiPost(`${BASE}/${id}/sync-stripe`)
  },
}
