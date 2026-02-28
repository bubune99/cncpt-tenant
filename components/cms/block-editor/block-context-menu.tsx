"use client"

import type { ReactNode } from "react"
import type { Block } from "@/lib/cms/block-editor/types"
import { isContainerTag } from "@/lib/cms/block-editor/types"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { exportBlockToJSX, exportBlockToJSON } from "@/lib/cms/block-editor/serialization"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/cms/ui/context-menu"
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Paintbrush,
  CopyPlus,
  Trash2,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Code2,
  Braces,
  CornerLeftUp,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react"

interface BlockContextMenuProps {
  block: Block
  parentId: string | null
  index: number
  children: ReactNode
}

export function BlockContextMenu({ block, parentId, index, children }: BlockContextMenuProps) {
  const {
    state,
    copyBlock,
    pasteBlock,
    pasteStyle,
    removeBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    getParentBlock,
    wrapInContainer,
    unwrapContainer,
    updateBlock,
  } = useEditor()

  const hasClipboard = state.clipboard !== null
  const isContainer = isContainerTag(block.tag) || !!block.children
  const hasChildren = isContainer && block.children && block.children.length > 0
  const parent = getParentBlock(block.id)
  const siblings = parent ? parent.children || [] : state.blocks
  const isFirst = index === 0
  const isLast = index === siblings.length - 1

  // Find container blocks that this block could move into
  const containerTargets = siblings.filter(
    (b) => b.id !== block.id && (isContainerTag(b.tag) || !!b.children)
  )

  const handleCut = () => {
    copyBlock(block.id)
    removeBlock(block.id)
  }

  const handleCopy = () => {
    copyBlock(block.id)
  }

  const handlePaste = () => {
    if (isContainer) {
      pasteBlock(block.id, 0)
    } else {
      pasteBlock(parentId, index + 1)
    }
  }

  const handlePasteStyle = () => {
    pasteStyle(block.id)
  }

  const handleDuplicate = () => {
    duplicateBlock(block.id)
  }

  const handleDelete = () => {
    removeBlock(block.id)
  }

  const handleGroup = () => {
    wrapInContainer(block.id)
  }

  const handleUngroup = () => {
    unwrapContainer(block.id)
  }

  const handleMoveUp = () => {
    if (!isFirst) {
      moveBlock(block.id, parentId, index - 1)
    }
  }

  const handleMoveDown = () => {
    if (!isLast) {
      moveBlock(block.id, parentId, index + 2)
    }
  }

  const handleMoveInto = (targetId: string) => {
    const target = siblings.find((b) => b.id === targetId)
    if (target) {
      moveBlock(block.id, targetId, target.children?.length || 0)
    }
  }

  const handleCopyAsJSX = async () => {
    const jsx = exportBlockToJSX(block)
    await navigator.clipboard.writeText(jsx)
  }

  const handleCopyAsJSON = async () => {
    const json = exportBlockToJSON(block)
    await navigator.clipboard.writeText(json)
  }

  const handleSelectParent = () => {
    if (parent) {
      selectBlock(parent.id)
    } else {
      selectBlock(null)
    }
  }

  const handleToggleVisibility = () => {
    updateBlock(block.id, { hidden: !block.hidden })
  }

  const handleToggleLock = () => {
    updateBlock(block.id, { locked: !block.locked })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Cut / Copy / Paste */}
        <ContextMenuItem onClick={handleCut}>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste} disabled={!hasClipboard}>
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePasteStyle} disabled={!hasClipboard}>
          <Paintbrush className="mr-2 h-4 w-4" />
          Paste Style
          <ContextMenuShortcut>Ctrl+Shift+V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Duplicate / Delete */}
        <ContextMenuItem onClick={handleDuplicate}>
          <CopyPlus className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Group / Ungroup */}
        <ContextMenuItem onClick={handleGroup}>
          <Group className="mr-2 h-4 w-4" />
          Group in Container
          <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleUngroup} disabled={!hasChildren}>
          <Ungroup className="mr-2 h-4 w-4" />
          Unwrap / Ungroup
          <ContextMenuShortcut>Ctrl+Shift+G</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Move Up / Down */}
        <ContextMenuItem onClick={handleMoveUp} disabled={isFirst}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Move Up
          <ContextMenuShortcut>Alt+Up</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleMoveDown} disabled={isLast}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Move Down
          <ContextMenuShortcut>Alt+Down</ContextMenuShortcut>
        </ContextMenuItem>

        {/* Move Into submenu */}
        {containerTargets.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderInput className="mr-2 h-4 w-4" />
              Move Into
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {containerTargets.map((target) => (
                <ContextMenuItem key={target.id} onClick={() => handleMoveInto(target.id)}>
                  <span className="font-mono text-xs mr-2">{"<"}{target.tag}{">"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {target.textContent?.slice(0, 20) || `[${target.children?.length || 0} children]`}
                  </span>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        <ContextMenuSeparator />

        {/* Copy as JSX / JSON */}
        <ContextMenuItem onClick={handleCopyAsJSX}>
          <Code2 className="mr-2 h-4 w-4" />
          Copy as JSX
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyAsJSON}>
          <Braces className="mr-2 h-4 w-4" />
          Copy as JSON
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Hide / Lock */}
        <ContextMenuItem onClick={handleToggleVisibility}>
          {block.hidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleToggleLock}>
          {block.locked ? (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Select Parent */}
        <ContextMenuItem onClick={handleSelectParent} disabled={!parent}>
          <CornerLeftUp className="mr-2 h-4 w-4" />
          Select Parent
          <ContextMenuShortcut>Esc</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
