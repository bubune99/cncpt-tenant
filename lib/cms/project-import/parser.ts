/**
 * Enhanced Parser
 *
 * Component-aware JSX parsing that replaces component tags with
 * PartialReference markers before calling importFromReact().
 */

import { importFromReact } from "../block-editor/serialization"
import { preprocessForImport } from "../block-editor/preprocess"
import type { Block } from "../block-editor/types"
import type { ProjectFile } from "./scanner"
import type { ResolvedProject } from "./resolver"
import { getPageComponents, nameToSlug } from "./resolver"

// ── Types ────────────────────────────────────────────────────────────

export interface ComponentRef {
  componentName: string
  partialSlug: string
  resolvedFile: string | null
}

export interface ParsedComponent {
  file: ProjectFile
  blocks: Block[]
  errors: string[]
}

export interface ParsedPage {
  file: ProjectFile
  blocks: Block[]
  componentRefs: ComponentRef[]
  errors: string[]
}

// ── Component Parsing ────────────────────────────────────────────────

/**
 * Parse a component file into Block[].
 * Just calls importFromReact() directly — components become standard block arrays.
 */
export function parseComponent(file: ProjectFile): ParsedComponent {
  // Preprocess v0/React code before parsing
  const preprocessed = preprocessForImport(file.content)
  const { blocks, errors } = importFromReact(preprocessed.code)
  // Include any preprocessing warnings as errors
  const allErrors = [
    ...errors,
    ...preprocessed.warnings
      .filter(w => w.type === "unknown-component")
      .map(w => w.message),
  ]
  return { file, blocks, errors: allErrors }
}

// ── Page Parsing (Component-Aware) ───────────────────────────────────

/**
 * Pre-process page JSX: replace component tags with PartialReference div markers.
 */
function preprocessPageJSX(jsx: string, componentNames: Set<string>, componentSlugs: Map<string, string>): {
  processed: string
  refs: ComponentRef[]
} {
  const refs: ComponentRef[] = []

  // Replace self-closing component tags: <Header /> or <Header className="..." />
  let processed = jsx.replace(
    /<([A-Z]\w*)((?:\s+[^>]*)?)\/\s*>/g,
    (match, tagName, attrs) => {
      if (!componentNames.has(tagName)) return match
      const slug = componentSlugs.get(tagName) || nameToSlug(tagName)
      refs.push({ componentName: tagName, partialSlug: slug, resolvedFile: null })
      return `<div data-component="PartialReference" data-partial-slug="${slug}"${attrs || ""} />`
    }
  )

  // Replace opening component tags: <Header> or <Header className="...">
  processed = processed.replace(
    /<([A-Z]\w*)((?:\s+[^>]*)?)>/g,
    (match, tagName, attrs) => {
      if (!componentNames.has(tagName)) return match
      const slug = componentSlugs.get(tagName) || nameToSlug(tagName)
      if (!refs.some((r) => r.componentName === tagName && r.partialSlug === slug)) {
        refs.push({ componentName: tagName, partialSlug: slug, resolvedFile: null })
      }
      return `<div data-component="PartialReference" data-partial-slug="${slug}"${attrs || ""}>`
    }
  )

  // Replace closing component tags: </Header>
  processed = processed.replace(
    /<\/([A-Z]\w*)\s*>/g,
    (match, tagName) => {
      if (!componentNames.has(tagName)) return match
      return `</div>`
    }
  )

  return { processed, refs }
}

/**
 * Extract the JSX body from a page component source.
 * Strips imports, function declaration, and return wrapper.
 */
