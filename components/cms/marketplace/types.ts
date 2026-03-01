/**
 * Marketplace types
 *
 * Shared type definitions for the template marketplace UI.
 * Data fetching hooks are built separately — these types define
 * the shape of data the UI components expect.
 */

export type TemplateType = "site" | "component"

export type MarketplaceSource =
  | "HyperUI"
  | "Tailblocks"
  | "Flowbite"
  | "DaisyUI"
  | "Community"
  | "Official"
  | string

export type MarketplaceSort = "popular" | "newest" | "az"

export interface MarketplaceTemplate {
  id: string
  name: string
  slug: string
  description: string
  type: TemplateType
  category: string
  source: MarketplaceSource
  tags: string[]
  thumbnail?: string | null
  /** Block JSON stored as the template content */
  blocks: unknown[]
  /** JSX source code for code preview */
  jsx?: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
  license?: string | null
}

export interface MarketplaceFilters {
  search: string
  type: TemplateType | "all"
  category: string
  source: string
  sort: MarketplaceSort
}

export interface MarketplacePageData {
  templates: MarketplaceTemplate[]
  total: number
  page: number
  pageSize: number
  categories: string[]
  sources: string[]
}
