#!/usr/bin/env npx tsx
/**
 * Block Validation & Conversion CLI
 *
 * Validates Block[] structure before seeding to database.
 * Also converts React/TSX code to Block[] format.
 *
 * Usage:
 *   npx tsx prisma/validate-blocks.ts ./path/to/blocks.json
 *   npx tsx prisma/validate-blocks.ts --stdin < blocks.json
 *   npx tsx prisma/validate-blocks.ts --file ./my-page.json
 *   npx tsx prisma/validate-blocks.ts --convert ./component.tsx
 *   npx tsx prisma/validate-blocks.ts --help
 *
 * Exit codes:
 *   0 - Validation passed / Conversion successful
 *   1 - Validation failed (schema errors)
 *   2 - Parse error (invalid JSON or TSX)
 */

import * as fs from "fs"
import * as path from "path"

// ============================================================
// Type Definitions (mirrored from lib/cms/block-editor/types.ts)
// ============================================================

type BlockTag =
  | "div"
  | "section"
  | "header"
  | "footer"
  | "main"
  | "nav"
  | "aside"
  | "article"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "a"
  | "img"
  | "button"
  | "ul"
  | "ol"
  | "li"
  | "hr"
  | "blockquote"
  | "figure"
  | "figcaption"
  | "form"
  | "input"
  | "textarea"
  | "label"
  | "video"
  | "svg"

const CONTAINER_TAGS: BlockTag[] = [
  "div",
  "section",
  "header",
  "footer",
  "main",
  "nav",
  "aside",
  "article",
  "ul",
  "ol",
  "li",
  "figure",
  "form",
  "blockquote",
]

const LEAF_TAGS: BlockTag[] = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "a", "img", "button",
  "hr", "input", "textarea", "label",
  "video", "svg", "figcaption",
]

const ALL_TAGS: BlockTag[] = [...CONTAINER_TAGS, ...LEAF_TAGS]

interface BlockAnimation {
  type?: "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scale" | "custom"
  trigger?: "onMount" | "inView" | "hover"
  duration?: number
  delay?: number
  custom?: Record<string, unknown>
}

interface BlockBackground {
  url: string
  size?: "cover" | "contain" | "auto"
  position?: "center" | "top" | "bottom" | "left" | "right"
  attachment?: "scroll" | "fixed"
  overlay?: string
}

interface Block {
  id: string
  tag: BlockTag
  className: string
  textContent?: string
  attrs?: Record<string, string>
  children?: Block[]
  parentId?: string | null
  animation?: BlockAnimation
  background?: BlockBackground
  label?: string
  hidden?: boolean
  locked?: boolean
}

interface PageDocument {
  version: string
  blocks: Block[]
}

// ============================================================
// Validation Logic
// ============================================================

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    rootBlocks: number
    totalBlocks: number
    version: string
  }
}