function extractJSXBody(code: string): string {
  let cleaned = code
    .replace(/^["']use (?:client|server)["'];?\s*/m, "")
    .replace(/import\s+.*?from\s+["'].*?["'];?\s*/g, "")
    .replace(/import\s+["'].*?["'];?\s*/g, "")
    .replace(/import\s+type\s+.*?from\s+["'].*?["'];?\s*/g, "")
    .replace(/export\s+(?:const|let)\s+metadata\s*[=:][^;]*;?\s*/g, "")
    .replace(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/g, "")
    .replace(/(?:export\s+default\s+)?(?:const|let)\s+\w+\s*=\s*\([^)]*\)\s*(?::\s*\w+\s*)?\s*=>\s*\{?\s*/g, "")
    .replace(/(?:export\s+default\s+)?(?:const|let)\s+\w+\s*=\s*\(\)\s*(?::\s*\w+\s*)?\s*=>\s*\(?\s*/g, "")
    .replace(/return\s*\(/g, "")
    .replace(/\)\s*;?\s*\}\s*$/g, "")
    .trim()

  // Remove React Fragment wrappers
  cleaned = cleaned
    .replace(/^<>\s*/, "")
    .replace(/\s*<\/>$/, "")
    .replace(/^<React\.Fragment>\s*/, "")
    .replace(/\s*<\/React\.Fragment>$/, "")

  return cleaned
}

/**
 * Parse a page file with component-aware processing.
 */
export function parsePage(
  page: ProjectFile,
  resolved: ResolvedProject
): ParsedPage {
  const errors: string[] = []

  const usedComponents = getPageComponents(page, resolved.componentMap)
  const componentNames = new Set(usedComponents)

  // Step 1: Preprocess v0/React code
  const preprocessed = preprocessForImport(page.content)

  // Step 2: Extract the JSX body
  const jsxBody = extractJSXBody(preprocessed.code)

  // Step 3: Replace component tags with PartialReference markers
  const { processed, refs } = preprocessPageJSX(jsxBody, componentNames, resolved.componentSlugs)

  // Resolve file paths for refs
  for (const ref of refs) {
    const compFile = resolved.componentMap.get(ref.componentName)
    if (compFile) ref.resolvedFile = compFile.path
  }

  // Step 4: Parse the pre-processed JSX
  const { blocks, errors: parseErrors } = importFromReact(
    `export default function TempPage() {\n  return (\n${processed}\n  )\n}`
  )

  errors.push(...parseErrors)

  // Post-process blocks: find PartialReference markers and annotate them
  annotatePartialRefs(blocks)

  return { file: page, blocks, componentRefs: refs, errors }
}

/**
 * Walk blocks and annotate PartialReference markers.
 */
function annotatePartialRefs(blocks: Block[]): void {
  for (const block of blocks) {
    if (block.attrs?.["data-component"] === "PartialReference") {
      block.componentName = "PartialReference"
      block.partialId = block.attrs["data-partial-slug"] || ""
      delete block.attrs["data-component"]
    }

    if (block.children) {
      annotatePartialRefs(block.children)
    }
  }
}

/**
 * Parse all components and pages from a resolved project.
 */
export function parseProject(resolved: ResolvedProject): {
  components: ParsedComponent[]
  pages: ParsedPage[]
  errors: string[]
} {
  const allErrors: string[] = []
  const components: ParsedComponent[] = []
  const pages: ParsedPage[] = []

  // Parse components first
  for (const comp of resolved.manifest.components) {
    try {
      const parsed = parseComponent(comp)
      components.push(parsed)
      if (parsed.errors.length > 0) {
        allErrors.push(`Component ${comp.path}: ${parsed.errors.join("; ")}`)
      }
    } catch (err) {
      allErrors.push(`Failed to parse component ${comp.path}: ${(err as Error).message}`)
    }
  }

  // Parse pages with component awareness
  for (const pagePath of resolved.pageOrder) {
    const page = resolved.manifest.pages.find((p) => p.path === pagePath)
    if (!page) continue

    try {
      const parsed = parsePage(page, resolved)
      pages.push(parsed)
      if (parsed.errors.length > 0) {
        allErrors.push(`Page ${page.path}: ${parsed.errors.join("; ")}`)
      }
    } catch (err) {
      allErrors.push(`Failed to parse page ${page.path}: ${(err as Error).message}`)
    }
  }

  return { components, pages, errors: allErrors }
}
