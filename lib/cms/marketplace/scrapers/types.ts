/**
 * Template Scraper Adapter Types
 *
 * Extensible adapter pattern for scraping open-source Tailwind component
 * libraries (HyperUI, Tailblocks, Meraki UI, etc.) and feeding them through
 * the block editor preprocessing pipeline.
 *
 * These types are for the scraper layer only. The output feeds into
 * the existing MarketplaceTemplate types in ../types.ts for DB storage.
 */

// ── Scraper Adapter Interface ─────────────────────────────────────────

export interface ScraperAdapter {
  /** Human-readable name for logging */
  name: string
  /** Machine identifier for CLI --source flag */
  source: string
  /** SPDX license identifier */
  license: string
  /** Attribution URL for the source */
  attributionUrl: string
  /** Available categories this adapter can scrape */
  getCategories(): Promise<ScraperCategory[]>
  /** Scrape components as an async generator */
  scrape(options: ScrapeOptions): AsyncGenerator<ScrapedTemplate, void, undefined>
}

// ── Scraped Template (raw scraper output) ─────────────────────────────

export interface ScrapedTemplate {
  /** Display name (e.g., "Header - Icon and links on the left") */
  name: string
  /** Raw HTML content (body innerHTML) or JSX/TSX source code */
  html: string
  /** Full JSX/TSX source code (for animated/React components, preserved as-is) */
  jsx?: string
  /** Source category path (e.g., "marketing/headers") */
  category: string
  /** Target marketplace category (e.g., "headers") */
  marketplaceCategory: string
  /** Adapter source identifier */
  source: string
  /** Direct URL to the component on the source site */
  sourceUrl: string
  /** Component description */
  description?: string
  /** Searchable tags */
  tags?: string[]
  /** Variant number (1, 2, 3...) */
  variant?: number
  /** Whether this is a dark variant */
  isDark?: boolean
  /** SPDX license from the adapter */
  license: string
  /** Component author */
  author?: string
}

// ── Scrape Options ────────────────────────────────────────────────────

export interface ScrapeOptions {
  /** Filter by top-level category (e.g., "marketing", "application") */
  category?: string
  /** Filter by sub-category slug (e.g., "headers", "pricing") */
  subcategory?: string
  /** Limit total number of templates scraped */
  limit?: number
  /** Preview mode -- log what would be scraped but don't fetch HTML */
  dryRun?: boolean
  /** Include dark variants (default: false) */
  includeDark?: boolean
  /** Number of concurrent fetches (default: 3) */
  concurrency?: number
}

// ── Scraper Category ──────────────────────────────────────────────────

export interface ScraperCategory {
  /** Category slug (e.g., "marketing") */
  slug: string
  /** Display name */
  name: string
  /** Sub-categories with component counts */
  subcategories: ScraperSubcategory[]
}

export interface ScraperSubcategory {
  /** Sub-category slug (e.g., "headers") */
  slug: string
  /** Display name */
  name: string
  /** Number of component variants available */
  componentCount: number
}

// ── Ingestion Pipeline Results ────────────────────────────────────────

export interface IngestionResult {
  /** Whether ingestion succeeded */
  success: boolean
  /** Generated slug for deduplication */
  slug: string
  /** Template name */
  name: string
  /** Number of blocks created */
  blockCount: number
  /** Import quality score (0-100) */
  quality: number
  /** Warnings from preprocessing/parsing */
  warnings: string[]
  /** Error message if failed */
  error?: string
}

export interface BatchIngestionResult {
  total: number
  succeeded: number
  failed: number
  skipped: number
  results: IngestionResult[]
}
