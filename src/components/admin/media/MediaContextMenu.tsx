'use client'

import { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { MediaWithRelations, FolderTree, TagWithCount } from '@/lib/media/types'
import {
  Eye,
  ExternalLink,
  Copy,
  Download,
  Pencil,
  FolderInput,
  Tags,
  FileSearch,
  Trash,
  FolderIcon,
  Tag,
} from 'lucide-react'

interface MediaContextMenuProps {
  children: React.ReactNode
  media: MediaWithRelations
  folders: FolderTree[]
  tags: TagWithCount[]
  onPreview: () => void
  onOpenInNewTab: () => void
  onCopyUrl: () => void
  onDownload: () => void
  onRename: () => void
  onEditDetails: () => void
  onMove: (folderId: string | null) => void
  onAddTag: (tagId: string) => void
  onViewUsage: () => void
  onDelete: () => void
}

export function MediaContextMenu({
  children,
  media,
  folders,
  tags,
  onPreview,
  onOpenInNewTab,
  onCopyUrl,
  onDownload,
  onRename,
  onEditDetails,
  onMove,
  onAddTag,
  onViewUsage,
  onDelete,
}: MediaContextMenuProps) {
  const existingTagIds = new Set(media.tags?.map((t) => t.tag.id) || [])

  const renderFolderOptions = (folders: FolderTree[], depth = 0) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <ContextMenuItem
          onClick={() => onMove(folder.id)}
          disabled={media.folderId === folder.id}
        >
          <span style={{ paddingLeft: depth * 12 }}>
            <FolderIcon className="mr-2 h-4 w-4 inline" />
            {folder.name}
          </span>
        </ContextMenuItem>
        {folder.children &&
          folder.children.length > 0 &&
          renderFolderOptions(folder.children, depth + 1)}
      </div>
    ))
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onPreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </ContextMenuItem>
        <ContextMenuItem onClick={onOpenInNewTab}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in new tab
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopyUrl}>
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </ContextMenuItem>
        <ContextMenuItem onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={onEditDetails}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit details
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="mr-2 h-4 w-4" />
            Move to folder
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 max-h-64 overflow-y-auto">
            <ContextMenuItem
              onClick={() => onMove(null)}
              disabled={media.folderId === null}
            >
              <FolderIcon className="mr-2 h-4 w-4" />
              Root (No folder)
            </ContextMenuItem>
            <ContextMenuSeparator />
            {folders.length > 0 ? (
              renderFolderOptions(folders)
            ) : (
              <ContextMenuItem disabled>No folders available</ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Tags className="mr-2 h-4 w-4" />
            Add tags
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 max-h-64 overflow-y-auto">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <ContextMenuItem
                  key={tag.id}
                  onClick={() => onAddTag(tag.id)}
                  disabled={existingTagIds.has(tag.id)}
                >
                  <Tag
                    className="mr-2 h-4 w-4"
                    style={tag.color ? { color: tag.color } : undefined}
                  />
                  {tag.name}
                  {existingTagIds.has(tag.id) && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Added
                    </span>
                  )}
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled>No tags available</ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onViewUsage}>
          <FileSearch className="mr-2 h-4 w-4" />
          View usage
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
