/**
 * Magic UI Scraper Adapter
 *
 * Fetches animated React components from Magic UI's GitHub repository.
 * Components are Tailwind CSS + Framer Motion (motion/react) with animations.
 *
 * Data sources:
 *   - Registry: https://raw.githubusercontent.com/magicuidesign/magicui/main/registry.json
 *   - Source:   https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/{name}.tsx
 *   - Demos:    https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/example/{name}-demo.tsx
 *
 * @see https://magicui.design
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

const REPO_OWNER = "magicuidesign"
const REPO_NAME = "magicui"
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`
const REGISTRY_URL = `${GITHUB_RAW_BASE}/registry.json`
const SITE_BASE = "https://magicui.design/docs/components"

/** Map Magic UI doc categories to marketplace categories */
const CATEGORY_MAP: Record<string, string> = {
  "components": "other",
  "special-effects": "other",
  "text-animations": "content",
  "animations": "other",
  "backgrounds": "hero",
  "buttons": "other",
  "device-mocks": "other",
  "community": "other",
  // Fallback from name heuristics
  "marquee": "content",
  "terminal": "other",
  "hero-video-dialog": "hero",
  "bento-grid": "content",
  "dock": "navigation",
  "globe": "hero",
  "particles": "hero",
  "meteors": "hero",
  "sparkles-text": "content",
}

// ── Types ─────────────────────────────────────────────────────────────

interface MagicUIRegistry {
  name: string
  homepage: string
  items: MagicUIRegistryItem[]
}

interface MagicUIRegistryItem {
  name: string
  type: "registry:ui" | "registry:style" | "registry:example"
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: Array<{
    path: string
    type: string
    target: string
    content?: string
  }>
  cssVars?: Record<string, Record<string, string>>
  css?: Record<string, unknown>
}

// ── Category Mapping from docs.ts ─────────────────────────────────────

/** Known doc-derived category assignments for common components */
const COMPONENT_CATEGORIES: Record<string, string> = {
  // Components
  "marquee": "components",
  "terminal": "components",
  "hero-video-dialog": "components",
  "bento-grid": "components",
  "animated-list": "components",
  "dock": "components",
  "globe": "components",
  "tweet-card": "components",
  "orbiting-circles": "components",
  "avatar-circles": "components",
  "icon-cloud": "components",
  "lens": "components",
  "pointer": "components",
  "smooth-cursor": "components",
  "progressive-blur": "components",
  "dotted-map": "components",
  // Special Effects
  "animated-beam": "special-effects",
  "border-beam": "special-effects",
  "shine-border": "special-effects",
  "magic-card": "special-effects",
  "meteors": "special-effects",
  "confetti": "special-effects",
  "particles": "special-effects",
  "animated-theme-toggler": "special-effects",
  // Text Animations
  "text-animate": "text-animations",
  "typing-animation": "text-animations",
  "line-shadow-text": "text-animations",
  "aurora-text": "text-animations",
  "video-text": "text-animations",
  "number-ticker": "text-animations",
  "animated-shiny-text": "text-animations",
  "animated-gradient-text": "text-animations",
  "text-reveal": "text-animations",
  "hyper-text": "text-animations",
  "word-rotate": "text-animations",
  "scroll-based-velocity": "text-animations",
  "sparkles-text": "text-animations",
  "morphing-text": "text-animations",
  "spinning-text": "text-animations",
  "highlighter": "text-animations",
  // Backgrounds
  "flickering-grid": "backgrounds",
  "animated-grid-pattern": "backgrounds",
  "retro-grid": "backgrounds",
  "ripple": "backgrounds",
  "dot-pattern": "backgrounds",
  "grid-pattern": "backgrounds",
  "striped-pattern": "backgrounds",
  "interactive-grid-pattern": "backgrounds",
  "light-rays": "backgrounds",
  // Buttons
  "rainbow-button": "buttons",
  "shimmer-button": "buttons",
  "ripple-button": "buttons",
  // Device Mocks
  "safari": "device-mocks",
  "iphone": "device-mocks",
  "android": "device-mocks",
}

