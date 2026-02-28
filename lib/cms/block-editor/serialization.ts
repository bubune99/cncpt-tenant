import { z } from "zod"
import type { Block, BlockTag, BlockAnimation, BlockBackground, PageDocument, ExportFramework, CommerceBinding } from "./types"
import { CONTAINER_TAGS, LEAF_TAGS, isContainerTag } from "./types"
import { generateId, rehydrateParentIds, stripParentIds } from "./tree-utils"

const ALL_TAGS_SET = new Set<string>([...CONTAINER_TAGS, ...LEAF_TAGS])

// ============================================================
// Code Editor JSX Serialization (Lossless Round-Trip)
// ============================================================

const SELF_CLOSING_TAGS = ["img", "hr", "input", "br"]

interface SerializeOptions {
  componentName?: string
}

/**
 * Serialize blocks to JSX for the code editor.
 * When componentName is provided, wraps output in a React component with
 * imports, "use client" directive (if animations exist), and fragment wrapper.
 * Animations render as motion.* tags with motion props instead of data-animation JSON.
 *
 * Round-trip guarantee: parseJSXToBlocks(serializeBlocksToJSX(blocks)) === blocks
 */
export function serializeBlocksToJSX(blocks: Block[], options?: SerializeOptions): string {
  const baseIndent = options?.componentName ? 3 : 0
  const jsx = blocks.map((block) => serializeBlockForEditor(block, baseIndent)).join("\n")

  if (!options?.componentName) return jsx

  const hasAnim = hasAnyAnimation(blocks)
  let output = ""
  if (hasAnim) output += '"use client"\n\nimport { motion } from "framer-motion"\n\n'
  output += `export default function ${options.componentName}() {\n  return (\n    <>\n`
  output += jsx
  output += `\n    </>\n  )\n}\n`
  return output
}

function serializeBlockForEditor(block: Block, indent: number): string {
  const pad = "  ".repeat(indent)
  const isSelfClosing = SELF_CLOSING_TAGS.includes(block.tag)
  const anim = block.animation
  const useMotionTag = !!anim?.type

  // Determine the tag name: motion.div for animated blocks, plain tag otherwise
  const tagName = useMotionTag ? `motion.${block.tag}` : block.tag

  // Build attributes array
  const attrs: string[] = []

  // data-block-id for round-trip identity
  attrs.push(`data-block-id="${block.id}"`)

  // className (always output, even if empty)
  attrs.push(`className="${block.className}"`)

  // Regular HTML attributes
  if (block.attrs) {
    for (const [key, val] of Object.entries(block.attrs)) {
      if (val !== undefined && val !== null && val !== "") {
        if (val.includes('"') || val.includes("'") || val.includes("{") || val.includes("}")) {
          attrs.push(`${key}={\`${val.replace(/`/g, "\\`")}\`}`)
        } else {
          attrs.push(`${key}="${val}"`)
        }
      }
    }
  }

  // Editor metadata as data attributes
  if (block.hidden) attrs.push(`data-editor-hidden="true"`)
  if (block.locked) attrs.push(`data-editor-locked="true"`)
  // Label emitted as JSX comment before the element, not as data attribute

  // Animation as motion props (instead of data-animation JSON)
  if (anim?.type && anim.type !== "custom") {
    const preset = ANIMATION_PRESETS[anim.type]
    if (preset) {
      if (anim.trigger === "inView") {
        attrs.push(`initial={${preset.initial}}`)
        attrs.push(`whileInView={${preset.animate}}`)
        attrs.push(`viewport={{ once: true, margin: "-50px" }}`)
      } else if (anim.trigger === "hover") {
        attrs.push(`initial={${preset.initial}}`)
        attrs.push(`whileHover={${preset.animate}}`)
      } else {
        attrs.push(`initial={${preset.initial}}`)
        attrs.push(`animate={${preset.animate}}`)
      }
      const dur = anim.duration ?? 0.5
      const del = anim.delay ?? 0
      attrs.push(`transition={{ duration: ${dur}${del > 0 ? `, delay: ${del}` : ""} }}`)
    }
  } else if (anim?.type === "custom" && anim.custom) {
    const c = anim.custom
    if (c.initial) attrs.push(`initial={${JSON.stringify(c.initial)}}`)
    if (c.animate) attrs.push(`animate={${JSON.stringify(c.animate)}}`)
    if (c.whileInView) attrs.push(`whileInView={${JSON.stringify(c.whileInView)}}`)
    if (c.whileHover) attrs.push(`whileHover={${JSON.stringify(c.whileHover)}}`)
    if (c.transition) attrs.push(`transition={${JSON.stringify(c.transition)}}`)
  }

  // Background as JSON data attribute (kept — no cleaner representation)
  if (block.background) {
    attrs.push(`data-background={${JSON.stringify(JSON.stringify(block.background))}}`)
  }

  // Commerce binding as JSON data attribute
  if (block.commerce) {
    attrs.push(`data-commerce={${JSON.stringify(JSON.stringify(block.commerce))}}`)
  }

  // Component name for Hydrogen blocks
  if (block.componentName) attrs.push(`data-component="${block.componentName}"`)
  if (block.frameworkRequirement) attrs.push(`data-framework="${block.frameworkRequirement}"`)

  const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : ""

  // Label comment emitted before the element
  const labelComment = block.label ? `${pad}{/* ${block.label} */}\n` : ""

  if (isSelfClosing) return `${labelComment}${pad}<${tagName}${attrStr} />`

  if (block.children && block.children.length > 0) {
    const childrenJSX = block.children.map((child) => serializeBlockForEditor(child, indent + 1)).join("\n")
    return `${labelComment}${pad}<${tagName}${attrStr}>\n${childrenJSX}\n${pad}</${tagName}>`
  }

  if (block.textContent) {
    if (block.textContent.includes("\n") || block.textContent.length > 60) {
      return `${labelComment}${pad}<${tagName}${attrStr}>\n${pad}  ${block.textContent}\n${pad}</${tagName}>`
    }
    return `${labelComment}${pad}<${tagName}${attrStr}>${block.textContent}</${tagName}>`
  }

  if (isContainerTag(block.tag)) return `${labelComment}${pad}<${tagName}${attrStr}></${tagName}>`
  return `${labelComment}${pad}<${tagName}${attrStr} />`
}

