/**
 * useAutoFill Hook
 * Smart auto-fill patterns for unique fields like SKU and barcode
 */

import { useCallback } from 'react'
import type { AutoFillPattern, AutoFillConfig, GridRow } from '../types'

/**
 * Generate a unique value based on pattern
 */
export function generateAutoFillValue(
  sourceValue: string,
  pattern: AutoFillPattern,
  index: number,
  config?: Partial<AutoFillConfig>
): string {
  switch (pattern) {
    case 'increment':
      return incrementValue(sourceValue, index)
    case 'uuid':
      return generateShortUuid(config?.prefix)
    case 'template':
      return applyTemplate(config?.template || '{N}', index, config)
    default:
      return sourceValue
  }
}

/**
 * Increment numeric suffix in a string
 * Examples:
 * - "SKU-001" + 1 = "SKU-002"
 * - "PROD-A-10" + 1 = "PROD-A-11"
 * - "abc" + 1 = "abc-1"
 */
function incrementValue(value: string, increment: number): string {
  // Find trailing number pattern
  const match = value.match(/^(.*?)(\d+)$/)

  if (match) {
    const [, prefix, numStr] = match
    const num = parseInt(numStr, 10)
    const newNum = num + increment
    // Preserve leading zeros
    const padded = String(newNum).padStart(numStr.length, '0')
    return `${prefix}${padded}`
  }

  // Check for number with separator
  const separatorMatch = value.match(/^(.+[-_])(\d+)$/)
  if (separatorMatch) {
    const [, prefix, numStr] = separatorMatch
    const num = parseInt(numStr, 10)
    const newNum = num + increment
    const padded = String(newNum).padStart(numStr.length, '0')
    return `${prefix}${padded}`
  }

  // No number found, append one
  return `${value}-${increment}`
}

/**
 * Generate a short UUID (8 characters)
 */
function generateShortUuid(prefix?: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return prefix ? `${prefix}${result}` : result
}

/**
 * Apply a template with placeholders
 * Supported placeholders:
 * - {N} or {NUM} - Sequential number
 * - {UUID} - Short UUID
 * - {DATE} - YYYYMMDD
 * - {TIME} - HHMMSS
 * - {RAND} - Random 4-char alphanumeric
 */
function applyTemplate(
  template: string,
  index: number,
  config?: Partial<AutoFillConfig>
): string {
  const now = new Date()
  const startNum = config?.startFrom ?? 1

  return template
    .replace(/\{N\}/gi, String(startNum + index).padStart(3, '0'))
    .replace(/\{NUM\}/gi, String(startNum + index).padStart(3, '0'))
    .replace(/\{UUID\}/gi, generateShortUuid())
    .replace(/\{DATE\}/gi, now.toISOString().slice(0, 10).replace(/-/g, ''))
    .replace(/\{TIME\}/gi, now.toTimeString().slice(0, 8).replace(/:/g, ''))
    .replace(/\{RAND\}/gi, Math.random().toString(36).slice(2, 6).toUpperCase())
}

/**
 * Detect the pattern type from a value
 */
export function detectPattern(value: string): AutoFillPattern {
  // Check for UUID-like pattern (mostly letters and numbers, no clear numeric suffix)
  if (/^[A-Z0-9]{8,}$/i.test(value) && !/\d+$/.test(value)) {
    return 'uuid'
  }

  // Check for numeric suffix (increment pattern)
  if (/\d+$/.test(value)) {
    return 'increment'
  }

  // Default to increment
  return 'increment'
}

/**
 * Hook for auto-fill operations
 */
export function useAutoFill() {
  /**
   * Generate auto-fill values for a column
   */
  const generateFillValues = useCallback(
    (
      sourceValue: unknown,
      count: number,
      config?: AutoFillConfig
    ): unknown[] => {
      if (typeof sourceValue !== 'string' || !sourceValue) {
        // For non-strings, just repeat the value
        return Array(count).fill(sourceValue)
      }

      const pattern = config?.pattern || detectPattern(sourceValue)

      return Array.from({ length: count }, (_, i) =>
        generateAutoFillValue(sourceValue, pattern, i + 1, config)
      )
    },
    []
  )

  /**
   * Generate unique SKUs for multiple rows
   */
  const generateUniqueSKUs = useCallback(
    (baseSku: string, count: number, startIndex = 1): string[] => {
      return Array.from({ length: count }, (_, i) =>
        incrementValue(baseSku, startIndex + i)
      )
    },
    []
  )

  /**
   * Generate unique barcodes
   */
  const generateUniqueBarcodes = useCallback(
    (prefix = '', count: number): string[] => {
      return Array.from({ length: count }, () => generateShortUuid(prefix))
    },
    []
  )

  /**
   * Fill values from source row to target rows
   */
  const fillFromSource = useCallback(
    (
      sourceRow: GridRow,
      columnId: string,
      targetCount: number,
      config?: AutoFillConfig
    ): unknown[] => {
      // Get source value
      let sourceValue: unknown

      if (columnId.startsWith('option_')) {
        const optionName = columnId.replace('option_', '')
        sourceValue = sourceRow.optionValues[optionName]?.value
      } else if (columnId.startsWith('cf_')) {
        const slug = columnId.replace('cf_', '')
        sourceValue = sourceRow.customFields[slug]?.value
      } else {
        sourceValue = (sourceRow as Record<string, unknown>)[columnId]
      }

      // Check if this is a unique field that needs special handling
      const isUniqueField = columnId === 'sku' || columnId === 'barcode'

      if (!isUniqueField) {
        // Just repeat the value
        return Array(targetCount).fill(sourceValue)
      }

      // Generate unique values
      if (columnId === 'barcode') {
        return generateUniqueBarcodes('', targetCount)
      }

      return generateFillValues(sourceValue, targetCount, config)
    },
    [generateFillValues, generateUniqueBarcodes]
  )

  return {
    generateFillValues,
    generateUniqueSKUs,
    generateUniqueBarcodes,
    fillFromSource,
    detectPattern,
  }
}

export default useAutoFill
