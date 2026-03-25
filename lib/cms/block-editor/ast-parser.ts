/**
 * AST-based JSX parser for the block editor.
 *
 * Uses @babel/parser to produce a proper AST, then walks it manually
 * to build Block[] trees. This replaces the regex-based importFromReact
 * parser with a more robust solution that correctly handles:
 *   - JSX expressions ({condition && <div>...</div>})
 *   - Ternary expressions ({cond ? <A/> : <B/>})
 *   - .map() calls (extracts JSX template from the callback)
 *   - Template literal classNames (extracts static parts)
 *   - Spread props (skips gracefully, notes in errors)
 *   - Fragments (<>, <React.Fragment>)
 *   - JSX comments
 *   - Inline style objects (converts to CSS string)
 *   - Import statements (strips them, extracts component names)
 *   - Function/arrow function component declarations
 *   - TypeScript type annotations (stripped by parser)
 *   - Variable declarations referencing JSX
 *   - Default exports
 */

import { parse, type ParserPlugin } from "@babel/parser"
import type {
  File,
  Node,
  JSXElement,
  JSXFragment,
  JSXOpeningElement,
  JSXText,
  JSXExpressionContainer,
  JSXSpreadChild,
  JSXAttribute,
  JSXSpreadAttribute,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  Expression,
  CallExpression,
  ConditionalExpression,
  LogicalExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  FunctionDeclaration,
  ReturnStatement,
  ExportDefaultDeclaration,
  VariableDeclaration,
  VariableDeclarator,
  ObjectExpression,
  ObjectProperty,
  TemplateLiteral,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  MemberExpression,
  Identifier,
  BlockStatement,
  Program,
  Statement,
  SpreadElement,
} from "@babel/types"

import type {
  Block,
  BlockTag,
  BlockAnimation,
  BlockBackground,
  BlockInteraction,
  BlockResponsive,
  CommerceBinding,
  ExportFramework,
  InteractionType,
} from "./types"
import { CONTAINER_TAGS, LEAF_TAGS, isContainerTag, isKnownTag } from "./types"
import { generateId, rehydrateParentIds } from "./tree-utils"

// ============================================================
// Constants
// ============================================================

/**
 * Apply @block metadata from a JSX comment onto a Block.
 * Used for round-tripping editor metadata without data-* attribute pollution.
 */
function applyBlockMeta(block: Block, meta: Record<string, unknown>): void {
  if (meta.id) block.id = meta.id as string
  if (meta.hidden) block.hidden = true
  if (meta.locked) block.locked = true
  if (meta.label) block.label = meta.label as string
  if (meta.component) block.componentName = meta.component as string
  if (meta.framework) block.frameworkRequirement = meta.framework as ExportFramework
  if (meta.animation) block.animation = meta.animation as BlockAnimation
  if (meta.background) block.background = meta.background as BlockBackground
  if (meta.commerce) block.commerce = meta.commerce as CommerceBinding
  if (meta.responsive) block.responsive = meta.responsive as BlockResponsive
  if (meta.partialId) block.partialId = meta.partialId as string
  if (meta.partialOverrides) block.partialOverrides = meta.partialOverrides as Block["partialOverrides"]
  if (meta.bindings) block.bindings = meta.bindings as Record<string, string>
  if (meta.interaction) block.interaction = meta.interaction as BlockInteraction
}

const ALL_TAGS_SET = new Set<string>([...CONTAINER_TAGS, ...LEAF_TAGS])

const INLINE_HTML_TAGS = new Set([
  "strong", "em", "b", "i", "u", "code", "small", "mark", "sub", "sup", "br",
])

const BOOLEAN_ATTRS = new Set([
  "controls", "autoplay", "muted", "loop", "playsinline",
  "disabled", "checked", "readonly", "required", "multiple",
  "hidden", "novalidate", "allowfullscreen",
])

const SPECIAL_DATA_ATTRS = new Set([
  "data-block-id", "data-editor-hidden", "data-editor-locked", "data-editor-label",
  "data-animation", "data-background", "data-commerce", "data-responsive",
  "data-component", "data-framework",
  "data-partial-id", "data-partial-overrides",
  "data-interaction", "data-interaction-type", "data-interaction-content",
  "data-interaction-side", "data-interaction-title", "data-interaction-description",
])

const MOTION_ONLY_ATTRS = new Set([
  "initial", "animate", "whileInView", "whileHover", "transition", "viewport", "exit",
])

/** React-internal or runtime-only props that must never be stored in block attrs */
const REACT_INTERNAL_ATTRS = new Set([
  "ref", "key", "children", "dangerouslySetInnerHTML",
  "suppressHydrationWarning", "suppressContentEditableWarning",
])

// ============================================================
// Main Export
// ============================================================

/**
 * Parse a JSX/TSX code string into Block[] using a proper AST parser.
 *
 * Drop-in replacement for `importFromReact()` with enhanced handling of
 * JSX expressions, dynamic patterns, fragments, and TypeScript.
 */
export function importFromReactAST(code: string): { blocks: Block[]; errors: string[] } {
  const errors: string[] = []

  try {
    const plugins: ParserPlugin[] = ["jsx", "typescript"]
    const ast = parse(code, {
      sourceType: "module",
      plugins,
      errorRecovery: true,
    })

    // Collect parse-time errors
    if (ast.errors && ast.errors.length > 0) {
      for (const err of ast.errors) {
        errors.push(`Parse warning: ${err.message}`)
      }
    }

    // Extract the JSX root(s) from the AST
    const jsxRoots = extractJSXRoots(ast, errors)

    // Convert each JSX root node to Block[]
    const blocks: Block[] = []
    for (const root of jsxRoots) {
      const result = nodeToBlocks(root, errors)
      blocks.push(...result)
    }

    if (blocks.length === 0 && errors.length === 0) {
      errors.push("No valid HTML/JSX elements found in the pasted code.")
    }

    return { blocks: rehydrateParentIds(blocks), errors }
  } catch (e) {
    errors.push(`AST parse error: ${(e as Error).message}`)
    return { blocks: [], errors }
  }
}

