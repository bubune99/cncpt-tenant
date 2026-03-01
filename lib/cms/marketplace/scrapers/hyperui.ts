/**
 * HyperUI Scraper Adapter
 *
 * Fetches open-source Tailwind CSS components from HyperUI's GitHub repository.
 *
 * Structure:
 *   - MDX metadata:  src/content/collection/{category}/{slug}.mdx
 *   - HTML files:    public/components/{category}/{slug}/{n}.html
 *
 * Each MDX file has frontmatter with title, description, slug, category,
 * and a components[] array mapping by index to numbered HTML files.
 * HTML files are full pages — we extract the <body> innerHTML.
 *
 * @see https://github.com/markmead/hyperui
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

const REPO_OWNER = "markmead"
const REPO_NAME = "hyperui"
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`
const SITE_BASE = "https://www.hyperui.dev/components"

/** Top-level categories in HyperUI */
const CATEGORIES = ["marketing", "application", "neobrutalism"] as const
type HyperUICategory = (typeof CATEGORIES)[number]

/** Map HyperUI sub-category slugs to marketplace categories */
const CATEGORY_MAP: Record<string, string> = {
  // Marketing
  announcements: "alerts",
  banners: "banners",
  "blog-cards": "blog",
  buttons: "buttons",
  cards: "cards",
  carts: "commerce",
  "contact-forms": "forms",
  ctas: "cta",
  "empty-content": "empty-states",
  faqs: "faq",
  "feature-grids": "features",
  footers: "footers",
  headers: "headers",
  "logo-clouds": "logos",
  "newsletter-signup": "forms",
  polls: "forms",
  pricing: "pricing",
  "product-cards": "commerce",
  "product-collections": "commerce",
  sections: "sections",
  stats: "stats",
  "team-sections": "team",

  // Application
  accordions: "accordions",
  badges: "badges",
  breadcrumbs: "breadcrumbs",
  "button-groups": "buttons",
  checkboxes: "forms",
  "details-list": "lists",
  dividers: "dividers",
  dropdown: "dropdowns",
  "empty-states": "empty-states",
  "file-uploaders": "forms",
  filters: "filters",
  grids: "grids",
  inputs: "forms",
  loaders: "loaders",
  media: "media",
  modals: "modals",
  pagination: "pagination",
  "progress-bars": "progress",
  "quantity-inputs": "forms",
  "radio-groups": "forms",
  "range-inputs": "forms",
  selects: "forms",
  "side-menu": "navigation",
  "skip-links": "navigation",
  steps: "steps",
  tables: "tables",
  tabs: "tabs",
  textareas: "forms",
  timelines: "timelines",
  toasts: "alerts",
  toggles: "toggles",
  "vertical-menu": "navigation",

  // Neobrutalism (style variants of standard components)
  alerts: "alerts",
}

// ── MDX Frontmatter Parser (lightweight, no external deps) ────────────

interface ComponentMeta {
  title: string
  dark?: boolean
}

interface MDXFrontmatter {
  title: string
  description: string
  category: string
  slug: string
  components: ComponentMeta[]
}

