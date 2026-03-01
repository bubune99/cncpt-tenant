/**
 * Template Ingestion Pipeline
 *
 * Takes scraped HTML templates, runs them through the block editor
 * preprocessing pipeline, and outputs data ready for the existing
 * marketplace service (DB insertion via upsertMarketplaceTemplates).
 *
 * Pipeline:
 *   1. preprocessForImport()  — Clean shadcn/Next.js/React code -> HTML+Tailwind
 *   2. importFromReact()      — Parse JSX/HTML -> Block[]
 *   3. normalizeBlocks()      — Match blocks against templates, assign labels
 *   4. validateImport()       — Score quality, collect warnings
 *   5. Map to CreateMarketplaceTemplateInput for DB storage
 */

import type { Block } from "@/lib/cms/block-editor/types"
import type { CreateMarketplaceTemplateInput, TemplateCategory } from "./types"
import type { ScrapedTemplate } from "./scrapers/types"
import type { IngestionResult, BatchIngestionResult } from "./scrapers/types"
import { ALL_CATEGORIES } from "./types"

// ── Lazy Pipeline Imports ─────────────────────────────────────────────
//
// The preprocessing pipeline lives in the block editor module.
// We use dynamic imports so the ingestion module can be loaded
// independently (e.g., in a standalone script context).

let _preprocessForImport: typeof import("@/lib/cms/block-editor/preprocess").preprocessForImport | null = null
let _validateImport: typeof import("@/lib/cms/block-editor/preprocess").validateImport | null = null
let _importFromReact: typeof import("@/lib/cms/block-editor/serialization").importFromReact | null = null
let _normalizeBlocks: typeof import("@/lib/cms/block-editor/normalize").normalizeBlocks | null = null

async function loadPipeline() {
  if (!_preprocessForImport) {
    try {
      const preprocess = await import("@/lib/cms/block-editor/preprocess")
      _preprocessForImport = preprocess.preprocessForImport
      _validateImport = preprocess.validateImport
    } catch {
      throw new Error(
        "Failed to load preprocess module. Ensure @/lib/cms/block-editor/preprocess.ts exists."
      )
    }
  }

  if (!_importFromReact) {
    try {
      const serialization = await import("@/lib/cms/block-editor/serialization")
      _importFromReact = serialization.importFromReact
    } catch {
      throw new Error(
        "Failed to load serialization module. Ensure @/lib/cms/block-editor/serialization.ts exists."
      )
    }
  }

  if (!_normalizeBlocks) {
    try {
      const normalize = await import("@/lib/cms/block-editor/normalize")
      _normalizeBlocks = normalize.normalizeBlocks
    } catch {
      // normalizeBlocks is optional -- if not available, pass through
      _normalizeBlocks = ((blocks: Block[]) => blocks) as any
    }
  }

  return {
    preprocessForImport: _preprocessForImport!,
    validateImport: _validateImport!,
    importFromReact: _importFromReact!,
    normalizeBlocks: _normalizeBlocks!,
  }
}

// ── Slug Utilities ────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

// ── Category Mapping ──────────────────────────────────────────────────

/**
 * Map a scraper's marketplace category string to the DB TemplateCategory enum.
 * Falls back to "other" for unknown categories.
 */
function resolveCategory(scraperCategory: string): TemplateCategory {
  // Direct match
  if (ALL_CATEGORIES.includes(scraperCategory as TemplateCategory)) {
    return scraperCategory as TemplateCategory
  }

  // Common mappings from scraper category names to DB enum values
  const FALLBACK_MAP: Record<string, TemplateCategory> = {
    headers: "header",
    footers: "footer",
    commerce: "ecommerce-section",
    alerts: "banner",
    banners: "banner",
    blog: "blog-section",
    buttons: "other",
    badges: "other",
    breadcrumbs: "navigation",
    dropdowns: "navigation",
    dividers: "other",
    empty: "other",
    "empty-states": "other",
    filters: "other",
    grids: "other",
    lists: "content",
    loaders: "other",
    media: "gallery",
    modals: "other",
    pagination: "other",
    progress: "other",
    sections: "content",
    steps: "other",
    tables: "other",
    tabs: "other",
    timelines: "content",
    toggles: "other",
    logos: "content",
    accordions: "other",
  }

  return FALLBACK_MAP[scraperCategory] ?? "other"
}

// ── Single Template Ingestion ─────────────────────────────────────────

export interface IngestedTemplate {
  /** Ready for DB via createMarketplaceTemplate or upsertMarketplaceTemplates */
  dbInput: CreateMarketplaceTemplateInput
  /** Ingestion result metadata */
  result: IngestionResult
  /** Raw HTML for JSON export */
  rawHtml: string
}

/**
 * Process a single scraped template through the full pipeline.
 * Returns data ready for the existing marketplace service.
 */
