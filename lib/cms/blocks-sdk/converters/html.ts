/**
 * Block SDK - HTML Converter
 *
 * Bidirectional conversion between HTML strings and Block[] trees.
 */

import type { Block, BlockTag } from "../types"
import { CONTAINER_TAGS, LEAF_TAGS } from "../types"
import { generateId } from "../utils"

const ALL_TAGS = new Set<string>([...CONTAINER_TAGS, ...LEAF_TAGS])

/**
 * Convert an HTML string to Block[] tree
 *
 * @example
 * ```ts
 * const blocks = fromHTML(`
 *   <section class="py-20">
 *     <h1>Hello World</h1>
 *   </section>
 * `)
 * ```
 */
export function fromHTML(html: string): { blocks: Block[]; errors: string[] } {
  const errors: string[] = []

  try {
    // Use a simple regex-based parser for HTML
    // In a browser/Node environment, we could use DOMParser
    const blocks = parseHTMLToBlocks(html, errors)
    return { blocks, errors }
  } catch (e) {
    errors.push(`HTML parse error: ${(e as Error).message}`)
    return { blocks: [], errors }
  }
}

/**
 * Convert Block[] tree to HTML string
 *
 * @example
 * ```ts
 * const html = toHTML(blocks)
 * // Output:
 * // <section class="py-20">
 * //   <h1>Hello World</h1>
 * // </section>
 * ```
 */
export function toHTML(blocks: Block[], options: { indent?: number; includeIds?: boolean } = {}): string {
  const indent = options.indent ?? 2
  const includeIds = options.includeIds ?? false

  return blocks.map(block => blockToHTML(block, 0, indent, includeIds)).join("\n")
}

