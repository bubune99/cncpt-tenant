'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import { cn } from '../../../lib/utils'
import { Checkbox } from '../../ui/checkbox'
import { Badge } from '../../ui/badge'
import { TableCell, TableRow } from '../../ui/table'
import { getMediaType, formatFileSize } from '../../../lib/media/types'
import type { MediaWithRelations } from '../../../lib/media/types'
import { format } from 'date-fns'
import {
  FileText,
  Film,
  Music,
  ImageIcon,
  File,
  MoreVertical,
} from 'lucide-react'

interface MediaRowProps {
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

export const MediaRow = forwardRef<HTMLTableRowElement, MediaRowProps>(
  ({ media, selected, onSelect, onToggle, onClick, onContextMenu }, ref) => {
    const mediaType = getMediaType(media.mimeType)
    const Icon = typeIcons[mediaType]

    return (
      <TableRow
        ref={ref}
        className={cn('cursor-pointer', selected && 'bg-accent')}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={() => onToggle()} />
        </TableCell>

        <TableCell className="w-12">
          <div className="w-10 h-10 relative bg-muted rounded overflow-hidden">
            {mediaType === 'image' ? (
              <Image
                src={media.url}
                alt={media.alt || media.filename}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div>
            <p className="font-medium truncate max-w-[200px]">
              {media.title || media.filename}
            </p>
            <p className="text-xs text-muted-foreground">{media.filename}</p>
          </div>
        </TableCell>

        <TableCell>
          <Badge variant="outline" className="text-xs">
            {mediaType}
          </Badge>
        </TableCell>

        <TableCell className="text-muted-foreground">
          {formatFileSize(media.size)}
        </TableCell>

        <TableCell className="text-muted-foreground">
          {media.width && media.height
            ? `${media.width} × ${media.height}`
            : '-'}
        </TableCell>

        <TableCell>
          {media.tags && media.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {media.tags.slice(0, 2).map((tagRelation) => (
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
              {media.tags.length > 2 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{media.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </TableCell>

        <TableCell className="text-muted-foreground text-sm">
          {format(new Date(media.createdAt), 'MMM d, yyyy')}
        </TableCell>
      </TableRow>
    )
  }
)

MediaRow.displayName = 'MediaRow'
