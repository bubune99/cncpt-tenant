"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditor, type ViewedFile } from "@/lib/cms/block-editor/editor-context"
import {
  buildFileTree,
  isDirectory,
  type VirtualFile,
  type VirtualDirectory,
} from "@/lib/cms/block-editor/virtual-fs"
import type { SavedPage } from "@/lib/cms/block-editor/storage"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import { Button } from "@/components/cms/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/cms/ui/context-menu"
import { cn } from "@/lib/cms/utils"
import {
  Folder,
  FolderOpen,
  FileCode2,
  ChevronRight,
  Copy,
  Trash2,
  Edit3,
  Files,
  Circle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

interface FileTreeNodeProps {
  node: VirtualFile | VirtualDirectory
  depth: number
  currentPageId: string | null
  viewedFilePath: string | null
  onFileClick: (file: VirtualFile) => void
  expandedDirs: Set<string>
  toggleDir: (path: string) => void
}

function FileTreeNode({
  node,
  depth,
  currentPageId,
  viewedFilePath,
  onFileClick,
  expandedDirs,
  toggleDir,
}: FileTreeNodeProps) {
  const isDir = isDirectory(node)
  const isExpanded = isDir && expandedDirs.has(node.path)
  const isCurrentFile = !isDir && node.source.id === currentPageId
  const isViewedFile = !isDir && node.path === viewedFilePath

  const handleClick = () => {
    if (isDir) {
      toggleDir(node.path)
    } else {
      onFileClick(node as VirtualFile)
    }
  }

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(node.path)
    toast.success("Path copied to clipboard")
  }, [node.path])

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "w-full flex items-center gap-1.5 py-1 px-2 text-sm rounded-sm",
              "hover:bg-accent/50 transition-colors text-left",
              isCurrentFile && "bg-accent text-accent-foreground font-medium",
              isViewedFile && !isCurrentFile && "bg-blue-500/10 text-blue-400"
            )}
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            {isDir ? (
              <>
                <ChevronRight
                  size={12}
                  className={cn(
                    "shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
                {isExpanded ? (
                  <FolderOpen size={14} className="shrink-0 text-amber-500" />
                ) : (
                  <Folder size={14} className="shrink-0 text-amber-500" />
                )}
              </>
            ) : (
              <>
                <span className="w-3" />
                <FileCode2 size={14} className="shrink-0 text-blue-400" />
              </>
            )}
            <span className="truncate flex-1">
              {isDir ? node.name : node.path.split("/").pop()}
            </span>
            {!isDir && (node as VirtualFile).isDirty && (
              <Circle size={6} className="shrink-0 fill-amber-500 text-amber-500" />
            )}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {!isDir && (
            <>
              <ContextMenuItem onClick={() => onFileClick(node as VirtualFile)}>
                <FileCode2 size={14} className="mr-2" />
                Open
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleCopyPath}>
            <Copy size={14} className="mr-2" />
            Copy Path
          </ContextMenuItem>
          {!isDir && !(node as VirtualFile).isReadOnly && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem disabled>
                <Edit3 size={14} className="mr-2" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem disabled>
                <Files size={14} className="mr-2" />
                Duplicate
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled className="text-destructive">
                <Trash2 size={14} className="mr-2" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isDir &&
        isExpanded &&
        (node as VirtualDirectory).children.map((child) => (
          <FileTreeNode
            key={isDirectory(child) ? child.path : (child as VirtualFile).path}
            node={child}
            depth={depth + 1}
            currentPageId={currentPageId}
            viewedFilePath={viewedFilePath}
            onFileClick={onFileClick}
            expandedDirs={expandedDirs}
            toggleDir={toggleDir}
          />
        ))}
    </>
  )
}

interface FileTreePanelProps {
  onRequestCodeView?: () => void
}

export function FileTreePanel({ onRequestCodeView }: FileTreePanelProps) {
  const { state, loadPage, openFile, getPages } = useEditor()
  const [tree, setTree] = useState<VirtualDirectory | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    new Set(["src", "src/pages", "src/blocks"])
  )

  const refreshTree = useCallback(async () => {
    const pages = await getPages()
    setTree(buildFileTree(pages))
  }, [getPages])

  useEffect(() => {
    refreshTree()
  }, [refreshTree])

  // Refresh tree when current page changes
  useEffect(() => {
    refreshTree()
  }, [state.currentPage, refreshTree])

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const handleFileClick = useCallback(
    (file: VirtualFile) => {
      // Convert VirtualFile to ViewedFile for the code panel
      const viewedFile: ViewedFile = {
        path: file.path,
        content: file.content,
        title: file.source.title,
        isReadOnly: file.isReadOnly,
        sourceType: file.source.type,
        sourceId: file.source.id,
      }

      openFile(viewedFile)
      onRequestCodeView?.()

      // If it's a page, also load it for visual editing
      if (file.source.type === "page" && file.source.id) {
        loadPage(file.source.id)
      } else if (file.source.type === "template") {
        toast.info("Custom templates — editing in code panel")
      } else if (file.source.type === "component") {
        toast.info(`${file.source.title} is a built-in block (read-only)`, {
          description: "Drag it from the palette to use it",
        })
      }
    },
    [loadPage, openFile, onRequestCodeView]
  )

  const currentPageId = state.currentPage?.id || null
  const viewedFilePath = state.viewedFile?.path || null

  return (
    <div
      className="w-72 border-r flex flex-col"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-medium text-foreground">Files</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshTree}
          className="h-6 w-6 p-0"
          title="Refresh"
        >
          <RefreshCw size={12} />
        </Button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {tree &&
            tree.children.map((child) => (
              <FileTreeNode
                key={isDirectory(child) ? child.path : (child as VirtualFile).path}
                node={child}
                depth={0}
                currentPageId={currentPageId}
                viewedFilePath={viewedFilePath}
                onFileClick={handleFileClick}
                expandedDirs={expandedDirs}
                toggleDir={toggleDir}
              />
            ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div
        className="px-3 py-2 border-t text-xs text-muted-foreground"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-1">
          <FileCode2 size={10} />
          <span>Click a file to open in code panel</span>
        </div>
      </div>
    </div>
  )
}