// ============================================================
// AST Root Extraction
// ============================================================

/**
 * Walk the top-level AST to find JSX content.
 * Handles: export default function, arrow functions, variable declarations,
 * and bare JSX expressions.
 */
function extractJSXRoots(ast: File, errors: string[]): Node[] {
  const roots: Node[] = []
  const program = ast.program

  for (const stmt of program.body) {
    // Skip import declarations
    if (stmt.type === "ImportDeclaration") continue

    // export default function Foo() { return <div>...</div> }
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = (stmt as ExportDefaultDeclaration).declaration
      const jsx = extractJSXFromDeclaration(decl, errors)
      if (jsx) { roots.push(jsx); continue }
    }

    // export function Foo() { return <div>...</div> } (named exports)
    // export const Foo = () => <div>...</div>
    if (stmt.type === "ExportNamedDeclaration") {
      const namedExport = stmt as { declaration: Node | null }
      if (namedExport.declaration) {
        if (namedExport.declaration.type === "FunctionDeclaration") {
          const jsx = extractReturnJSX((namedExport.declaration as FunctionDeclaration).body, errors)
          if (jsx) { roots.push(jsx); continue }
        }
        if (namedExport.declaration.type === "VariableDeclaration") {
          for (const declarator of (namedExport.declaration as VariableDeclaration).declarations) {
            const d = declarator as VariableDeclarator
            if (!d.init) continue
            const jsx = extractJSXFromExpression(d.init, errors)
            if (jsx) { roots.push(jsx); break }
          }
          continue
        }
      }
    }

    // function Foo() { return <div>...</div> }
    if (stmt.type === "FunctionDeclaration") {
      const jsx = extractReturnJSX((stmt as FunctionDeclaration).body, errors)
      if (jsx) { roots.push(jsx); continue }
    }

    // const Foo = () => <div>...</div>  OR  const Foo = function() { return ... }
    if (stmt.type === "VariableDeclaration") {
      for (const declarator of (stmt as VariableDeclaration).declarations) {
        const d = declarator as VariableDeclarator
        if (!d.init) continue
        const jsx = extractJSXFromExpression(d.init, errors)
        if (jsx) { roots.push(jsx); break }
      }
      continue
    }

    // Bare expression statement containing JSX (e.g. pasted JSX fragment)
    if (stmt.type === "ExpressionStatement") {
      const expr = (stmt as { expression: Expression }).expression
      if (isJSXNode(expr)) {
        roots.push(expr)
      } else {
        const jsx = extractJSXFromExpression(expr, errors)
        if (jsx) roots.push(jsx)
      }
    }
  }

  return roots
}

function extractJSXFromDeclaration(node: Node, errors: string[]): Node | null {
  if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
    return extractReturnJSX((node as FunctionDeclaration).body, errors)
  }
  if (node.type === "ArrowFunctionExpression") {
    const arrow = node as ArrowFunctionExpression
    if (arrow.body.type === "BlockStatement") {
      return extractReturnJSX(arrow.body, errors)
    }
    // Concise body: () => <div>...</div>
    if (isJSXNode(arrow.body)) return arrow.body
    return null
  }
  if (isJSXNode(node)) return node
  return null
}

function extractJSXFromExpression(node: Expression | Node, errors: string[]): Node | null {
  if (isJSXNode(node)) return node

  if (node.type === "ArrowFunctionExpression") {
    const arrow = node as ArrowFunctionExpression
    if (arrow.body.type === "BlockStatement") {
      return extractReturnJSX(arrow.body, errors)
    }
    if (isJSXNode(arrow.body)) return arrow.body
  }

  if (node.type === "FunctionExpression") {
    return extractReturnJSX((node as FunctionExpression).body, errors)
  }

  if (node.type === "CallExpression") {
    const call = node as CallExpression
    // Handle React.forwardRef((props, ref) => <div>...</div>)
    // and forwardRef((props, ref) => <div>...</div>)
    const calleeName = getCalleeName(call.callee)
    if (calleeName === "forwardRef" || calleeName === "React.forwardRef" || calleeName === "memo" || calleeName === "React.memo") {
      if (call.arguments[0]) {
        return extractJSXFromExpression(call.arguments[0] as Expression, errors)
      }
    }
    return null
  }

  return null
}

function getCalleeName(node: Node): string {
  if (node.type === "Identifier") return (node as Identifier).name
  if (node.type === "MemberExpression") {
    const member = node as MemberExpression
    const obj = member.object.type === "Identifier" ? (member.object as Identifier).name : ""
    const prop = member.property.type === "Identifier" ? (member.property as Identifier).name : ""
    return obj && prop ? `${obj}.${prop}` : ""
  }
  return ""
}

function extractReturnJSX(body: BlockStatement, errors: string[]): Node | null {
  for (const stmt of body.body) {
    if (stmt.type === "ReturnStatement") {
      const ret = (stmt as ReturnStatement).argument
      if (ret && isJSXNode(ret)) return ret
      if (ret) {
        const jsx = extractJSXFromExpression(ret, errors)
        if (jsx) return jsx
      }
    }
  }
  return null
}

function isJSXNode(node: Node): boolean {
  return (
    node.type === "JSXElement" ||
    node.type === "JSXFragment"
  )
}

// ============================================================
// JSX Node -> Block[] Conversion
// ============================================================

/**
 * Convert a JSX AST node into Block[].
 * A single JSXElement produces one block (with possible children).
 * A JSXFragment produces blocks from its children (unwrapped).
 */
