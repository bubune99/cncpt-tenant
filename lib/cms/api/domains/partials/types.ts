/**
 * Partials Domain Types
 *
 * DTOs and input types for the Partials API.
 * Matches the shape returned by /api/admin/partials routes.
 */

import type { ListParams } from "../../types"

/* ------------------------------------------------------------------ */
/*  DTOs                                                               */
/* ------------------------------------------------------------------ */

export type PartialCategory = "header" | "footer" | "announcement" | "sidebar" | "section"

/** Shape returned by GET /api/admin/partials (list + detail) */
export interface PartialDto {
  id: string
  name: string
  slug: string
  description: string | null
  category: PartialCategory
  content: unknown
  thumbnail: string | null
  isDefault: boolean
  status: string
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */

export interface CreatePartialInput {
  name: string
  slug: string
  description?: string
  category: PartialCategory
  content?: unknown
  thumbnail?: string
  status?: string
}

export interface UpdatePartialInput {
  name?: string
  slug?: string
  description?: string
  content?: unknown
  thumbnail?: string
  status?: string
}

/* ------------------------------------------------------------------ */
/*  Query Params                                                       */
/* ------------------------------------------------------------------ */

export interface ListPartialsParams extends ListParams {
  category?: PartialCategory
}
