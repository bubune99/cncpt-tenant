/* ------------------------------------------------------------------ */
/*  Marketplace Types — DB-driven template marketplace                 */
/* ------------------------------------------------------------------ */

import type { Block } from '@/lib/cms/block-editor/types'

/** Whether this is a full multi-section site template or a single component section */
export type TemplateType = 'site' | 'component'

/** All supported marketplace categories */
export type TemplateCategory =
  // Site categories (full page templates)
  | 'landing-page'
  | 'saas'
  | 'ecommerce'
  | 'portfolio'
  | 'blog'
  | 'restaurant'
  | 'agency'
  | 'startup'
  | 'personal'
  | 'nonprofit'
  // Component categories (individual sections)
  | 'hero'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'cta'
  | 'faq'
  | 'footer'
  | 'header'
  | 'navigation'
  | 'stats'
  | 'team'
  | 'contact'
  | 'gallery'
  | 'content'
  | 'banner'
  | 'cards'
  | 'forms'
  | 'auth'
  | 'sidebar'
  | 'ecommerce-section'
  | 'blog-section'
  | 'other'

/** Site-level categories (used for filtering UI) */
export const SITE_CATEGORIES: TemplateCategory[] = [
  'landing-page',
  'saas',
  'ecommerce',
  'portfolio',
  'blog',
  'restaurant',
  'agency',
  'startup',
  'personal',
  'nonprofit',
]

/** Component-level categories (used for filtering UI) */
export const COMPONENT_CATEGORIES: TemplateCategory[] = [
  'hero',
  'features',
  'pricing',
  'testimonials',
  'cta',
  'faq',
  'footer',
  'header',
  'navigation',
  'stats',
  'team',
  'contact',
  'gallery',
  'content',
  'banner',
  'cards',
  'forms',
  'auth',
  'sidebar',
  'ecommerce-section',
  'blog-section',
  'other',
]

/** All valid category values */
export const ALL_CATEGORIES: TemplateCategory[] = [
  ...SITE_CATEGORIES,
  ...COMPONENT_CATEGORIES,
]

/** A marketplace template as returned from the database/API */
export interface MarketplaceTemplate {
  id: string
  name: string
  slug: string
  description: string
  type: TemplateType
  category: TemplateCategory
  tags: string[]

  // Content
  blocks: Block[]
  jsx?: string | null

  // Display
  thumbnail?: string | null
  previewUrl?: string | null

  // Metadata
  source: string
  sourceUrl?: string | null
  license: string
  author?: string | null

  // Status
  isPublished: boolean
  isFeatured: boolean
  usageCount: number

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/** Filter/query options for listing marketplace templates */
export interface MarketplaceFilter {
  type?: TemplateType
  category?: TemplateCategory
  search?: string
  tags?: string[]
  source?: string
  featured?: boolean
  page?: number
  limit?: number
  sort?: 'popular' | 'newest' | 'name'
}

/** Data required to create a new marketplace template */
export interface CreateMarketplaceTemplateInput {
  name: string
  slug: string
  description?: string
  type?: TemplateType
  category: TemplateCategory
  tags?: string[]
  blocks: Block[]
  jsx?: string
  thumbnail?: string
  previewUrl?: string
  source?: string
  sourceUrl?: string
  license?: string
  author?: string
  isPublished?: boolean
  isFeatured?: boolean
}

/** Data for updating an existing marketplace template */
export interface UpdateMarketplaceTemplateInput {
  name?: string
  slug?: string
  description?: string
  type?: TemplateType
  category?: TemplateCategory
  tags?: string[]
  blocks?: Block[]
  jsx?: string | null
  thumbnail?: string | null
  previewUrl?: string | null
  source?: string
  sourceUrl?: string | null
  license?: string
  author?: string | null
  isPublished?: boolean
  isFeatured?: boolean
}

/** Category with its template count */
export interface CategoryCount {
  category: TemplateCategory
  type: TemplateType
  count: number
}

/** Paginated response wrapper */
export interface PaginatedTemplates {
  templates: MarketplaceTemplate[]
  total: number
  page: number
  limit: number
  totalPages: number
}
