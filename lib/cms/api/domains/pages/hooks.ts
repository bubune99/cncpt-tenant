/**
 * Pages SWR Hooks
 *
 * React hooks for fetching pages data with SWR.
 */

"use client"

import type { SWRConfiguration } from "swr"
import { useApiGet, useApiList } from "../../hooks"
import type { UseApiGetResult, UseApiListResult } from "../../hooks"
import type { PaginatedResult } from "../../client"
import type { PageListDto, PageDto, ListPagesParams } from "./types"

const BASE = "/api/admin/pages"

/**
 * Hook for fetching a paginated list of pages.
 *
 * ```tsx
 * const { data: pages, total, isLoading } = usePages({ limit: 20, status: 'published' })
 * ```
 */
export function usePages(
  params?: ListPagesParams,
  config?: SWRConfiguration<PaginatedResult<PageListDto>>
): UseApiListResult<PageListDto> {
  return useApiList<PageListDto>(
    BASE,
    params as Record<string, unknown>,
    "pages",
    config
  )
}

/**
 * Hook for fetching a single page by ID.
 *
 * ```tsx
 * const { data: page, isLoading } = usePage(pageId)
 * ```
 */
export function usePage(
  id: string | null,
  config?: SWRConfiguration<PageDto>
): UseApiGetResult<PageDto> {
  return useApiGet<PageDto>(id ? `${BASE}/${id}` : null, config)
}
