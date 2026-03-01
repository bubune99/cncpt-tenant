/**
 * Aceternity UI Scraper Adapter
 *
 * Fetches animated React components from Aceternity UI's registry API.
 * Components are Tailwind CSS + Framer Motion with rich animations.
 *
 * API Endpoints:
 *   - Manifest:  https://ui.aceternity.com/api/components
 *   - Source:    https://ui.aceternity.com/registry/{slug}.json
 *
 * @see https://ui.aceternity.com
 * @license MIT
 */

import type {
  ScraperAdapter,
  ScraperCategory,
  ScraperSubcategory,
  ScrapedTemplate,
  ScrapeOptions,
} from "./types"

// ── Constants ─────────────────────────────────────────────────────────

const REGISTRY_API = "https://ui.aceternity.com/api/components"
const REGISTRY_BASE = "https://ui.aceternity.com/registry"
const SITE_BASE = "https://ui.aceternity.com/components"

/** Map Aceternity categories to marketplace categories */
const CATEGORY_MAP: Record<string, string> = {
  backgrounds: "hero",
  text: "content",
  cards: "cards",
  navigation: "navigation",
  hero: "hero",
  animations: "other",
  effects: "other",
  layout: "content",
  forms: "forms",
  utilities: "other",
  community: "other",
}

// ── Types ─────────────────────────────────────────────────────────────

interface AceternityManifest {
  meta: {
    name: string
    totalComponents?: number
  }
  stats: {
    totalComponents: number
    totalBlocks: number
  }
  categories: Record<string, string[]>
  components: AceternityComponent[]
  blocks: AceternityComponent[]
}

interface AceternityComponent {
  name: string
  title: string
  description?: string
  categories?: string[]
  dependencies?: string[]
  files?: string[]
  documentationUrl?: string
  image?: string | null
}

interface AceternityRegistryEntry {
  name: string
  type: string
  title?: string
  dependencies?: string[]
  files: Array<{
    path: string
    content: string
    type: string
    target: string
  }>
  author?: string
}

// ── Network Helpers ───────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "cncpt-template-scraper/1.0",
        },
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 429) {
        const waitMs = 2000 * (attempt + 1)
        await sleep(waitMs)
        continue
      }

      return res
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries - 1) {
        await sleep(1000 * (attempt + 1))
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Manifest Cache ────────────────────────────────────────────────────

let cachedManifest: AceternityManifest | null = null

async function getManifest(): Promise<AceternityManifest> {
  if (cachedManifest) return cachedManifest

  const res = await fetchWithRetry(REGISTRY_API)
  if (!res.ok) {
    throw new Error(`Aceternity API ${res.status}: ${REGISTRY_API}`)
  }

  cachedManifest = (await res.json()) as AceternityManifest
  return cachedManifest
}

// ── Slug/Category Helpers ─────────────────────────────────────────────

function buildReverseCategory(
  categories: Record<string, string[]>
): Map<string, string> {
  const map = new Map<string, string>()
  for (const [cat, slugs] of Object.entries(categories)) {
    for (const slug of slugs) {
      if (!map.has(slug)) map.set(slug, cat)
    }
  }
  return map
}

function generateTags(
  component: AceternityComponent,
  aceternityCategory: string
): string[] {
  const tags = new Set<string>()

  tags.add("aceternity")
  tags.add("tailwind")
  tags.add("animated")
  tags.add("framer-motion")
  tags.add(aceternityCategory)

  if (component.categories) {
    for (const cat of component.categories) {
      tags.add(cat)
    }
  }

  // Extract keywords from title
  const words = component.title
    .toLowerCase()
    .split(/[\s,()-]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  for (const w of words) tags.add(w)

  // Add dependency info as tags
  if (component.dependencies) {
    for (const dep of component.dependencies) {
      if (dep === "motion" || dep === "framer-motion") tags.add("animated")
      if (dep.includes("three")) tags.add("3d")
      if (dep.includes("particles")) tags.add("particles")
    }
  }

  return [...tags]
}

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "are",
  "has", "have", "will", "can", "all", "not", "but", "its",
  "effect", "component",
])