function validateBlock(block: unknown, path: string, errors: string[], warnings: string[]): void {
  if (typeof block !== "object" || block === null) {
    errors.push(`${path}: Block must be an object`)
    return
  }

  const b = block as Record<string, unknown>

  // Required: id
  if (!b.id || typeof b.id !== "string" || b.id.trim() === "") {
    errors.push(`${path}: Missing or invalid "id" field (must be non-empty string)`)
  }

  // Required: tag
  if (!b.tag || typeof b.tag !== "string") {
    errors.push(`${path}: Missing "tag" field`)
  } else if (!ALL_TAGS.includes(b.tag as BlockTag)) {
    errors.push(`${path}: Invalid tag "${b.tag}". Valid tags: ${ALL_TAGS.join(", ")}`)
  }

  // Required: className (can be empty string)
  if (typeof b.className !== "string") {
    errors.push(`${path}: Missing "className" field (can be empty string "")`)
  }

  // Semantic: Leaf tags should not have children
  if (LEAF_TAGS.includes(b.tag as BlockTag) && Array.isArray(b.children) && b.children.length > 0) {
    errors.push(`${path}: Leaf tag "${b.tag}" cannot have children. Use a container tag (div, section, etc.) or remove children.`)
  }

  // Semantic: Container tags should use children, not textContent
  if (CONTAINER_TAGS.includes(b.tag as BlockTag) && b.textContent && typeof b.textContent === "string" && b.textContent.trim()) {
    warnings.push(`${path}: Container tag "${b.tag}" has textContent. Consider wrapping text in a <p> or <span> child instead.`)
  }

  // Semantic: <a> should have href
  if (b.tag === "a") {
    const attrs = b.attrs as Record<string, string> | undefined
    if (!attrs?.href) {
      warnings.push(`${path}: <a> tag should have href attribute in attrs`)
    }
  }

  // Semantic: <img> must have src
  if (b.tag === "img") {
    const attrs = b.attrs as Record<string, string> | undefined
    if (!attrs?.src) {
      errors.push(`${path}: <img> tag requires src attribute in attrs`)
    }
    if (!attrs?.alt) {
      warnings.push(`${path}: <img> tag should have alt attribute for accessibility`)
    }
  }

  // Semantic: <input> should have type
  if (b.tag === "input") {
    const attrs = b.attrs as Record<string, string> | undefined
    if (!attrs?.type) {
      warnings.push(`${path}: <input> tag should have type attribute (text, email, password, etc.)`)
    }
  }

  // Validate attrs is an object of strings
  if (b.attrs !== undefined) {
    if (typeof b.attrs !== "object" || b.attrs === null || Array.isArray(b.attrs)) {
      errors.push(`${path}: "attrs" must be an object`)
    } else {
      for (const [key, value] of Object.entries(b.attrs)) {
        if (typeof value !== "string") {
          errors.push(`${path}.attrs.${key}: Attribute value must be a string, got ${typeof value}`)
        }
      }
    }
  }

  // Validate animation if present
  if (b.animation !== undefined) {
    if (typeof b.animation !== "object" || b.animation === null) {
      errors.push(`${path}: "animation" must be an object`)
    } else {
      const anim = b.animation as BlockAnimation
      const validTypes = ["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scale", "custom"]
      const validTriggers = ["onMount", "inView", "hover"]

      if (anim.type && !validTypes.includes(anim.type)) {
        errors.push(`${path}.animation.type: Invalid value "${anim.type}". Valid: ${validTypes.join(", ")}`)
      }
      if (anim.trigger && !validTriggers.includes(anim.trigger)) {
        errors.push(`${path}.animation.trigger: Invalid value "${anim.trigger}". Valid: ${validTriggers.join(", ")}`)
      }
      if (anim.duration !== undefined && (typeof anim.duration !== "number" || anim.duration < 0)) {
        errors.push(`${path}.animation.duration: Must be a positive number`)
      }
      if (anim.delay !== undefined && (typeof anim.delay !== "number" || anim.delay < 0)) {
        errors.push(`${path}.animation.delay: Must be a positive number`)
      }
    }
  }

  // Validate background if present
  if (b.background !== undefined) {
    if (typeof b.background !== "object" || b.background === null) {
      errors.push(`${path}: "background" must be an object`)
    } else {
      const bg = b.background as BlockBackground
      if (!bg.url || typeof bg.url !== "string") {
        errors.push(`${path}.background.url: Required and must be a string`)
      }
      const validSizes = ["cover", "contain", "auto"]
      const validPositions = ["center", "top", "bottom", "left", "right"]
      const validAttachments = ["scroll", "fixed"]

      if (bg.size && !validSizes.includes(bg.size)) {
        errors.push(`${path}.background.size: Invalid value. Valid: ${validSizes.join(", ")}`)
      }
      if (bg.position && !validPositions.includes(bg.position)) {
        errors.push(`${path}.background.position: Invalid value. Valid: ${validPositions.join(", ")}`)
      }
      if (bg.attachment && !validAttachments.includes(bg.attachment)) {
        errors.push(`${path}.background.attachment: Invalid value. Valid: ${validAttachments.join(", ")}`)
      }
    }
  }

  // Recurse into children
  if (b.children !== undefined) {
    if (!Array.isArray(b.children)) {
      errors.push(`${path}: "children" must be an array`)
    } else {
      b.children.forEach((child, i) => {
        validateBlock(child, `${path}.children[${i}]`, errors, warnings)
      })
    }
  }
}

function countBlocks(blocks: Block[]): number {
  let count = 0
  function recurse(b: Block) {
    count++
    if (b.children) {
      b.children.forEach(recurse)
    }
  }
  blocks.forEach(recurse)
  return count
}

