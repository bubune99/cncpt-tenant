/**
 * Dependency Context for Kofi
 *
 * Extracts and formats component dependency information from imported projects
 * so Kofi can understand what imported components render as concrete HTML.
 *
 * Key capability: CVA (class-variance-authority) variant resolution.
 * Given `<Button variant="destructive" size="lg">`, this module resolves it to
 * the concrete Tailwind classes: `inline-flex items-center ... bg-destructive ... h-10 px-6`.
 * Kofi can then produce the exact block equivalent without guessing.
 *
 * Uses parseImports() from project-import/scanner.ts to extract imports,
 * then resolves component files to build a compact manifest.
 */

import type { ProjectFile } from "../project-import/scanner"
import { parseImports } from "../project-import/scanner"
import { getPageComponents } from "../project-import/resolver"

// ── Types ────────────────────────────────────────────────────────────

/** Map of variant values to their Tailwind classes: e.g. { destructive: "bg-destructive text-white ..." } */
export type VariantValueMap = Record<string, string>

/** Full variant schema for a component: e.g. { variant: { default: "...", destructive: "..." }, size: { sm: "...", lg: "..." } } */
export type VariantMap = Record<string, VariantValueMap>

export interface ComponentDep {
  file: string
  /** Primary HTML tag this component renders */
  renders: string
  /** Base Tailwind classes (always applied regardless of variants) */
  defaultClasses: string
  /** CVA variant definitions — maps prop names to { value: classes } */
  variants?: VariantMap
  /** Default variant values when no props are specified */
  defaultVariants?: Record<string, string>
  /** Notable prop names (non-variant) */
  props?: string[]
}

export interface HookDep {
  file: string
  description: string
}

export interface SourceDeps {
  components: Record<string, ComponentDep>
  hooks?: Record<string, HookDep>
  /** Raw import sources we couldn't resolve */
  unresolved?: string[]
}

export interface ImportInfo {
  specifiers: string[]
  source: string
  isLocal: boolean
}

// ── CVA Variant Parser ───────────────────────────────────────────────

interface CvaParseResult {
  baseClasses: string
  variants: VariantMap
  defaultVariants: Record<string, string>
}

/**
 * Parse a cva() call from component source code.
 *
 * Handles the standard shadcn/ui pattern:
 * ```
 * const buttonVariants = cva(
 *   "base classes here",
 *   {
 *     variants: { variant: { default: "...", destructive: "..." }, size: { sm: "...", lg: "..." } },
 *     defaultVariants: { variant: "default", size: "default" }
 *   }
 * )
 * ```
 *
 * Uses a brace-counting approach to extract the full cva() argument,
 * then parses the variants object structure.
 */
