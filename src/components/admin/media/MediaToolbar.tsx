'use client'

import { Button } from '../../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { Input } from '../../ui/input'
import { LayoutGrid, List, Upload, Search, SlidersHorizontal } from 'lucide-react'
import type { ViewMode, MediaType, MediaFilters } from '../../../lib/media/types'

interface MediaToolbarProps {
  viewMode: ViewMode
  filters: MediaFilters
  onViewModeChange: (mode: ViewMode) => void
  onSearch: (search: string) => void
  onTypeFilter: (type: MediaType | undefined) => void
  onSortChange: (sortBy: MediaFilters['sortBy'], sortOrder: MediaFilters['sortOrder']) => void
  onUpload: () => void
}

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
] as const

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'size-desc', label: 'Largest first' },
  { value: 'size-asc', label: 'Smallest first' },
] as const

export function MediaToolbar({
  viewMode,
  filters,
  onViewModeChange,
  onSearch,
  onTypeFilter,
  onSortChange,
  onUpload,
}: MediaToolbarProps) {
  const currentSort = `${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={filters.search || ''}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-8 w-[200px]"
          />
        </div>

        {/* Type filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) =>
            onTypeFilter(value === 'all' ? undefined : (value as MediaType))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={currentSort}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-') as [
              MediaFilters['sortBy'],
              MediaFilters['sortOrder']
            ]
            onSortChange(sortBy, sortOrder)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 items-center">
        {/* View mode toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Upload button */}
        <Button onClick={onUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>
    </div>
  )
}
