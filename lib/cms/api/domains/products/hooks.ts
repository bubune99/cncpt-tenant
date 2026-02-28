/**
 * Products SWR Hooks
 *
 * React hooks for fetching products data with SWR.
 */

"use client"

import type { SWRConfiguration } from "swr"
import { useApiGet, useApiList } from "../../hooks"
import type { UseApiGetResult, UseApiListResult } from "../../hooks"
import type { PaginatedResult } from "../../client"
import type { ProductDto, ListProductsParams } from "./types"

const BASE = "/api/cms/admin/products"

/**
 * Hook for fetching a paginated list of products.
 *
 * ```tsx
 * const { data: products, total, isLoading } = useProducts({ limit: 20, status: 'active' })
 * ```
 */
export function useProducts(
  params?: ListProductsParams,
  config?: SWRConfiguration<PaginatedResult<ProductDto>>
): UseApiListResult<ProductDto> {
  return useApiList<ProductDto>(
    BASE,
    params as Record<string, unknown>,
    "products",
    config
  )
}

/**
 * Hook for fetching a single product by ID.
 *
 * ```tsx
 * const { data: product, isLoading } = useProduct(productId)
 * ```
 */
export function useProduct(
  id: string | null,
  config?: SWRConfiguration<ProductDto>
): UseApiGetResult<ProductDto> {
  return useApiGet<ProductDto>(id ? `${BASE}/${id}` : null, config)
}