function validatePageDocument(input: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Handle different input formats
  let doc: PageDocument

  if (Array.isArray(input)) {
    // Raw Block[] array
    doc = { version: "2.0", blocks: input }
    warnings.push("Input is a raw Block[] array. Consider wrapping in { version: \"2.0\", blocks: [...] }")
  } else if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>

    if (obj.version && obj.blocks) {
      // PageDocument format
      doc = input as PageDocument
    } else if (obj.tag && obj.id) {
      // Single Block
      doc = { version: "2.0", blocks: [input as Block] }
      warnings.push("Input is a single Block. Consider wrapping in { version: \"2.0\", blocks: [...] }")
    } else {
      errors.push("Invalid input format. Expected PageDocument { version, blocks } or Block[] array")
      return { valid: false, errors, warnings, stats: { rootBlocks: 0, totalBlocks: 0, version: "unknown" } }
    }
  } else {
    errors.push("Input must be an object or array")
    return { valid: false, errors, warnings, stats: { rootBlocks: 0, totalBlocks: 0, version: "unknown" } }
  }

  // Validate version
  if (doc.version !== "2.0") {
    warnings.push(`Version "${doc.version}" detected. Current version is "2.0"`)
  }

  // Validate blocks array
  if (!Array.isArray(doc.blocks)) {
    errors.push("\"blocks\" must be an array")
    return { valid: false, errors, warnings, stats: { rootBlocks: 0, totalBlocks: 0, version: doc.version || "unknown" } }
  }

  // Validate each block
  doc.blocks.forEach((block, i) => {
    validateBlock(block, `blocks[${i}]`, errors, warnings)
  })

  // Check for duplicate IDs
  const ids = new Set<string>()
  function collectIds(blocks: Block[]) {
    for (const block of blocks) {
      if (ids.has(block.id)) {
        errors.push(`Duplicate block ID: "${block.id}"`)
      }
      ids.add(block.id)
      if (block.children) {
        collectIds(block.children)
      }
    }
  }
  collectIds(doc.blocks as Block[])

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      rootBlocks: doc.blocks.length,
      totalBlocks: countBlocks(doc.blocks as Block[]),
      version: doc.version || "2.0",
    },
  }
}

// ============================================================
// CLI Interface
// ============================================================

function printHelp() {
  console.log(`
Block Validation & Conversion CLI
==================================

Validates Block[] structure before seeding to the page builder database.
Also converts React/TSX code to Block[] format.

USAGE:
  npx tsx prisma/validate-blocks.ts [OPTIONS] [FILE]

OPTIONS:
  --help, -h      Show this help message
  --stdin         Read JSON from stdin
  --file PATH     Read JSON from file (same as positional argument)
  --quiet, -q     Only output errors (no stats or success message)
  --json          Output results as JSON
  --convert PATH  Convert React/TSX code to Block[] format (outputs JSON)

EXAMPLES:
  # Validate a JSON file
  npx tsx prisma/validate-blocks.ts ./my-page.json

  # Pipe JSON from another command
  cat blocks.json | npx tsx prisma/validate-blocks.ts --stdin

  # Validate and get JSON output for scripting
  npx tsx prisma/validate-blocks.ts --json ./blocks.json

  # Convert a React component to Block[] format
  npx tsx prisma/validate-blocks.ts --convert ./components/hero.tsx

  # Convert and save to file
  npx tsx prisma/validate-blocks.ts --convert ./hero.tsx > hero-blocks.json

BLOCK STRUCTURE:
  {
    "version": "2.0",
    "blocks": [
      {
        "id": "unique-id",
        "tag": "section",         // Valid HTML tag
        "className": "py-20",     // Tailwind classes
        "textContent": "...",     // For leaf elements
        "attrs": { "href": "..." }, // HTML attributes
        "children": [...]         // For containers
      }
    ]
  }

VALID TAGS:
  Containers: ${CONTAINER_TAGS.join(", ")}
  Leaves: ${LEAF_TAGS.join(", ")}

EXIT CODES:
  0 - Validation passed
  1 - Validation failed (schema errors)
  2 - Parse error (invalid JSON)
`)
}

/**
 * Convert React/TSX code to Block[] format
 */
