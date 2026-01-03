/**
 * VariantGridEditor Component
 * Excel-like variant editor with ACF support
 */

'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { VariantGridCell } from './VariantGridCell'
import { VariantGridToolbar } from './VariantGridToolbar'
import { AddFieldDialog } from './AddFieldDialog'
import { useVariantGrid, useKeyboardNavigation, useClipboard } from './hooks'
import type {
  VariantGridEditorProps,
  GridColumn,
  GridRow,
  VariantApiResponse,
  SaveVariantsRequest,
} from './types'

export function VariantGridEditor({
  productId,
  mode = 'inline',
  maxHeight = 400,
  onDirtyChange,
  onSave,
  onClose,
}: VariantGridEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddField, setShowAddField] = useState(false)

  const {
    state,
    setRows,
    setColumns,
    updateCell,
    selectCell,
    selectRange,
    extendSelection,
    clearSelection,
    startEditing,
    setEditValue,
    commitEdit,
    cancelEdit,
    deleteRows,
    addRow,
    duplicateRows,
    copyRows,
    pasteRows,
    fillDown,
    undo,
    redo,
    markSaved,
    selectedRowIndices,
    isCellSelected,
    isCellActive,
    isCellEditing,
  } = useVariantGrid()

  const clipboard = useClipboard()

  // Initialize keyboard navigation
  useKeyboardNavigation({
    containerRef,
    rows: state.rows,
    columns: state.columns,
    activeCell: state.activeCell,
    editingCell: state.editingCell,
    selectedRowIndices,
    selectCell,
    extendSelection,
    startEditing,
    commitEdit,
    cancelEdit,
    deleteRows,
    duplicateRows,
    copyRows,
    pasteRows: (idx, gen) => pasteRows(idx, gen),
    undo,
    redo,
    fillDown,
  })

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(state.isDirty)
  }, [state.isDirty, onDirtyChange])

  // Fetch variant data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/products/${productId}/variants`)
        if (!response.ok) {
          throw new Error('Failed to load variants')
        }

        const data: VariantApiResponse = await response.json()

        // Build columns from options and custom fields
        const columns: GridColumn[] = []

        // Option columns
        data.options.forEach((option) => {
          columns.push({
            id: `option_${option.name}`,
            type: 'option',
            label: option.name,
            optionId: option.id,
            optionValues: option.values.map((v) => ({ id: v.id, value: v.value })),
            width: 120,
            editable: true,
          })
        })

        // Standard variant fields
        columns.push(
          { id: 'sku', type: 'field', label: 'SKU', width: 120, editable: true },
          { id: 'barcode', type: 'field', label: 'Barcode', width: 120, editable: true },
          { id: 'price', type: 'field', label: 'Price', width: 100, editable: true },
          { id: 'compareAtPrice', type: 'field', label: 'Compare', width: 100, editable: true },
          { id: 'costPrice', type: 'field', label: 'Cost', width: 80, editable: true },
          { id: 'stock', type: 'field', label: 'Stock', width: 70, editable: true },
          { id: 'weight', type: 'field', label: 'Weight', width: 70, editable: true },
          { id: 'enabled', type: 'field', label: 'Active', width: 60, editable: true }
        )

        // Custom field columns
        data.customFields.forEach((field) => {
          columns.push({
            id: `cf_${field.slug}`,
            type: 'custom',
            label: field.name,
            customFieldId: field.id,
            customFieldType: field.type,
            customFieldOptions: field.options as Array<{ value: string; label: string; color?: string }> | undefined,
            validation: field.validation as { min?: number; max?: number; pattern?: string } | undefined,
            required: field.required,
            width: 120,
            editable: true,
          })
        })

        setColumns(columns)

        // Transform variants to grid rows
        const rows: GridRow[] = data.variants.map((variant) => ({
          id: variant.id,
          isNew: false,
          isDirty: false,
          isDeleted: false,
          sku: variant.sku,
          barcode: variant.barcode,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          costPrice: variant.costPrice,
          stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold,
          allowBackorder: variant.allowBackorder,
          weight: variant.weight,
          length: variant.length,
          width: variant.width,
          height: variant.height,
          enabled: variant.enabled,
          imageId: variant.imageId,
          optionValues: variant.optionValues,
          customFields: variant.customFields,
        }))

        setRows(rows)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variants')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId, setRows, setColumns])

  // Save changes
  const handleSave = useCallback(async () => {
    if (!state.isDirty) return

    try {
      setIsSaving(true)
      setError(null)

      // Prepare save request
      const saveRequest: SaveVariantsRequest = {
        variants: state.rows
          .filter((row) => !row.isDeleted)
          .map((row) => ({
            id: row.isNew ? undefined : row.id,
            sku: row.sku ?? undefined,
            barcode: row.barcode ?? undefined,
            price: row.price,
            compareAtPrice: row.compareAtPrice ?? undefined,
            enabled: row.enabled,
            costPrice: row.costPrice ?? undefined,
            stock: row.stock,
            lowStockThreshold: row.lowStockThreshold,
            allowBackorder: row.allowBackorder,
            weight: row.weight ?? undefined,
            length: row.length ?? undefined,
            width: row.width ?? undefined,
            height: row.height ?? undefined,
            imageId: row.imageId ?? undefined,
            optionValues: Object.values(row.optionValues).map((ov) => ov.valueId),
            customFields: Object.entries(row.customFields).map(([, cf]) => ({
              customFieldId: cf.fieldId,
              value: cf.value,
            })),
          })),
        deleteIds: state.rows.filter((row) => row.isDeleted && !row.isNew).map((row) => row.id),
      }

      const response = await fetch(`/api/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequest),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save variants')
      }

      // Remove deleted rows and mark as saved
      const newRows = state.rows.filter((row) => !row.isDeleted)
      setRows(newRows)
      markSaved()
      onSave?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save variants')
    } finally {
      setIsSaving(false)
    }
  }, [state.rows, state.isDirty, productId, setRows, markSaved, onSave])

  // Handle copy rows
  const handleCopyRows = useCallback(() => {
    const rowsToCopy = selectedRowIndices.map((idx) => state.rows[idx])
    clipboard.copyToClipboard(rowsToCopy, state.columns)
    copyRows(selectedRowIndices)
  }, [selectedRowIndices, state.rows, state.columns, clipboard, copyRows])

  // Handle paste rows
  const handlePasteRows = useCallback(() => {
    const afterIndex = selectedRowIndices.length > 0 ? Math.max(...selectedRowIndices) : state.rows.length - 1
    pasteRows(afterIndex, true)
  }, [selectedRowIndices, state.rows.length, pasteRows])

  // Handle add custom field column
  const handleAddColumn = useCallback(
    async (fieldId: string) => {
      try {
        // Add field to product
        await fetch(`/api/products/${productId}/custom-fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldIds: [fieldId] }),
        })

        // Refresh data
        const response = await fetch(`/api/products/${productId}/variants`)
        if (response.ok) {
          const data: VariantApiResponse = await response.json()

          // Find the new field
          const newField = data.customFields.find((f) => f.id === fieldId)
          if (newField) {
            const newColumn: GridColumn = {
              id: `cf_${newField.slug}`,
              type: 'custom',
              label: newField.name,
              customFieldId: newField.id,
              customFieldType: newField.type,
              customFieldOptions: newField.options as Array<{ value: string; label: string; color?: string }> | undefined,
              validation: newField.validation as { min?: number; max?: number; pattern?: string } | undefined,
              required: newField.required,
              width: 120,
              editable: true,
            }
            setColumns([...state.columns, newColumn])
          }
        }
      } catch (err) {
        console.error('Failed to add column:', err)
      }
    },
    [productId, state.columns, setColumns]
  )

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = state.columns.map((c) => c.label).join(',')
    const rows = state.rows
      .filter((row) => !row.isDeleted)
      .map((row) => {
        return state.columns
          .map((col) => {
            let value: unknown
            if (col.id.startsWith('option_')) {
              const optionName = col.id.replace('option_', '')
              value = row.optionValues[optionName]?.value || ''
            } else if (col.id.startsWith('cf_')) {
              const slug = col.id.replace('cf_', '')
              value = row.customFields[slug]?.value ?? ''
            } else {
              value = (row as Record<string, unknown>)[col.id]
            }
            // Escape quotes and wrap in quotes
            const str = String(value ?? '').replace(/"/g, '""')
            return `"${str}"`
          })
          .join(',')
      })
      .join('\n')

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `variants-${productId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [state.columns, state.rows, productId])

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>{error}</p>
        <button
          className="mt-2 text-sm underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  const visibleRows = state.rows.filter((row) => !row.isDeleted)

  return (
    <div
      ref={containerRef}
      className={cn(
        'border rounded-lg overflow-hidden bg-background',
        'focus:outline-none focus-within:ring-1 focus-within:ring-ring'
      )}
      tabIndex={0}
    >
      <VariantGridToolbar
        selectedCount={selectedRowIndices.length}
        hasClipboard={clipboard.hasClipboardContent()}
        canUndo={state.undoStack.length > 0}
        canRedo={state.redoStack.length > 0}
        isDirty={state.isDirty}
        isSaving={isSaving}
        mode={mode}
        onAddRow={() => addRow()}
        onDuplicateSelected={() => duplicateRows(selectedRowIndices)}
        onCopySelected={handleCopyRows}
        onPaste={handlePasteRows}
        onDeleteSelected={() => deleteRows(selectedRowIndices)}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onAddColumn={() => setShowAddField(true)}
        onExportCSV={handleExportCSV}
        onImportCSV={() => {
          /* TODO: Implement import */
        }}
        onExpandModal={mode === 'inline' ? onClose : undefined}
      />

      <div
        className="overflow-auto"
        style={{ maxHeight: mode === 'inline' ? maxHeight : undefined }}
      >
        {/* Grid table */}
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex sticky top-0 z-10 bg-muted border-b">
            {/* Row number column */}
            <div className="w-10 flex-shrink-0 px-2 py-2 text-xs font-medium text-muted-foreground border-r">
              #
            </div>
            {state.columns.map((column) => (
              <div
                key={column.id}
                className="flex-shrink-0 px-2 py-2 text-xs font-medium border-r"
                style={{ width: column.width || 100 }}
              >
                {column.label}
                {column.required && <span className="text-destructive ml-0.5">*</span>}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {visibleRows.map((row, displayIndex) => {
            const actualIndex = state.rows.findIndex((r) => r.id === row.id)
            return (
              <div
                key={row.id}
                className={cn(
                  'flex',
                  row.isNew && 'bg-green-50/30',
                  row.isDirty && !row.isNew && 'bg-yellow-50/30'
                )}
              >
                {/* Row number */}
                <div
                  className={cn(
                    'w-10 flex-shrink-0 px-2 py-2 text-xs text-muted-foreground border-r border-b',
                    'flex items-center justify-center',
                    selectedRowIndices.includes(actualIndex) && 'bg-blue-100'
                  )}
                >
                  {displayIndex + 1}
                </div>
                {/* Cells */}
                {state.columns.map((column) => (
                  <div
                    key={`${row.id}-${column.id}`}
                    style={{ width: column.width || 100 }}
                    className="flex-shrink-0"
                  >
                    <VariantGridCell
                      row={row}
                      column={column}
                      isSelected={isCellSelected(actualIndex, column.id)}
                      isActive={isCellActive(actualIndex, column.id)}
                      isEditing={isCellEditing(actualIndex, column.id)}
                      editValue={state.editValue}
                      onSelect={() => selectCell({ rowIndex: actualIndex, columnId: column.id })}
                      onStartEdit={() => startEditing({ rowIndex: actualIndex, columnId: column.id })}
                      onEditChange={setEditValue}
                      onCommitEdit={commitEdit}
                      onCancelEdit={cancelEdit}
                      onExtendSelection={() =>
                        extendSelection({ rowIndex: actualIndex, columnId: column.id })
                      }
                    />
                  </div>
                ))}
              </div>
            )
          })}

          {/* Empty state */}
          {visibleRows.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No variants yet.</p>
              <button
                className="mt-2 text-sm text-primary underline"
                onClick={() => addRow()}
              >
                Add your first variant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add field dialog */}
      <AddFieldDialog
        open={showAddField}
        onOpenChange={setShowAddField}
        productId={productId}
        existingFieldIds={state.columns
          .filter((c) => c.type === 'custom' && c.customFieldId)
          .map((c) => c.customFieldId!)}
        onAddField={handleAddColumn}
      />
    </div>
  )
}

export default VariantGridEditor
export * from './types'
