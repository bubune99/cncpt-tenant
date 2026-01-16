/**
 * MCP Utility Functions
 *
 * Token optimization and response helpers for MCP tools.
 */

/**
 * Compact JSON response - removes whitespace for ~30-40% token savings
 */
export function compactJson(data: unknown): string {
  return JSON.stringify(data)
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(
  str: string | null | undefined,
  maxLength: number
): string | null {
  if (!str) return null
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + "..."
}

/**
 * Pick only specified fields from an object
 */
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): Partial<T> {
  const result: Partial<T> = {}
  for (const field of fields) {
    if (field in obj) {
      result[field as keyof T] = obj[field as keyof T]
    }
  }
  return result
}

/**
 * Standard MCP response wrapper - always compact
 */
export function mcpResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: compactJson(data) }]
  }
}

/**
 * Standard MCP error response
 */
export function mcpError(message: string) {
  return {
    content: [{ type: "text" as const, text: compactJson({ error: message }) }]
  }
}

// Default pagination limits
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

/**
 * Normalize pagination parameters
 */
export function normalizePagination(
  limit?: number,
  offset?: number
): { limit: number; offset: number } {
  return {
    limit: Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT),
    offset: offset || 0
  }
}
