/**
 * Unified API Types
 *
 * Standardized response envelope with `ok` discriminant for TypeScript narrowing.
 * Used by both server-side response helpers and client-side fetch/hooks.
 */

/* ------------------------------------------------------------------ */
/*  Error Codes                                                        */
/* ------------------------------------------------------------------ */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"

/** Map error codes to HTTP status codes */
export const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

/* ------------------------------------------------------------------ */
/*  Response Envelopes                                                 */
/* ------------------------------------------------------------------ */

export interface ApiSuccessResponse<T> {
  ok: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiListResponse<T> {
  ok: true
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ApiErrorResponse {
  ok: false
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

/** Union of all possible API responses */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
export type ApiListResult<T> = ApiListResponse<T> | ApiErrorResponse

/* ------------------------------------------------------------------ */
/*  Common Query Parameters                                            */
/* ------------------------------------------------------------------ */

export interface ListParams {
  search?: string
  status?: string
  limit?: number
  offset?: number
  sort?: string
  order?: "asc" | "desc"
}
