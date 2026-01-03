'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { getMediaType, formatFileSize, getMediaTypeIcon } from '@/lib/media/types'
import type { MediaWithRelations } from '@/lib/media/types'
import {
  FileText,
  Film,
  Music,
  ImageIcon,
  File,
  MoreVertical,
} from 'lucide-react'

interface MediaCardProps {
  media: MediaWithRelations
  selected: boolean
  onSelect: () => void
  onToggle: () => void
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

const typeIcons = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  document: FileText,
  other: File,
}

export const MediaCard = forwardRef<HTMLDivElement, MediaCardProps>(
  ({ media, selected, onSelect, onToggle, onClick, onContextMenu }, ref) => {
    const mediaType = getMediaType(media.mimeType)
    const Icon = typeIcons[mediaType]

    return (
      <div
        ref={ref}
        className={cn(
          'group relative bg-card rounded-lg border cursor-pointer transition-all hover:shadow-md',
          selected && 'ring-2 ring-primary'
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        {/* Selection checkbox */}
        <div
          className={cn(
            'absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity',
            selected && 'opacity-100'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle()}
            className="bg-background/80 backdrop-blur-sm"
          />
        </div>

        {/* Thumbnail */}
        <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
          {mediaType === 'image' ? (
            <Image
              src={media.url}
              alt={media.alt || media.filename}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Type badge for non-images */}
          {mediaType !== 'image' && (
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 text-xs"
            >
              {media.mimeType.split('/')[1]?.toUpperCase() || mediaType}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="font-medium text-sm truncate" title={media.title || media.filename}>
            {media.title || media.filename}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatFileSize(media.size)}
            {media.width && media.height && (
              <span className="ml-2">
                {media.width} × {media.height}
              </span>
            )}
          </p>

          {/* Tags */}
          {media.tags && media.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {media.tags.slice(0, 3).map((tagRelation) => (
                <Badge
                  key={tagRelation.tag.id}
                  variant="outline"
                  className="text-xs py-0"
                  style={
                    tagRelation.tag.color
                      ? { borderColor: tagRelation.tag.color }
                      : undefined
                  }
                >
                  {tagRelation.tag.name}
                </Badge>
              ))}
              {media.tags.length > 3 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{media.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

MediaCard.displayName = 'MediaCard'
