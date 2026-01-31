/**
 * useVariantGrid Hook
 * Manages grid state, cell selection, and row operations
 */

import { useReducer, useCallback, useMemo } from 'react'
import type {
  GridState,
  GridAction,
  GridRow,
  GridColumn,
  CellPosition,
  CellRange,
} from '../types'
import { generateAutoFillValue } from './useAutoFill'

const MAX_UNDO_STACK = 50

function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'SET_ROWS':
      return {
        ...state,
        rows: action.payload,
        isDirty: false,
        undoStack: [],
        redoStack: [],
      }

    case 'SET_COLUMNS':
      return { ...state, columns: action.payload }

    case 'UPDATE_CELL': {
      const { rowIndex, columnId, value } = action.payload
      const newRows = [...state.rows]
      const row = { ...newRows[rowIndex], isDirty: true }

      // Determine which field to update
      if (columnId.startsWith('option_')) {
        const optionName = columnId.replace('option_', '')
        const column = state.columns.find((c) => c.id === columnId)
        const optionValue = column?.optionValues?.find((v) => v.value === value || v.id === value)
        if (optionValue && column?.optionId) {
          row.optionValues = {
            ...row.optionValues,
            [optionName]: { optionId: column.optionId, valueId: optionValue.id, value: optionValue.value },
          }
        }
      } else if (columnId.startsWith('cf_')) {
        const slug = columnId.replace('cf_', '')
        const column = state.columns.find((c) => c.id === columnId)
        if (column?.customFieldId) {
          row.customFields = {
            ...row.customFields,
            [slug]: { fieldId: column.customFieldId, type: column.customFieldType || 'TEXT', value },
          }
        }
      } else {
        // Standard field
        ;(row as Record<string, unknown>)[columnId] = value
      }

      newRows[rowIndex] = row

      return {
        ...state,
        rows: newRows,
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'SELECT_CELL':
      return {
        ...state,
        selectedCells: [action.payload],
        activeCell: action.payload,
        editingCell: null,
      }

    case 'SELECT_RANGE': {
      const cells = getCellsInRange(action.payload, state.rows.length, state.columns)
      return {
        ...state,
        selectedCells: cells,
        activeCell: action.payload.start,
        editingCell: null,
      }
    }

    case 'EXTEND_SELECTION': {
      if (!state.activeCell) return state
      const range: CellRange = { start: state.activeCell, end: action.payload }
      const cells = getCellsInRange(range, state.rows.length, state.columns)
      return { ...state, selectedCells: cells }
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedCells: [], activeCell: null, editingCell: null }

    case 'START_EDITING': {
      const cell = action.payload
      const row = state.rows[cell.rowIndex]
      const currentValue = getCellValue(row, cell.columnId, state.columns)
      return {
        ...state,
        editingCell: cell,
        activeCell: cell,
        selectedCells: [cell],
        editValue: currentValue?.toString() ?? '',
      }
    }

    case 'SET_EDIT_VALUE':
      return { ...state, editValue: action.payload }

    case 'COMMIT_EDIT': {
      if (!state.editingCell) return state
      const { rowIndex, columnId } = state.editingCell
      const column = state.columns.find((c) => c.id === columnId)
      const parsedValue = parseValue(state.editValue, column)

      const newRows = [...state.rows]
      const row = { ...newRows[rowIndex], isDirty: true }

      if (columnId.startsWith('option_')) {
        const optionName = columnId.replace('option_', '')
        const optionValue = column?.optionValues?.find((v) => v.value === parsedValue || v.id === parsedValue)
        if (optionValue && column?.optionId) {
          row.optionValues = {
            ...row.optionValues,
            [optionName]: { optionId: column.optionId, valueId: optionValue.id, value: optionValue.value },
          }
        }
      } else if (columnId.startsWith('cf_')) {
        const slug = columnId.replace('cf_', '')
        if (column?.customFieldId) {
          row.customFields = {
            ...row.customFields,
            [slug]: { fieldId: column.customFieldId, type: column.customFieldType || 'TEXT', value: parsedValue },
          }
        }
      } else {
        ;(row as Record<string, unknown>)[columnId] = parsedValue
      }

      newRows[rowIndex] = row

      return {
        ...state,
        rows: newRows,
        editingCell: null,
        editValue: '',
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'CANCEL_EDIT':
      return { ...state, editingCell: null, editValue: '' }

    case 'DELETE_ROWS': {
      const newRows = state.rows.map((row, index) =>
        action.payload.includes(index) ? { ...row, isDeleted: true, isDirty: true } : row
      )
      return {
        ...state,
        rows: newRows,
        selectedCells: [],
        activeCell: null,
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'ADD_ROW': {
      const newRow: GridRow = {
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        isNew: true,
        isDirty: true,
        sku: null,
        barcode: null,
        price: 0,
        compareAtPrice: null,
        costPrice: null,
        stock: 0,
        lowStockThreshold: 5,
        allowBackorder: false,
        weight: null,
        length: null,
        width: null,
        height: null,
        enabled: true,
        imageId: null,
        optionValues: {},
        customFields: {},
        ...action.payload,
      }
      return {
        ...state,
        rows: [...state.rows, newRow],
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'DUPLICATE_ROWS': {
      const duplicates = action.payload.map((index) => {
        const original = state.rows[index]
        return {
          ...original,
          id: `new_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          isNew: true,
          isDirty: true,
          sku: original.sku ? generateAutoFillValue(original.sku, 'increment', 1) : null,
          barcode: null, // Always generate new
        }
      })
      return {
        ...state,
        rows: [...state.rows, ...duplicates],
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'COPY_ROWS': {
      const clipboardRows = action.payload.map((index) => ({ ...state.rows[index] }))
      return { ...state, clipboardRows }
    }

    case 'PASTE_ROWS': {
      if (state.clipboardRows.length === 0) return state
      const { afterIndex, generateUnique } = action.payload

      const pastedRows = state.clipboardRows.map((row, i) => ({
        ...row,
        id: `new_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
        isNew: true,
        isDirty: true,
        sku: generateUnique && row.sku ? generateAutoFillValue(row.sku, 'increment', i + 1) : row.sku,
        barcode: generateUnique ? null : row.barcode,
      }))

      const newRows = [
        ...state.rows.slice(0, afterIndex + 1),
        ...pastedRows,
        ...state.rows.slice(afterIndex + 1),
      ]

      return {
        ...state,
        rows: newRows,
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'FILL_DOWN': {
      const { columnId, fromIndex, toIndex } = action.payload
      const sourceRow = state.rows[fromIndex]
      const sourceValue = getCellValue(sourceRow, columnId, state.columns)

      const newRows = [...state.rows]
      const column = state.columns.find((c) => c.id === columnId)
      const isUniqueField = columnId === 'sku' || columnId === 'barcode'

      for (let i = fromIndex + 1; i <= toIndex; i++) {
        const row = { ...newRows[i], isDirty: true }
        let fillValue = sourceValue

        // Generate unique values for SKU/barcode
        if (isUniqueField && typeof sourceValue === 'string' && sourceValue) {
          fillValue = generateAutoFillValue(sourceValue, 'increment', i - fromIndex)
        }

        if (columnId.startsWith('option_')) {
          const optionName = columnId.replace('option_', '')
          row.optionValues = { ...row.optionValues, [optionName]: sourceRow.optionValues[optionName] }
        } else if (columnId.startsWith('cf_')) {
          const slug = columnId.replace('cf_', '')
          const cfValue = sourceRow.customFields[slug]
          if (cfValue) {
            row.customFields = {
              ...row.customFields,
              [slug]: { ...cfValue, value: fillValue },
            }
          }
        } else {
          ;(row as Record<string, unknown>)[columnId] = fillValue
        }

        newRows[i] = row
      }

      return {
        ...state,
        rows: newRows,
        isDirty: true,
        undoStack: [[...state.rows], ...state.undoStack.slice(0, MAX_UNDO_STACK - 1)],
        redoStack: [],
      }
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state
      const [previousRows, ...restUndo] = state.undoStack
      return {
        ...state,
        rows: previousRows,
        undoStack: restUndo,
        redoStack: [[...state.rows], ...state.redoStack],
        isDirty: restUndo.length > 0,
      }
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state
      const [nextRows, ...restRedo] = state.redoStack
      return {
        ...state,
        rows: nextRows,
        redoStack: restRedo,
        undoStack: [[...state.rows], ...state.undoStack],
        isDirty: true,
      }
    }

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        rows: state.rows.map((row) => ({
          ...row,
          isDirty: false,
          isNew: false,
          isDeleted: row.isDeleted ? true : false, // Keep deleted rows marked for cleanup
        })),
      }

    default:
      return state
  }
}

// Helper: Get all cells in a selection range
function getCellsInRange(range: CellRange, rowCount: number, columns: GridColumn[]): CellPosition[] {
  const minRow = Math.min(range.start.rowIndex, range.end.rowIndex)
  const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex)

  const columnIds = columns.map((c) => c.id)
  const startColIndex = columnIds.indexOf(range.start.columnId)
  const endColIndex = columnIds.indexOf(range.end.columnId)
  const minCol = Math.min(startColIndex, endColIndex)
  const maxCol = Math.max(startColIndex, endColIndex)

  const cells: CellPosition[] = []
  for (let row = minRow; row <= maxRow && row < rowCount; row++) {
    for (let col = minCol; col <= maxCol && col < columnIds.length; col++) {
      cells.push({ rowIndex: row, columnId: columnIds[col] })
    }
  }
  return cells
}

// Helper: Get cell value from row
function getCellValue(row: GridRow, columnId: string, columns: GridColumn[]): unknown {
  if (columnId.startsWith('option_')) {
    const optionName = columnId.replace('option_', '')
    return row.optionValues[optionName]?.value || ''
  }
  if (columnId.startsWith('cf_')) {
    const slug = columnId.replace('cf_', '')
    return row.customFields[slug]?.value ?? ''
  }
  return (row as Record<string, unknown>)[columnId]
}

// Helper: Parse input value based on column type
function parseValue(value: string, column?: GridColumn): unknown {
  if (!column) return value

  if (column.type === 'field') {
    switch (column.id) {
      case 'price':
      case 'compareAtPrice':
      case 'costPrice':
      case 'stock':
      case 'weight':
      case 'lowStockThreshold':
        const num = parseFloat(value)
        return isNaN(num) ? 0 : num
      case 'enabled':
      case 'allowBackorder':
        return value === 'true' || value === '1'
      default:
        return value
    }
  }

  if (column.customFieldType) {
    switch (column.customFieldType) {
      case 'NUMBER':
        const num = parseFloat(value)
        return isNaN(num) ? null : num
      case 'BOOLEAN':
        return value === 'true' || value === '1'
      default:
        return value
    }
  }

  return value
}

// Initial state factory
function createInitialState(): GridState {
  return {
    rows: [],
    columns: [],
    selectedCells: [],
    activeCell: null,
    editingCell: null,
    editValue: '',
    clipboardRows: [],
    isDirty: false,
    undoStack: [],
    redoStack: [],
  }
}

// Hook
export function useVariantGrid() {
  const [state, dispatch] = useReducer(gridReducer, null, createInitialState)

  const setRows = useCallback((rows: GridRow[]) => {
    dispatch({ type: 'SET_ROWS', payload: rows })
  }, [])

  const setColumns = useCallback((columns: GridColumn[]) => {
    dispatch({ type: 'SET_COLUMNS', payload: columns })
  }, [])

  const updateCell = useCallback((rowIndex: number, columnId: string, value: unknown) => {
    dispatch({ type: 'UPDATE_CELL', payload: { rowIndex, columnId, value } })
  }, [])

  const selectCell = useCallback((position: CellPosition) => {
    dispatch({ type: 'SELECT_CELL', payload: position })
  }, [])

  const selectRange = useCallback((range: CellRange) => {
    dispatch({ type: 'SELECT_RANGE', payload: range })
  }, [])

  const extendSelection = useCallback((position: CellPosition) => {
    dispatch({ type: 'EXTEND_SELECTION', payload: position })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])

  const startEditing = useCallback((position: CellPosition) => {
    dispatch({ type: 'START_EDITING', payload: position })
  }, [])

  const setEditValue = useCallback((value: string) => {
    dispatch({ type: 'SET_EDIT_VALUE', payload: value })
  }, [])

  const commitEdit = useCallback(() => {
    dispatch({ type: 'COMMIT_EDIT' })
  }, [])

  const cancelEdit = useCallback(() => {
    dispatch({ type: 'CANCEL_EDIT' })
  }, [])

  const deleteRows = useCallback((indices: number[]) => {
    dispatch({ type: 'DELETE_ROWS', payload: indices })
  }, [])

  const addRow = useCallback((initialData?: Partial<GridRow>) => {
    dispatch({ type: 'ADD_ROW', payload: initialData })
  }, [])

  const duplicateRows = useCallback((indices: number[]) => {
    dispatch({ type: 'DUPLICATE_ROWS', payload: indices })
  }, [])

  const copyRows = useCallback((indices: number[]) => {
    dispatch({ type: 'COPY_ROWS', payload: indices })
  }, [])

  const pasteRows = useCallback((afterIndex: number, generateUnique = true) => {
    dispatch({ type: 'PASTE_ROWS', payload: { afterIndex, generateUnique } })
  }, [])

  const fillDown = useCallback((columnId: string, fromIndex: number, toIndex: number) => {
    dispatch({ type: 'FILL_DOWN', payload: { columnId, fromIndex, toIndex } })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const markSaved = useCallback(() => {
    dispatch({ type: 'MARK_SAVED' })
  }, [])

  // Get unique selected row indices
  const selectedRowIndices = useMemo(() => {
    return [...new Set(state.selectedCells.map((c) => c.rowIndex))]
  }, [state.selectedCells])

  // Check if a cell is selected
  const isCellSelected = useCallback(
    (rowIndex: number, columnId: string) => {
      return state.selectedCells.some(
        (c) => c.rowIndex === rowIndex && c.columnId === columnId
      )
    },
    [state.selectedCells]
  )

  // Check if a cell is the active cell
  const isCellActive = useCallback(
    (rowIndex: number, columnId: string) => {
      return state.activeCell?.rowIndex === rowIndex && state.activeCell?.columnId === columnId
    },
    [state.activeCell]
  )

  // Check if a cell is being edited
  const isCellEditing = useCallback(
    (rowIndex: number, columnId: string) => {
      return state.editingCell?.rowIndex === rowIndex && state.editingCell?.columnId === columnId
    },
    [state.editingCell]
  )

  return {
    state,
    // Setters
    setRows,
    setColumns,
    // Cell operations
    updateCell,
    selectCell,
    selectRange,
    extendSelection,
    clearSelection,
    startEditing,
    setEditValue,
    commitEdit,
    cancelEdit,
    // Row operations
    deleteRows,
    addRow,
    duplicateRows,
    copyRows,
    pasteRows,
    fillDown,
    // History
    undo,
    redo,
    markSaved,
    // Helpers
    selectedRowIndices,
    isCellSelected,
    isCellActive,
    isCellEditing,
  }
}
