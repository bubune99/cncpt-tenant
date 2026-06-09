/**
 * AI Section Refinement — Source-Code-Aware Block Expansion
 *
 * Takes the original React/JSX source code and rough-parsed Block[] for a
 * single section, then uses AI to:
 *   - Expand .map() loops into actual block instances with real content
 *   - Replace {variable.property} placeholders with values from source data
 *   - Preserve Tailwind classes from the rough parse
 *   - Output valid Block[] JSON
 *
 * Usage:
 *   const refined = await refineSection(sourceCode, roughBlocks)
 */

import { generateObject } from "ai"
import { z } from "zod"
import { getLanguageModel } from "../ai/providers"
import type { Block, BlockTag } from "./types"

// ── Configuration ───────────────────────────────────────────────────

/** Model to use for refinement (fast + cheap, good at structured output) */
const REFINE_MODEL_ID = "anthropic/claude-sonnet-4.5"

/** Max retries on AI call failure */
const MAX_RETRIES = 2

// ── Block Schema for Zod ────────────────────────────────────────────

const blockTagSchema = z.enum([
  "div", "section", "header", "footer", "main", "nav", "aside", "article",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "img", "button",
  "ul", "ol", "li", "hr", "blockquote", "figure", "figcaption", "form",
  "input", "textarea", "label", "video", "svg",
])

const blockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    tag: blockTagSchema,
    className: z.string(),
    textContent: z.string().optional(),
    attrs: z.record(z.string(), z.string()).optional(),
    children: z.array(blockSchema).optional(),
    label: z.string().optional(),
  })
)

const refinementResultSchema = z.object({
  blocks: z.array(blockSchema),
  changes: z.array(z.string()).describe("Brief description of each change made"),
})

// ── System Prompt ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precise code-to-content converter. You receive:
1. The ORIGINAL React/JSX source code for a page or component
2. A rough-parsed Block[] JSON that was mechanically extracted from that source

The rough parse loses dynamic content — .map() loops become single placeholder blocks,
{variable.property} expressions become literal text like "{event.title}", and data arrays
defined in the source are not expanded.

Your job is to REFINE the blocks by reading the source code and:

## Rules

