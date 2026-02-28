/**
 * Typed API Fetch Client
 *
 * Generalizes the fetch pattern from `block-editor/storage.ts`.
 * Handles both new envelope (`{ ok, data }`) and legacy response formats.
 */

import type {
  ApiSuccessResponse,
  ApiListResponse,
  ApiErrorResponse,
  ApiErrorCode,
} from "./types"

/* ------------------------------------------------------------------ */
/*  Error Class                                                        */
/* ------------------------------------------------------------------ */

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = "ApiClientError"
  }
}

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = path.startsWith("http") ? path : path
  if (!params) return url

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  }

  const qs = searchParams.toString()
  return qs ? `${url}?${qs}` : url
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiErrorResponse | { error?: string } | undefined
    try {
      body = await res.json()
    } catch {
      // non-JSON error response
    }

    // New envelope format
    if (body && "ok" in body && body.ok === false) {
      const err = (body as ApiErrorResponse).error
      throw new ApiClientError(err.message, err.code, res.status, err.details)
    }

    // Legacy format: { error: "message" }
    if (body && "error" in body && typeof body.error === "string") {
      throw new ApiClientError(
        body.error,
        statusToCode(res.status),
        res.status
      )
    }

    throw new ApiClientError(
      res.statusText || "Request failed",
      statusToCode(res.status),
      res.status
    )
  }

  const data = await res.json()

  // New envelope format — unwrap
  if (data && typeof data === "object" && "ok" in data && data.ok === true) {
    return data.data as T
  }

  // Legacy format — return as-is
  return data as T
}

function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 409:
      return "CONFLICT"
    case 422:
      return "VALIDATION_ERROR"
    case 429:
      return "RATE_LIMITED"
    default:
      return "INTERNAL_ERROR"
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  const url = buildUrl(path, params)
  const res = await fetch(url)
  return handleResponse<T>(res)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(res)
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(res)
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(res)
}

export async function apiDelete<T = { success: boolean }>(
  path: string
): Promise<T> {
  const res = await fetch(path, { method: "DELETE" })
  return handleResponse<T>(res)
}

/* ------------------------------------------------------------------ */
/*  List Helper (handles both new & legacy paginated formats)          */
/* ------------------------------------------------------------------ */

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Fetch a paginated list, handling both envelope and legacy formats.
 *
 * Legacy format: `{ pages: [...], total, limit, offset }` (field name varies)
 * New format:    `{ ok: true, data: [...], pagination: {...} }`
 */
export async function apiList<T>(
  path: string,
  params?: Record<string, unknown>,
  /** The key used for the data array in legacy responses (e.g. "pages", "products") */
  legacyDataKey?: string
): Promise<PaginatedResult<T>> {
  const url = buildUrl(path, params)
  const res = await fetch(url)

  if (!res.ok) {
    // Delegate to standard error handling
    await handleResponse(res)
    // unreachable — handleResponse throws on !ok
    throw new Error("unreachable")
  }

  const body = await res.json()

  // New envelope format
  if (body && "ok" in body && body.ok === true && "pagination" in body) {
    const list = body as ApiListResponse<T>
    return {
      data: list.data,
      total: list.pagination.total,
      limit: list.pagination.limit,
      offset: list.pagination.offset,
      hasMore: list.pagination.hasMore,
    }
  }

  // Legacy format — find data array by key or first array value
  const dataArray = legacyDataKey
    ? (body[legacyDataKey] as T[])
    : findArrayInObject<T>(body)

  const total = (body.total as number) ?? dataArray.length
  const limit = (body.limit as number) ?? dataArray.length
  const offset = (body.offset as number) ?? 0

  return {
    data: dataArray,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  }
}

/** Find the first array value in an object (for legacy format detection) */
function findArrayInObject<T>(obj: Record<string, unknown>): T[] {
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) return value as T[]
  }
  return []
}