// ============================================================
// Code Editor JSX Parser (Stack-Based)
// ============================================================

type TokenType = "open" | "close" | "self-closing" | "text" | "expression"

interface Token {
  type: TokenType
  tag?: string
  attrs?: string
  content?: string
}

/**
 * Parse JSX string to blocks with full fidelity.
 * Handles everything serializeBlocksToJSX outputs, plus hand-written JSX.
 * Uses a stack-based parser for proper nesting.
 */
export function parseJSXToBlocks(jsx: string): { blocks: Block[]; errors: string[] } {
  const errors: string[] = []

  try {
    const cleaned = stripComponentWrapper(jsx)
    const tokens = tokenizeJSX(cleaned)
    const { blocks, errors: parseErrors } = parseTokens(tokens)
    errors.push(...parseErrors)
    return { blocks, errors }
  } catch (e) {
    errors.push(`Parse error: ${(e as Error).message}`)
    return { blocks: [], errors }
  }
}

/**
 * Strip React component wrapper (imports, function declaration, return, fragments)
 * so the parser only sees raw JSX elements. Same approach as importFromReact.
 */
function stripComponentWrapper(code: string): string {
  return code
    .replace(/^["']use client["'];?\s*/m, "")
    .replace(/import\s+.*?from\s+["'].*?["'];?\s*/g, "")
    .replace(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/g, "")
    .replace(/return\s*\(\s*/g, "")
    .replace(/\s*\)\s*;?\s*\}\s*$/g, "")
    .replace(/^\s*<>\s*$/m, "")
    .replace(/^\s*<\/>\s*$/m, "")
    .trim()
}

function tokenizeJSX(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < source.length) {
    // Skip whitespace between elements
    if (/\s/.test(source[i]) && (tokens.length === 0 || tokens[tokens.length - 1].type !== "text")) {
      while (i < source.length && /\s/.test(source[i])) i++
      continue
    }

    // Opening or closing tag
    if (source[i] === "<") {
      if (source[i + 1] === "/") {
        const closeMatch = source.slice(i).match(/^<\/([\w.:-]+)\s*>/)
        if (closeMatch) {
          tokens.push({ type: "close", tag: closeMatch[1] })
          i += closeMatch[0].length
          continue
        }
      }

      i++ // skip <
      const tagNameMatch = source.slice(i).match(/^[\w.:-]+/)
      if (!tagNameMatch) continue

      const tagName = tagNameMatch[0]
      i += tagName.length

      // Parse attributes with brace-depth tracking
      let attrStr = ""
      let braceDepth = 0
      let inString: string | null = null

      while (i < source.length) {
        const char = source[i]

        if (!inString && (char === '"' || char === "'" || char === "`")) {
          inString = char
          attrStr += char
          i++
          continue
        }
        if (inString && char === inString && source[i - 1] !== "\\") {
          inString = null
          attrStr += char
          i++
          continue
        }

        if (!inString) {
          if (char === "{") braceDepth++
          if (char === "}") braceDepth--

          if (braceDepth === 0) {
            if (char === ">") {
              i++
              break
            }
            if (char === "/" && source[i + 1] === ">") {
              tokens.push({ type: "self-closing", tag: tagName, attrs: attrStr.trim() })
              i += 2
              attrStr = ""
              break
            }
          }
        }

        attrStr += char
        i++
      }

      if (attrStr !== "" || source[i - 1] === ">") {
        tokens.push({ type: "open", tag: tagName, attrs: attrStr.trim() })
      }
      continue
    }

    // JSX expression {...}
    if (source[i] === "{") {
      let depth = 1
      const start = i + 1
      i++
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++
        if (source[i] === "}") depth--
        i++
      }
      const content = source.slice(start, i - 1).trim()
      const unwrapped = content.replace(/^["'`](.*)["'`]$/, "$1")
      tokens.push({ type: "expression", content: unwrapped })
      continue
    }

    // Text content
    let text = ""
    while (i < source.length && source[i] !== "<" && source[i] !== "{") {
      text += source[i]
      i++
    }
    if (text.trim()) {
      tokens.push({ type: "text", content: text })
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

function parseTokens(tokens: Token[]): { blocks: Block[]; errors: string[] } {
  const errors: string[] = []
  const root: Block[] = []
  const stack: ParseFrame[] = []

  const INLINE_HTML_TAGS = ["strong", "em", "b", "i", "u", "code", "small", "mark", "sub", "sup", "br"]

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    switch (token.type) {
      case "open": {
        const resolvedTag = resolveDottedTag(token.tag!)

        // Handle inline HTML tags — preserve as text in parent
        if (INLINE_HTML_TAGS.includes(resolvedTag)) {
          let depth = 1
          let inlineHTML = `<${token.tag}${token.attrs ? " " + token.attrs : ""}>`
          let j = i + 1
          while (j < tokens.length && depth > 0) {
            const t = tokens[j]
            if (t.type === "open" && resolveDottedTag(t.tag!) === resolvedTag) {
              depth++
              inlineHTML += `<${t.tag}${t.attrs ? " " + t.attrs : ""}>`
            } else if (t.type === "close" && resolveDottedTag(t.tag!) === resolvedTag) {
              depth--
              inlineHTML += `</${t.tag}>`
            } else if (t.type === "text" || t.type === "expression") {
              inlineHTML += t.content || ""
            }
            j++
          }
          if (stack.length > 0) {
            stack[stack.length - 1].textContent += inlineHTML
          }
          i = j - 1
          continue
        }

        stack.push({ tag: token.tag!, attrs: token.attrs || "", children: [], textContent: "" })
        break
      }

      case "close": {
        const resolvedCloseTag = resolveDottedTag(token.tag!)
        if (INLINE_HTML_TAGS.includes(resolvedCloseTag)) continue

        if (stack.length === 0) {
          errors.push(`Unexpected closing tag: </${token.tag}>`)
          continue
        }

        const frame = stack.pop()!
        const resolvedFrameTag = resolveDottedTag(frame.tag)
        if (resolvedFrameTag !== resolvedCloseTag) {
          errors.push(`Mismatched tags: expected </${frame.tag}>, got </${token.tag}>`)
        }

        const block = frameToBlockFromEditor(frame)
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(block)
        } else {
          root.push(block)
        }
        break
      }

      case "self-closing": {
        const block = frameToBlockFromEditor({
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

      case "text":
      case "expression": {
        if (stack.length > 0) {
          const text = token.content || ""
          // Skip JSX comments like {/* Navbar */}
          if (text.startsWith("/*")) break
          const current = stack[stack.length - 1]
          current.textContent += (current.textContent ? " " : "") + text.trim()
        }
        break
      }
    }
  }

  // Handle unclosed tags
  while (stack.length > 0) {
    const frame = stack.pop()!
    errors.push(`Unclosed tag: <${frame.tag}>`)
    const block = frameToBlockFromEditor(frame)
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(block)
    } else {
      root.push(block)
    }
  }

  return { blocks: root, errors }
}

function frameToBlockFromEditor(frame: ParseFrame): Block {
  const resolvedTag = resolveDottedTag(frame.tag)
  const isMotion = frame.tag.startsWith("motion.")

  const parsedAttrs = parseAttributesEnhanced(frame.attrs)

  // Extract special attributes
  const blockId = parsedAttrs["data-block-id"] || generateId()
  const className = parsedAttrs["className"] || parsedAttrs["class"] || ""
  const hidden = parsedAttrs["data-editor-hidden"] === "true"
  const locked = parsedAttrs["data-editor-locked"] === "true"
  const label = parsedAttrs["data-editor-label"]
  const componentName = parsedAttrs["data-component"]
  const frameworkRequirement = parsedAttrs["data-framework"] as ExportFramework | undefined

  let animation: BlockAnimation | undefined
  if (parsedAttrs["data-animation"]) {
    try { animation = JSON.parse(parsedAttrs["data-animation"]) } catch { /* ignore */ }
  }
  if (isMotion && !animation) {
    animation = parseAnimationFromAttrs(parsedAttrs)
  }

  let background: BlockBackground | undefined
  if (parsedAttrs["data-background"]) {
    try { background = JSON.parse(parsedAttrs["data-background"]) } catch { /* ignore */ }
  }

  let commerce: CommerceBinding | undefined
  if (parsedAttrs["data-commerce"]) {
    try { commerce = JSON.parse(parsedAttrs["data-commerce"]) } catch { /* ignore */ }
  }

  // Remove special attrs, keep the rest as HTML attrs
  const htmlAttrs: Record<string, string> = {}
  const specialKeys = [
    "data-block-id", "className", "class",
    "data-editor-hidden", "data-editor-locked", "data-editor-label",
    "data-animation", "data-background", "data-commerce",
    "data-component", "data-framework",
    "initial", "animate", "whileInView", "whileHover", "transition", "viewport", "exit",
  ]
  for (const [key, val] of Object.entries(parsedAttrs)) {
    if (!specialKeys.includes(key) && val !== undefined && val !== "") {
      htmlAttrs[key] = val
    }
  }

  let tag: BlockTag = resolvedTag as BlockTag
  if (!ALL_TAGS_SET.has(resolvedTag)) tag = "div"

  const isContainer = CONTAINER_TAGS.includes(tag)

  const block: Block = { id: blockId, tag, className }

  if (Object.keys(htmlAttrs).length > 0) block.attrs = htmlAttrs
  if (frame.textContent.trim()) block.textContent = frame.textContent.trim()
  if (isContainer || frame.children.length > 0) block.children = frame.children
  if (animation) block.animation = animation
  if (background) block.background = background
  if (commerce) block.commerce = commerce
  if (hidden) block.hidden = true
  if (locked) block.locked = true
  if (label) block.label = label
  if (componentName) block.componentName = componentName
  if (frameworkRequirement) block.frameworkRequirement = frameworkRequirement

  return block
}

function parseAttributesEnhanced(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (!attrStr) return attrs

  let i = 0
  while (i < attrStr.length) {
    while (i < attrStr.length && /\s/.test(attrStr[i])) i++
    if (i >= attrStr.length) break

    const nameStart = i
    while (i < attrStr.length && /[\w:-]/.test(attrStr[i])) i++
    const name = attrStr.slice(nameStart, i)
    if (!name) { i++; continue }

    while (i < attrStr.length && /\s/.test(attrStr[i])) i++

    // Boolean attribute
    if (attrStr[i] !== "=") { attrs[name] = "true"; continue }

    i++ // skip =
    while (i < attrStr.length && /\s/.test(attrStr[i])) i++

    // JSX expression: {...}
    if (attrStr[i] === "{") {
      let depth = 1
      const start = i + 1
      i++
      while (i < attrStr.length && depth > 0) {
        if (attrStr[i] === "{") depth++
        else if (attrStr[i] === "}") depth--
        else if (attrStr[i] === '"' || attrStr[i] === "'" || attrStr[i] === "`") {
          const quote = attrStr[i]
          i++
          while (i < attrStr.length && !(attrStr[i] === quote && attrStr[i - 1] !== "\\")) i++
        }
        i++
      }
      let value = attrStr.slice(start, i - 1).trim()
      value = value.replace(/^["'`](.*)["'`]$/, "$1")
      attrs[name] = value
      continue
    }

    // String value: "..." or '...'
    if (attrStr[i] === '"' || attrStr[i] === "'") {
      const quote = attrStr[i]
      i++
      const start = i
      while (i < attrStr.length && attrStr[i] !== quote) {
        if (attrStr[i] === "\\" && i + 1 < attrStr.length) i++
        i++
      }
      attrs[name] = attrStr.slice(start, i)
      i++ // skip closing quote
      continue
    }

    // Unquoted value
    const valStart = i
    while (i < attrStr.length && !/[\s>]/.test(attrStr[i])) i++
    attrs[name] = attrStr.slice(valStart, i)
  }

  return attrs
}

// ============================================================
// Framework Export Configuration
// ============================================================

export interface ExportOptions {
  framework: ExportFramework
  /** Include animation code (framer-motion) */
  includeAnimations?: boolean
  /** Shopify store domain for Hydrogen exports */
  shopifyDomain?: string
  /** Component name for the exported page */
  componentName?: string
}

// ============================================================
// Zod Schema for validation
// ============================================================

const TagEnum = z.enum([
  "div","section","header","footer","main","nav","aside","article",
  "h1","h2","h3","h4","h5","h6",
  "p","span","a","img","button",
  "ul","ol","li","hr",
  "blockquote","figure","figcaption",
  "form","input","textarea","label",
  "video","svg",
])

const AnimationSchema = z.object({
  type: z.enum(["fadeIn","slideUp","slideDown","slideLeft","slideRight","scale","custom"]).optional(),
  trigger: z.enum(["onMount","inView","hover"]).optional(),
  duration: z.number().optional(),
  delay: z.number().optional(),
  custom: z.object({
    initial: z.record(z.string(), z.unknown()).optional(),
    animate: z.record(z.string(), z.unknown()).optional(),
    whileInView: z.record(z.string(), z.unknown()).optional(),
    whileHover: z.record(z.string(), z.unknown()).optional(),
    transition: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
}).optional()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BlockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    tag: TagEnum,
    className: z.string(),
    textContent: z.string().optional(),
    attrs: z.record(z.string(), z.string()).optional(),
    children: z.array(BlockSchema).optional(),
    parentId: z.string().nullable().optional(),
    animation: AnimationSchema,
  })
)

const PageDocumentSchema = z.object({
  version: z.string(),
  blocks: z.array(BlockSchema),
})

// ============================================================
// JSON Export / Import
// ============================================================

export function exportToJSON(blocks: Block[]): string {
  const doc: PageDocument = {
    version: "2.0",
    blocks: stripParentIds(blocks) as Block[],
  }
  return JSON.stringify(doc, null, 2)
}

export function importFromJSON(jsonStr: string): { blocks: Block[]; errors: string[] } {
  const errors: string[] = []
  try {
    const data = JSON.parse(jsonStr)
    const result = PageDocumentSchema.safeParse(data)
    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errors.push(...(result.error.issues as any[]).map((e) => `${e.path.join(".")}: ${e.message}`))
      if (data.blocks && Array.isArray(data.blocks)) {
        const blocks = assignFreshIds(data.blocks)
        return { blocks: rehydrateParentIds(blocks), errors }
      }
      return { blocks: [], errors }
    }
    const blocks = assignFreshIds(result.data.blocks)
    return { blocks: rehydrateParentIds(blocks), errors }
  } catch (e) {
    errors.push(`Invalid JSON: ${(e as Error).message}`)
    return { blocks: [], errors }
  }
}

function assignFreshIds(blocks: Block[]): Block[] {
  return blocks.map((block) => ({
    ...block,
    id: generateId(),
    children: block.children ? assignFreshIds(block.children) : undefined,
  }))
}

// ============================================================
// React/JSX Export (with animation / motion.div support)
// ============================================================

const ANIMATION_PRESETS: Record<string, { initial: string; animate: string }> = {
  fadeIn:     { initial: '{ opacity: 0 }',                      animate: '{ opacity: 1 }' },
  slideUp:   { initial: '{ opacity: 0, y: 40 }',               animate: '{ opacity: 1, y: 0 }' },
  slideDown: { initial: '{ opacity: 0, y: -40 }',              animate: '{ opacity: 1, y: 0 }' },
  slideLeft: { initial: '{ opacity: 0, x: 40 }',               animate: '{ opacity: 1, x: 0 }' },
  slideRight:{ initial: '{ opacity: 0, x: -40 }',              animate: '{ opacity: 1, x: 0 }' },
  scale:     { initial: '{ opacity: 0, scale: 0.85 }',         animate: '{ opacity: 1, scale: 1 }' },
}

/**
 * Export a single block to JSX string (for clipboard)
 */
export function exportBlockToJSX(block: Block): string {
  const clean = stripParentIds([block])[0] as Block
  return blockToJSX(clean, 0)
}

/**
 * Export a single block to JSON string (for clipboard)
 */
export function exportBlockToJSON(block: Block): string {
  const clean = stripParentIds([block])[0]
  return JSON.stringify(clean, null, 2)
}

export function exportToReact(blocks: Block[]): string {
  return exportToFramework(blocks, { framework: "react" })
}

/**
 * Export blocks to a specific framework
 */
export function exportToFramework(blocks: Block[], options: ExportOptions): string {
  const clean = stripParentIds(blocks) as Block[]

  switch (options.framework) {
    case "hydrogen":
      return exportToHydrogen(clean, options)
    case "nextjs":
      return exportToNextJS(clean, options)
    case "react":
    default:
      return exportToReactInternal(clean, options)
  }
}

function exportToReactInternal(blocks: Block[], options: ExportOptions): string {
  const { componentName = "Page", includeAnimations = true } = options
  const hasAnim = includeAnimations && hasAnyAnimation(blocks)
  const jsx = blocks.map((b) => blockToJSX(b, 2, "react")).join("\n")

  const imports = hasAnim
    ? `"use client"\n\nimport { motion } from "framer-motion"\n\n`
    : ""

  return `${imports}export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen">
${jsx}
    </div>
  )
}
`
}

function exportToNextJS(blocks: Block[], options: ExportOptions): string {
  const { componentName = "Page", includeAnimations = true } = options
  const hasAnim = includeAnimations && hasAnyAnimation(blocks)
  const jsx = blocks.map((b) => blockToJSX(b, 2, "nextjs")).join("\n")

  let imports = ""
  if (hasAnim) {
    imports = `"use client"\n\nimport { motion } from "framer-motion"\n`
  }
  imports += `import Image from "next/image"\nimport Link from "next/link"\n\n`

  return `${imports}export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen">
${jsx}
    </div>
  )
}
`
}

function exportToHydrogen(blocks: Block[], options: ExportOptions): string {
  const { componentName = "Page", includeAnimations = true } = options
  const hasAnim = includeAnimations && hasAnyAnimation(blocks)
  const hasCommerce = hasAnyCommerceBlock(blocks)

  const jsx = blocks.map((b) => blockToJSX(b, 2, "hydrogen")).join("\n")

  // Build imports based on what's used
  const importLines: string[] = []

  if (hasAnim) {
    importLines.push(`import { motion } from "framer-motion"`)
  }

  if (hasCommerce) {
    importLines.push(`import { Image, Money } from "@shopify/hydrogen"`)
    importLines.push(`import { Link } from "@remix-run/react"`)
  }

  // Collect commerce components used
  const commerceComponents = collectCommerceComponents(blocks)
  if (commerceComponents.size > 0) {
    importLines.push(`import { ${[...commerceComponents].join(", ")} } from "~/components/commerce"`)
  }

  // Generate GraphQL query if needed
  const graphqlQuery = generateGraphQLQuery(blocks)

  const importsStr = importLines.length > 0 ? importLines.join("\n") + "\n\n" : ""

  let output = importsStr

  if (graphqlQuery) {
    output += `const QUERY = \`#graphql
${graphqlQuery}
\`;\n\n`

    output += `export async function loader({ context }) {
  const { storefront } = context;
  const data = await storefront.query(QUERY);
  return { ...data };
}\n\n`
  }

  output += `export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen">
${jsx}
    </div>
  )
}
`

  return output
}

function hasAnyCommerceBlock(blocks: Block[]): boolean {
  for (const b of blocks) {
    if (b.commerce || b.componentName) return true
    if (b.children && hasAnyCommerceBlock(b.children)) return true
  }
  return false
}

function collectCommerceComponents(blocks: Block[]): Set<string> {
  const components = new Set<string>()

  function traverse(block: Block) {
    if (block.componentName) {
      components.add(block.componentName)
    }
    if (block.children) {
      block.children.forEach(traverse)
    }
  }

  blocks.forEach(traverse)
  return components
}

function generateGraphQLQuery(blocks: Block[]): string | null {
  const hasProductQuery = hasCommerceType(blocks, "product")
  const hasCollectionQuery = hasCommerceType(blocks, "collection")

  if (!hasProductQuery && !hasCollectionQuery) return null

  let query = ""

  if (hasCollectionQuery) {
    const collectionBinding = findCommerceBinding(blocks, "collection")
    const limit = collectionBinding?.limit || 8
    const sortKey = collectionBinding?.sortKey || "BEST_SELLING"

    query = `  query CollectionProducts($handle: String!) {
    collection(handle: $handle) {
      title
      description
      image {
        url
        altText
      }
      products(first: ${limit}, sortKey: ${sortKey}) {
        nodes {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              availableForSale
            }
          }
        }
      }
    }
  }`
  } else if (hasProductQuery) {
    query = `  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
        }
      }
      options {
        name
        values
      }
    }
  }`
  }

  return query
}

function hasCommerceType(blocks: Block[], type: CommerceBinding["type"]): boolean {
  for (const b of blocks) {
    if (b.commerce?.type === type) return true
    if (b.children && hasCommerceType(b.children, type)) return true
  }
  return false
}

function findCommerceBinding(blocks: Block[], type: CommerceBinding["type"]): CommerceBinding | null {
  for (const b of blocks) {
    if (b.commerce?.type === type) return b.commerce
    if (b.children) {
      const found = findCommerceBinding(b.children, type)
      if (found) return found
    }
  }
  return null
}

function hasAnyAnimation(blocks: Block[]): boolean {
  for (const b of blocks) {
    if (b.animation?.type) return true
    if (b.children && hasAnyAnimation(b.children)) return true
  }
  return false
}

function blockToJSX(block: Block, indent: number, framework: ExportFramework = "react"): string {
  const pad = " ".repeat(indent)
  const isContainer = isContainerTag(block.tag) || !!block.children
  const isSelfClosing = ["img", "hr", "input"].includes(block.tag)
  const anim = block.animation

  // For Hydrogen, commerce blocks export as their component names
  if (framework === "hydrogen" && block.componentName) {
    return blockToHydrogenComponent(block, indent)
  }

  // Determine the tag name (motion.div, motion.section, etc.)
  const useMotion = anim?.type && anim.type !== "custom"
  let Tag = useMotion ? `motion.${block.tag}` : block.tag

  // Next.js specific: use Image and Link components
  if (framework === "nextjs") {
    if (block.tag === "img") Tag = "Image"
    if (block.tag === "a") Tag = "Link"
  }

  // Build attributes
  const attrParts: string[] = []
  if (block.className) attrParts.push(`className="${block.className}"`)
  if (block.attrs) {
    for (const [key, val] of Object.entries(block.attrs)) {
      if (val !== undefined && val !== null && val !== "") {
        attrParts.push(`${key}="${val}"`)
      }
    }
  }

  // Animation attributes
  if (anim?.type && anim.type !== "custom") {
    const preset = ANIMATION_PRESETS[anim.type]
    if (preset) {
      if (anim.trigger === "inView") {
        attrParts.push(`initial={${preset.initial}}`)
        attrParts.push(`whileInView={${preset.animate}}`)
        attrParts.push(`viewport={{ once: true, margin: "-50px" }}`)
      } else if (anim.trigger === "hover") {
        attrParts.push(`initial={${preset.initial}}`)
        attrParts.push(`whileHover={${preset.animate}}`)
      } else {
        attrParts.push(`initial={${preset.initial}}`)
        attrParts.push(`animate={${preset.animate}}`)
      }
      const dur = anim.duration ?? 0.5
      const del = anim.delay ?? 0
      attrParts.push(`transition={{ duration: ${dur}${del > 0 ? `, delay: ${del}` : ""} }}`)
    }
  } else if (anim?.type === "custom" && anim.custom) {
    const c = anim.custom
    if (c.initial) attrParts.push(`initial={${JSON.stringify(c.initial)}}`)
    if (c.animate) attrParts.push(`animate={${JSON.stringify(c.animate)}}`)
    if (c.whileInView) attrParts.push(`whileInView={${JSON.stringify(c.whileInView)}}`)
    if (c.whileHover) attrParts.push(`whileHover={${JSON.stringify(c.whileHover)}}`)
    if (c.transition) attrParts.push(`transition={${JSON.stringify(c.transition)}}`)
  }

  const attrStr = attrParts.length > 0 ? " " + attrParts.join(" ") : ""

  if (isSelfClosing) return `${pad}<${Tag}${attrStr} />`

  if (isContainer && block.children && block.children.length > 0) {
    const children = block.children.map((c) => blockToJSX(c, indent + 2, framework)).join("\n")
    return `${pad}<${Tag}${attrStr}>\n${children}\n${pad}</${Tag}>`
  }

  const text = block.textContent || ""
  if (!text && isContainer) return `${pad}<${Tag}${attrStr} />`
  return `${pad}<${Tag}${attrStr}>${text}</${Tag}>`
}

/**
 * Export a commerce block as its Hydrogen component
 */
function blockToHydrogenComponent(block: Block, indent: number): string {
  const pad = " ".repeat(indent)
  const componentName = block.componentName!

  const propParts: string[] = []

  // Add className if present
  if (block.className) {
    propParts.push(`className="${block.className}"`)
  }

  // Map component-specific props
  switch (componentName) {
    case "ProductCard":
      propParts.push(`product={product}`)
      break
    case "ProductGrid":
      propParts.push(`products={collection.products.nodes}`)
      if (block.commerce?.limit) propParts.push(`limit={${block.commerce.limit}}`)
      break
    case "ProductImage":
      propParts.push(`data={product.featuredImage}`)
      propParts.push(`aspectRatio="1/1"`)
      propParts.push(`sizes="(min-width: 45em) 50vw, 100vw"`)
      break
    case "ProductTitle":
      return `${pad}<h3 className="${block.className}">{product.title}</h3>`
    case "ProductPrice":
      return `${pad}<Money data={product.priceRange.minVariantPrice} className="${block.className}" />`
    case "AddToCartButton":
      propParts.push(`lines={[{ merchandiseId: selectedVariant.id, quantity: 1 }]}`)
      propParts.push(`disabled={!selectedVariant?.availableForSale}`)
      break
    case "BuyNowButton":
      propParts.push(`variantId={selectedVariant.id}`)
      break
    case "CartToggle":
      propParts.push(`cart={cart}`)
      break
    case "VariantSelector":
      propParts.push(`product={product}`)
      propParts.push(`selectedOptions={selectedOptions}`)
      propParts.push(`onSelectedOptionChange={handleOptionChange}`)
      break
    case "PredictiveSearch":
      return `${pad}<PredictiveSearchForm className="${block.className}" />`
    case "CollectionBanner":
      if (block.children && block.children.length > 0) {
        const children = block.children.map((c) => blockToJSX(c, indent + 2, "hydrogen")).join("\n")
        return `${pad}<${componentName} collection={collection}>\n${children}\n${pad}</${componentName}>`
      }
      propParts.push(`collection={collection}`)
      break
  }

  const propsStr = propParts.length > 0 ? " " + propParts.join(" ") : ""

  // Handle children for container components
  if (block.children && block.children.length > 0) {
    const children = block.children.map((c) => blockToJSX(c, indent + 2, "hydrogen")).join("\n")
    return `${pad}<${componentName}${propsStr}>\n${children}\n${pad}</${componentName}>`
  }

  // Handle text content
  if (block.textContent) {
    return `${pad}<${componentName}${propsStr}>${block.textContent}</${componentName}>`
  }

  return `${pad}<${componentName}${propsStr} />`
}

// ============================================================
// HTML/JSX Import (stack-based parser)
// ============================================================

export function importFromReact(code: string): { blocks: Block[]; errors: string[] } {
  const errors: string[] = []
  try {
    let cleaned = code
      .replace(/^["']use client["'];?\s*/m, "")
      .replace(/import\s+.*?from\s+["'].*?["'];?\s*/g, "")
      .replace(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/g, "")
      .replace(/return\s*\(/g, "")
      .replace(/\)\s*;?\s*\}\s*$/g, "")
      .trim()

    const blocks = parseJSX(cleaned)
    if (blocks.length === 0) {
      errors.push("No valid HTML/JSX elements found in the pasted code.")
    }
    return { blocks: rehydrateParentIds(blocks), errors }
  } catch (e) {
    errors.push(`Parse error: ${(e as Error).message}`)
    return { blocks: [], errors }
  }
}

const ALL_TAGS = [...CONTAINER_TAGS, ...LEAF_TAGS] as string[]
const SELF_CLOSING = ["img", "hr", "input", "br"]
const INLINE_TAGS = ["strong", "em", "b", "i", "u", "code", "small", "mark", "sub", "sup", "a"]

// Map dotted names like motion.div -> div
function resolveDottedTag(raw: string): string {
  if (raw.includes(".")) {
    const parts = raw.split(".")
    return parts[parts.length - 1]
  }
  return raw
}

interface StackFrame {
  rawTag: string
  tag: string
  attrs: string
  children: Block[]
  text: string
  animAttrs: Record<string, string>
  isMotion: boolean
}

/**
 * Stack-based JSX parser that handles:
 * - Dotted tag names (motion.div, motion.section)
 * - Brace-depth attribute parsing ({...} expressions)
 * - Rich inline text (preserves <strong>, <em>, <a>)
 * - Unknown elements fall back to div containers
 */
function parseJSX(source: string): Block[] {
  const root: Block[] = []
  const stack: StackFrame[] = []

  // Tokenise: closing tags, self-closing, opening, and text
  // Support dotted names: motion.div etc.
  const tokenRe = /<\/([\w.]+)\s*>|<([\w.]+)((?:\s+(?:[^>]|=\{[^}]*\})*)?)\/\s*>|<([\w.]+)((?:\s+(?:[^>]|=\{[^}]*\})*)?)>|([^<]+)/g
  let m: RegExpExecArray | null

  while ((m = tokenRe.exec(source)) !== null) {
    const [, closeRaw, selfRaw, selfAttrs, openRaw, openAttrs, text] = m

    if (closeRaw) {
      const resolvedClose = resolveDottedTag(closeRaw)
      if (stack.length === 0) continue

      // Match closing tag to nearest open frame (handle inline elements)
      if (INLINE_TAGS.includes(resolvedClose)) {
        // Inline tags don't become blocks -- their content is part of parent's text
        if (stack.length > 0) {
          stack[stack.length - 1].text += `</${resolvedClose}>`
        }
        continue
      }

      const frame = stack.pop()!
      const block = frameToBlock(frame)
      if (block) {
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(block)
        } else {
          root.push(block)
        }
      }
    } else if (selfRaw) {
      const resolved = resolveDottedTag(selfRaw)
      const isMotion = selfRaw.startsWith("motion.")
      const frame: StackFrame = {
        rawTag: selfRaw, tag: resolved, attrs: selfAttrs || "",
        children: [], text: "", animAttrs: {}, isMotion,
      }
      const block = frameToBlock(frame)
      if (block) {
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(block)
        } else {
          root.push(block)
        }
      }
    } else if (openRaw) {
      const resolved = resolveDottedTag(openRaw)

      // Handle inline elements: preserve as text in parent
      if (INLINE_TAGS.includes(resolved)) {
        if (stack.length > 0) {
          stack[stack.length - 1].text += `<${resolved}${openAttrs || ""}>`
        }
        continue
      }

      if (SELF_CLOSING.includes(resolved)) {
        const isMotion = openRaw.startsWith("motion.")
        const frame: StackFrame = {
          rawTag: openRaw, tag: resolved, attrs: openAttrs || "",
          children: [], text: "", animAttrs: {}, isMotion,
        }
        const block = frameToBlock(frame)
        if (block) {
          if (stack.length > 0) {
            stack[stack.length - 1].children.push(block)
          } else {
            root.push(block)
          }
        }
      } else {
        const isMotion = openRaw.startsWith("motion.")
        stack.push({
          rawTag: openRaw, tag: resolved, attrs: openAttrs || "",
          children: [], text: "", animAttrs: {}, isMotion,
        })
      }
    } else if (text) {
      const trimmed = text.trim()
      if (trimmed && stack.length > 0) {
        stack[stack.length - 1].text += (stack[stack.length - 1].text ? " " : "") + trimmed
      }
    }
  }

  // Flush unclosed tags
  while (stack.length > 0) {
    const frame = stack.pop()!
    const block = frameToBlock(frame)
    if (block) {
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(block)
      } else {
        root.push(block)
      }
    }
  }

  return root
}

function frameToBlock(frame: StackFrame): Block | null {
  let tag = frame.tag.toLowerCase()

  // Unknown elements fall back to div (container)
  if (!ALL_TAGS.includes(tag)) {
    tag = "div"
  }

  const parsedAttrs = parseAttributes(frame.attrs)
  const className = parsedAttrs.className || parsedAttrs.class || ""
  delete parsedAttrs.className
  delete parsedAttrs.class

  // Extract animation props if this was a motion.* element
  let animation: BlockAnimation | undefined
  if (frame.isMotion) {
    animation = parseAnimationFromAttrs(parsedAttrs)
  }
  // Remove animation-specific attrs so they don't leak into the attrs object
  for (const key of ["initial", "animate", "whileInView", "whileHover", "transition", "viewport", "exit"]) {
    delete parsedAttrs[key]
  }

  const isContainer = CONTAINER_TAGS.includes(tag as BlockTag)

  const block: Block = {
    id: generateId(),
    tag: tag as BlockTag,
    className,
  }

  if (Object.keys(parsedAttrs).length > 0) block.attrs = parsedAttrs
  if (isContainer) {
    block.children = frame.children.length > 0 ? frame.children : []
  }
  if (frame.text) {
    block.textContent = cleanTextContent(frame.text)
  }
  if (animation) {
    block.animation = animation
  }
  return block
}

function parseAnimationFromAttrs(attrs: Record<string, string>): BlockAnimation | undefined {
  const hasInitial = !!attrs.initial
  const hasAnimate = !!attrs.animate
  const hasWhileInView = !!attrs.whileInView
  const hasWhileHover = !!attrs.whileHover

  if (!hasInitial && !hasAnimate && !hasWhileInView && !hasWhileHover) return undefined

  const anim: BlockAnimation = { type: "custom" }

  // Try to detect a named preset
  const initialStr = attrs.initial || ""
  if (initialStr.includes("opacity: 0") && !initialStr.includes("y:") && !initialStr.includes("x:") && !initialStr.includes("scale")) {
    anim.type = "fadeIn"
  } else if (initialStr.includes("y: 40") || initialStr.includes("y:40")) {
    anim.type = "slideUp"
  } else if (initialStr.includes("y: -40") || initialStr.includes("y:-40")) {
    anim.type = "slideDown"
  } else if (initialStr.includes("x: 40") || initialStr.includes("x:40")) {
    anim.type = "slideLeft"
  } else if (initialStr.includes("x: -40") || initialStr.includes("x:-40")) {
    anim.type = "slideRight"
  } else if (initialStr.includes("scale")) {
    anim.type = "scale"
  }

  if (hasWhileInView) anim.trigger = "inView"
  else if (hasWhileHover) anim.trigger = "hover"
  else anim.trigger = "onMount"

  // Parse transition for duration/delay
  const transStr = attrs.transition || ""
  const durMatch = transStr.match(/duration:\s*([\d.]+)/)
  const delMatch = transStr.match(/delay:\s*([\d.]+)/)
  if (durMatch) anim.duration = parseFloat(durMatch[1])
  if (delMatch) anim.delay = parseFloat(delMatch[1])

  // If custom, stash the raw objects
  if (anim.type === "custom") {
    anim.custom = {}
    if (hasInitial) anim.custom.initial = safeParseJSObj(attrs.initial)
    if (hasAnimate) anim.custom.animate = safeParseJSObj(attrs.animate)
    if (hasWhileInView) anim.custom.whileInView = safeParseJSObj(attrs.whileInView)
    if (hasWhileHover) anim.custom.whileHover = safeParseJSObj(attrs.whileHover)
    if (attrs.transition) anim.custom.transition = safeParseJSObj(attrs.transition)
  }

  return anim
}

function safeParseJSObj(str: string): Record<string, unknown> {
  try {
    // Convert JS object literal to valid JSON: { opacity: 0, y: 40 } -> {"opacity":0,"y":40}
    const jsonStr = str
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/'/g, '"')
    return JSON.parse(jsonStr)
  } catch {
    return { _raw: str }
  }
}

function parseAttributes(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {}

  // Match key="value" or key='value'
  const stdRe = /([\w-]+)=["']([^"']*)["']/g
  let m: RegExpExecArray | null
  while ((m = stdRe.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2]
  }

  // Match JSX brace expressions: key={...}
  // Uses brace-depth tracking to correctly handle nested objects
  const braceRe = /([\w-]+)=\{/g
  while ((m = braceRe.exec(attrStr)) !== null) {
    if (attrs[m[1]]) continue // Already matched by stdRe
    const key = m[1]
    let depth = 1
    let start = m.index + m[0].length
    let i = start
    while (i < attrStr.length && depth > 0) {
      if (attrStr[i] === "{") depth++
      else if (attrStr[i] === "}") depth--
      i++
    }
    const value = attrStr.slice(start, i - 1).trim()
    // Unwrap simple string expressions: {"text"} or {'text'} or {`text`}
    const unwrapped = value.replace(/^["'`](.*)["'`]$/, "$1")
    attrs[key] = unwrapped
  }

  return attrs
}

function cleanTextContent(str: string): string {
  return str
    .replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

// ============================================================
// AI Schema Documentation
// ============================================================

export function getAISchemaDocumentation(): string {
  return `# Block Editor Schema (v2 - className-driven)

Each block is an HTML element with Tailwind CSS classes:

\`\`\`json
{
  "version": "2.0",
  "blocks": [
    {
      "id": "unique-readable-id",
      "tag": "section",
      "className": "w-full py-16 px-6 bg-slate-900",
      "children": [
        {
          "id": "hero-heading",
          "tag": "h1",
          "className": "text-5xl font-bold tracking-tight text-white",
          "textContent": "Welcome to My Site"
        }
      ],
      "animation": {
        "type": "fadeIn",
        "trigger": "inView",
        "duration": 0.6,
        "delay": 0.1
      }
    }
  ]
}
\`\`\`

## Block fields:
- **id** (string): unique human-readable ID
- **tag**: div, section, header, footer, main, nav, aside, article, h1-h6, p, span, a, img, button, ul, ol, li, hr, blockquote, figure, figcaption, form, input, textarea, label, video, svg
- **className** (string): Tailwind CSS classes
- **textContent** (string, optional): inner text for leaf elements
- **attrs** (object, optional): HTML attributes { "src": "...", "href": "...", "alt": "..." }
- **children** (array, optional): nested blocks for container elements
- **animation** (object, optional): { type, trigger, duration, delay }
  - type: fadeIn, slideUp, slideDown, slideLeft, slideRight, scale, custom
  - trigger: onMount, inView, hover
  - duration/delay: in seconds
`
}