export async function ingestTemplate(
  scraped: ScrapedTemplate
): Promise<IngestedTemplate> {
  const pipeline = await loadPipeline()
  const slug = toSlug(scraped.name)
  const warnings: string[] = []

  try {
    // Step 1: Preprocess HTML through the cleanup pipeline
    const preprocessed = pipeline.preprocessForImport(scraped.html)
    warnings.push(
      ...preprocessed.warnings.map((w) => `[preprocess] ${w.message}`)
    )

    // Step 2: Parse cleaned HTML/JSX into Block[]
    const parsed = pipeline.importFromReact(preprocessed.code)
    if (parsed.errors.length > 0) {
      warnings.push(...parsed.errors.map((e) => `[parse] ${e}`))
    }

    if (parsed.blocks.length === 0) {
      return {
        dbInput: makeDBInput(scraped, [], slug, resolveCategory(scraped.marketplaceCategory)),
        result: {
          success: false,
          slug,
          name: scraped.name,
          blockCount: 0,
          quality: 0,
          warnings,
          error: "No blocks parsed from HTML",
        },
        rawHtml: scraped.html,
      }
    }

    // Step 3: Normalize blocks -- match against templates, assign labels
    const normalized = pipeline.normalizeBlocks(parsed.blocks, {
      matchThreshold: 0.4,
      mergeClasses: false,
    })

    // Step 4: Validate import quality
    const validation = pipeline.validateImport(normalized, preprocessed)
    warnings.push(...validation.warnings)

    const category = resolveCategory(scraped.marketplaceCategory)

    return {
      dbInput: makeDBInput(scraped, normalized, slug, category),
      result: {
        success: true,
        slug,
        name: scraped.name,
        blockCount: validation.blockCount,
        quality: validation.quality,
        warnings,
      },
      rawHtml: scraped.html,
    }
  } catch (err) {
    const errorMsg = (err as Error).message
    warnings.push(`[error] ${errorMsg}`)
    return {
      dbInput: makeDBInput(scraped, [], slug, resolveCategory(scraped.marketplaceCategory)),
      result: {
        success: false,
        slug,
        name: scraped.name,
        blockCount: 0,
        quality: 0,
        warnings,
        error: errorMsg,
      },
      rawHtml: scraped.html,
    }
  }
}

// ── Batch Ingestion ───────────────────────────────────────────────────

export interface BatchOptions {
  /** Skip templates whose slug already exists */
  skipDuplicates?: boolean
  /** Minimum quality score to accept (default: 0) */
  minQuality?: number
  /** Callback for progress reporting */
  onProgress?: (current: number, total: number, result: IngestionResult) => void
}

export interface BatchResult {
  /** Templates ready for DB insertion */
  templates: IngestedTemplate[]
  /** Summary report */
  report: BatchIngestionResult
}

/**
 * Process multiple scraped templates through the pipeline.
 */
export async function ingestBatch(
  templates: ScrapedTemplate[],
  options: BatchOptions = {}
): Promise<BatchResult> {
  const { skipDuplicates = true, minQuality = 0, onProgress } = options
  const seenSlugs = new Set<string>()
  const results: IngestionResult[] = []
  const accepted: IngestedTemplate[] = []

  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < templates.length; i++) {
    const scraped = templates[i]
    const slug = toSlug(scraped.name)

    // Deduplication
    if (skipDuplicates && seenSlugs.has(slug)) {
      const result: IngestionResult = {
        success: false,
        slug,
        name: scraped.name,
        blockCount: 0,
        quality: 0,
        warnings: [],
        error: `Duplicate slug: ${slug}`,
      }
      results.push(result)
      skipped++
      onProgress?.(i + 1, templates.length, result)
      continue
    }

    seenSlugs.add(slug)

    const ingested = await ingestTemplate(scraped)
    results.push(ingested.result)

    if (ingested.result.success) {
      if (ingested.result.quality >= minQuality) {
        accepted.push(ingested)
        succeeded++
      } else {
        skipped++
        ingested.result.error = `Quality ${ingested.result.quality} below threshold ${minQuality}`
      }
    } else {
      failed++
    }

    onProgress?.(i + 1, templates.length, ingested.result)
  }

  return {
    templates: accepted,
    report: {
      total: templates.length,
      succeeded,
      failed,
      skipped,
      results,
    },
  }
}

// ── Helper: Build CreateMarketplaceTemplateInput ──────────────────────

function makeDBInput(
  scraped: ScrapedTemplate,
  blocks: Block[],
  slug: string,
  category: TemplateCategory
): CreateMarketplaceTemplateInput {
  return {
    name: scraped.name,
    slug,
    description: scraped.description ?? `${scraped.name} component from ${scraped.source}`,
    type: "component",
    category,
    tags: scraped.tags ?? [],
    blocks,
    jsx: scraped.jsx,
    source: scraped.source,
    sourceUrl: scraped.sourceUrl,
    license: scraped.license,
    author: scraped.author,
    isPublished: true,
    isFeatured: false,
  }
}
