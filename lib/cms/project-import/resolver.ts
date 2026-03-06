/**
 * Import Resolver
 *
 * Resolves the import graph and maps component names to file paths.
 * Handles re-exports, barrel files, and default exports.
 */

import type { ProjectManifest, ProjectFile } from "./scanner"

// ── Types ────────────────────────────────────────────────────────────

/** Layout-level header/footer detection result */
export interface LayoutComponents {
  /** Component name used as header in layout.tsx (before {children}) */
  headerName: string | null
  /** Component name used as footer in layout.tsx (after {children}) */
  footerName: string | null
  /** All component names used in the layout (for stripping from page content) */
  layoutComponentNames: Set<string>
}

export interface ResolvedProject {
  manifest: ProjectManifest
  /** Component export name → source file */
  componentMap: Map<string, ProjectFile>
  /** Page files in route order (by path depth and alphabet) */
  pageOrder: string[]
  /** Slug derived from page file path */
  pageSlugs: Map<string, string>
  /** Component name → derived slug for partial */
  componentSlugs: Map<string, string>
  /** Header/footer components detected from layout.tsx */
  layout: LayoutComponents
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Convert a PascalCase or camelCase name to a kebab-case slug */
export function nameToSlug(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Derive a page slug from a file path */
function derivePageSlug(path: string): string {
  let slug = path
    .replace(/^src\//, "")
    .replace(/^(app|pages)\//, "")
    .replace(/\/?(page|index)\.(tsx?|jsx?)$/, "")
    .replace(/\.(tsx?|jsx?)$/, "")
    .replace(/\[.*?\]\/?/g, "")
    .replace(/\/+$/, "")

  if (!slug) slug = "imported-home"

  return slug
}

/** Derive a display title from a slug or export name */
export function deriveTitle(exportName: string | null, slug: string): string {
  if (exportName) {
    let name = exportName.replace(/Page$/, "")
    name = name.replace(/([a-z])([A-Z])/g, "$1 $2")
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Imported Page"
}

/** Parse re-exports from barrel/index files */
function parseReExports(content: string): { name: string; source: string }[] {
  const results: { name: string; source: string }[] = []

  const reExportRe = /export\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = reExportRe.exec(content)) !== null) {
    const [, specifiers, source] = m
    specifiers.split(",").forEach((s) => {
      const trimmed = s.trim()
      const asMatch = trimmed.match(/(?:default\s+as\s+)?(\w+)$/)
      if (asMatch) {
        results.push({ name: asMatch[1], source })
      }
    })
  }

  return results
}

// ── Layout Analysis ──────────────────────────────────────────────────

const HEADER_PATTERNS = [/^header$/i, /^nav(?:bar|igation)?$/i, /^top-?bar$/i, /^site-?header$/i, /^app-?header$/i]
const FOOTER_PATTERNS = [/^footer$/i, /^bottom-?bar$/i, /^site-?footer$/i, /^app-?footer$/i]

function isHeaderName(name: string): boolean {
  return HEADER_PATTERNS.some((p) => p.test(name))
}

function isFooterName(name: string): boolean {
  return FOOTER_PATTERNS.some((p) => p.test(name))
}

function analyzeLayout(layouts: ProjectFile[], componentMap: Map<string, ProjectFile>): LayoutComponents {
  const result: LayoutComponents = {
    headerName: null,
    footerName: null,
    layoutComponentNames: new Set(),
  }

  if (layouts.length === 0) return result

  const layout = layouts.sort((a, b) => a.path.length - b.path.length)[0]

  for (const imp of layout.imports) {
    for (const spec of imp.specifiers) {
      if (componentMap.has(spec)) {
        result.layoutComponentNames.add(spec)
      }
    }
  }

  // Strategy 1: Name-based detection
  for (const name of result.layoutComponentNames) {
    if (!result.headerName && isHeaderName(name)) result.headerName = name
    if (!result.footerName && isFooterName(name)) result.footerName = name
  }

  // Strategy 2: Position-based detection (before/after {children})
  if (!result.headerName || !result.footerName) {
    const childrenIdx = layout.content.indexOf("{children}")
    if (childrenIdx !== -1) {
      const beforeChildren = layout.content.slice(0, childrenIdx)
      const afterChildren = layout.content.slice(childrenIdx)

      for (const name of result.layoutComponentNames) {
        const tagPattern = new RegExp(`<${name}[\\s/>]`)
        if (!result.headerName && tagPattern.test(beforeChildren)) {
          result.headerName = name
        }
        if (!result.footerName && tagPattern.test(afterChildren)) {
          result.footerName = name
        }
      }
    }
  }

  return result
}

// ── Main Resolver ────────────────────────────────────────────────────

export function resolveProject(manifest: ProjectManifest): ResolvedProject {
  const componentMap = new Map<string, ProjectFile>()
  const componentSlugs = new Map<string, string>()
  const pageSlugs = new Map<string, string>()

  for (const comp of manifest.components) {
    const name = comp.exportName
    if (name && !componentMap.has(name)) {
      componentMap.set(name, comp)
      componentSlugs.set(name, nameToSlug(name))
    }
  }

  // Handle barrel files / re-exports
  for (const comp of manifest.components) {
    if (!comp.path.match(/\/index\.(tsx?|jsx?)$/)) continue
    const reExports = parseReExports(comp.content)
    for (const { name } of reExports) {
      if (!componentMap.has(name)) {
        for (const otherComp of manifest.components) {
          if (otherComp.exportName === name) {
            componentMap.set(name, otherComp)
            componentSlugs.set(name, nameToSlug(name))
            break
          }
        }
      }
    }
  }

  // Also map component names found via page and layout imports
  for (const file of [...manifest.pages, ...manifest.layouts]) {
    for (const imp of file.imports) {
      if (!imp.resolvedPath) continue
      for (const specifier of imp.specifiers) {
        if (componentMap.has(specifier)) continue
        const compFile = manifest.components.find((c) => c.path === imp.resolvedPath)
        if (compFile) {
          componentMap.set(specifier, compFile)
          componentSlugs.set(specifier, nameToSlug(specifier))
        }
      }
    }
  }

  // Derive page slugs
  for (const page of manifest.pages) {
    pageSlugs.set(page.path, derivePageSlug(page.path))
  }

  const pageOrder = manifest.pages
    .map((p) => p.path)
    .sort((a, b) => {
      const depthA = a.split("/").length
      const depthB = b.split("/").length
      if (depthA !== depthB) return depthA - depthB
      return a.localeCompare(b)
    })

  const layout = analyzeLayout(manifest.layouts, componentMap)

  return {
    manifest,
    componentMap,
    pageOrder,
    pageSlugs,
    componentSlugs,
    layout,
  }
}

/**
 * Get the list of component names that a page file uses.
 * Returns only components that exist in our component map.
 */
export function getPageComponents(
  page: ProjectFile,
  componentMap: Map<string, ProjectFile>
): string[] {
  const used: string[] = []

  for (const imp of page.imports) {
    for (const specifier of imp.specifiers) {
      if (componentMap.has(specifier)) {
        used.push(specifier)
      }
    }
  }

  return used
}
