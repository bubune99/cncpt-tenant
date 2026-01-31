import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS merge support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents to currency display
 */
export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

/**
 * Format date using Intl
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-US", options).format(
    typeof date === "string" ? new Date(date) : date
  )
}

/**
 * Format weight from ounces to lb/oz display
 */
export function formatWeight(ounces: number): string {
  const lbs = Math.floor(ounces / 16)
  const oz = ounces % 16
  if (lbs === 0) return `${oz} oz`
  if (oz === 0) return `${lbs} lb`
  return `${lbs} lb ${oz} oz`
}

/**
 * Format dimensions (width x height x depth)
 */
export function formatDimensions(
  width: number,
  height: number,
  depth: number,
  unit = "in"
): string {
  return `${width} x ${height} x ${depth} ${unit}`
}

/**
 * Format slug from string
 */
export function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Generate a random ID
 */
export function generateId(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "object") return Object.keys(value).length === 0
  return false
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert object to URL search params
 */
export function toSearchParams(
  obj: Record<string, string | number | boolean | undefined>
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      params.set(key, String(value))
    }
  }
  return params.toString()
}

/**
 * Generate a UUID v4
 * ChatSDK compatibility alias
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * SWR fetcher utility
 * For use with SWR hooks
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error('Failed to fetch') as Error & { status: number }
    error.status = response.status
    throw error
  }
  return response.json()
}

/**
 * Fetch with error handlers
 * Drop-in replacement for fetch that handles common error cases
 */
export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)

  if (!response.ok) {
    // Clone response to read body for error details
    const clonedResponse = response.clone()
    let errorBody: Record<string, unknown> = {}
    try {
      errorBody = await clonedResponse.json()
    } catch {
      // Ignore JSON parse errors
    }

    const error = new Error(
      (errorBody.message as string) || `HTTP ${response.status}`
    ) as Error & { status: number; code?: string }
    error.status = response.status
    error.code = errorBody.code as string

    throw error
  }

  return response
}

/**
 * Extract text content from a UIMessage
 * ChatSDK utility for message text extraction
 */
export function getTextFromMessage(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return ''
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && !!part.text)
    .map((part) => part.text)
    .join('\n')
}

/**
 * Sanitize text for safe display
 * Removes potentially dangerous characters while preserving content
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  // Basic sanitization - remove control characters except newlines/tabs
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}