function nodeToBlocks(node: Node, errors: string[]): Block[] {
  if (node.type === "JSXFragment") {
    return jsxFragmentToBlocks(node as JSXFragment, errors)
  }

  if (node.type === "JSXElement") {
    const block = jsxElementToBlock(node as JSXElement, errors)
    return block ? [block] : []
  }

  return []
}

function jsxFragmentToBlocks(fragment: JSXFragment, errors: string[]): Block[] {
  const blocks: Block[] = []
  let pendingMeta: Record<string, unknown> | null = null
  for (const child of fragment.children) {
    if (child.type === "JSXExpressionContainer") {
      const result = processExpressionContainer(child as JSXExpressionContainer, errors)
      if (result.blockMeta) {
        pendingMeta = result.blockMeta
        continue
      }
      if (result.blocks.length > 0) blocks.push(...result.blocks)
      continue
    }
    const childBlocks = jsxChildToBlocks(child, errors)
    for (const b of childBlocks) {
      if (pendingMeta) {
        applyBlockMeta(b, pendingMeta)
        pendingMeta = null
      }
      blocks.push(b)
    }
  }
  return blocks
}

/**
 * Convert a JSXElement into a single Block (with children).
 */
function jsxElementToBlock(element: JSXElement, errors: string[]): Block | null {
  const opening = element.openingElement
  const rawTag = getTagName(opening.name)
  const resolvedTag = resolveDottedTag(rawTag)
  const isMotion = rawTag.startsWith("motion.")
  const isPartialRef = rawTag === "PartialRef"

  // Handle inline HTML tags — return null (handled as text by parent)
  if (INLINE_HTML_TAGS.has(resolvedTag)) {
    return null
  }

  // Parse attributes
  const {
    className, htmlAttrs, animation, background, commerce, responsive, interaction,
    blockId, hidden, locked, label, componentName, frameworkRequirement,
    partialId, partialOverrides, isMotionFromAttrs,
  } = parseJSXAttributes(opening.attributes, isMotion, errors)

  // Determine final animation
  let finalAnimation = animation
  if ((isMotion || isMotionFromAttrs) && !finalAnimation) {
    // Motion tag without animation data — will be parsed from attrs
  }

  // Determine tag — accept any tag, including custom components
  let tag: BlockTag = resolvedTag as BlockTag
  const isCustomComponent = !ALL_TAGS_SET.has(resolvedTag) && !isPartialRef && !isMotion
  if (isPartialRef) {
    tag = "div" as BlockTag
  }

  const isContainer = isContainerTag(tag)

  // Process children
  const childBlocks: Block[] = []
  let textContent = ""
  let pendingMeta: Record<string, unknown> | null = null

  for (const child of element.children) {
    if (child.type === "JSXText") {
      const text = (child as JSXText).value.trim()
      if (text) {
        textContent += (textContent ? " " : "") + text
      }
    } else if (child.type === "JSXElement") {
      const childElement = child as JSXElement
      const childRawTag = getTagName(childElement.openingElement.name)
      const childResolved = resolveDottedTag(childRawTag)

      if (INLINE_HTML_TAGS.has(childResolved)) {
        // Inline tag: serialize back to HTML text
        const inlineHTML = serializeInlineElement(childElement)
        textContent += (textContent ? " " : "") + inlineHTML
      } else {
        const block = jsxElementToBlock(childElement, errors)
        if (block) {
          // Apply pending @block metadata from preceding comment
          if (pendingMeta) {
            applyBlockMeta(block, pendingMeta)
            pendingMeta = null
          }
          childBlocks.push(block)
        }
      }
    } else if (child.type === "JSXExpressionContainer") {
      const result = processExpressionContainer(child as JSXExpressionContainer, errors)
      if (result.blockMeta) {
        pendingMeta = result.blockMeta
      }
      if (result.blocks.length > 0) {
        for (const b of result.blocks) {
          if (pendingMeta) {
            applyBlockMeta(b, pendingMeta)
            pendingMeta = null
          }
          childBlocks.push(b)
        }
      }
      if (result.text) {
        textContent += (textContent ? " " : "") + result.text
      }
    } else if (child.type === "JSXFragment") {
      const fragBlocks = jsxFragmentToBlocks(child as JSXFragment, errors)
      childBlocks.push(...fragBlocks)
    } else if (child.type === "JSXSpreadChild") {
      errors.push("Spread children ({...expr}) are not supported, skipped.")
    }
  }

  // Skip custom components that produce empty blocks (e.g. <SiteHeader />, <Footer />)
  // These are React component calls with no extractable visual content
  if (isCustomComponent && !className && !textContent.trim() && childBlocks.length === 0 && Object.keys(htmlAttrs).length === 0) {
    return null
  }

  // Build block
  const block: Block = {
    id: blockId || generateId(),
    tag,
    className,
  }

  if (Object.keys(htmlAttrs).length > 0) block.attrs = htmlAttrs
  if (textContent.trim()) block.textContent = cleanTextContent(textContent)
  if (isContainer || childBlocks.length > 0) block.children = childBlocks
  if (finalAnimation) block.animation = finalAnimation
  if (background) block.background = background
  if (commerce) block.commerce = commerce
  if (responsive) block.responsive = responsive
  if (hidden) block.hidden = true
  if (locked) block.locked = true
  if (label) block.label = label
  if (componentName) block.componentName = componentName
  else if (isCustomComponent) block.componentName = resolvedTag
  if (isPartialRef && !componentName) block.componentName = "PartialReference"
  if (frameworkRequirement) block.frameworkRequirement = frameworkRequirement
  if (partialId) block.partialId = partialId
  if (partialOverrides) block.partialOverrides = partialOverrides
  if (interaction) block.interaction = interaction

  return block
}

