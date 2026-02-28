/**
 * Partials API Client
 *
 * Typed client for /api/admin/partials routes.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiList } from "../../client"
import type { PaginatedResult } from "../../client"
import type {
  PartialDto,
  CreatePartialInput,
  UpdatePartialInput,
  ListPartialsParams,
} from "./types"

const BASE = "/api/admin/partials"

export const partialsClient = {
  /** List partials with pagination and category filter */
  list(params?: ListPartialsParams): Promise<PaginatedResult<PartialDto>> {
    return apiList<PartialDto>(BASE, params as Record<string, unknown>, "partials")
  },

  /** Get a single partial by ID */
  get(id: string): Promise<PartialDto> {
    return apiGet<PartialDto>(`${BASE}/${id}`)
  },

  /** Create a new partial */
  create(input: CreatePartialInput): Promise<PartialDto> {
    return apiPost<PartialDto>(BASE, input)
  },

  /** Update an existing partial */
  update(id: string, input: UpdatePartialInput): Promise<PartialDto> {
    return apiPut<PartialDto>(`${BASE}/${id}`, input)
  },

  /** Delete a partial */
  delete(id: string): Promise<{ success: boolean }> {
    return apiDelete(`${BASE}/${id}`)
  },

  /** Set a partial as the default for its category */
  setDefault(id: string): Promise<{ success: boolean; id: string; name: string; category: string }> {
    return apiPost(`${BASE}/${id}/set-default`, {})
  },
}
