'use client'

/* ------------------------------------------------------------------ */
/*  React Hooks — Marketplace template browsing & insertion            */
/* ------------------------------------------------------------------ */

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  MarketplaceTemplate,
  MarketplaceFilter,
  PaginatedTemplates,
  CategoryCount,
  TemplateType,
  TemplateCategory,
} from '@/lib/cms/marketplace/types'
import type { Block } from '@/lib/cms/block-editor/types'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const BASE_URL = '/api/cms/marketplace'

/** Build query string from a filter object, omitting undefined/null values */
function toQueryString(filter: MarketplaceFilter): string {
  const params = new URLSearchParams()

  if (filter.type) params.set('type', filter.type)
  if (filter.category) params.set('category', filter.category)
  if (filter.search) params.set('search', filter.search)
  if (filter.tags?.length) params.set('tags', filter.tags.join(','))
  if (filter.source) params.set('source', filter.source)
  if (filter.featured !== undefined) params.set('featured', String(filter.featured))
  if (filter.sort) params.set('sort', filter.sort)
  if (filter.page) params.set('page', String(filter.page))
  if (filter.limit) params.set('limit', String(filter.limit))

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** Simple fetch wrapper that throws on non-OK responses */
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with status ${res.status}`)
  }
  return res.json()
}

/* ------------------------------------------------------------------ */
/*  useMarketplaceTemplates — paginated, filtered list                 */
/* ------------------------------------------------------------------ */

interface UseMarketplaceTemplatesReturn {
  templates: MarketplaceTemplate[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetch a paginated, filtered list of marketplace templates.
 *
 * Automatically re-fetches when the filter changes.
 */
export function useMarketplaceTemplates(
  filter: MarketplaceFilter = {}
): UseMarketplaceTemplatesReturn {
  const [data, setData] = useState<PaginatedTemplates | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  // Serialize filter to a stable string for the dependency array
  const filterKey = JSON.stringify(filter)

  const fetchData = useCallback(async () => {
    const fetchId = ++fetchIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const parsed: MarketplaceFilter = JSON.parse(filterKey)
      const url = `${BASE_URL}${toQueryString(parsed)}`
      const result = await apiFetch<PaginatedTemplates>(url)

      // Only update if this is still the latest request (prevents race conditions)
      if (fetchId === fetchIdRef.current) {
        setData(result)
      }
    } catch (err: any) {
      if (fetchId === fetchIdRef.current) {
        setError(err.message ?? 'Failed to fetch templates')
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [filterKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    templates: data?.templates ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    refetch: fetchData,
  }
}

/* ------------------------------------------------------------------ */
/*  useMarketplaceTemplate — single template by slug                   */
/* ------------------------------------------------------------------ */

interface UseMarketplaceTemplateReturn {
  template: MarketplaceTemplate | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetch a single marketplace template by slug.
 */
export function useMarketplaceTemplate(
  slug: string | null
): UseMarketplaceTemplateReturn {
  const [template, setTemplate] = useState<MarketplaceTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(!!slug)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!slug) {
      setTemplate(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiFetch<{ template: MarketplaceTemplate }>(
        `${BASE_URL}/${encodeURIComponent(slug)}`
      )
      setTemplate(result.template)
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch template')
      setTemplate(null)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    template,
    isLoading,
    error,
    refetch: fetchData,
  }
}

/* ------------------------------------------------------------------ */
/*  useMarketplaceCategories — category list with counts               */
/* ------------------------------------------------------------------ */

interface UseMarketplaceCategoriesReturn {
  categories: CategoryCount[]
  siteCategories: CategoryCount[]
  componentCategories: CategoryCount[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetch all marketplace categories with their template counts.
 * Splits results into site vs component categories for easy UI rendering.
 */
export function useMarketplaceCategories(): UseMarketplaceCategoriesReturn {
  const [categories, setCategories] = useState<CategoryCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiFetch<{ categories: CategoryCount[] }>(
        `${BASE_URL}?categories=true`
      )
      setCategories(result.categories)
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const siteCategories = categories.filter((c) => c.type === 'site')
  const componentCategories = categories.filter((c) => c.type === 'component')

  return {
    categories,
    siteCategories,
    componentCategories,
    isLoading,
    error,
    refetch: fetchData,
  }
}

/* ------------------------------------------------------------------ */
/*  useTemplateAction — insert a template's blocks into the page       */
/* ------------------------------------------------------------------ */

interface UseTemplateActionReturn {
  /** Call this to "use" a template — fetches its blocks and calls onInsert */
  useTemplate: (slug: string) => Promise<Block[]>
  isLoading: boolean
  error: string | null
}

/**
 * Hook for the "Use this template" action.
 *
 * Calls the `/use` endpoint (which increments the usage counter) and
 * returns the Block[] content. The caller is responsible for inserting
 * the blocks into the editor state.
 *
 * @example
 * ```tsx
 * const { useTemplate, isLoading } = useTemplateAction()
 *
 * const handleUse = async (slug: string) => {
 *   const blocks = await useTemplate(slug)
 *   editorState.insertBlocks(blocks)
 * }
 * ```
 */
export function useTemplateAction(): UseTemplateActionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const useTemplate = useCallback(async (slug: string): Promise<Block[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiFetch<{ blocks: Block[] }>(
        `${BASE_URL}/${encodeURIComponent(slug)}/use`,
        { method: 'POST' }
      )

      return result.blocks
    } catch (err: any) {
      const message = err.message ?? 'Failed to use template'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    useTemplate,
    isLoading,
    error,
  }
}

/* ------------------------------------------------------------------ */
/*  useMarketplaceSearch — debounced search                            */
/* ------------------------------------------------------------------ */

interface UseMarketplaceSearchReturn {
  results: MarketplaceTemplate[]
  isLoading: boolean
  error: string | null
  search: (query: string) => void
  clear: () => void
}

/**
 * Debounced search hook for the marketplace search bar.
 * Waits 300ms after the last keystroke before firing the request.
 */
export function useMarketplaceSearch(
  debounceMs: number = 300
): UseMarketplaceSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MarketplaceTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Empty query = clear results immediately
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    timerRef.current = setTimeout(async () => {
      const fetchId = ++fetchIdRef.current

      try {
        const result = await apiFetch<PaginatedTemplates>(
          `${BASE_URL}?search=${encodeURIComponent(query.trim())}&limit=20`
        )

        if (fetchId === fetchIdRef.current) {
          setResults(result.templates)
          setError(null)
        }
      } catch (err: any) {
        if (fetchId === fetchIdRef.current) {
          setError(err.message ?? 'Search failed')
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, debounceMs])

  const search = useCallback((q: string) => setQuery(q), [])
  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    isLoading,
    error,
    search,
    clear,
  }
}