// ============================================================
// Attribute Parsing
// ============================================================

interface ParsedAttributes {
  className: string
  htmlAttrs: Record<string, string>
  animation: BlockAnimation | undefined
  background: BlockBackground | undefined
  commerce: CommerceBinding | undefined
  responsive: BlockResponsive | undefined
  blockId: string | undefined
  hidden: boolean
  locked: boolean
  label: string | undefined
  componentName: string | undefined
  frameworkRequirement: ExportFramework | undefined
  partialId: string | undefined
  partialOverrides: Record<string, Partial<Pick<Block, "textContent" | "className" | "attrs">>> | undefined
  interaction: BlockInteraction | undefined
  isMotionFromAttrs: boolean
}

function parseJSXAttributes(
  attributes: (JSXAttribute | JSXSpreadAttribute)[],
  isMotion: boolean,
  errors: string[],
): ParsedAttributes {
  const result: ParsedAttributes = {
    className: "",
    htmlAttrs: {},
    animation: undefined,
    background: undefined,
    commerce: undefined,
    responsive: undefined,
    blockId: undefined,
    hidden: false,
    locked: false,
    label: undefined,
    componentName: undefined,
    frameworkRequirement: undefined,
    partialId: undefined,
    partialOverrides: undefined,
    interaction: undefined,
    isMotionFromAttrs: false,
  }

  // First pass: collect all attribute key-value pairs
  const attrMap: Record<string, string> = {}
  const motionAttrs: Record<string, string> = {}

  for (const attr of attributes) {
    if (attr.type === "JSXSpreadAttribute") {
      errors.push("Spread props ({...props}) are not fully supported; skipped.")
      continue
    }

    const jsxAttr = attr as JSXAttribute
    const name = getAttributeName(jsxAttr.name)
    const value = getAttributeValue(jsxAttr, errors)

    // Skip React-internal props (ref, key, etc.) — they crash createElement
    if (REACT_INTERNAL_ATTRS.has(name)) continue

    if (MOTION_ONLY_ATTRS.has(name)) {
      motionAttrs[name] = value
      result.isMotionFromAttrs = true
    } else {
      attrMap[name] = value
    }
  }

  // Extract className
  result.className = attrMap["className"] || attrMap["class"] || ""
  delete attrMap["className"]
  delete attrMap["class"]

  // Extract block ID
  result.blockId = attrMap["data-block-id"]
  delete attrMap["data-block-id"]

  // Editor metadata
  result.hidden = attrMap["data-editor-hidden"] === "true"
  delete attrMap["data-editor-hidden"]
  result.locked = attrMap["data-editor-locked"] === "true"
  delete attrMap["data-editor-locked"]
  result.label = attrMap["data-editor-label"]
  delete attrMap["data-editor-label"]

  // Component name (data-component is CMS internal, data-original-component is from preprocessor)
  result.componentName = attrMap["data-component"] || attrMap["data-original-component"]
  delete attrMap["data-component"]
  delete attrMap["data-original-component"]
  result.frameworkRequirement = attrMap["data-framework"] as ExportFramework | undefined
  delete attrMap["data-framework"]

  // Partial data
  result.partialId = attrMap["data-partial-id"]
  delete attrMap["data-partial-id"]
  if (attrMap["data-partial-overrides"]) {
    try { result.partialOverrides = JSON.parse(attrMap["data-partial-overrides"]) } catch { /* ignore */ }
    delete attrMap["data-partial-overrides"]
  }

  // Animation from data-animation attribute
  if (attrMap["data-animation"]) {
    try { result.animation = JSON.parse(attrMap["data-animation"]) } catch { /* ignore */ }
    delete attrMap["data-animation"]
  }

  // Animation from motion props
  if (!result.animation && (isMotion || Object.keys(motionAttrs).length > 0)) {
    result.animation = parseAnimationFromMotionAttrs(motionAttrs)
  }

  // Background
  if (attrMap["data-background"]) {
    try { result.background = JSON.parse(attrMap["data-background"]) } catch { /* ignore */ }
    delete attrMap["data-background"]
  }

  // Commerce
  if (attrMap["data-commerce"]) {
    try { result.commerce = JSON.parse(attrMap["data-commerce"]) } catch { /* ignore */ }
    delete attrMap["data-commerce"]
  }

  // Responsive
  if (attrMap["data-responsive"]) {
    try { result.responsive = JSON.parse(attrMap["data-responsive"]) } catch { /* ignore */ }
    delete attrMap["data-responsive"]
  }

  // Interaction (overlay content from preprocessor)
  if (attrMap["data-interaction"]) {
    try { result.interaction = JSON.parse(attrMap["data-interaction"]) } catch { /* ignore */ }
    delete attrMap["data-interaction"]
  }
  if (!result.interaction && attrMap["data-interaction-type"]) {
    const iType = attrMap["data-interaction-type"] as InteractionType
    const rawContent = attrMap["data-interaction-content"]
    const contentJSX = rawContent
      ?.replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
    let contentBlocks: Block[] = []
    if (contentJSX) {
      try {
        // Lazy require to avoid circular dependency (serialization imports ast-parser)
        const { parseJSX } = require("./serialization")
        contentBlocks = parseJSX(contentJSX)
      } catch { /* ignore parse errors in overlay content */ }
    }
    result.interaction = {
      type: iType,
      trigger: (iType === "tooltip" ? "hover" : "click") as "click" | "hover",
      content: contentBlocks,
    }
    const config: BlockInteraction["config"] = {}
    if (attrMap["data-interaction-side"]) config.side = attrMap["data-interaction-side"]
    if (attrMap["data-interaction-title"]) config.title = attrMap["data-interaction-title"]
    if (attrMap["data-interaction-description"]) config.description = attrMap["data-interaction-description"]
    if (Object.keys(config).length > 0) result.interaction.config = config
    delete attrMap["data-interaction-type"]
    delete attrMap["data-interaction-content"]
    delete attrMap["data-interaction-side"]
    delete attrMap["data-interaction-title"]
    delete attrMap["data-interaction-description"]
  }

  // Style attribute (convert object to string if needed)
  if (attrMap["style"] && attrMap["style"].startsWith("{")) {
    // Already a string representation from getAttributeValue
  }

  // Remaining attrs go to htmlAttrs
  for (const [key, val] of Object.entries(attrMap)) {
    if (SPECIAL_DATA_ATTRS.has(key)) continue
    // Skip empty style attributes (e.g. from unresolvable dynamic style objects)
    if (key === "style" && !val) continue
    if (BOOLEAN_ATTRS.has(key)) {
      result.htmlAttrs[key] = ""
      continue
    }
    if (val === "" && !BOOLEAN_ATTRS.has(key)) continue
    if (val === "true" && BOOLEAN_ATTRS.has(key)) {
      result.htmlAttrs[key] = ""
      continue
    }
    result.htmlAttrs[key] = val
  }

  return result
}

