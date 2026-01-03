/**
 * useKeyboardNavigation Hook
 * Handles keyboard navigation and shortcuts for the grid
 */

import { useCallback, useEffect, RefObject } from 'react'
import type { CellPosition, GridColumn, GridRow } from '../types'

interface UseKeyboardNavigationOptions {
  containerRef: RefObject<HTMLDivElement | null>
  rows: GridRow[]
  columns: GridColumn[]
  activeCell: CellPosition | null
  editingCell: CellPosition | null
  selectedRowIndices: number[]
  // Actions
  selectCell: (position: CellPosition) => void
  extendSelection: (position: CellPosition) => void
  startEditing: (position: CellPosition) => void
  commitEdit: () => void
  cancelEdit: () => void
  deleteRows: (indices: number[]) => void
  duplicateRows: (indices: number[]) => void
  copyRows: (indices: number[]) => void
  pasteRows: (afterIndex: number, generateUnique: boolean) => void
  undo: () => void
  redo: () => void
  fillDown: (columnId: string, fromIndex: number, toIndex: number) => void
}

export function useKeyboardNavigation({
  containerRef,
  rows,
  columns,
  activeCell,
  editingCell,
  selectedRowIndices,
  selectCell,
  extendSelection,
  startEditing,
  commitEdit,
  cancelEdit,
  deleteRows,
  duplicateRows,
  copyRows,
  pasteRows,
  undo,
  redo,
  fillDown,
}: UseKeyboardNavigationOptions) {
  // Get next/prev column index
  const getColumnIndex = useCallback(
    (columnId: string) => columns.findIndex((c) => c.id === columnId),
    [columns]
  )

  // Navigate to adjacent cell
  const navigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', extend = false) => {
      if (!activeCell) return

      const { rowIndex, columnId } = activeCell
      const colIndex = getColumnIndex(columnId)
      let newRowIndex = rowIndex
      let newColIndex = colIndex

      switch (direction) {
        case 'up':
          newRowIndex = Math.max(0, rowIndex - 1)
          break
        case 'down':
          newRowIndex = Math.min(rows.length - 1, rowIndex + 1)
          break
        case 'left':
          newColIndex = Math.max(0, colIndex - 1)
          break
        case 'right':
          newColIndex = Math.min(columns.length - 1, colIndex + 1)
          break
      }

      const newPosition: CellPosition = {
        rowIndex: newRowIndex,
        columnId: columns[newColIndex].id,
      }

      if (extend) {
        extendSelection(newPosition)
      } else {
        selectCell(newPosition)
      }
    },
    [activeCell, rows.length, columns, getColumnIndex, selectCell, extendSelection]
  )

  // Tab navigation (wraps to next/prev row)
  const tabNavigate = useCallback(
    (reverse = false) => {
      if (!activeCell) return

      const { rowIndex, columnId } = activeCell
      const colIndex = getColumnIndex(columnId)

      let newRowIndex = rowIndex
      let newColIndex = colIndex

      if (reverse) {
        // Shift+Tab: go left, wrap to previous row
        newColIndex = colIndex - 1
        if (newColIndex < 0) {
          newColIndex = columns.length - 1
          newRowIndex = Math.max(0, rowIndex - 1)
        }
      } else {
        // Tab: go right, wrap to next row
        newColIndex = colIndex + 1
        if (newColIndex >= columns.length) {
          newColIndex = 0
          newRowIndex = Math.min(rows.length - 1, rowIndex + 1)
        }
      }

      selectCell({
        rowIndex: newRowIndex,
        columnId: columns[newColIndex].id,
      })
    },
    [activeCell, rows.length, columns, getColumnIndex, selectCell]
  )

  // Handle keydown events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if focus is in an input that's not part of the grid
      const target = event.target as HTMLElement
      const isInGrid = containerRef.current?.contains(target)
      if (!isInGrid) return

      const { key, ctrlKey, metaKey, shiftKey } = event
      const cmdOrCtrl = ctrlKey || metaKey

      // When editing a cell
      if (editingCell) {
        switch (key) {
          case 'Enter':
            event.preventDefault()
            commitEdit()
            // Move to next row
            if (activeCell && activeCell.rowIndex < rows.length - 1) {
              selectCell({
                rowIndex: activeCell.rowIndex + 1,
                columnId: activeCell.columnId,
              })
            }
            break
          case 'Escape':
            event.preventDefault()
            cancelEdit()
            break
          case 'Tab':
            event.preventDefault()
            commitEdit()
            tabNavigate(shiftKey)
            break
        }
        return
      }

      // When not editing
      switch (key) {
        // Navigation
        case 'ArrowUp':
          event.preventDefault()
          navigate('up', shiftKey)
          break
        case 'ArrowDown':
          event.preventDefault()
          navigate('down', shiftKey)
          break
        case 'ArrowLeft':
          event.preventDefault()
          navigate('left', shiftKey)
          break
        case 'ArrowRight':
          event.preventDefault()
          navigate('right', shiftKey)
          break
        case 'Tab':
          event.preventDefault()
          tabNavigate(shiftKey)
          break

        // Edit
        case 'Enter':
          event.preventDefault()
          if (activeCell) {
            startEditing(activeCell)
          }
          break
        case 'F2':
          event.preventDefault()
          if (activeCell) {
            startEditing(activeCell)
          }
          break

        // Quick type to edit
        default:
          if (
            activeCell &&
            key.length === 1 &&
            !cmdOrCtrl &&
            /[a-zA-Z0-9]/.test(key)
          ) {
            startEditing(activeCell)
            // The key will be captured by the input
          }
          break

        // Actions
        case 'Delete':
        case 'Backspace':
          if (cmdOrCtrl && selectedRowIndices.length > 0) {
            event.preventDefault()
            deleteRows(selectedRowIndices)
          }
          break

        // Copy/Paste
        case 'c':
          if (cmdOrCtrl && selectedRowIndices.length > 0) {
            event.preventDefault()
            copyRows(selectedRowIndices)
          }
          break
        case 'v':
          if (cmdOrCtrl) {
            event.preventDefault()
            const afterIndex =
              selectedRowIndices.length > 0
                ? Math.max(...selectedRowIndices)
                : rows.length - 1
            pasteRows(afterIndex, true)
          }
          break

        // Duplicate
        case 'd':
          if (cmdOrCtrl && selectedRowIndices.length > 0) {
            event.preventDefault()
            duplicateRows(selectedRowIndices)
          }
          break

        // Fill down (Ctrl+D on Mac/Windows style)
        case 'D':
          if (cmdOrCtrl && shiftKey && activeCell && selectedRowIndices.length > 1) {
            event.preventDefault()
            const sortedIndices = [...selectedRowIndices].sort((a, b) => a - b)
            fillDown(
              activeCell.columnId,
              sortedIndices[0],
              sortedIndices[sortedIndices.length - 1]
            )
          }
          break

        // Undo/Redo
        case 'z':
          if (cmdOrCtrl) {
            event.preventDefault()
            if (shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
        case 'y':
          if (cmdOrCtrl) {
            event.preventDefault()
            redo()
          }
          break

        // Select all in column/row
        case 'a':
          if (cmdOrCtrl) {
            // Could implement select all here
            // For now, let default behavior happen
          }
          break
      }
    },
    [
      containerRef,
      editingCell,
      activeCell,
      rows.length,
      selectedRowIndices,
      navigate,
      tabNavigate,
      startEditing,
      commitEdit,
      cancelEdit,
      selectCell,
      deleteRows,
      copyRows,
      pasteRows,
      duplicateRows,
      fillDown,
      undo,
      redo,
    ]
  )

  // Attach event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, handleKeyDown])

  return {
    navigate,
    tabNavigate,
  }
}

export default useKeyboardNavigation
