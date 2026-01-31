'use client'

import { MediaCard } from './MediaCard'
import { MediaContextMenu } from './MediaContextMenu'
import type { MediaWithRelations, FolderTree, TagWithCount } from '@/lib/cms/media/types'
import { Skeleton } from '../../ui/skeleton'

interface MediaGridProps {
  media: MediaWithRelations[]
  selectedIds: Set<string>
  folders: FolderTree[]
  tags: TagWithCount[]
  loading: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onClick: (media: MediaWithRelations) => void
  onPreview: (media: MediaWithRelations) => void
  onMove: (mediaId: string, folderId: string | null) => void
  onAddTag: (mediaId: string, tagId: string) => void
  onDelete: (mediaId: string) => void
  onRename: (media: MediaWithRelations) => void
  onEditDetails: (media: MediaWithRelations) => void
  onViewUsage: (media: MediaWithRelations) => void
}

export function MediaGrid({
  media,
  selectedIds,
  folders,
  tags,
  loading,
  onSelect,
  onToggle,
  onClick,
  onPreview,
  onMove,
  onAddTag,
  onDelete,
  onRename,
  onEditDetails,
  onViewUsage,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
          <MediaCard
            media={item}
            selected={selectedIds.has(item.id)}
            onSelect={() => onSelect(item.id)}
            onToggle={() => onToggle(item.id)}
            onClick={() => onClick(item)}
          />
        </MediaContextMenu>
      ))}
    </div>
  )
}