function getAttributeName(name: JSXIdentifier | JSXNamespacedName): string {
  if (name.type === "JSXIdentifier") return name.name
  if (name.type === "JSXNamespacedName") return `${name.namespace.name}:${name.name.name}`
  return ""
}

/**
 * Extract the string value of a JSX attribute.
 */
function getAttributeValue(attr: JSXAttribute, errors: string[]): string {
  const value = attr.value

  // Boolean attribute: <div controls />
  if (value === null || value === undefined) {
    return "true"
  }

  // String literal: <div className="foo" />
  if (value.type === "StringLiteral") {
    return (value as StringLiteral).value
  }

  // JSX expression container: <div className={...} />
  if (value.type === "JSXExpressionContainer") {
    const expr = (value as JSXExpressionContainer).expression
    return expressionToString(expr, errors)
  }

  return ""
}

/**
 * Convert a JSX expression to a string value (for attribute values).
 */
function expressionToString(expr: Node, errors: string[]): string {
  if (expr.type === "JSXEmptyExpression") return ""

  if (expr.type === "StringLiteral") return (expr as StringLiteral).value
  if (expr.type === "NumericLiteral") return String((expr as NumericLiteral).value)
  if (expr.type === "BooleanLiteral") return String((expr as BooleanLiteral).value)

  // Template literal: `class1 ${dynamic} class2`
  if (expr.type === "TemplateLiteral") {
    return templateLiteralToString(expr as TemplateLiteral, errors)
  }

  // Object expression: {{ color: 'red', fontSize: '16px' }}
  if (expr.type === "ObjectExpression") {
    return objectExpressionToCSSString(expr as ObjectExpression)
  }

  // cn/clsx/twMerge/twJoin — className builder functions
  // Extract all string literal arguments, join with spaces
  if (expr.type === "CallExpression") {
    const call = expr as CallExpression
    const calleeName = getCalleeName(call.callee)
    if (["cn", "clsx", "twMerge", "twJoin", "cva"].includes(calleeName)) {
      const classes: string[] = []
      for (const arg of call.arguments) {
        extractStringLiteralsFromExpr(arg, classes)
      }
      return classes.join(" ").trim()
    }
  }

  // JSON.stringify("...") - common pattern for data attributes
  if (expr.type === "CallExpression") {
    const call = expr as CallExpression
    if (
      call.callee.type === "MemberExpression" &&
      (call.callee as MemberExpression).object.type === "Identifier" &&
      ((call.callee as MemberExpression).object as Identifier).name === "JSON" &&
      (call.callee as MemberExpression).property.type === "Identifier" &&
      ((call.callee as MemberExpression).property as Identifier).name === "stringify"
    ) {
      if (call.arguments[0]?.type === "StringLiteral") {
        return (call.arguments[0] as StringLiteral).value
      }
    }
  }

  // Conditional expression: someFlag ? "class-a" : "class-b"
  if (expr.type === "ConditionalExpression") {
    const cond = expr as ConditionalExpression
    const consequent = expressionToString(cond.consequent, errors)
    const alternate = expressionToString(cond.alternate, errors)
    // Return both, separated by space (since we can't resolve the condition)
    return [consequent, alternate].filter(Boolean).join(" ")
  }

  // Identifier or member expression — preserve as expression with brace markers
  if (expr.type === "Identifier") {
    return `{${(expr as Identifier).name}}`
  }
  if (expr.type === "MemberExpression") {
    return memberExpressionToString(expr as MemberExpression)
  }

  // For complex expressions, try to extract what we can
  if (expr.type === "LogicalExpression") {
    const logical = expr as LogicalExpression
    // For `condition && "value"`, return the right side
    if (logical.operator === "&&") {
      return expressionToString(logical.right, errors)
    }
    // For `value || "fallback"`, return left side
    if (logical.operator === "||") {
      return expressionToString(logical.left, errors)
    }
  }

  // Fallback: try to get JS object literal representation
  return ""
}

function templateLiteralToString(tl: TemplateLiteral, errors: string[]): string {
  // Extract static parts, warn about dynamic parts
  const parts: string[] = []
  let hasDynamic = false

  for (let i = 0; i < tl.quasis.length; i++) {
    const quasi = tl.quasis[i]
    if (quasi.value.raw) parts.push(quasi.value.raw)
    if (i < tl.expressions.length) {
      hasDynamic = true
      // Try to extract string value from expression
      const exprVal = expressionToString(tl.expressions[i], errors)
      if (exprVal && !exprVal.startsWith("{")) {
        parts.push(exprVal)
      }
    }
  }

  if (hasDynamic) {
    errors.push("Template literal className contains dynamic parts; only static parts extracted.")
  }

  return parts.join("").trim()
}