function parseMDXFrontmatter(content: string): MDXFrontmatter | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return null

  const yaml = fmMatch[1]

  // Extract simple fields
  const title = yaml.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? ""
  const description = yaml.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? ""
  const category = yaml.match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? ""
  const slug = yaml.match(/^slug:\s*(.+)$/m)?.[1]?.trim() ?? ""

  // Extract components array (inline YAML objects)
  const components: ComponentMeta[] = []
  const compLines = yaml.split("\n")
  let inComponents = false

  for (const line of compLines) {
    if (line.match(/^components:\s*$/)) {
      inComponents = true
      continue
    }
    if (inComponents) {
      // Stop at next top-level key
      if (line.match(/^\w/) && !line.startsWith(" ") && !line.startsWith("-")) {
        inComponents = false
        continue
      }
      // Parse: - { title: '...', dark: true }
      const itemMatch = line.match(
        /^\s*-\s*\{\s*title:\s*['"](.+?)['"](?:.*?dark:\s*(true))?/
      )
      if (itemMatch) {
        components.push({
          title: itemMatch[1],
          dark: itemMatch[2] === "true",
        })
      }
      // Handle multi-line titles with continuation
      // e.g., - { title: 'Options with tier, price, features and call to action with highlighted
      //            option' }
      if (!itemMatch) {
        const multilineStart = line.match(/^\s*-\s*\{\s*title:\s*['"](.+)$/)
        if (multilineStart) {
          // Peek - this is a multi-line title, capture what we have
          components.push({
            title: multilineStart[1].replace(/['",}\s]+$/, "").trim(),
          })
        }
      }
    }
  }

  return { title, description, category, slug, components }
}

// ── GitHub API Helpers ────────────────────────────────────────────────

interface GHFile {
  name: string
  type: "file" | "dir"
}

async function fetchGitHubDir(path: string): Promise<GHFile[]> {
  const url = `${GITHUB_API_BASE}/${path}`
  const res = await fetchWithRetry(url, {
    headers: githubHeaders(),
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${url}`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data.map((item: { name: string; type: string }) => ({
    name: item.name,
    type: item.type as "file" | "dir",
  }))
}

async function fetchRawFile(path: string): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${path}`
  const res = await fetchWithRetry(url)
  if (!res.ok) {
    throw new Error(`Raw fetch ${res.status}: ${url}`)
  }
  return res.text()
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "cncpt-template-scraper/1.0",
  }
  // Use GitHub token if available for higher rate limits
  // Must look like a real token (ghp_/gho_/github_pat_ prefix, 30+ chars)
  const token = process.env.GITHUB_TOKEN
  if (token && token.length > 30 && /^(ghp_|gho_|github_pat_)/.test(token)) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// ── Network Helpers ───────────────────────────────────────────────────

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

      // Rate limited — back off and retry
      if (res.status === 403 || res.status === 429) {
        const retryAfter = res.headers.get("retry-after")
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * (attempt + 1)
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

// ── HTML Extraction ───────────────────────────────────────────────────

/**
 * Extract the component HTML from a full HyperUI HTML page.
 * The component content is inside <body>...</body>, minus any <script> tags.
 */
function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!bodyMatch) return html

  let content = bodyMatch[1]
    // Remove script tags
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Remove link tags
    .replace(/<link[^>]*>/gi, "")
    // Remove meta tags
    .replace(/<meta[^>]*>/gi, "")
    .trim()

  return content
}

// ── Slug Generator ────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// ── HyperUI Adapter ──────────────────────────────────────────────────

export class HyperUIAdapter implements ScraperAdapter {
  name = "HyperUI"
  source = "hyperui"
  license = "MIT"
  attributionUrl = "https://www.hyperui.dev"

  /**
   * List all available categories and their sub-categories
   * by reading the GitHub repo structure and MDX metadata.
   */
  async getCategories(): Promise<ScraperCategory[]> {
    const categories: ScraperCategory[] = []

    for (const cat of CATEGORIES) {
      try {
        // List MDX files for this category
        const mdxFiles = await fetchGitHubDir(`src/content/collection/${cat}`)
        const subcategories: ScraperSubcategory[] = []

        for (const file of mdxFiles) {
          if (!file.name.endsWith(".mdx")) continue
          const slug = file.name.replace(".mdx", "")

          try {
            // Fetch MDX to get metadata
            const mdx = await fetchRawFile(`src/content/collection/${cat}/${file.name}`)
            const fm = parseMDXFrontmatter(mdx)

            // Count HTML files for this component
            const htmlFiles = await fetchGitHubDir(`public/components/${cat}/${slug}`)
            const componentCount = htmlFiles.filter(
              (f) => f.name.endsWith(".html") && !f.name.includes("-dark")
            ).length

            subcategories.push({
              slug,
              name: fm?.title ?? slug,
              componentCount,
            })
          } catch {
            // Skip if can't read this subcategory
          }
        }

        categories.push({
          slug: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
          subcategories,
        })
      } catch {
        // Skip if category listing fails
      }
    }

    return categories
  }

  /**
   * Scrape HyperUI components as an async generator.
   * Yields individual ScrapedTemplate objects.
   */
  async *scrape(options: ScrapeOptions = {}): AsyncGenerator<ScrapedTemplate, void, undefined> {
    const {
      category,
      subcategory,
      limit,
      dryRun = false,
      includeDark = false,
    } = options

    let yielded = 0

    // Determine which categories to scrape
    const categoriesToScrape = category
      ? CATEGORIES.filter((c) => c === category)
      : [...CATEGORIES]

    for (const cat of categoriesToScrape) {
      if (limit && yielded >= limit) break

      // List sub-category MDX files
      let mdxFiles: GHFile[]
      try {
        mdxFiles = await fetchGitHubDir(`src/content/collection/${cat}`)
      } catch {
        console.error(`[hyperui] Failed to list category: ${cat}`)
        continue
      }

      for (const mdxFile of mdxFiles) {
        if (limit && yielded >= limit) break
        if (!mdxFile.name.endsWith(".mdx")) continue

        const slug = mdxFile.name.replace(".mdx", "")

        // Filter by subcategory if specified
        if (subcategory && slug !== subcategory) continue

        // Fetch MDX for metadata
        let fm: MDXFrontmatter | null = null
        try {
          const mdxContent = await fetchRawFile(`src/content/collection/${cat}/${mdxFile.name}`)
          fm = parseMDXFrontmatter(mdxContent)
        } catch {
          console.error(`[hyperui] Failed to fetch MDX: ${cat}/${slug}`)
          continue
        }

        if (!fm) continue

        // List HTML variants for this component
        let htmlFiles: GHFile[]
        try {
          htmlFiles = await fetchGitHubDir(`public/components/${cat}/${slug}`)
        } catch {
          console.error(`[hyperui] Failed to list HTML files: ${cat}/${slug}`)
          continue
        }

        // Filter to non-dark HTML files (or include dark if requested)
        const variants = htmlFiles.filter((f) => {
          if (!f.name.endsWith(".html")) return false
          if (!includeDark && f.name.includes("-dark")) return false
          return true
        })

        for (const variant of variants) {
          if (limit && yielded >= limit) break

          const isDark = variant.name.includes("-dark")
          const variantNum = parseInt(variant.name.replace("-dark", "").replace(".html", ""), 10)

          // Get component title from MDX metadata
          const compMeta = fm.components[variantNum - 1]
          const compTitle = compMeta?.title ?? `${fm.title} ${variantNum}`
          const templateName = isDark
            ? `${fm.title} - ${compTitle} (Dark)`
            : `${fm.title} - ${compTitle}`

          if (dryRun) {
            yield {
              name: templateName,
              html: "", // Skip fetching in dry-run
              category: `${cat}/${slug}`,
              marketplaceCategory: CATEGORY_MAP[slug] ?? slug,
              source: this.source,
              sourceUrl: `${SITE_BASE}/${cat}/${slug}`,
              description: fm.description,
              tags: [cat, slug, ...(fm.title ? [fm.title.toLowerCase()] : [])],
              variant: variantNum,
              isDark,
              license: this.license,
            }
            yielded++
            continue
          }

          // Fetch the actual HTML
          let html: string
          try {
            const rawHtml = await fetchRawFile(`public/components/${cat}/${slug}/${variant.name}`)
            html = extractBodyContent(rawHtml)
          } catch (err) {
            console.error(
              `[hyperui] Failed to fetch HTML: ${cat}/${slug}/${variant.name}: ${(err as Error).message}`
            )
            continue
          }

          yield {
            name: templateName,
            html,
            category: `${cat}/${slug}`,
            marketplaceCategory: CATEGORY_MAP[slug] ?? slug,
            source: this.source,
            sourceUrl: `${SITE_BASE}/${cat}/${slug}`,
            description: fm.description,
            tags: generateTags(cat, slug, fm.title, compTitle),
            variant: variantNum,
            isDark,
            license: this.license,
          }
          yielded++
        }
      }
    }
  }
}

// ── Tag Generation ────────────────────────────────────────────────────

function generateTags(
  category: string,
  subcategory: string,
  title: string,
  variantTitle: string
): string[] {
  const tags = new Set<string>()

  tags.add(category)
  tags.add(subcategory)
  tags.add("tailwind")
  tags.add("hyperui")

  // Add marketplace category
  const mapped = CATEGORY_MAP[subcategory]
  if (mapped && mapped !== subcategory) tags.add(mapped)

  // Extract keywords from titles
  const words = `${title} ${variantTitle}`
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  for (const w of words) tags.add(w)

  return [...tags]
}

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "are", "was",
  "has", "have", "will", "can", "all", "not", "but", "its", "our",
  "out", "use", "your", "they", "been", "each", "which", "their",
  "option", "options",
])

// ── Export singleton ──────────────────────────────────────────────────

export const hyperuiAdapter = new HyperUIAdapter()
