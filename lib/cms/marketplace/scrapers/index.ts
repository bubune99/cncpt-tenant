/**
 * Scraper Registry
 *
 * Central registry of all template scraper adapters.
 * Add new adapters here to make them available via CLI.
 */

import type { ScraperAdapter } from "./types"
import { hyperuiAdapter } from "./hyperui"
import { aceternityAdapter } from "./aceternity"
import { magicuiAdapter } from "./magicui"

// ── Registry ──────────────────────────────────────────────────────────

const SCRAPERS: Map<string, ScraperAdapter> = new Map()

function register(adapter: ScraperAdapter): void {
  SCRAPERS.set(adapter.source, adapter)
}

// Register built-in adapters
register(hyperuiAdapter)
register(aceternityAdapter)
register(magicuiAdapter)

// ── Public API ────────────────────────────────────────────────────────

/**
 * Get a scraper adapter by its source identifier.
 * @throws if the source is not registered.
 */
export function getScraper(source: string): ScraperAdapter {
  const adapter = SCRAPERS.get(source)
  if (!adapter) {
    const available = getAvailableSources().join(", ")
    throw new Error(
      `Unknown scraper source "${source}". Available: ${available}`
    )
  }
  return adapter
}

/** List all registered source identifiers. */
export function getAvailableSources(): string[] {
  return [...SCRAPERS.keys()]
}

/** List all registered adapters with metadata. */
export function getAvailableAdapters(): { source: string; name: string; license: string }[] {
  return [...SCRAPERS.values()].map((a) => ({
    source: a.source,
    name: a.name,
    license: a.license,
  }))
}

/**
 * Register a custom scraper adapter at runtime.
 * Use this to add scrapers from plugins or external packages.
 */
export function registerScraper(adapter: ScraperAdapter): void {
  register(adapter)
}

// Re-export types
export type { ScraperAdapter, ScrapedTemplate, ScrapeOptions, ScraperCategory } from "./types"