function objectExpressionToCSSString(obj: ObjectExpression): string {
  const parts: string[] = []

  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") continue
    if (prop.type !== "ObjectProperty") continue

    const objProp = prop as ObjectProperty
    let key = ""
    if (objProp.key.type === "Identifier") {
      key = camelToKebab((objProp.key as Identifier).name)
    } else if (objProp.key.type === "StringLiteral") {
      key = (objProp.key as StringLiteral).value
    }

    let value = ""
    if (objProp.value.type === "StringLiteral") {
      value = (objProp.value as StringLiteral).value
    } else if (objProp.value.type === "NumericLiteral") {
      value = String((objProp.value as NumericLiteral).value)
      // Add px for numeric values that typically need units
      if (!["opacity", "zIndex", "flex", "flexGrow", "flexShrink", "fontWeight", "lineHeight", "order"].includes(
        objProp.key.type === "Identifier" ? (objProp.key as Identifier).name : ""
      )) {
        value += "px"
      }
    } else if (objProp.value.type === "TemplateLiteral") {
      const tl = objProp.value as TemplateLiteral
      value = tl.quasis.map(q => q.value.raw).join("")
    }

    if (key && value) parts.push(`${key}: ${value}`)
  }

  return parts.join("; ")
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

// ============================================================
// Expression Container Processing
// ============================================================

interface ExpressionResult {
  blocks: Block[]
  text: string
  /** @block metadata extracted from a JSX comment */
  blockMeta?: Record<string, unknown> | null
}

/**
 * Process a JSXExpressionContainer and extract blocks or text from it.
 */
function processExpressionContainer(
  container: JSXExpressionContainer,
  errors: string[],
): ExpressionResult {
  const expr = container.expression
  const result: ExpressionResult = { blocks: [], text: "" }

  // Empty expression: {}
  if (expr.type === "JSXEmptyExpression") {
    // JSXEmptyExpression with inner comments is how Babel represents {/* comment */}
    // Check for @block metadata comment
    const emptyExpr = expr as { innerComments?: Array<{ value: string; type: string }> }
    if (emptyExpr.innerComments?.length) {
      for (const comment of emptyExpr.innerComments) {
        const match = comment.value.match(/^\s*@block\s+(\{[\s\S]*\})\s*$/)
        if (match) {
          try { result.blockMeta = JSON.parse(match[1]) } catch { /* ignore */ }
        }
      }
    }
    return result
  }

  // String literal: {"Hello"}
  if (expr.type === "StringLiteral") {
    result.text = (expr as StringLiteral).value
    return result
  }

  // Number literal: {42}
  if (expr.type === "NumericLiteral") {
    result.text = String((expr as NumericLiteral).value)
    return result
  }

  // Template literal: {`Hello ${name}`}
  if (expr.type === "TemplateLiteral") {
    result.text = templateLiteralToString(expr as TemplateLiteral, errors)
    return result
  }

  // Logical expression: {condition && <div>...</div>}
  if (expr.type === "LogicalExpression") {
    return processLogicalExpression(expr as LogicalExpression, errors)
  }

  // Conditional expression: {cond ? <A/> : <B/>}
  if (expr.type === "ConditionalExpression") {
    return processConditionalExpression(expr as ConditionalExpression, errors)
  }

  // Call expression: {items.map(item => <div>...</div>)}
  if (expr.type === "CallExpression") {
    return processCallExpression(expr as CallExpression, errors)
  }

  // JSXElement nested in expression: {<div>...</div>}
  if (expr.type === "JSXElement") {
    const block = jsxElementToBlock(expr as JSXElement, errors)
    if (block) result.blocks.push(block)
    return result
  }

  // JSXFragment in expression: {<>...</>}
  if (expr.type === "JSXFragment") {
    result.blocks.push(...jsxFragmentToBlocks(expr as JSXFragment, errors))
    return result
  }

  // Identifier: {variableName} — preserve as expression
  if (expr.type === "Identifier") {
    result.text = `{${(expr as Identifier).name}}`
    return result
  }

  // Member expression: {obj.property} — preserve as expression
  if (expr.type === "MemberExpression") {
    result.text = memberExpressionToString(expr as MemberExpression)
    return result
  }

  return result
}

function processLogicalExpression(expr: LogicalExpression, errors: string[]): ExpressionResult {
  const result: ExpressionResult = { blocks: [], text: "" }

  if (expr.operator === "&&") {
    // {condition && <JSXElement>} — extract the right side
    if (isJSXNode(expr.right)) {
      const blocks = nodeToBlocks(expr.right, errors)
      result.blocks.push(...blocks)
    } else if (expr.right.type === "StringLiteral") {
      result.text = (expr.right as StringLiteral).value
    }
  } else if (expr.operator === "||") {
    // {value || <Fallback>} — try left first, then right
    if (isJSXNode(expr.left)) {
      result.blocks.push(...nodeToBlocks(expr.left, errors))
    } else if (isJSXNode(expr.right)) {
      result.blocks.push(...nodeToBlocks(expr.right, errors))
    }
  }

  return result
}

