/**
 * Unified API Layer
 *
 * Core infrastructure for typed API communication.
 *
 * Server-side (API routes):
 *   import { apiSuccess, apiListResponse, apiError, apiCatchError } from '@/lib/cms/api'
 *
 * Client-side (components):
 *   import { apiGet, apiPost, useApiGet, useApiList } from '@/lib/cms/api'
 *
 * Forms & Actions:
 *   import { useApiMutation, useDeleteMutation } from '@/lib/cms/api'
 *   import { routes } from '@/lib/cms/api'
 *
 * Domain-specific (pages, products):
 *   import { usePages, useCreatePage, pagesClient, routes } from '@/lib/cms/api/domains/pages'
 */

// Types
export type {
  ApiSuccessResponse,
  ApiListResponse,
  ApiErrorResponse,
  ApiResponse,
  ApiListResult,
  ApiErrorCode,
  ListParams,
} from "./types"
export { ERROR_STATUS_MAP } from "./types"

// Server-side response helpers
export { apiSuccess, apiList as apiListResponse, apiError, apiCatchError } from "./responses"

// Client-side fetch functions
export {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiList as apiListFetch,
  ApiClientError,
  type PaginatedResult,
} from "./client"

// SWR hooks
export { useApiGet, useApiList, buildUrl } from "./hooks"

// Mutations
export { useApiMutation, useDeleteMutation, type MutationOptions, type MutationResult } from "./mutations"

// Routes
export { routes } from "./routes"
