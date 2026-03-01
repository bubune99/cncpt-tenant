/**
 * Post-Import Block Normalization
 *
 * When importing JSX from v0.dev or external React projects, the parser
 * creates raw blocks with whatever className strings were in the source.
 * This normalizer scans each block and tries to match it against our
 * BLOCK_TEMPLATES, assigning labels and optionally merging class patterns
 * so imported blocks integrate with the editor's design system.
 *
 * Usage:
 *   const raw = importFromReact(jsxCode)
 *   const normalized = normalizeBlocks(raw.blocks)
 */

import type { Block, BlockTag, BlockTemplate } from "./types"
import { BLOCK_TEMPLATES } from "./block-templates"

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface NormalizeOptions {
  /** Minimum class overlap score to consider a match (0-1, default 0.5) */
  matchThreshold?: number
  /** If true, merge template's default classes into the block (default false) */
  mergeClasses?: boolean
}

/**
 * Normalize imported blocks by matching against BLOCK_TEMPLATES.
 * Assigns labels, optionally merges classes. Non-destructive — preserves
 * original structure and extra classes.
 */
export function normalizeBlocks(
  blocks: Block[],
  options: NormalizeOptions = {}
): Block[] {
  const { matchThreshold = 0.5, mergeClasses = false } = options
  return blocks.map((block) => normalizeBlock(block, matchThreshold, mergeClasses))
}

/* ------------------------------------------------------------------ */
/*  Core Matching Logic                                                */
/* ------------------------------------------------------------------ */

interface MatchResult {
  template: BlockTemplate
  score: number
}

function normalizeBlock(
  block: Block,
  threshold: number,
  mergeClasses: boolean
): Block {
  // Recursively normalize children first
  const children = block.children?.map((child) =>
    normalizeBlock(child, threshold, mergeClasses)
  )

  // If block already has a label (manually set or from template), keep it
  if (block.label) {
    return children ? { ...block, children } : block
  }

  // Find best matching template
  const match = findBestMatch(block)

  if (!match || match.score < threshold) {
    // No good match — infer a label from the tag and class patterns
    const inferredLabel = inferLabel(block)
    return {
      ...block,
      ...(children ? { children } : {}),
      ...(inferredLabel ? { label: inferredLabel } : {}),
    }
  }

  // Apply template match
  const result: Block = {
    ...block,
    label: match.template.label,
    ...(children ? { children } : {}),
  }

  // Optionally merge template classes
  if (mergeClasses) {
    result.className = mergeClassNames(
      match.template.defaultClassName,
      block.className
    )
  }

  return result
}

/**
 * Find the best matching template for a block.
 * Scores based on: tag match, class overlap, structure similarity.
 */
function findBestMatch(block: Block): MatchResult | null {
  const blockTokens = tokenize(block.className)
  const hasChildren = !!block.children?.length
  const hasText = !!block.textContent

  let best: MatchResult | null = null

  for (const template of BLOCK_TEMPLATES) {
    let score = 0

    // Tag match is required (weight: 0.3)
    if (!tagMatches(block.tag, template.tag)) continue
    score += 0.3

    // Class overlap (weight: 0.5)
    const templateTokens = tokenize(template.defaultClassName)
    const overlap = classOverlap(blockTokens, templateTokens)
    score += overlap * 0.5

    // Structure match (weight: 0.2)
    if (template.isContainer === hasChildren) score += 0.1
    if (template.isContainer === !hasText) score += 0.05
    if (template.defaultTextContent && hasText) score += 0.05

    if (!best || score > best.score) {
      best = { template, score }
    }
  }

  return best
}

/* ------------------------------------------------------------------ */
/*  Label Inference (fallback when no template matches)                */
/* ------------------------------------------------------------------ */

const TAG_LABELS: Partial<Record<BlockTag, string>> = {
  section: "Section",
  header: "Header",
  footer: "Footer",
  nav: "Navigation",
  main: "Main",
  aside: "Sidebar",
  article: "Article",
  figure: "Figure",
  form: "Form",
  blockquote: "Quote",
}