function processConditionalExpression(
  expr: ConditionalExpression,
  errors: string[],
): ExpressionResult {
  const result: ExpressionResult = { blocks: [], text: "" }

  // Extract JSX from consequent branch
  if (isJSXNode(expr.consequent)) {
    result.blocks.push(...nodeToBlocks(expr.consequent, errors))
  } else if (expr.consequent.type === "ConditionalExpression") {
    // Nested ternary in consequent
    const nested = processConditionalExpression(expr.consequent as ConditionalExpression, errors)
    result.blocks.push(...nested.blocks)
  }

  // Extract JSX from alternate branch
  if (isJSXNode(expr.alternate)) {
    result.blocks.push(...nodeToBlocks(expr.alternate, errors))
  } else if (expr.alternate.type === "ConditionalExpression") {
    // Nested ternary: cond1 ? <A> : cond2 ? <B> : <C>
    const nested = processConditionalExpression(expr.alternate as ConditionalExpression, errors)
    result.blocks.push(...nested.blocks)
  }

  return result
}

function processCallExpression(expr: CallExpression, errors: string[]): ExpressionResult {
  const result: ExpressionResult = { blocks: [], text: "" }

  // Check for .map() pattern: items.map(item => <div>...</div>)
  if (
    expr.callee.type === "MemberExpression" &&
    (expr.callee as MemberExpression).property.type === "Identifier" &&
    ((expr.callee as MemberExpression).property as Identifier).name === "map"
  ) {
    // Extract the callback's JSX
    const callback = expr.arguments[0]
    if (callback) {
      const jsx = extractJSXFromMapCallback(callback, errors)
      if (jsx) {
        result.blocks.push(...nodeToBlocks(jsx, errors))
        return result
      }
    }
  }

  // For other function calls, extract a text placeholder
  // e.g. {formatPrice(amount, currency)} → "{formatPrice(...)}"
  const calleeName = getCalleeNameForText(expr.callee)
  if (calleeName) {
    result.text = `{${calleeName}(...)}`
  }

  return result
}

function extractJSXFromMapCallback(node: Node, errors: string[]): Node | null {
  if (node.type === "ArrowFunctionExpression") {
    const arrow = node as ArrowFunctionExpression
    if (isJSXNode(arrow.body)) return arrow.body
    if (arrow.body.type === "BlockStatement") {
      return extractReturnJSX(arrow.body, errors)
    }
    // Parenthesized JSX
    if (arrow.body.type === "JSXElement" || arrow.body.type === "JSXFragment") {
      return arrow.body
    }
  }

  if (node.type === "FunctionExpression") {
    return extractReturnJSX((node as FunctionExpression).body, errors)
  }

  return null
}

/**
 * Convert a JS expression name to a human-readable placeholder.
 * Instead of rendering `{items.length}` or `{count}` literally,
 * produce sensible static text that looks natural on the page.
 */
export function expressionToPlaceholder(raw: string): string {
  // Strip curly braces if present
  const expr = raw.replace(/^\{|\}$/g, "").trim()

  // Common patterns → readable placeholders
  const PLACEHOLDERS: Record<string, string> = {
    "count": "0",
    "total": "0",
    "length": "0",
    "price": "$0.00",
    "amount": "$0.00",
    "quantity": "1",
    "index": "1",
    "name": "Name",
    "title": "Title",
    "description": "Description",
    "email": "email@example.com",
    "date": "Jan 1, 2025",
    "time": "12:00 PM",
    "label": "Label",
    "value": "Value",
    "text": "Text",
    "message": "Message",
    "status": "Active",
    "category": "Category",
    "username": "User",
    "url": "#",
    "href": "#",
  }

  // Check the last segment (e.g., "items.length" → "length", "product.price" → "price")
  const lastPart = expr.split(".").pop()?.toLowerCase() || ""
  if (PLACEHOLDERS[lastPart]) return PLACEHOLDERS[lastPart]

  // Check the whole expression
  if (PLACEHOLDERS[expr.toLowerCase()]) return PLACEHOLDERS[expr.toLowerCase()]

  // Patterns: *.length → "0", *.count → "0"
  if (lastPart === "length" || lastPart === "count" || lastPart === "size") return "0"
  if (/price|cost|amount|total|fee|tax/i.test(lastPart)) return "$0.00"

  // Default: humanize the variable name
  // "itemCount" → "Item Count", "firstName" → "First Name"
  const humanized = expr
    .split(".").pop()!
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()

  return humanized || "..."
}

function memberExpressionToString(expr: MemberExpression): string {
  let obj = ""
  if (expr.object.type === "Identifier") {
    obj = (expr.object as Identifier).name
  } else if (expr.object.type === "MemberExpression") {
    obj = memberExpressionToString(expr.object as MemberExpression)
  }

  let prop = ""
  if (expr.property.type === "Identifier") {
    prop = (expr.property as Identifier).name
  }

  return `{${obj}.${prop}}`
}

// ============================================================
// Animation Parsing
// ============================================================

const ANIMATION_PRESETS: Record<string, { initial: string; animate: string }> = {
  fadeIn:      { initial: "{ opacity: 0 }",                animate: "{ opacity: 1 }" },
  slideUp:    { initial: "{ opacity: 0, y: 40 }",         animate: "{ opacity: 1, y: 0 }" },
  slideDown:  { initial: "{ opacity: 0, y: -40 }",        animate: "{ opacity: 1, y: 0 }" },
  slideLeft:  { initial: "{ opacity: 0, x: 40 }",         animate: "{ opacity: 1, x: 0 }" },
  slideRight: { initial: "{ opacity: 0, x: -40 }",        animate: "{ opacity: 1, x: 0 }" },
  scale:      { initial: "{ opacity: 0, scale: 0.85 }",   animate: "{ opacity: 1, scale: 1 }" },
}

function parseAnimationFromMotionAttrs(attrs: Record<string, string>): BlockAnimation | undefined {
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
    const jsonStr = str
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/'/g, '"')
    return JSON.parse(jsonStr)
  } catch {
    return { _raw: str }
  }
}

// ============================================================
// Utility Helpers
// ============================================================