// ── Aceternity Adapter ──────────────────────────────────────────────

export class AceternityAdapter implements ScraperAdapter {
  name = "Aceternity UI"
  source = "aceternity"
  license = "MIT"
  attributionUrl = "https://ui.aceternity.com"

  async getCategories(): Promise<ScraperCategory[]> {
    const manifest = await getManifest()
    const categories: ScraperCategory[] = []

    for (const [catSlug, slugs] of Object.entries(manifest.categories)) {
      const subcategories: ScraperSubcategory[] = slugs.map((slug) => {
        const comp = manifest.components.find((c) => c.name === slug)
        return {
          slug,
          name: comp?.title ?? slug,
          componentCount: 1,
        }
      })

      categories.push({
        slug: catSlug,
        name: catSlug.charAt(0).toUpperCase() + catSlug.slice(1),
        subcategories,
      })
    }

    return categories
  }

  async *scrape(
    options: ScrapeOptions = {}
  ): AsyncGenerator<ScrapedTemplate, void, undefined> {
    const {
      category,
      subcategory,
      limit,
      dryRun = false,
    } = options

    const manifest = await getManifest()
    const slugToCategory = buildReverseCategory(manifest.categories)

    // Build list of components to scrape
    let components = [...manifest.components]

    // Filter by category
    if (category) {
      const categorySlugs = new Set(manifest.categories[category] ?? [])
      components = components.filter((c) => categorySlugs.has(c.name))
    }

    // Filter by subcategory (component slug)
    if (subcategory) {
      components = components.filter((c) => c.name === subcategory)
    }

    let yielded = 0

    for (const comp of components) {
      if (limit && yielded >= limit) break

      const aceternityCategory = slugToCategory.get(comp.name) ?? "other"
      const marketplaceCategory = CATEGORY_MAP[aceternityCategory] ?? "other"

      if (dryRun) {
        yield {
          name: comp.title,
          html: "",
          category: aceternityCategory,
          marketplaceCategory,
          source: this.source,
          sourceUrl: `${SITE_BASE}/${comp.name}`,
          description: comp.description,
          tags: generateTags(comp, aceternityCategory),
          license: this.license,
        }
        yielded++
        continue
      }

      // Fetch the full TSX source from the registry
      let sourceCode: string
      try {
        const res = await fetchWithRetry(`${REGISTRY_BASE}/${comp.name}.json`)
        if (!res.ok) {
          console.error(`[aceternity] Failed to fetch ${comp.name}: ${res.status}`)
          continue
        }

        const entry = (await res.json()) as AceternityRegistryEntry
        sourceCode = entry.files[0]?.content ?? ""

        if (!sourceCode) {
          console.error(`[aceternity] Empty source for ${comp.name}`)
          continue
        }
      } catch (err) {
        console.error(
          `[aceternity] Failed to fetch ${comp.name}: ${(err as Error).message}`
        )
        continue
      }

      // Small delay to be respectful to the API
      await sleep(200)

      yield {
        name: comp.title,
        html: sourceCode, // TSX source — preprocessForImport handles it
        jsx: sourceCode,  // Also preserve full source for react-live rendering
        category: aceternityCategory,
        marketplaceCategory,
        source: this.source,
        sourceUrl: `${SITE_BASE}/${comp.name}`,
        description: comp.description ?? `${comp.title} — animated React component with Tailwind CSS and Framer Motion`,
        tags: generateTags(comp, aceternityCategory),
        license: this.license,
        author: "Manu Arora",
      }
      yielded++
    }
  }
}

// ── Export singleton ──────────────────────────────────────────────────

export const aceternityAdapter = new AceternityAdapter()
