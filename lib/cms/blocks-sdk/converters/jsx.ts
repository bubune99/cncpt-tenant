/**
 * Block SDK - JSX Converter
 *
 * Bidirectional conversion between JSX strings and Block[] trees.
 * Uses the existing serialization functions but wraps them with SDK types.
 */

import type { Block } from "../types"
import type { JSXConverterOptions } from "../types"
import { generateId } from "../utils"
import {
  serializeBlocksToJSX as _serializeToJSX,
  parseJSXToBlocks as _parseFromJSX
} from "@/lib/cms/block-editor/serialization"

/**
 * Convert a JSX string to Block[] tree
 *
 * @example
 * ```ts
 * const blocks = fromJSX(`
 *   <section className="py-20">
 *     <h1>Hello World</h1>
 *     <p>Welcome to our site</p>
 *   </section>
 * `)
 * ```
 */
export function fromJSX(jsx: string): { blocks: Block[]; errors: string[] } {
  return _parseFromJSX(jsx)
}

/**
 * Convert Block[] tree to JSX string
 *
 * @example
 * ```ts
 * const jsx = toJSX(blocks)
 * // Output:
 * // <section className="py-20" data-block-id="block_xxx">
 * //   <h1 className="" data-block-id="block_yyy">Hello World</h1>
 * // </section>
 * ```
 */
export function toJSX(blocks: Block[], options: JSXConverterOptions = {}): string {
  const opts: Required<JSXConverterOptions> = {
    indent: options.indent ?? 2,
    includeBlockIds: options.includeBlockIds ?? true,
    includeAnimations: options.includeAnimations ?? true,
    singleLine: options.singleLine ?? false,
  }

  if (opts.includeBlockIds) {
    // Use the standard serializer which includes data-block-id
    return _serializeToJSX(blocks)
  }

  // Custom output without block ids
  return blocks.map(block => blockToJSXClean(block, 0, opts)).join("\n")
}

/**
 * Convert Block[] to clean JSX without data-block-id attributes
 * (for export to external projects)
 */
export function toCleanJSX(blocks: Block[], options: Omit<JSXConverterOptions, "includeBlockIds"> = {}): string {
  return toJSX(blocks, { ...options, includeBlockIds: false })
}

// Internal helper for clean JSX output
function blockToJSXClean(block: Block, depth: number, opts: Required<JSXConverterOptions>): string {
  const indent = " ".repeat(opts.indent)
  const pad = indent.repeat(depth)
  const SELF_CLOSING = ["img", "hr", "input", "br"]

  // Build attributes
  const attrs: string[] = []

  if (block.className) {
    attrs.push(`className="${block.className}"`)
  }

  // HTML attributes
  if (block.attrs) {
    for (const [key, val] of Object.entries(block.attrs)) {
      if (val !== undefined && val !== null && val !== "") {
        if (key === "class") continue // skip class, use className
        attrs.push(`${key}="${escapeAttr(val)}"`)
      }
    }
  }

  // Animation (as motion.div if enabled)
  if (opts.includeAnimations && block.animation) {
    attrs.push(`data-animation={${JSON.stringify(JSON.stringify(block.animation))}}`)
  }

  const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : ""

  // Self-closing tags
  if (SELF_CLOSING.includes(block.tag)) {
    return `${pad}<${block.tag}${attrStr} />`
  }

  // Tag with children
  if (block.children && block.children.length > 0) {
    if (opts.singleLine && block.children.length === 1 && !block.children[0].children) {
      // Single line for simple children
      const childJSX = blockToJSXClean(block.children[0], 0, opts).trim()
      return `${pad}<${block.tag}${attrStr}>${childJSX}</${block.tag}>`
    }
    const childrenJSX = block.children.map(c => blockToJSXClean(c, depth + 1, opts)).join("\n")
    return `${pad}<${block.tag}${attrStr}>\n${childrenJSX}\n${pad}</${block.tag}>`
  }

  // Tag with text content
  if (block.textContent) {
    if (opts.singleLine || (block.textContent.length < 60 && !block.textContent.includes("\n"))) {
      return `${pad}<${block.tag}${attrStr}>${escapeJSX(block.textContent)}</${block.tag}>`
    }
    return `${pad}<${block.tag}${attrStr}>\n${pad}${indent}${escapeJSX(block.textContent)}\n${pad}</${block.tag}>`
  }

  // Empty tag
  return `${pad}<${block.tag}${attrStr}></${block.tag}>`
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeJSX(str: string): string {
  // Escape curly braces for JSX
  return str.replace(/[{}]/g, char => `{'${char}'}`)
}

/**
 * Parse a React component file and extract the JSX return block
 *
 * @example
 * ```ts
 * const { blocks, componentName } = fromReactComponent(code)
 * ```
 */
export function fromReactComponent(code: string): {
  blocks: Block[]
  componentName: string | null
  errors: string[]
} {
  const errors: string[] = []
  let componentName: string | null = null

  // Extract component name from export
  const defaultExportMatch = code.match(/export\s+default\s+function\s+(\w+)/)
  const namedExportMatch = code.match(/export\s+function\s+(\w+)/)
  const constExportMatch = code.match(/export\s+const\s+(\w+)\s*[:=]/)

  componentName = defaultExportMatch?.[1] || namedExportMatch?.[1] || constExportMatch?.[1] || null

  // Find the return statement JSX
  // This is a simplified approach - handles most common cases
  const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*[;}]/)
    || code.match(/return\s*(<[\s\S]*?>[\s\S]*?<\/\w+>)\s*[;}]/)
    || code.match(/=>\s*\(\s*([\s\S]*?)\s*\)\s*[;}]/)
    || code.match(/=>\s*(<[\s\S]*?>[\s\S]*?<\/\w+>)\s*[;}]/)

  if (!returnMatch) {
    errors.push("Could not find JSX return statement in component")
    return { blocks: [], componentName, errors }
  }

  let jsx = returnMatch[1].trim()

  // Remove React fragments
  jsx = jsx.replace(/<>\s*/g, "").replace(/\s*<\/>/g, "")
  jsx = jsx.replace(/<React\.Fragment>\s*/g, "").replace(/\s*<\/React\.Fragment>/g, "")

  const result = fromJSX(jsx)
  errors.push(...result.errors)

  return { blocks: result.blocks, componentName, errors }
}

/**
 * Extract all JSX snippets from a file (useful for parsing multiple components)
 */
export function extractJSXSnippets(code: string): { jsx: string; startLine: number }[] {
  const snippets: { jsx: string; startLine: number }[] = []

  // Find all return ( ... ) patterns
  const regex = /return\s*\(\s*([\s\S]*?)\s*\)\s*[;}]/g
  let match

  while ((match = regex.exec(code)) !== null) {
    const lineNumber = code.slice(0, match.index).split("\n").length
    snippets.push({
      jsx: match[1].trim(),
      startLine: lineNumber,
    })
  }

  return snippets
}