1. **Expand .map() iterations**: If the source maps over an array (e.g., \`events.map()\`),
   find the data array in the source and create one block per real item with actual content.

2. **Replace placeholders**: Replace text like \`{event.title}\`, \`{item.price}\`,
   \`{service.description}\` with the actual values from the source data arrays/objects.

3. **Preserve Tailwind classes**: Keep ALL className strings exactly as they are in the
   rough blocks. The mechanical parser got these right.

4. **Preserve block structure**: Don't restructure the block hierarchy. Only modify
   textContent, attrs (like src, href, alt), and expand children arrays.

5. **Keep IDs stable**: Preserve existing block IDs. For new blocks created by expanding
   loops, generate descriptive IDs like "event-item-0", "event-item-1", etc.

6. **Be conservative**: If you can't find the data in the source, leave the block as-is.
   Don't invent content. Only change blocks that clearly have placeholder text or need expansion.

7. **Image URLs**: If the source has image URLs (even relative paths), preserve them in
   attrs.src. If a placeholder like \`{item.image}\` exists, try to find the actual URL.

8. **Links**: If the source has href values, fill them into attrs.href.

## Output

Return the refined blocks array and a list of changes you made.`

// ── Core Function ───────────────────────────────────────────────────

/**
 * Refine a single section's blocks using AI + source code context.
 *
 * @param sourceCode  - The original React/JSX source for the page/component
 * @param roughBlocks - The mechanically-parsed Block[] for this section
 * @param sectionContext - Optional hint like "this is the events grid section"
 * @returns Refined Block[] with placeholders expanded
 */
export async function refineSection(
  sourceCode: string,
  roughBlocks: Block[],
  sectionContext?: string
): Promise<{ blocks: Block[]; changes: string[] }> {
  const model = getLanguageModel(REFINE_MODEL_ID)

  const userPrompt = buildUserPrompt(sourceCode, roughBlocks, sectionContext)

  const { object } = await generateObject({
    model,
    schema: refinementResultSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    maxRetries: MAX_RETRIES,
  })

  // Merge AI output back, preserving fields the AI schema doesn't cover
  // (animation, background, commerce, partialId, etc.)
  const mergedBlocks = mergeRefinedBlocks(roughBlocks, object.blocks as Block[])

  return {
    blocks: mergedBlocks,
    changes: object.changes,
  }
}

// ── Section Splitting ───────────────────────────────────────────────

/**
 * Split a page's blocks into top-level sections for independent refinement.
 * Each top-level block (usually a <section> or <div>) becomes one chunk.
 */
export function splitIntoSections(blocks: Block[]): Block[][] {
  // Each top-level block is its own section
  return blocks.map((block) => [block])
}

/**
 * Check if a section likely needs refinement (has placeholder text or
 * unexpanded loops).
 */
export function needsRefinement(blocks: Block[]): boolean {
  let found = false

  function walk(blockList: Block[]) {
    for (const block of blockList) {
      if (found) return

      // Check for JSX expression placeholders
      if (block.textContent && /\{[\w.]+\}/.test(block.textContent)) {
        found = true
        return
      }

      // Check for data-original-component stubs (unlinked components)
      if (block.attrs?.["data-original-component"]) {
        found = true
        return
      }

      // Check for placeholder image src
      if (block.attrs?.src && /\{[\w.]+\}/.test(block.attrs.src)) {
        found = true
        return
      }

      if (block.children?.length) walk(block.children)
    }
  }

  walk(blocks)
  return found
}

// ── Helpers ─────────────────────────────────────────────────────────

function buildUserPrompt(
  sourceCode: string,
  roughBlocks: Block[],
  sectionContext?: string
): string {
  const parts = [
    "## Original Source Code\n```tsx\n" + sourceCode + "\n```",
    "## Rough-Parsed Blocks (JSON)\n```json\n" + JSON.stringify(roughBlocks, null, 2) + "\n```",
  ]

  if (sectionContext) {
    parts.push(`## Section Context\n${sectionContext}`)
  }

  parts.push(
    "## Task\nRefine these blocks by reading the source code. " +
    "Expand any .map() loops into real content, replace {variable.property} " +
    "placeholders with actual values from the source data. " +
    "Keep all Tailwind classes and block structure intact."
  )

  return parts.join("\n\n")
}

/**
 * Merge AI-refined blocks back onto the originals, preserving fields
 * the AI doesn't output (animation, background, commerce, locked, hidden, etc.)
 */
function mergeRefinedBlocks(originals: Block[], refined: Block[]): Block[] {
  // Build a map of original blocks by ID for quick lookup
  const originalMap = new Map<string, Block>()
  function indexOriginals(blocks: Block[]) {
    for (const block of blocks) {
      originalMap.set(block.id, block)
      if (block.children?.length) indexOriginals(block.children)
    }
  }
  indexOriginals(originals)

  // Walk refined blocks and restore missing fields from originals
  function mergeBlock(block: Block): Block {
    const original = originalMap.get(block.id)
    const merged: Block = { ...block }

    if (original) {
      // Preserve fields the AI schema doesn't include
      if (original.animation) merged.animation = original.animation
      if (original.background) merged.background = original.background
      if (original.commerce) merged.commerce = original.commerce
      if (original.componentName) merged.componentName = original.componentName
      if (original.partialId) merged.partialId = original.partialId
      if (original.partialOverrides) merged.partialOverrides = original.partialOverrides
      if (original.hidden) merged.hidden = original.hidden
      if (original.locked) merged.locked = original.locked
      if (original.responsive) merged.responsive = original.responsive
      if (original.frameworkRequirement) merged.frameworkRequirement = original.frameworkRequirement
      if (original.parentId) merged.parentId = original.parentId
    }

    if (merged.children?.length) {
      merged.children = merged.children.map(mergeBlock)
    }

    return merged
  }

  return refined.map(mergeBlock)
}
