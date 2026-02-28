/**
 * Server-side API Response Helpers
 *
 * Used in API route handlers to return standardized envelopes.
 * Re-throws AuthError so `withPermission` middleware can handle it.
 */

import { NextResponse } from "next/server"
import type {
  ApiSuccessResponse,
  ApiListResponse,
  ApiErrorResponse,
  ApiErrorCode,
} from "./types"
import { ERROR_STATUS_MAP } from "./types"

/* ------------------------------------------------------------------ */
/*  Success Responses                                                  */
/* ------------------------------------------------------------------ */

/** Return a single-item success response */
export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { ok: true as const, data, ...(meta ? { meta } : {}) },
    { status }
  )
}

/** Return a paginated list response */
export function apiList<T>(
  data: T[],
  pagination: { total: number; limit: number; offset: number }
): NextResponse<ApiListResponse<T>> {
  return NextResponse.json({
    ok: true as const,
    data,
    pagination: {
      ...pagination,
      hasMore: pagination.offset + pagination.limit < pagination.total,
    },
  })
}

/* ------------------------------------------------------------------ */
/*  Error Responses                                                    */
/* ------------------------------------------------------------------ */

/** Return a typed error response */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      ok: false as const,
      error: { code, message, ...(details !== undefined ? { details } : {}) },
    },
    { status: ERROR_STATUS_MAP[code] }
  )
}

/* ------------------------------------------------------------------ */
/*  Catch-all Error Handler                                            */
/* ------------------------------------------------------------------ */

/**
 * Catch exceptions in API route handlers.
 *
 * Re-throws errors whose name includes "Auth" so that the
 * `withPermission` middleware can intercept them (Stack Auth errors).
 * Everything else becomes a 500 response.
 */
export function apiCatchError(
  error: unknown,
  fallbackMessage = "Internal server error"
): NextResponse<ApiErrorResponse> {
  // Let auth errors bubble to withPermission middleware
  if (
    error instanceof Error &&
    (error.name.includes("Auth") || error.name === "PermissionError")
  ) {
    throw error
  }

  console.error("[API Error]", error)

  return apiError("INTERNAL_ERROR", fallbackMessage)
}
