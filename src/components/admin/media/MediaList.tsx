'use client'

import { MediaRow } from './MediaRow'
import { MediaContextMenu } from './MediaContextMenu'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import { Checkbox } from '../../ui/checkbox'
import { Skeleton } from '../../ui/skeleton'
import type { MediaWithRelations, FolderTree, TagWithCount } from '../../../lib/media/types'

interface MediaListProps {
  media: MediaWithRelations[]
  selectedIds: Set<string>
  folders: FolderTree[]
  tags: TagWithCount[]
  loading: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClick: (media: MediaWithRelations) => void
  onPreview: (media: MediaWithRelations) => void
  onMove: (mediaId: string, folderId: string | null) => void
  onAddTag: (mediaId: string, tagId: string) => void
  onDelete: (mediaId: string) => void
  onRename: (media: MediaWithRelations) => void
  onEditDetails: (media: MediaWithRelations) => void
  onViewUsage: (media: MediaWithRelations) => void
}

export function MediaList({
  media,
  selectedIds,
  folders,
  tags,
  loading,
  onSelect,
  onToggle,
  onSelectAll,
  onClick,
  onPreview,
  onMove,
  onAddTag,
  onDelete,
  onRename,
  onEditDetails,
  onViewUsage,
}: MediaListProps) {
  const allSelected = media.length > 0 && selectedIds.size === media.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < media.length

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No media files found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload files or change your filters
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as any).indeterminate = someSelected
                  }
                }}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {media.map((item) => (
            <MediaContextMenu
              key={item.id}
              media={item}
              folders={folders}
              tags={tags}
              onPreview={() => onPreview(item)}
              onOpenInNewTab={() => window.open(item.url, '_blank')}
              onCopyUrl={() => navigator.clipboard.writeText(item.url)}
              onDownload={() => {
                const a = document.createElement('a')
                a.href = item.url
                a.download = item.filename
                a.click()
              }}
              onRename={() => onRename(item)}
              onEditDetails={() => onEditDetails(item)}
              onMove={(folderId) => onMove(item.id, folderId)}
              onAddTag={(tagId) => onAddTag(item.id, tagId)}
              onViewUsage={() => onViewUsage(item)}
              onDelete={() => onDelete(item.id)}
            >
              <MediaRow
                media={item}
                selected={selectedIds.has(item.id)}
                onSelect={() => onSelect(item.id)}
                onToggle={() => onToggle(item.id)}
                onClick={() => onClick(item)}
              />
            </MediaContextMenu>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
