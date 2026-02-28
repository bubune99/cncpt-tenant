/**
 * Partials SWR Hooks
 *
 * React hooks for fetching partials data with SWR.
 */

"use client"

import type { SWRConfiguration } from "swr"
import { useApiGet, useApiList } from "../../hooks"
import type { UseApiGetResult, UseApiListResult } from "../../hooks"
import type { PaginatedResult } from "../../client"
import type { PartialDto, ListPartialsParams } from "./types"

const BASE = "/api/cms/admin/partials"

/**
 * Hook for fetching a paginated list of partials.
 *
 * ```tsx
 * const { data: partials, total, isLoading } = usePartials({ category: 'header' })
 * ```
 */
export function usePartials(
  params?: ListPartialsParams,
  config?: SWRConfiguration<PaginatedResult<PartialDto>>
): UseApiListResult<PartialDto> {
  return useApiList<PartialDto>(
    BASE,
    params as Record<string, unknown>,
    "partials",
    config
  )
}

/**
 * Hook for fetching a single partial by ID.
 *
 * ```tsx
 * const { data: partial, isLoading } = usePartial(partialId)
 * ```
 */
export function usePartial(
  id: string | null,
  config?: SWRConfiguration<PartialDto>
): UseApiGetResult<PartialDto> {
  return useApiGet<PartialDto>(id ? `${BASE}/${id}` : null, config)
}
