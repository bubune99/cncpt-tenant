/**
 * VariantGridCell Component
 * Renders individual cells based on column type
 */

'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Input } from '../../ui/input'
import { Checkbox } from '../../ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { cn } from '../../../lib/utils'
import type { GridColumn, GridRow } from './types'

interface VariantGridCellProps {
  row: GridRow
  column: GridColumn
  isSelected: boolean
  isActive: boolean
  isEditing: boolean
  editValue: string
  onSelect: () => void
  onStartEdit: () => void
  onEditChange: (value: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onExtendSelection: () => void
}

export function VariantGridCell({
  row,
  column,
  isSelected,
  isActive,
  isEditing,
  editValue,
  onSelect,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onExtendSelection,
}: VariantGridCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Get current cell value
  const getValue = (): unknown => {
    if (column.id.startsWith('option_')) {
      const optionName = column.id.replace('option_', '')
      return row.optionValues[optionName]?.value || ''
    }
    if (column.id.startsWith('cf_')) {
      const slug = column.id.replace('cf_', '')
      return row.customFields[slug]?.value ?? ''
    }
    return (row as Record<string, unknown>)[column.id]
  }

  const value = getValue()

  // Handle double-click to edit
  const handleDoubleClick = () => {
    if (column.editable !== false) {
      onStartEdit()
    }
  }

  // Handle click to select
  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      onExtendSelection()
    } else {
      onSelect()
    }
  }

  // Handle mouse down for drag selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      onSelect()
    }
  }

  const handleMouseEnter = () => {
    if (isDragging) {
      onExtendSelection()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Render editing input
  if (isEditing) {
    return renderEditInput()
  }

  // Render display value
  return (
    <div
      className={cn(
        'h-9 px-2 flex items-center cursor-default border-r border-b text-sm',
        'transition-colors duration-75',
        isActive && 'ring-2 ring-inset ring-blue-500',
        isSelected && !isActive && 'bg-blue-50',
        row.isDeleted && 'opacity-50 line-through',
        row.isDirty && !row.isNew && 'bg-yellow-50/50'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
    >
      {renderDisplayValue()}
    </div>
  )

  function renderEditInput() {
    // Boolean fields
    if (column.id === 'enabled' || column.id === 'allowBackorder' || column.customFieldType === 'BOOLEAN') {
      return (
        <div className="h-9 px-2 flex items-center border-r border-b bg-white ring-2 ring-inset ring-blue-500">
          <Checkbox
            checked={editValue === 'true' || editValue === '1'}
            onCheckedChange={(checked) => {
              onEditChange(checked ? 'true' : 'false')
              onCommitEdit()
            }}
          />
        </div>
      )
    }

    // Select fields (options or SELECT/MULTISELECT custom fields)
    if (column.type === 'option' || column.customFieldType === 'SELECT') {
      const options = column.optionValues || column.customFieldOptions || []
      return (
        <div className="h-9 border-r border-b bg-white ring-2 ring-inset ring-blue-500">
          <Select
            value={editValue}
            onValueChange={(val) => {
              onEditChange(val)
              onCommitEdit()
            }}
          >
            <SelectTrigger className="h-9 border-0 rounded-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {'label' in opt ? opt.label : opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Color picker
    if (column.customFieldType === 'COLOR') {
      return (
        <div className="h-9 px-2 flex items-center gap-2 border-r border-b bg-white ring-2 ring-inset ring-blue-500">
          <input
            type="color"
            value={editValue || '#000000'}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onCommitEdit}
            className="w-6 h-6 cursor-pointer border-0"
          />
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitEdit()
              if (e.key === 'Escape') onCancelEdit()
            }}
            className="flex-1 h-7 px-1 text-sm border-0 focus:ring-0"
          />
        </div>
      )
    }

    // Number fields
    if (
      column.customFieldType === 'NUMBER' ||
      ['price', 'compareAtPrice', 'costPrice', 'stock', 'weight', 'lowStockThreshold'].includes(column.id)
    ) {
      return (
        <div className="h-9 border-r border-b bg-white ring-2 ring-inset ring-blue-500">
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitEdit()
              if (e.key === 'Escape') onCancelEdit()
            }}
            min={column.validation?.min}
            max={column.validation?.max}
            className="h-9 px-2 text-sm border-0 rounded-none focus:ring-0"
          />
        </div>
      )
    }

    // Default text input
    return (
      <div className="h-9 border-r border-b bg-white ring-2 ring-inset ring-blue-500">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitEdit()
            if (e.key === 'Escape') onCancelEdit()
          }}
          className="h-9 px-2 text-sm border-0 rounded-none focus:ring-0"
        />
      </div>
    )
  }

  function renderDisplayValue() {
    // Boolean values
    if (column.id === 'enabled' || column.id === 'allowBackorder' || column.customFieldType === 'BOOLEAN') {
      return (
        <Checkbox
          checked={value === true || value === 'true'}
          disabled
          className="pointer-events-none"
        />
      )
    }

    // Color swatch
    if (column.customFieldType === 'COLOR' && typeof value === 'string' && value) {
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs text-muted-foreground">{value}</span>
        </div>
      )
    }

    // Price fields - format as currency
    if (['price', 'compareAtPrice', 'costPrice'].includes(column.id)) {
      const numValue = typeof value === 'number' ? value : 0
      // Display in dollars (assuming cents stored)
      return <span>${(numValue / 100).toFixed(2)}</span>
    }

    // Select options - show label if available
    if (column.customFieldType === 'SELECT' && column.customFieldOptions) {
      const option = column.customFieldOptions.find((o) => o.value === value)
      if (option?.color) {
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: option.color }}
            />
            <span>{option.label || option.value}</span>
          </div>
        )
      }
      return <span>{option?.label || value?.toString() || ''}</span>
    }

    // Default display
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>
    }

    return <span className="truncate">{String(value)}</span>
  }
}

export default VariantGridCell
