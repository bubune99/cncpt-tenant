'use client'

import { useState, useCallback, useEffect } from 'react'
import type {
  MediaWithRelations,
  MediaFilters,
  ViewMode,
  MediaType,
  FolderTree,
  TagWithCount,
} from '@/lib/cms/media/types'

interface UseMediaState {
  media: MediaWithRelations[]
  folders: FolderTree[]
  tags: TagWithCount[]
  selectedIds: Set<string>
  viewMode: ViewMode
  filters: MediaFilters
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseMediaActions {
  fetchMedia: () => Promise<void>
  fetchFolders: () => Promise<void>
  fetchTags: () => Promise<void>
  setViewMode: (mode: ViewMode) => void
  setFilters: (filters: Partial<MediaFilters>) => void
  setPage: (page: number) => void
  selectItem: (id: string) => void
  toggleItem: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  deleteSelected: (hard?: boolean) => Promise<void>
  moveSelected: (folderId: string | null) => Promise<void>
  tagSelected: (tagIds: string[]) => Promise<void>
  refreshAll: () => Promise<void>
}

const DEFAULT_FILTERS: MediaFilters = {
  page: 1,
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  includeDeleted: false,
}

export function useMedia(): UseMediaState & UseMediaActions {
  const [media, setMedia] = useState<MediaWithRelations[]>([])
  const [folders, setFolders] = useState<FolderTree[]>([])
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewModeState] = useState<ViewMode>('grid')
  const [filters, setFiltersState] = useState<MediaFilters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Load view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('media-view-mode')
    if (saved === 'grid' || saved === 'list') {
      setViewModeState(saved)
    }
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem('media-view-mode', mode)
  }, [])

  const setFilters = useCallback((newFilters: Partial<MediaFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }))
  }, [])

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.folderId !== undefined) {
        params.set('folderId', filters.folderId === null ? 'null' : filters.folderId)
      }
      if (filters.type) params.set('type', filters.type)
      if (filters.search) params.set('search', filters.search)
      if (filters.tagIds?.length) params.set('tagIds', filters.tagIds.join(','))
      if (filters.includeDeleted) params.set('includeDeleted', 'true')
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/media?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const data = await response.json()

      // Ensure we always set an array, even if API returns an error object
      // API returns { media: [...] } so check for data.media first, then data.items for backwards compatibility
      const mediaItems = Array.isArray(data.media) ? data.media : Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []
      setMedia(mediaItems)
      setPagination({
        page: data.page || 1,
        limit: data.limit || 50,
        total: data.total || mediaItems.length || 0,
        totalPages: data.totalPages || 1,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media')
      setMedia([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/media/folders?tree=true')

      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }

      const data = await response.json()
      // Ensure we always set an array, even if API returns an error object
      setFolders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch folders:', err)
      setFolders([])
    }
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/media/tags')

      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }

      const data = await response.json()
      // Ensure we always set an array, even if API returns an error object
      setTags(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch tags:', err)
      setTags([])
    }
  }, [])

  const selectItem = useCallback((id: string) => {
    setSelectedIds(new Set([id]))
  }, [])

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(media.map((m) => m.id)))
  }, [media])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const deleteSelected = useCallback(
    async (hard = false) => {
      if (selectedIds.size === 0) return

      try {
        const response = await fetch('/api/media/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'delete',
            mediaIds: Array.from(selectedIds),
            hard,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete media')
        }

        clearSelection()
        await fetchMedia()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete media')
      }
    },
    [selectedIds, clearSelection, fetchMedia]
  )

  const moveSelected = useCallback(
    async (folderId: string | null) => {
      if (selectedIds.size === 0) return

      try {
        const response = await fetch('/api/media/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'move',
            mediaIds: Array.from(selectedIds),
            folderId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to move media')
        }

        clearSelection()
        await fetchMedia()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move media')
      }
    },
    [selectedIds, clearSelection, fetchMedia]
  )

  const tagSelected = useCallback(
    async (tagIds: string[]) => {
      if (selectedIds.size === 0 || tagIds.length === 0) return

      try {
        const response = await fetch('/api/media/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'tag',
            mediaIds: Array.from(selectedIds),
            tagIds,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to tag media')
        }

        clearSelection()
        await fetchMedia()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to tag media')
      }
    },
    [selectedIds, clearSelection, fetchMedia]
  )

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMedia(), fetchFolders(), fetchTags()])
  }, [fetchMedia, fetchFolders, fetchTags])

  // Fetch on filter change
  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  // Initial load
  useEffect(() => {
    fetchFolders()
    fetchTags()
  }, [fetchFolders, fetchTags])

  return {
    media,
    folders,
    tags,
    selectedIds,
    viewMode,
    filters,
    loading,
    error,
    pagination,
    fetchMedia,
    fetchFolders,
    fetchTags,
    setViewMode,
    setFilters,
    setPage,
    selectItem,
    toggleItem,
    selectAll,
    clearSelection,
    deleteSelected,
    moveSelected,
    tagSelected,
    refreshAll,
  }
}
