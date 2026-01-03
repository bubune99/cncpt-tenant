/**
 * Variant Grid Editor Types
 */

import type { CustomFieldType } from '@prisma/client'

// Cell position in the grid
export interface CellPosition {
  rowIndex: number
  columnId: string
}

// Cell selection range
export interface CellRange {
  start: CellPosition
  end: CellPosition
}

// Column definition
export interface GridColumn {
  id: string
  type: 'option' | 'field' | 'custom'
  label: string
  width?: number
  minWidth?: number
  editable?: boolean
  required?: boolean
  // For option columns
  optionId?: string
  optionValues?: { id: string; value: string }[]
  // For custom field columns
  customFieldId?: string
  customFieldType?: CustomFieldType
  customFieldOptions?: Array<{ value: string; label: string; color?: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// Standard variant fields
export type StandardFieldId =
  | 'sku'
  | 'barcode'
  | 'price'
  | 'compareAtPrice'
  | 'costPrice'
  | 'stock'
  | 'weight'
  | 'enabled'

// Row data structure
export interface GridRow {
  [key: string]: unknown // Index signature for dynamic access
  id: string
  isNew?: boolean
  isDirty?: boolean
  isDeleted?: boolean
  // Standard fields
  sku: string | null
  barcode: string | null
  price: number
  compareAtPrice: number | null
  costPrice: number | null
  stock: number
  lowStockThreshold: number
  allowBackorder: boolean
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  enabled: boolean
  imageId: string | null
  // Option values: { [optionName]: { valueId, value } }
  optionValues: Record<string, { optionId: string; valueId: string; value: string }>
  // Custom field values: { [slug]: { fieldId, type, value } }
  customFields: Record<string, { fieldId: string; type: string; value: unknown }>
}

// Grid state
export interface GridState {
  rows: GridRow[]
  columns: GridColumn[]
  selectedCells: CellPosition[]
  activeCell: CellPosition | null
  editingCell: CellPosition | null
  editValue: string
  clipboardRows: GridRow[]
  isDirty: boolean
  undoStack: GridRow[][]
  redoStack: GridRow[][]
}

// Grid actions
export type GridAction =
  | { type: 'SET_ROWS'; payload: GridRow[] }
  | { type: 'SET_COLUMNS'; payload: GridColumn[] }
  | { type: 'UPDATE_CELL'; payload: { rowIndex: number; columnId: string; value: unknown } }
  | { type: 'SELECT_CELL'; payload: CellPosition }
  | { type: 'SELECT_RANGE'; payload: CellRange }
  | { type: 'EXTEND_SELECTION'; payload: CellPosition }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'START_EDITING'; payload: CellPosition }
  | { type: 'SET_EDIT_VALUE'; payload: string }
  | { type: 'COMMIT_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'DELETE_ROWS'; payload: number[] }
  | { type: 'ADD_ROW'; payload?: Partial<GridRow> }
  | { type: 'DUPLICATE_ROWS'; payload: number[] }
  | { type: 'COPY_ROWS'; payload: number[] }
  | { type: 'PASTE_ROWS'; payload: { afterIndex: number; generateUnique: boolean } }
  | { type: 'FILL_DOWN'; payload: { columnId: string; fromIndex: number; toIndex: number } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_SAVED' }

// Auto-fill pattern types
export type AutoFillPattern = 'increment' | 'uuid' | 'template'

export interface AutoFillConfig {
  pattern: AutoFillPattern
  template?: string // e.g., "PROD-{COLOR}-{SIZE}-{N}"
  startFrom?: number
  prefix?: string
  suffix?: string
}

// Column auto-fill settings
export interface ColumnAutoFill {
  columnId: string
  config: AutoFillConfig
}

// Variant Grid Editor props
export interface VariantGridEditorProps {
  productId: string
  mode: 'inline' | 'modal'
  maxHeight?: number
  onDirtyChange?: (isDirty: boolean) => void
  onSave?: () => void
  onClose?: () => void
}

// API response types
export interface VariantApiResponse {
  productId: string
  productTitle: string
  variants: Array<{
    id: string
    sku: string | null
    barcode: string | null
    price: number
    compareAtPrice: number | null
    enabled: boolean
    costPrice: number | null
    stock: number
    lowStockThreshold: number
    allowBackorder: boolean
    weight: number | null
    length: number | null
    width: number | null
    height: number | null
    imageId: string | null
    image: { id: string; url: string; alt: string | null } | null
    stripePriceId: string | null
    createdAt: string
    updatedAt: string
    optionValues: Record<string, { optionId: string; valueId: string; value: string }>
    customFields: Record<string, { fieldId: string; type: string; value: unknown }>
  }>
  options: Array<{
    id: string
    name: string
    position: number
    values: Array<{ id: string; value: string; position: number }>
  }>
  customFields: Array<{
    id: string
    name: string
    slug: string
    type: CustomFieldType
    options: unknown
    defaultValue: unknown
    required: boolean
    validation: unknown
  }>
  total: number
}

export interface SaveVariantsRequest {
  variants: Array<{
    id?: string
    sku?: string
    barcode?: string
    price: number
    compareAtPrice?: number
    enabled?: boolean
    costPrice?: number
    stock?: number
    lowStockThreshold?: number
    allowBackorder?: boolean
    weight?: number
    length?: number
    width?: number
    height?: number
    imageId?: string
    optionValues?: string[]
    customFields?: Array<{ customFieldId: string; value: unknown }>
  }>
  deleteIds?: string[]
}
