/**
 * SWR Hook Factories
 *
 * Typed hooks for fetching API data with SWR.
 * Handles both new envelope and legacy response formats.
 */

"use client"

import useSWR, { type SWRConfiguration } from "swr"
import { apiGet, apiList as apiListFetch, type PaginatedResult } from "./client"

/* ------------------------------------------------------------------ */
/*  URL Builder                                                        */
/* ------------------------------------------------------------------ */

/** Build a URL with query params — also used as SWR cache key */
export function buildUrl(
  base: string,
  params?: Record<string, unknown>
): string {
  if (!params) return base

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  }

  const qs = searchParams.toString()
  return qs ? `${base}?${qs}` : base
}

/* ------------------------------------------------------------------ */
/*  Single-Item Hook                                                   */
/* ------------------------------------------------------------------ */

export interface UseApiGetResult<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  mutate: ReturnType<typeof useSWR<T>>["mutate"]
}

/**
 * Hook for fetching a single item from an API endpoint.
 *
 * ```tsx
 * const { data: page, isLoading } = useApiGet<PageDto>(`/api/cms/admin/pages/${id}`)
 * ```
 */
export function useApiGet<T>(
  url: string | null,
  config?: SWRConfiguration<T>
): UseApiGetResult<T> {
  const { data, error, isLoading, mutate } = useSWR<T>(
    url,
    (key: string) => apiGet<T>(key),
    config
  )

  return {
    data,
    isLoading,
    isError: !!error,
    error: error as Error | undefined,
    mutate,
  }
}

/* ------------------------------------------------------------------ */
/*  Paginated List Hook                                                */
/* ------------------------------------------------------------------ */

export interface UseApiListResult<T> {
  data: T[]
  total: number
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  isLoading: boolean
  isError: boolean
  error: Error | undefined
  mutate: ReturnType<typeof useSWR<PaginatedResult<T>>>["mutate"]
}

/**
 * Hook for fetching a paginated list from an API endpoint.
 *
 * ```tsx
 * const { data: pages, total, isLoading } = useApiList<PageDto>(
 *   '/api/cms/admin/pages',
 *   { limit: 20, offset: 0 },
 *   'pages' // legacy data key
 * )
 * ```
 */
export function useApiList<T>(
  url: string | null,
  params?: Record<string, unknown>,
  legacyDataKey?: string,
  config?: SWRConfiguration<PaginatedResult<T>>
): UseApiListResult<T> {
  const key = url ? buildUrl(url, params) : null

  const { data, error, isLoading, mutate } = useSWR<PaginatedResult<T>>(
    key,
    (fetchKey: string) => {
      // Extract base path and params from the full URL key
      const [basePath, queryString] = fetchKey.split("?")
      const fetchParams: Record<string, unknown> = {}
      if (queryString) {
        for (const [k, v] of new URLSearchParams(queryString).entries()) {
          fetchParams[k] = v
        }
      }
      return apiListFetch<T>(basePath, fetchParams, legacyDataKey)
    },
    config
  )

  const emptyPagination = { total: 0, limit: 0, offset: 0, hasMore: false }

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    pagination: data
      ? {
          total: data.total,
          limit: data.limit,
          offset: data.offset,
          hasMore: data.hasMore,
        }
      : emptyPagination,
    isLoading,
    isError: !!error,
    error: error as Error | undefined,
    mutate,
  }
}
