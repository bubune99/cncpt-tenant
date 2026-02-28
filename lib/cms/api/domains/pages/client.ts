/**
 * Pages API Client
 *
 * Typed client for /api/admin/pages routes.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiList } from "../../client"
import type { PaginatedResult } from "../../client"
import type {
  PageListDto,
  PageDto,
  CreatePageInput,
  UpdatePageInput,
  ListPagesParams,
} from "./types"

const BASE = "/api/cms/admin/pages"

export const pagesClient = {
  /** List pages with pagination and filters */
  list(params?: ListPagesParams): Promise<PaginatedResult<PageListDto>> {
    return apiList<PageListDto>(BASE, params as Record<string, unknown>, "pages")
  },

  /** Get a single page by ID */
  get(id: string): Promise<PageDto> {
    return apiGet<PageDto>(`${BASE}/${id}`)
  },

  /** Create a new page */
  create(input: CreatePageInput): Promise<PageDto> {
    return apiPost<PageDto>(BASE, input)
  },

  /** Update an existing page */
  update(id: string, input: UpdatePageInput): Promise<PageDto> {
    return apiPut<PageDto>(`${BASE}/${id}`, input)
  },

  /** Delete a page */
  delete(id: string): Promise<{ success: boolean }> {
    return apiDelete(`${BASE}/${id}`)
  },
}