function getTagName(name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName): string {
  if (name.type === "JSXIdentifier") return name.name
  if (name.type === "JSXMemberExpression") {
    const obj = getTagName(name.object)
    const prop = name.property.name
    return `${obj}.${prop}`
  }
  if (name.type === "JSXNamespacedName") {
    return `${name.namespace.name}:${name.name.name}`
  }
  return "div"
}

function resolveDottedTag(raw: string): string {
  if (raw.includes(".")) {
    const parts = raw.split(".")
    return parts[parts.length - 1]
  }
  // Lowercase only known HTML tags — preserve case for custom components
  const lower = raw.toLowerCase()
  if (ALL_TAGS_SET.has(lower)) return lower
  return raw
}

/**
 * Serialize an inline JSX element back to HTML string (for textContent).
 */
function serializeInlineElement(element: JSXElement): string {
  const tag = getTagName(element.openingElement.name)
  const resolved = resolveDottedTag(tag)

  // Get attributes
  let attrStr = ""
  for (const attr of element.openingElement.attributes) {
    if (attr.type === "JSXSpreadAttribute") continue
    const jsxAttr = attr as JSXAttribute
    const name = getAttributeName(jsxAttr.name)
    const val = jsxAttr.value
    if (val === null || val === undefined) {
      attrStr += ` ${name}`
    } else if (val.type === "StringLiteral") {
      attrStr += ` ${name}="${(val as StringLiteral).value}"`
    }
  }

  // Self-closing
  if (element.openingElement.selfClosing || element.children.length === 0) {
    if (resolved === "br") return `<br>`
    return `<${resolved}${attrStr}></${resolved}>`
  }

  // Children
  let inner = ""
  for (const child of element.children) {
    if (child.type === "JSXText") {
      inner += (child as JSXText).value
    } else if (child.type === "JSXElement") {
      inner += serializeInlineElement(child as JSXElement)
    } else if (child.type === "JSXExpressionContainer") {
      const expr = (child as JSXExpressionContainer).expression
      if (expr.type === "StringLiteral") {
        inner += (expr as StringLiteral).value
      }
    }
  }

  return `<${resolved}${attrStr}>${inner}</${resolved}>`
}

/**
 * Process JSX children into blocks (used by jsxChildToBlocks).
 */
function jsxChildToBlocks(
  child: JSXElement["children"][number],
  errors: string[],
): Block[] {
  if (child.type === "JSXElement") {
    const childElement = child as JSXElement
    const childRawTag = getTagName(childElement.openingElement.name)
    const childResolved = resolveDottedTag(childRawTag)

    if (INLINE_HTML_TAGS.has(childResolved)) {
      // Inline tags in fragment context produce no blocks
      return []
    }

    const block = jsxElementToBlock(childElement, errors)
    return block ? [block] : []
  }

  if (child.type === "JSXFragment") {
    return jsxFragmentToBlocks(child as JSXFragment, errors)
  }

  if (child.type === "JSXExpressionContainer") {
    const result = processExpressionContainer(child as JSXExpressionContainer, errors)
    return result.blocks
  }

  // JSXText and JSXSpreadChild don't produce blocks at fragment level
  return []
}

/**
 * Recursively extract string literals from an expression tree.
 * Used for cn/clsx argument parsing — extracts the static classes
 * from complex expressions like ternaries, logical ANDs, arrays.
 */
function extractStringLiteralsFromExpr(node: Node, results: string[]): void {
  if (node.type === "StringLiteral") {
    const val = (node as StringLiteral).value.trim()
    if (val) results.push(val)
    return
  }

  // Array: cn(["class-a", condition && "class-b"])
  if (node.type === "ArrayExpression") {
    for (const elem of (node as { elements: (Node | null)[] }).elements) {
      if (elem) extractStringLiteralsFromExpr(elem, results)
    }
    return
  }

  // Logical: condition && "class-name" — take the right side
  if (node.type === "LogicalExpression") {
    const logical = node as LogicalExpression
    if (logical.operator === "&&") {
      extractStringLiteralsFromExpr(logical.right, results)
    } else if (logical.operator === "||") {
      // Take both sides for ||
      extractStringLiteralsFromExpr(logical.left, results)
      extractStringLiteralsFromExpr(logical.right, results)
    }
    return
  }

  // Ternary: condition ? "class-a" : "class-b" — take both branches
  if (node.type === "ConditionalExpression") {
    const cond = node as ConditionalExpression
    extractStringLiteralsFromExpr(cond.consequent, results)
    extractStringLiteralsFromExpr(cond.alternate, results)
    return
  }

  // Template literal: `text-${size}` — extract static parts
  if (node.type === "TemplateLiteral") {
    const tl = node as TemplateLiteral
    for (const quasi of tl.quasis) {
      const val = quasi.value.raw.trim()
      if (val) results.push(val)
    }
    return
  }

  // Nested cn/clsx calls
  if (node.type === "CallExpression") {
    const call = node as CallExpression
    const name = getCalleeName(call.callee)
    if (["cn", "clsx", "twMerge", "twJoin", "cva"].includes(name)) {
      for (const arg of call.arguments) {
        extractStringLiteralsFromExpr(arg, results)
      }
    }
    return
  }

  // Ignore everything else (identifiers, member expressions, etc.)
}

/**
 * Extract a readable callee name for text placeholder generation.
 * e.g. formatPrice → "formatPrice", obj.method → "method"
 */
function getCalleeNameForText(node: Node): string {
  if (node.type === "Identifier") return (node as Identifier).name
  if (node.type === "MemberExpression") {
    const member = node as MemberExpression
    const prop = member.property.type === "Identifier" ? (member.property as Identifier).name : ""
    // For obj.method() — return just the method name for cleaner text
    return prop || ""
  }
  return ""
}

function cleanTextContent(str: string): string {
  return str
    .replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}
