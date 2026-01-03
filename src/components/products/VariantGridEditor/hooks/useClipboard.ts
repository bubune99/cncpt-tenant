/**
 * useClipboard Hook
 * Handles copy/paste operations with system clipboard integration
 */

import { useCallback, useState } from 'react'
import type { GridRow, GridColumn } from '../types'

interface ClipboardData {
  rows: GridRow[]
  columns: string[] // Column IDs that were copied
  timestamp: number
}

export function useClipboard() {
  const [internalClipboard, setInternalClipboard] = useState<ClipboardData | null>(null)

  /**
   * Copy rows to clipboard (both internal and system)
   */
  const copyToClipboard = useCallback(
    async (rows: GridRow[], columns: GridColumn[]) => {
      // Store internally for paste operations
      const clipboardData: ClipboardData = {
        rows: rows.map((row) => ({ ...row })),
        columns: columns.map((c) => c.id),
        timestamp: Date.now(),
      }
      setInternalClipboard(clipboardData)

      // Also copy to system clipboard as TSV (tab-separated values)
      try {
        const headers = columns.map((c) => c.label).join('\t')
        const rowsText = rows
          .map((row) => {
            return columns
              .map((col) => {
                if (col.id.startsWith('option_')) {
                  const optionName = col.id.replace('option_', '')
                  return row.optionValues[optionName]?.value || ''
                }
                if (col.id.startsWith('cf_')) {
                  const slug = col.id.replace('cf_', '')
                  const value = row.customFields[slug]?.value
                  return value != null ? String(value) : ''
                }
                const value = (row as Record<string, unknown>)[col.id]
                return value != null ? String(value) : ''
              })
              .join('\t')
          })
          .join('\n')

        const text = `${headers}\n${rowsText}`
        await navigator.clipboard.writeText(text)
      } catch (err) {
        console.warn('Could not copy to system clipboard:', err)
      }

      return clipboardData
    },
    []
  )

  /**
   * Parse clipboard text into row data
   */
  const parseClipboardText = useCallback(
    (text: string, columns: GridColumn[]): Partial<GridRow>[] | null => {
      const lines = text.trim().split('\n')
      if (lines.length === 0) return null

      // Try to detect if first line is headers
      const firstLine = lines[0].split('\t')
      const hasHeaders = columns.some((col) =>
        firstLine.some((cell) => cell.toLowerCase() === col.label.toLowerCase())
      )

      const dataLines = hasHeaders ? lines.slice(1) : lines
      const columnOrder = hasHeaders
        ? firstLine.map((header) => {
            const col = columns.find(
              (c) => c.label.toLowerCase() === header.toLowerCase()
            )
            return col?.id || null
          })
        : columns.map((c) => c.id)

      return dataLines.map((line) => {
        const cells = line.split('\t')
        const row: Partial<GridRow> = {
          optionValues: {},
          customFields: {},
        }

        cells.forEach((cell, index) => {
          const columnId = columnOrder[index]
          if (!columnId) return

          if (columnId.startsWith('option_')) {
            const optionName = columnId.replace('option_', '')
            const column = columns.find((c) => c.id === columnId)
            const optionValue = column?.optionValues?.find(
              (v) => v.value.toLowerCase() === cell.toLowerCase() || v.id === cell
            )
            if (optionValue && column?.optionId) {
              row.optionValues![optionName] = {
                optionId: column.optionId,
                valueId: optionValue.id,
                value: optionValue.value,
              }
            }
          } else if (columnId.startsWith('cf_')) {
            const slug = columnId.replace('cf_', '')
            const column = columns.find((c) => c.id === columnId)
            if (column?.customFieldId) {
              row.customFields![slug] = {
                fieldId: column.customFieldId,
                type: column.customFieldType || 'TEXT',
                value: cell,
              }
            }
          } else {
            // Standard field - parse appropriately
            switch (columnId) {
              case 'price':
              case 'compareAtPrice':
              case 'costPrice':
              case 'stock':
              case 'weight':
              case 'lowStockThreshold':
                const num = parseFloat(cell)
                ;(row as Record<string, unknown>)[columnId] = isNaN(num) ? 0 : num
                break
              case 'enabled':
              case 'allowBackorder':
                ;(row as Record<string, unknown>)[columnId] =
                  cell.toLowerCase() === 'true' || cell === '1'
                break
              default:
                ;(row as Record<string, unknown>)[columnId] = cell
            }
          }
        })

        return row
      })
    },
    []
  )

  /**
   * Read from system clipboard and parse
   */
  const readFromClipboard = useCallback(
    async (columns: GridColumn[]): Promise<Partial<GridRow>[] | null> => {
      try {
        const text = await navigator.clipboard.readText()
        if (!text) return null
        return parseClipboardText(text, columns)
      } catch (err) {
        console.warn('Could not read from system clipboard:', err)
        // Fall back to internal clipboard
        if (internalClipboard) {
          return internalClipboard.rows.map((row) => ({ ...row }))
        }
        return null
      }
    },
    [internalClipboard, parseClipboardText]
  )

  /**
   * Get internal clipboard data
   */
  const getInternalClipboard = useCallback(() => {
    return internalClipboard
  }, [internalClipboard])

  /**
   * Check if clipboard has content
   */
  const hasClipboardContent = useCallback(() => {
    return internalClipboard !== null && internalClipboard.rows.length > 0
  }, [internalClipboard])

  /**
   * Clear clipboard
   */
  const clearClipboard = useCallback(() => {
    setInternalClipboard(null)
  }, [])

  return {
    copyToClipboard,
    readFromClipboard,
    parseClipboardText,
    getInternalClipboard,
    hasClipboardContent,
    clearClipboard,
  }
}

export default useClipboard
