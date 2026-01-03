'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FolderTree } from '@/lib/media/types'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Clock,
  Image,
  FolderPlus,
} from 'lucide-react'

interface MediaFolderTreeProps {
  folders: FolderTree[]
  selectedFolderId: string | null | undefined
  onSelectFolder: (folderId: string | null | undefined) => void
  onCreateFolder: () => void
}

interface FolderNodeProps {
  folder: FolderTree
  selectedFolderId: string | null | undefined
  onSelect: (folderId: string) => void
  depth?: number
}

function FolderNode({
  folder,
  selectedFolderId,
  onSelect,
  depth = 0,
}: FolderNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = selectedFolderId === folder.id
  const FolderIcon = expanded ? FolderOpen : Folder

  return (
    <div>
      <button
        onClick={() => onSelect(folder.id)}
        className={cn(
          'w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <FolderIcon
          className="h-4 w-4 text-muted-foreground flex-shrink-0"
          style={folder.color ? { color: folder.color } : undefined}
        />
        <span className="truncate flex-1 text-left">{folder.name}</span>
        {folder.mediaCount !== undefined && folder.mediaCount > 0 && (
          <span className="text-xs text-muted-foreground">{folder.mediaCount}</span>
        )}
      </button>

      {expanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MediaFolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
}: MediaFolderTreeProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Folders</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Recent */}
          <button
            onClick={() => onSelectFolder(undefined)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
              selectedFolderId === undefined && 'bg-accent'
            )}
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Recent</span>
          </button>

          {/* All */}
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
              selectedFolderId === null && 'bg-accent'
            )}
          >
            <Image className="h-4 w-4 text-muted-foreground" />
            <span>All Media</span>
          </button>

          {/* Folder tree */}
          {folders.length > 0 && (
            <div className="pt-2 mt-2 border-t">
              {folders.map((folder) => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  selectedFolderId={selectedFolderId}
                  onSelect={onSelectFolder}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onCreateFolder}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>
    </div>
  )
}