function inferLabel(block: Block): string | undefined {
  // Semantic tags get labels automatically
  if (TAG_LABELS[block.tag]) return TAG_LABELS[block.tag]

  const cls = block.className.toLowerCase()

  // Detect layout patterns
  if (cls.includes("grid")) {
    const cols = cls.match(/grid-cols-(\d+)/)
    return cols ? `Grid ${cols[1]}-Col` : "Grid"
  }
  if (cls.includes("flex") && cls.includes("col")) return "Flex Column"
  if (cls.includes("flex") && cls.includes("row")) return "Flex Row"
  if (cls.includes("flex")) return "Flex"

  // Detect common patterns
  if (cls.includes("container") || cls.includes("max-w-")) return "Container"
  if (cls.includes("card") || cls.includes("rounded") && cls.includes("border") && cls.includes("shadow")) return "Card"
  if (cls.includes("hero") || (block.tag === "section" && cls.includes("py-") && cls.includes("text-"))) return "Hero"

  // Heading tags
  if (block.tag.startsWith("h")) {
    const level = block.tag.slice(1)
    return `Heading ${level}`
  }

  // Other known patterns
  if (block.tag === "p") return "Paragraph"
  if (block.tag === "a") return "Link"
  if (block.tag === "img") return "Image"
  if (block.tag === "button") return "Button"
  if (block.tag === "input") return "Input"
  if (block.tag === "textarea") return "Textarea"
  if (block.tag === "label") return "Label"
  if (block.tag === "video") return "Video"
  if (block.tag === "hr") return "Divider"
  if (block.tag === "ul") return "List"
  if (block.tag === "ol") return "Ordered List"
  if (block.tag === "li") return "List Item"

  return undefined
}

/* ------------------------------------------------------------------ */
/*  Class Utilities                                                    */
/* ------------------------------------------------------------------ */

/** Split className into sorted, deduplicated tokens */
function tokenize(className: string): Set<string> {
  return new Set(
    className
      .split(/\s+/)
      .filter(Boolean)
      .map((c) => c.toLowerCase())
  )
}

/**
 * Calculate overlap between two class sets.
 * Returns 0-1 representing how much of the template's classes appear in the block.
 */
function classOverlap(blockTokens: Set<string>, templateTokens: Set<string>): number {
  if (templateTokens.size === 0) return 0

  let matches = 0
  for (const token of templateTokens) {
    // Exact match
    if (blockTokens.has(token)) {
      matches++
      continue
    }
    // Fuzzy match: same utility prefix (e.g., "py-16" matches "py-12")
    const prefix = getUtilityPrefix(token)
    if (prefix) {
      for (const bt of blockTokens) {
        if (getUtilityPrefix(bt) === prefix) {
          matches += 0.7 // Partial credit for same utility, different value
          break
        }
      }
    }
  }

  return matches / templateTokens.size
}

/** Extract the utility prefix from a Tailwind class (e.g., "py-16" → "py") */
function getUtilityPrefix(cls: string): string | null {
  // Handle responsive prefixes (sm:, md:, lg:)
  const base = cls.replace(/^(sm|md|lg|xl|2xl):/, "")
  // Handle state prefixes (hover:, focus:, etc.)
  const clean = base.replace(/^(hover|focus|active|disabled|group-hover):/, "")
  // Extract prefix before the value
  const match = clean.match(/^([a-z-]+)-/)
  return match ? match[1] : null
}

/** Check if block tag is compatible with template tag */
function tagMatches(blockTag: BlockTag, templateTag: BlockTag): boolean {
  if (blockTag === templateTag) return true
  // Allow div↔section interchangeability for layout templates
  if (
    (blockTag === "div" && templateTag === "section") ||
    (blockTag === "section" && templateTag === "div")
  ) {
    return true
  }
  return false
}

/**
 * Merge template classes with block classes.
 * Template classes provide the base, block's extra classes are appended.
 * Conflicting utilities (same prefix) use the block's value.
 */
function mergeClassNames(templateClasses: string, blockClasses: string): string {
  const templateTokens = templateClasses.split(/\s+/).filter(Boolean)
  const blockTokens = blockClasses.split(/\s+/).filter(Boolean)

  // Build a map of utility prefix → class for conflict resolution
  const prefixMap = new Map<string, string>()

  // Template classes first (lower priority)
  for (const cls of templateTokens) {
    const prefix = getUtilityPrefix(cls)
    prefixMap.set(prefix || cls, cls)
  }

  // Block classes override (higher priority)
  for (const cls of blockTokens) {
    const prefix = getUtilityPrefix(cls)
    prefixMap.set(prefix || cls, cls)
  }

  // Also include any block classes that don't have prefixes (exact matches)
  const result = new Set<string>(prefixMap.values())

  // Add remaining block classes not captured by prefix matching
  for (const cls of blockTokens) {
    if (!getUtilityPrefix(cls)) {
      result.add(cls)
    }
  }

  return [...result].join(" ")
}