function blockToHTML(block: Block, depth: number, indentSize: number, includeIds: boolean): string {
  const pad = " ".repeat(indentSize * depth)
  const SELF_CLOSING = ["img", "hr", "input", "br", "meta", "link"]

  // Build attributes
  const attrs: string[] = []

  if (includeIds && block.id) {
    attrs.push(`data-block-id="${block.id}"`)
  }

  if (block.className) {
    attrs.push(`class="${block.className}"`)
  }

  if (block.attrs) {
    for (const [key, val] of Object.entries(block.attrs)) {
      if (val !== undefined && val !== null && val !== "") {
        attrs.push(`${key}="${escapeHTML(val)}"`)
      }
    }
  }

  const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : ""

  // Self-closing tags
  if (SELF_CLOSING.includes(block.tag)) {
    return `${pad}<${block.tag}${attrStr} />`
  }

  // Tag with children
  if (block.children && block.children.length > 0) {
    const childrenHTML = block.children
      .map(c => blockToHTML(c, depth + 1, indentSize, includeIds))
      .join("\n")
    return `${pad}<${block.tag}${attrStr}>\n${childrenHTML}\n${pad}</${block.tag}>`
  }

  // Tag with text content
  if (block.textContent) {
    return `${pad}<${block.tag}${attrStr}>${escapeHTML(block.textContent)}</${block.tag}>`
  }

  // Empty tag
  return `${pad}<${block.tag}${attrStr}></${block.tag}>`
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ============================================================
// HTML Parser (simplified regex-based)
// ============================================================

interface HTMLToken {
  type: "open" | "close" | "self-closing" | "text"
  tag?: string
  attrs?: string
  content?: string
}

function parseHTMLToBlocks(html: string, errors: string[]): Block[] {
  const tokens = tokenizeHTML(html)
  return parseHTMLTokens(tokens, errors)
}

function tokenizeHTML(source: string): HTMLToken[] {
  const tokens: HTMLToken[] = []
  let i = 0

  while (i < source.length) {
    // Skip whitespace between elements (but preserve meaningful text)
    const leadingWhitespace = source.slice(i).match(/^[\s\n\r]+/)
    if (leadingWhitespace && (tokens.length === 0 || tokens[tokens.length - 1].type !== "text")) {
      i += leadingWhitespace[0].length
      continue
    }

    // HTML comment
    if (source.slice(i, i + 4) === "<!--") {
      const endComment = source.indexOf("-->", i + 4)
      if (endComment !== -1) {
        i = endComment + 3
        continue
      }
    }

    // DOCTYPE
    if (source.slice(i, i + 9).toLowerCase() === "<!doctype") {
      const endDoctype = source.indexOf(">", i)
      if (endDoctype !== -1) {
        i = endDoctype + 1
        continue
      }
    }

    // Opening or closing tag
    if (source[i] === "<") {
      if (source[i + 1] === "/") {
        const closeMatch = source.slice(i).match(/^<\/(\w+)\s*>/)
        if (closeMatch) {
          tokens.push({ type: "close", tag: closeMatch[1].toLowerCase() })
          i += closeMatch[0].length
          continue
        }
      }

      const openMatch = source.slice(i).match(/^<(\w+)([^>]*?)(\/?)>/)
      if (openMatch) {
        const tag = openMatch[1].toLowerCase()
        const attrs = openMatch[2].trim()
        const selfClose = openMatch[3] === "/" || ["img", "br", "hr", "input", "meta", "link"].includes(tag)

        tokens.push({
          type: selfClose ? "self-closing" : "open",
          tag,
          attrs,
        })
        i += openMatch[0].length
        continue
      }
    }

    // Text content
    let text = ""
    while (i < source.length && source[i] !== "<") {
      text += source[i]
      i++
    }
    if (text.trim()) {
      tokens.push({ type: "text", content: text.trim() })
    }
  }

  return tokens
}

interface ParseFrame {
  tag: string
  attrs: string
  children: Block[]
  textContent: string
}

function parseHTMLTokens(tokens: HTMLToken[], errors: string[]): Block[] {
  const root: Block[] = []
  const stack: ParseFrame[] = []

  for (const token of tokens) {
    switch (token.type) {
      case "open": {
        stack.push({
          tag: token.tag!,
          attrs: token.attrs || "",
          children: [],
          textContent: "",
        })
        break
      }

      case "close": {
        if (stack.length === 0) {
          errors.push(`Unexpected closing tag: </${token.tag}>`)
          continue
        }

        const frame = stack.pop()!
        if (frame.tag !== token.tag) {
          errors.push(`Mismatched tags: expected </${frame.tag}>, got </${token.tag}>`)
        }

        const block = frameToBlock(frame)
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(block)
        } else {
          root.push(block)
        }
        break
      }

      case "self-closing": {
        const block = frameToBlock({
          tag: token.tag!,
          attrs: token.attrs || "",
          children: [],
          textContent: "",
        })

        if (stack.length > 0) {
          stack[stack.length - 1].children.push(block)
        } else {
          root.push(block)
        }
        break
      }

      case "text": {
        if (stack.length > 0) {
          const current = stack[stack.length - 1]
          current.textContent += (current.textContent ? " " : "") + token.content
        }
        break
      }
    }
  }

  // Handle unclosed tags
  while (stack.length > 0) {
    const frame = stack.pop()!
    errors.push(`Unclosed tag: <${frame.tag}>`)
    const block = frameToBlock(frame)
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(block)
    } else {
      root.push(block)
    }
  }

  return root
}

function frameToBlock(frame: ParseFrame): Block {
  const attrs = parseHTMLAttributes(frame.attrs)

  // Extract className from class attribute
  const className = attrs["class"] || ""
  delete attrs["class"]

  // Determine tag - map to valid BlockTag or default to div
  let tag: BlockTag = frame.tag as BlockTag
  if (!ALL_TAGS.has(frame.tag)) {
    tag = "div"
  }

  const block: Block = {
    id: attrs["data-block-id"] || generateId(),
    tag,
    className,
  }

  delete attrs["data-block-id"]

  if (Object.keys(attrs).length > 0) {
    block.attrs = attrs
  }

  if (frame.textContent.trim()) {
    block.textContent = frame.textContent.trim()
  }

  if (frame.children.length > 0) {
    block.children = frame.children
  } else if (CONTAINER_TAGS.includes(tag)) {
    block.children = []
  }

  return block
}

function parseHTMLAttributes(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (!attrStr) return attrs

  // Match attribute patterns: name="value", name='value', name=value, or just name
  const regex = /(\w[\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g
  let match

  while ((match = regex.exec(attrStr)) !== null) {
    const name = match[1]
    const value = match[2] ?? match[3] ?? match[4] ?? "true"
    attrs[name] = value
  }

  return attrs
}
