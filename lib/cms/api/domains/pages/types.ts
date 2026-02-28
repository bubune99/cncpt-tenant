/**
 * Pages Domain Types
 *
 * DTOs and input types for the Pages API.
 * Matches the shape returned by /api/admin/pages routes.
 */

import type { ListParams } from "../../types"

/* ------------------------------------------------------------------ */
/*  DTOs                                                               */
/* ------------------------------------------------------------------ */

export interface PageImage {
  id: string
  url: string
  alt: string | null
}

export interface PageParent {
  id: string
  title: string
  slug: string
}

export interface PageChild {
  id: string
  title: string
  slug: string
  status: string
}

/** Shape returned by GET /api/admin/pages (list item) */
export interface PageListDto {
  id: string
  title: string
  slug: string
  status: string
  metaTitle: string | null
  metaDescription: string | null
  featuredImage: PageImage | null
  parentId: string | null
  parent: PageParent | null
  childCount: number
  headerMode: string
  footerMode: string
  showAnnouncement: boolean
  hasContent: boolean
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

/** Shape returned by GET /api/admin/pages/[id] */
export interface PageDto extends Omit<PageListDto, "childCount" | "hasContent"> {
  content: unknown
  featuredImageId: string | null
  children: PageChild[]
  customHeader: unknown
  customFooter: unknown
  customAnnouncement: unknown
}

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */

export interface CreatePageInput {
  title: string
  slug: string
  status?: string
  content?: unknown
  metaTitle?: string
  metaDescription?: string
  featuredImageId?: string
  parentId?: string
  headerMode?: string
  footerMode?: string
  showAnnouncement?: boolean
}

export interface UpdatePageInput {
  title?: string
  slug?: string
  status?: string
  content?: unknown
  metaTitle?: string
  metaDescription?: string
  featuredImageId?: string | null
  parentId?: string | null
  headerMode?: string
  footerMode?: string
  customHeader?: unknown
  customFooter?: unknown
  showAnnouncement?: boolean
  customAnnouncement?: unknown
}

/* ------------------------------------------------------------------ */
/*  Query Params                                                       */
/* ------------------------------------------------------------------ */

export interface ListPagesParams extends ListParams {
  status?: "draft" | "published" | "archived"
}