// ── Network Helpers ───────────────────────────────────────────────────

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "cncpt-template-scraper/1.0",
  }
  const token = process.env.GITHUB_TOKEN
  if (token && token.length > 30 && /^(ghp_|gho_|github_pat_)/.test(token)) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 403 || res.status === 429) {
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

// ── Registry Cache ────────────────────────────────────────────────────

let cachedRegistry: MagicUIRegistry | null = null

async function getRegistry(): Promise<MagicUIRegistry> {
  if (cachedRegistry) return cachedRegistry

  const res = await fetchWithRetry(REGISTRY_URL, {
    headers: githubHeaders(),
  })
  if (!res.ok) {
    throw new Error(`Magic UI registry ${res.status}: ${REGISTRY_URL}`)
  }

  cachedRegistry = (await res.json()) as MagicUIRegistry
  return cachedRegistry
}

// ── Tag Generation ────────────────────────────────────────────────────

function generateTags(
  item: MagicUIRegistryItem,
  docCategory: string
): string[] {
  const tags = new Set<string>()

  tags.add("magicui")
  tags.add("tailwind")
  tags.add("animated")
  tags.add("framer-motion")
  tags.add(docCategory)

  // Add marketplace-mapped category
  const mapped = CATEGORY_MAP[docCategory]
  if (mapped && mapped !== docCategory) tags.add(mapped)

  // Keywords from title/name
  const words = (item.title ?? item.name)
    .toLowerCase()
    .replace(/-/g, " ")
    .split(/[\s,()]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  for (const w of words) tags.add(w)

  // Dependency-derived tags
  if (item.dependencies) {
    for (const dep of item.dependencies) {
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
])

// ── Magic UI Adapter ────────────────────────────────────────────────

export class MagicUIAdapter implements ScraperAdapter {
  name = "Magic UI"
  source = "magicui"
  license = "MIT"
  attributionUrl = "https://magicui.design"

  async getCategories(): Promise<ScraperCategory[]> {
    const registry = await getRegistry()

    // Group UI components by their doc category
    const catMap = new Map<string, MagicUIRegistryItem[]>()

    for (const item of registry.items) {
      if (item.type !== "registry:ui") continue
      const cat = COMPONENT_CATEGORIES[item.name] ?? "community"
      const arr = catMap.get(cat) ?? []
      arr.push(item)
      catMap.set(cat, arr)
    }

    const categories: ScraperCategory[] = []
    for (const [catSlug, items] of catMap) {
      const subcategories: ScraperSubcategory[] = items.map((item) => ({
        slug: item.name,
        name: item.title ?? item.name,
        componentCount: 1,
      }))

      categories.push({
        slug: catSlug,
        name: catSlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
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

    const registry = await getRegistry()

    // Filter to UI components only
    let components = registry.items.filter((i) => i.type === "registry:ui")

    // Filter by category
    if (category) {
      components = components.filter((item) => {
        const itemCat = COMPONENT_CATEGORIES[item.name] ?? "community"
        return itemCat === category
      })
    }

    // Filter by subcategory (component name)
    if (subcategory) {
      components = components.filter((c) => c.name === subcategory)
    }

    let yielded = 0

    for (const item of components) {
      if (limit && yielded >= limit) break

      const docCategory = COMPONENT_CATEGORIES[item.name] ?? "community"
      const marketplaceCategory = CATEGORY_MAP[docCategory] ?? "other"

      if (dryRun) {
        yield {
          name: item.title ?? item.name,
          html: "",
          category: docCategory,
          marketplaceCategory,
          source: this.source,
          sourceUrl: `${SITE_BASE}/${item.name}`,
          description: item.description,
          tags: generateTags(item, docCategory),
          license: this.license,
        }
        yielded++
        continue
      }

      // Check if registry.json already includes file content
      const inlineContent = item.files[0]?.content
      let sourceCode: string

      if (inlineContent) {
        sourceCode = inlineContent
      } else {
        // Fetch from GitHub raw
        const filePath = item.files[0]?.path ?? `registry/magicui/${item.name}.tsx`
        try {
          const res = await fetchWithRetry(
            `${GITHUB_RAW_BASE}/apps/www/${filePath}`,
            { headers: githubHeaders() }
          )
          if (!res.ok) {
            console.error(`[magicui] Failed to fetch ${item.name}: ${res.status}`)
            continue
          }
          sourceCode = await res.text()
        } catch (err) {
          console.error(
            `[magicui] Failed to fetch ${item.name}: ${(err as Error).message}`
          )
          continue
        }

        // Respect rate limits
        await sleep(100)
      }

      if (!sourceCode || sourceCode.length < 10) {
        console.error(`[magicui] Empty source for ${item.name}`)
        continue
      }

      yield {
        name: item.title ?? item.name,
        html: sourceCode,
        jsx: sourceCode,
        category: docCategory,
        marketplaceCategory,
        source: this.source,
        sourceUrl: `${SITE_BASE}/${item.name}`,
        description:
          item.description ??
          `${item.title ?? item.name} — animated React component with Tailwind CSS and Framer Motion`,
        tags: generateTags(item, docCategory),
        license: this.license,
      }
      yielded++
    }
  }
}

// ── Export singleton ──────────────────────────────────────────────────

export const magicuiAdapter = new MagicUIAdapter()
