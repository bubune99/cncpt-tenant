'use client'

import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import type { FolderTree, TagWithCount } from '@/lib/cms/media/types'
import {
  X,
  FolderInput,
  Tags,
  Trash,
  FolderIcon,
  Tag,
  MoreHorizontal,
} from 'lucide-react'

interface MediaBulkActionsProps {
  selectedCount: number
  folders: FolderTree[]
  tags: TagWithCount[]
  onClearSelection: () => void
  onMove: (folderId: string | null) => void
  onTag: (tagIds: string[]) => void
  onDelete: () => void
}

export function MediaBulkActions({
  selectedCount,
  folders,
  tags,
  onClearSelection,
  onMove,
  onTag,
  onDelete,
}: MediaBulkActionsProps) {
  if (selectedCount === 0) return null

  const renderFolderOptions = (folders: FolderTree[], depth = 0): React.ReactNode[] => {
    return folders.flatMap((folder) => [
      <DropdownMenuItem key={folder.id} onClick={() => onMove(folder.id)}>
        <span style={{ paddingLeft: depth * 12 }}>
          <FolderIcon className="mr-2 h-4 w-4 inline" />
          {folder.name}
        </span>
      </DropdownMenuItem>,
      ...(folder.children && folder.children.length > 0
        ? renderFolderOptions(folder.children, depth + 1)
        : []),
    ])
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Move to folder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderInput className="h-4 w-4 mr-2" />
              Move
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
            <DropdownMenuItem onClick={() => onMove(null)}>
              <FolderIcon className="mr-2 h-4 w-4" />
              Root (No folder)
            </DropdownMenuItem>
            {folders.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {renderFolderOptions(folders)}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add tags */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Tags className="h-4 w-4 mr-2" />
              Tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <DropdownMenuItem key={tag.id} onClick={() => onTag([tag.id])}>
                  <Tag
                    className="mr-2 h-4 w-4"
                    style={tag.color ? { color: tag.color } : undefined}
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
