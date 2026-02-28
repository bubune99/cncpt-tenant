"use client"

import { useEffect, useCallback } from "react"
import type { Block } from "@/lib/cms/block-editor/types"

interface EditorShortcutsEditor {
  state: {
    blocks: Block[]
    selectedBlockId: string | null
    clipboard: Block | null
  }
  undo: () => void
  redo: () => void
  copyBlock: (id: string) => void
  pasteBlock: (parentId?: string | null, index?: number) => void
  removeBlock: (id: string) => void
  duplicateBlock: (id: string) => void
  moveBlock: (blockId: string, targetParentId: string | null, targetIndex: number) => void
  selectBlock: (id: string | null) => void
  getParentBlock: (id: string) => Block | null
  getBlockById: (id: string) => Block | null
  wrapInContainer: (blockId: string) => void
  unwrapContainer: (blockId: string) => void
  pasteStyle: (targetId: string) => void
}

interface UseEditorShortcutsOptions {
  editor: EditorShortcutsEditor
  enabled?: boolean
}

/**
 * Global keyboard shortcuts for the block editor.
 * Skips when focus is inside an input, textarea, or contentEditable.
 */
export function useEditorShortcuts({ editor, enabled = true }: UseEditorShortcutsOptions) {
  const {
    state,
    undo,
    redo,
    copyBlock,
    pasteBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    getParentBlock,
    getBlockById,
    wrapInContainer,
    unwrapContainer,
    pasteStyle,
  } = editor

  const selectedId = state.selectedBlockId

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when inside editable elements
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const isMod = e.ctrlKey || e.metaKey
      const isShift = e.shiftKey
      const isAlt = e.altKey
      const key = e.key.toLowerCase()

      // Undo: Ctrl+Z
      if (isMod && !isShift && key === "z") {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((isMod && key === "y") || (isMod && isShift && key === "z")) {
        e.preventDefault()
        redo()
        return
      }

      // Copy: Ctrl+C
      if (isMod && !isShift && key === "c" && selectedId) {
        e.preventDefault()
        copyBlock(selectedId)
        return
      }

      // Cut: Ctrl+X
      if (isMod && !isShift && key === "x" && selectedId) {
        e.preventDefault()
        copyBlock(selectedId)
        removeBlock(selectedId)
        return
      }

      // Paste: Ctrl+V
      if (isMod && !isShift && key === "v") {
        e.preventDefault()
        // Paste after selected block's parent position, or at root if nothing selected
        if (selectedId) {
          const parent = getParentBlock(selectedId)
          const block = getBlockById(selectedId)
          if (parent && parent.children) {
            const idx = parent.children.findIndex((b) => b.id === selectedId)
            pasteBlock(parent.id, idx + 1)
          } else if (block) {
            // It's a root block, paste at root after it
            const rootIdx = state.blocks.findIndex((b) => b.id === selectedId)
            pasteBlock(null, rootIdx + 1)
          } else {
            pasteBlock(null)
          }
        } else {
          pasteBlock(null)
        }
        return
      }

      // Paste Style: Ctrl+Shift+V
      if (isMod && isShift && key === "v" && selectedId) {
        e.preventDefault()
        pasteStyle(selectedId)
        return
      }

      // Duplicate: Ctrl+D
      if (isMod && !isShift && key === "d" && selectedId) {
        e.preventDefault()
        duplicateBlock(selectedId)
        return
      }

      // Delete: Delete or Backspace
      if ((key === "delete" || key === "backspace") && selectedId) {
        e.preventDefault()
        removeBlock(selectedId)
        return
      }

      // Deselect: Escape
      if (key === "escape") {
        e.preventDefault()
        selectBlock(null)
        return
      }

      // Group in Container: Ctrl+G
      if (isMod && !isShift && key === "g" && selectedId) {
        e.preventDefault()
        wrapInContainer(selectedId)
        return
      }

      // Ungroup / Unwrap: Ctrl+Shift+G
      if (isMod && isShift && key === "g" && selectedId) {
        e.preventDefault()
        unwrapContainer(selectedId)
        return
      }

      // Move Up: Alt+ArrowUp
      if (isAlt && key === "arrowup" && selectedId) {
        e.preventDefault()
        const parent = getParentBlock(selectedId)
        const siblings = parent ? parent.children || [] : state.blocks
        const idx = siblings.findIndex((b) => b.id === selectedId)
        if (idx > 0) {
          moveBlock(selectedId, parent?.id ?? null, idx - 1)
        }
        return
      }

      // Move Down: Alt+ArrowDown
      if (isAlt && key === "arrowdown" && selectedId) {
        e.preventDefault()
        const parent = getParentBlock(selectedId)
        const siblings = parent ? parent.children || [] : state.blocks
        const idx = siblings.findIndex((b) => b.id === selectedId)
        if (idx < siblings.length - 1) {
          moveBlock(selectedId, parent?.id ?? null, idx + 2) // +2 because we need to go after the next one
        }
        return
      }
    },
    [
      selectedId,
      state.blocks,
      undo,
      redo,
      copyBlock,
      pasteBlock,
      removeBlock,
      duplicateBlock,
      moveBlock,
      selectBlock,
      getParentBlock,
      getBlockById,
      wrapInContainer,
      unwrapContainer,
      pasteStyle,
    ]
  )

  useEffect(() => {
    if (!enabled) return
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [enabled, handleKeyDown])
}