export function parseCvaCall(content: string): CvaParseResult | null {
  // Find cva( start position
  const cvaIdx = content.indexOf("cva(")
  if (cvaIdx === -1) return null

  // Extract the full cva(...) argument body using brace/paren counting
  const startParen = cvaIdx + 3 // index of '('
  const cvaBody = extractBalancedBody(content, startParen)
  if (!cvaBody) return null

  // --- Extract base classes (first string argument) ---
  const baseClasses = extractFirstString(cvaBody)

  // --- Extract variants object ---
  const variants: VariantMap = {}
  const defaultVariants: Record<string, string> = {}

  // Find the variants: { ... } block
  const variantsBlockMatch = cvaBody.match(/variants\s*:\s*\{/)
  if (variantsBlockMatch && variantsBlockMatch.index !== undefined) {
    const variantsStart = cvaBody.indexOf("{", variantsBlockMatch.index + variantsBlockMatch[0].length - 1)
    const variantsBody = extractBalancedBody(cvaBody, variantsStart)
    if (variantsBody) {
      parseVariantsObject(variantsBody, variants)
    }
  }

  // Find the defaultVariants: { ... } block
  const defaultsMatch = cvaBody.match(/defaultVariants\s*:\s*\{/)
  if (defaultsMatch && defaultsMatch.index !== undefined) {
    const defaultsStart = cvaBody.indexOf("{", defaultsMatch.index + defaultsMatch[0].length - 1)
    const defaultsBody = extractBalancedBody(cvaBody, defaultsStart)
    if (defaultsBody) {
      // Parse simple key: "value" pairs
      const pairRe = /(\w+)\s*:\s*["']([^"']+)["']/g
      let pm: RegExpExecArray | null
      while ((pm = pairRe.exec(defaultsBody)) !== null) {
        defaultVariants[pm[1]] = pm[2]
      }
    }
  }

  return {
    baseClasses,
    variants: Object.keys(variants).length > 0 ? variants : {},
    defaultVariants,
  }
}

/**
 * Extract a balanced body from an opening delimiter (brace or paren).
 * Returns the content between the delimiters (exclusive).
 */
function extractBalancedBody(content: string, openIdx: number): string | null {
  const openChar = content[openIdx]
  const closeChar = openChar === "{" ? "}" : openChar === "(" ? ")" : openChar === "[" ? "]" : null
  if (!closeChar) return null

  let depth = 0
  let inString: string | null = null
  let escaped = false

  for (let i = openIdx; i < content.length; i++) {
    const ch = content[i]

    if (escaped) { escaped = false; continue }
    if (ch === "\\") { escaped = true; continue }

    // Track string boundaries
    if (!inString && (ch === '"' || ch === "'" || ch === "`")) {
      inString = ch
      continue
    }
    if (inString && ch === inString) {
      inString = null
      continue
    }
    if (inString) continue

    if (ch === openChar) depth++
    if (ch === closeChar) {
      depth--
      if (depth === 0) {
        return content.slice(openIdx + 1, i)
      }
    }
  }

  return null
}

/** Extract the first string literal (single/double/template) from a code fragment */
function extractFirstString(code: string): string {
  // Match "..." or '...' (not template literals — those may have interpolation)
  const match = code.match(/^[\s\S]*?["']([^"']*(?:["'][^"']*)*?)["']/)
  if (match) {
    // For multi-line base classes, collapse whitespace
    return match[1].replace(/\s+/g, " ").trim()
  }
  // Try template literal (backtick) without interpolation
  const tmplMatch = code.match(/`([^`]*)`/)
  if (tmplMatch) {
    return tmplMatch[1].replace(/\s+/g, " ").trim()
  }
  return ""
}

/**
 * Parse the inner body of a `variants: { ... }` object.
 *
 * Structure: { variantName: { valueName: "classes", ... }, ... }
 * Each variant group is a nested object we parse via brace-counting.
 */
function parseVariantsObject(body: string, out: VariantMap): void {
  // Find each top-level key: { ... } pair
  // We iterate through looking for `identifier:` followed by `{`
  const keyRe = /(\w[\w-]*)\s*:\s*\{/g
  let km: RegExpExecArray | null

  while ((km = keyRe.exec(body)) !== null) {
    const variantName = km[1]
    const braceStart = body.indexOf("{", km.index + km[0].length - 1)
    const innerBody = extractBalancedBody(body, braceStart)
    if (!innerBody) continue

    const values: VariantValueMap = {}

    // Parse value: "classes" pairs inside this variant group
    // Handle both regular keys and quoted keys (e.g. "icon-sm": "...")
    const valuePairRe = /["']?([\w-]+)["']?\s*:\s*["'`]([^"'`]*?)["'`]/g
    let vm: RegExpExecArray | null
    while ((vm = valuePairRe.exec(innerBody)) !== null) {
      values[vm[1]] = vm[2].replace(/\s+/g, " ").trim()
    }

    if (Object.keys(values).length > 0) {
      out[variantName] = values
    }

    // Advance the regex past this variant's closing brace to avoid re-matching
    keyRe.lastIndex = braceStart + (innerBody?.length ?? 0) + 2
  }
}

// ── Resolve concrete classes for a prop combination ──────────────────

/**
 * Resolve a component usage to concrete Tailwind classes.
 *
 * Given a ComponentDep and a set of props (e.g. { variant: "destructive", size: "lg" }),
 * returns the full merged class string that the component would render.
 *
 * This is the core translation Kofi uses: component props → concrete classes.
 */
export function resolveVariantClasses(
  dep: ComponentDep,
  props?: Record<string, string>
): string {
  const parts: string[] = []

  // Always include base classes
  if (dep.defaultClasses) {
    parts.push(dep.defaultClasses)
  }

  if (!dep.variants) return parts.join(" ")

  // For each variant dimension, pick the value from props > defaultVariants > skip
  for (const [variantName, valueMap] of Object.entries(dep.variants)) {
    const value = props?.[variantName] ?? dep.defaultVariants?.[variantName]
    if (value && valueMap[value]) {
      parts.push(valueMap[value])
    }
  }

  return parts.join(" ")
}

// ── Extract import names from source code ────────────────────────────

/**
 * Extract structured import info from a source code string.
 * Works on any source code — no project context needed.
 */
export function extractImportNames(sourceCode: string): ImportInfo[] {
  const results: ImportInfo[] = []

  // Use parseImports for local imports (it skips node_modules)
  const localImports = parseImports(sourceCode)
  for (const imp of localImports) {
    results.push({
      specifiers: imp.specifiers,
      source: imp.source,
      isLocal: true,
    })
  }

  // Also capture external (node_modules) imports for unresolved context
  const importRe = /import\s+(?:(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\}\s*)?(?:\*\s+as\s+(\w+)\s*)?)\s*(?:from\s+)?["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = importRe.exec(sourceCode)) !== null) {
    const [, defaultImport, namedImports, starImport, source] = m
    // Skip local imports (already handled above)
    if (source.startsWith(".") || source.startsWith("@/") || source.startsWith("~/")) continue

    const specifiers: string[] = []
    if (defaultImport) specifiers.push(defaultImport)
    if (starImport) specifiers.push(starImport)
    if (namedImports) {
      namedImports.split(",").forEach((s) => {
        const name = s.trim().split(/\s+as\s+/).pop()?.trim()
        if (name) specifiers.push(name)
      })
    }
    if (specifiers.length > 0) {
      results.push({ specifiers, source, isLocal: false })
    }
  }

  return results
}

// ── Build dependency manifest during project import ──────────────────

/** Extract the primary rendered tag from a component's source code */
function extractPrimaryTag(content: string): string {
  // Find the return statement's outermost JSX tag
  // Match: return ( <tag or return <tag
  const returnMatch = content.match(/return\s*\(?[\s\n]*<(\w+)/)
  if (returnMatch) {
    const tag = returnMatch[1].toLowerCase()
    const htmlTags = new Set([
      "div", "section", "header", "footer", "main", "nav", "aside", "article",
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "img", "button",
      "ul", "ol", "li", "hr", "form", "input", "textarea", "label", "video",
      "figure", "figcaption", "blockquote", "table", "svg",
    ])
    if (htmlTags.has(tag)) return tag
  }
  // For components using Slot/Comp pattern (shadcn), look for the underlying element
  const compMatch = content.match(/<Comp[\s\S]*?/)
  if (compMatch) {
    // shadcn Button pattern: renders as <button> via asChild/Slot
    // Check if it's a button component by name or className
    if (content.includes("ButtonHTMLAttributes") || content.includes("button")) return "button"
    if (content.includes("AnchorHTMLAttributes") || content.includes("HTMLAnchorElement")) return "a"
    if (content.includes("InputHTMLAttributes") || content.includes("HTMLInputElement")) return "input"
  }
  return "div"
}

/** Extract prop names from a component function signature (excluding variant props) */
function extractNonVariantProps(content: string, variantNames: Set<string>): string[] {
  const propsMatch = content.match(/(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*)\s*\(\s*\{([^}]+)\}/)
  if (!propsMatch) return []

  return propsMatch[1]
    .split(",")
    .map((p) => p.trim().split(/[=:]/)[0].trim())
    .filter((p) =>
      p &&
      !p.startsWith("...") &&
      p !== "children" &&
      p !== "className" &&
      p !== "ref" &&
      !variantNames.has(p)
    )
    .slice(0, 10)
}

/**
 * Build a SourceDeps manifest for a page from its imports and the project's component map.
 * Called during project import when full project context is available.
 *
 * For each component, extracts:
 * - Primary HTML tag
 * - CVA base classes + variant definitions + default variant values
 * - Non-variant prop names
 */
export function buildDependencyManifest(
  page: ProjectFile,
  componentMap: Map<string, ProjectFile>
): SourceDeps {
  const deps: SourceDeps = { components: {} }
  const unresolved: string[] = []

  // Get components this page uses
  const usedComponents = getPageComponents(page, componentMap)

  for (const name of usedComponents) {
    const compFile = componentMap.get(name)
    if (!compFile) continue

    // Try CVA extraction first — it gives us structured variant data
    const cva = parseCvaCall(compFile.content)

    if (cva && (cva.baseClasses || Object.keys(cva.variants).length > 0)) {
      const variantNames = new Set(Object.keys(cva.variants))

      deps.components[name] = {
        file: compFile.path,
        renders: extractPrimaryTag(compFile.content),
        defaultClasses: cva.baseClasses,
        variants: Object.keys(cva.variants).length > 0 ? cva.variants : undefined,
        defaultVariants: Object.keys(cva.defaultVariants).length > 0 ? cva.defaultVariants : undefined,
        props: extractNonVariantProps(compFile.content, variantNames),
      }
    } else {
      // Fallback: extract classes heuristically (non-cva components)
      deps.components[name] = {
        file: compFile.path,
        renders: extractPrimaryTag(compFile.content),
        defaultClasses: extractDefaultClassesFallback(compFile.content),
        props: extractNonVariantProps(compFile.content, new Set()),
      }
    }

    // Clean up empty optional fields
    const dep = deps.components[name]
    if (dep.props?.length === 0) delete dep.props
    if (!dep.variants) delete dep.variants
    if (!dep.defaultVariants) delete dep.defaultVariants
  }

  // Track external imports as unresolved
  for (const imp of page.imports) {
    if (!imp.resolvedPath && imp.source) {
      if (!imp.source.startsWith(".") && !imp.source.startsWith("@/") && !imp.source.startsWith("~/")) {
        unresolved.push(imp.source)
      }
    }
  }

  // Also add external imports from the source (parseImports skips them)
  const externalImports = extractImportNames(page.content).filter((i) => !i.isLocal)
  for (const ext of externalImports) {
    if (!unresolved.includes(ext.source)) {
      unresolved.push(ext.source)
    }
  }

  if (unresolved.length > 0) {
    deps.unresolved = unresolved
  }

  return deps
}

/** Fallback class extraction for non-CVA components */
function extractDefaultClassesFallback(content: string): string {
  const classPatterns = [
    /className="([^"]+)"/g,
    /className=\{cn\(\s*"([^"]+)"/g,
    /className=\{`([^`]+)`\}/g,
    /className=\{clsx\(\s*"([^"]+)"/g,
  ]

  const allClasses: string[] = []
  for (const pattern of classPatterns) {
    let cm: RegExpExecArray | null
    while ((cm = pattern.exec(content)) !== null) {
      allClasses.push(cm[1].trim())
    }
  }

  if (allClasses.length === 0) return ""
  const root = allClasses[0]
  return root.length > 120 ? root.slice(0, 120) + "..." : root
}

// ── Format for Kofi's prompt ─────────────────────────────────────────

/**
 * Format a SourceDeps manifest as a compact reference for Kofi's system prompt.
 *
 * For CVA components, outputs a variant lookup table so Kofi can directly
 * resolve `<Button variant="destructive" size="lg">` → concrete classes
 * without needing to guess or hallucinate styles.
 */
export function formatDepsForPrompt(sourceDeps: SourceDeps): string {
  const lines: string[] = [
    "## Component → Block Translation Table",
    "Use this to convert imported components into concrete HTML blocks with exact Tailwind classes.\n",
  ]

  const entries = Object.entries(sourceDeps.components || {})
  if (entries.length === 0 && !sourceDeps.unresolved?.length) {
    return ""
  }

  for (const [name, dep] of entries) {
    lines.push(`### ${name}`)
    lines.push(`- **Tag**: \`<${dep.renders}>\``)
    if (dep.defaultClasses) {
      lines.push(`- **Base classes**: \`${dep.defaultClasses}\``)
    }

    // Render variant table
    if (dep.variants && Object.keys(dep.variants).length > 0) {
      lines.push("- **Variants** (prop → additional classes):")

      for (const [variantName, values] of Object.entries(dep.variants)) {
        const defaultVal = dep.defaultVariants?.[variantName]
        for (const [valueName, classes] of Object.entries(values)) {
          const isDefault = defaultVal === valueName ? " *(default)*" : ""
          lines.push(`  - \`${variantName}="${valueName}"\`${isDefault}: \`${classes}\``)
        }
      }
    }

    // Show default resolution as a quick reference
    if (dep.variants && dep.defaultVariants && Object.keys(dep.defaultVariants).length > 0) {
      const resolved = resolveVariantClasses(dep)
      lines.push(`- **Default resolution** (no props): \`${resolved}\``)
    }

    if (dep.props && dep.props.length > 0) {
      lines.push(`- **Other props**: ${dep.props.join(", ")}`)
    }

    lines.push("") // blank line between components
  }

  // Usage instructions for Kofi
  lines.push("### How to use this table")
  lines.push("When the source code has `<ComponentName prop=\"value\">text</ComponentName>`, translate it to a block:")
  lines.push("1. Use the **Tag** as the block's `tag`")
  lines.push("2. Start with **Base classes**")
  lines.push("3. Append the classes for each variant prop value")
  lines.push("4. Set `textContent` from the component's children")
  lines.push("Example: `<Button variant=\"destructive\" size=\"lg\">Delete</Button>` → look up Button's base + destructive + lg classes")

  if (sourceDeps.unresolved && sourceDeps.unresolved.length > 0) {
    lines.push(`\n**Unresolved external imports** (render with reasonable defaults): ${sourceDeps.unresolved.join(", ")}`)
  }

  return lines.join("\n")
}

/**
 * Format extracted import names (fallback when no full SourceDeps available).
 */
export function formatImportNamesForPrompt(imports: ImportInfo[]): string {
  if (imports.length === 0) return ""

  const lines: string[] = ["## Import Context", "The source code imports the following (no resolved details available):\n"]

  const local = imports.filter((i) => i.isLocal)
  const external = imports.filter((i) => !i.isLocal)

  if (local.length > 0) {
    lines.push("Local components/modules:")
    for (const imp of local) {
      lines.push(`- ${imp.specifiers.join(", ")} from \`${imp.source}\``)
    }
  }

  if (external.length > 0) {
    lines.push(`\nExternal libraries: ${external.map((i) => i.source).join(", ")}`)
  }

  return lines.join("\n")
}