async function handleConvert(filePath: string) {
  const resolvedPath = path.resolve(filePath)

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found: ${resolvedPath}`)
    process.exit(2)
  }

  const code = fs.readFileSync(resolvedPath, "utf-8")

  // Import the parser and converter dynamically
  try {
    const { parseV0Component } = await import("../lib/cms/v0/parser")
    const { convertToBlocks, validateBlocks } = await import("../lib/cms/v0/converter")

    // Parse the component
    const parsed = parseV0Component(code)

    // Convert to blocks
    const result = convertToBlocks(parsed)

    // Validate the output
    const validation = validateBlocks(result.blocks)

    // Build output
    const output = {
      success: validation.valid,
      componentName: result.metadata.componentName,
      displayName: result.metadata.displayName,
      version: "2.0",
      blocks: result.blocks,
      warnings: [
        ...result.metadata.warnings,
        ...validation.warnings,
      ],
      errors: validation.errors,
      dependencies: result.metadata.dependencies,
    }

    // Output JSON
    console.log(JSON.stringify(output, null, 2))

    // Log summary to stderr so it doesn't interfere with JSON output
    if (!validation.valid) {
      console.error(`\nConversion completed with ${validation.errors.length} error(s).`)
      console.error("Review errors and fix manually before seeding.\n")
      process.exit(1)
    }

    if (output.warnings.length > 0) {
      console.error(`\nConversion successful with ${output.warnings.length} warning(s).`)
      console.error("Review warnings in the output.\n")
    } else {
      console.error(`\nConversion successful: ${result.blocks.length} root block(s) generated.\n`)
    }

    process.exit(0)
  } catch (e) {
    console.error(`\nConversion Error: ${(e as Error).message}\n`)
    console.error("Make sure you're running from the project root directory.")
    process.exit(2)
  }
}

async function main() {
  const args = process.argv.slice(2)

  // Parse flags
  const flags = {
    help: args.includes("--help") || args.includes("-h"),
    stdin: args.includes("--stdin"),
    quiet: args.includes("--quiet") || args.includes("-q"),
    json: args.includes("--json"),
    convert: false,
    convertPath: "",
  }

  // Check for --convert flag
  const convertIdx = args.indexOf("--convert")
  if (convertIdx !== -1 && args[convertIdx + 1]) {
    flags.convert = true
    flags.convertPath = args[convertIdx + 1]
  }

  if (flags.help) {
    printHelp()
    process.exit(0)
  }

  // Handle convert mode
  if (flags.convert) {
    await handleConvert(flags.convertPath)
    return
  }

  // Get file path (if not using stdin)
  let filePath: string | null = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      filePath = args[i + 1]
      break
    }
    if (!args[i].startsWith("-") && !filePath) {
      filePath = args[i]
    }
  }

  // Get input
  let input: string

  if (flags.stdin) {
    // Read from stdin
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    input = Buffer.concat(chunks).toString("utf-8")
  } else if (filePath) {
    // Read from file
    const resolvedPath = path.resolve(filePath)
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: File not found: ${resolvedPath}`)
      process.exit(2)
    }
    input = fs.readFileSync(resolvedPath, "utf-8")
  } else {
    printHelp()
    process.exit(0)
  }

  // Parse JSON
  let data: unknown
  try {
    data = JSON.parse(input)
  } catch (e) {
    if (flags.json) {
      console.log(JSON.stringify({ valid: false, errors: [`JSON parse error: ${(e as Error).message}`], warnings: [] }))
    } else {
      console.error(`\nJSON Parse Error: ${(e as Error).message}\n`)
    }
    process.exit(2)
  }

  // Validate
  const result = validatePageDocument(data)

  // Output
  if (flags.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    if (!flags.quiet) {
      console.log("\nBlock Validation Results")
      console.log("========================\n")
    }

    if (result.errors.length > 0) {
      console.log("ERRORS:\n")
      result.errors.forEach((err) => console.log(`  - ${err}`))
      console.log("")
    }

    if (result.warnings.length > 0 && !flags.quiet) {
      console.log("WARNINGS:\n")
      result.warnings.forEach((warn) => console.log(`  - ${warn}`))
      console.log("")
    }

    if (result.valid) {
      if (!flags.quiet) {
        console.log("STATUS: PASSED\n")
        console.log("Statistics:")
        console.log(`  - Version: ${result.stats.version}`)
        console.log(`  - Root blocks: ${result.stats.rootBlocks}`)
        console.log(`  - Total blocks: ${result.stats.totalBlocks}`)
        if (result.warnings.length > 0) {
          console.log(`  - Warnings: ${result.warnings.length} (review recommended)`)
        }
        console.log("")
      }
    } else {
      console.log("STATUS: FAILED\n")
      console.log(`Found ${result.errors.length} error(s). Fix these before seeding.\n`)
    }
  }

  process.exit(result.valid ? 0 : 1)
}

main().catch((e) => {
  console.error("Unexpected error:", e)
  process.exit(2)
})
