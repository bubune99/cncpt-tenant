/**
 * Block Validation Tool
 *
 * Validates Block[] structure for the page builder.
 * Replaces the old Puck template validation.
 */

import type { Block, BlockTag, BlockAnimation, BlockBackground } from "@/lib/cms/block-editor/types"
import { CONTAINER_TAGS, LEAF_TAGS } from "@/lib/cms/block-editor/types"
import type { AgentToolResult } from "../types"

const ALL_TAGS: BlockTag[] = [...CONTAINER_TAGS, ...LEAF_TAGS]

// ============================================================
// Validation Types
// ============================================================

interface ValidationIssue {
  path: string
  type: "error" | "warning"
  message: string
  suggestion?: string
}

interface ValidationStats {
  totalBlocks: number
  rootBlocks: number
  maxDepth: number
  tagsUsed: string[]
  hasAnimations: boolean
  hasBackgrounds: boolean
}

interface ValidateBlocksInput {
  blocks: unknown
  strict?: boolean
}

interface ValidateBlocksOutput {
  valid: boolean
  issues: ValidationIssue[]
  stats: ValidationStats
}

// ============================================================
// Validation Logic
// ============================================================

function validateBlock(
  block: unknown,
  path: string,
  depth: number,
  issues: ValidationIssue[],
  stats: { totalBlocks: number; maxDepth: number; tagsUsed: Set<string>; hasAnimations: boolean; hasBackgrounds: boolean },
  strict: boolean
): void {
  stats.totalBlocks++
  stats.maxDepth = Math.max(stats.maxDepth, depth)

  if (typeof block !== "object" || block === null) {
    issues.push({
      path,
      type: "error",
      message: "Block must be an object",
      suggestion: "Each block should be { id, tag, className, ... }",
    })
    return
  }

  const b = block as Record<string, unknown>

  // Required: id
  if (!b.id || typeof b.id !== "string" || b.id.trim() === "") {
    issues.push({
      path,
      type: "error",
      message: 'Missing or invalid "id" field',
      suggestion: "Every block needs a unique string id, e.g., \"sec-001\"",
    })
  }

  // Required: tag
  if (!b.tag || typeof b.tag !== "string") {
    issues.push({
      path,
      type: "error",
      message: 'Missing "tag" field',
      suggestion: "Specify an HTML tag like \"div\", \"section\", \"h1\", etc.",
    })
  } else if (!ALL_TAGS.includes(b.tag as BlockTag)) {
    issues.push({
      path,
      type: "error",
      message: `Invalid tag "${b.tag}"`,
      suggestion: `Valid tags: ${ALL_TAGS.join(", ")}`,
    })
  } else {
    stats.tagsUsed.add(b.tag as string)
  }

  // Required: className (can be empty string)
  if (typeof b.className !== "string") {
    issues.push({
      path,
      type: "error",
      message: 'Missing "className" field',
      suggestion: "Every block needs className (can be empty string \"\")",
    })
  }

  // Semantic: Leaf tags should not have children
  if (LEAF_TAGS.includes(b.tag as BlockTag) && Array.isArray(b.children) && b.children.length > 0) {
    issues.push({
      path,
      type: "error",
      message: `Leaf tag "${b.tag}" cannot have children`,
      suggestion: `Use textContent for leaf elements, or change to a container tag (div, section, etc.)`,
    })
  }

  // Semantic: Container tags should use children, not textContent (warning)
  if (
    CONTAINER_TAGS.includes(b.tag as BlockTag) &&
    b.textContent &&
    typeof b.textContent === "string" &&
    b.textContent.trim()
  ) {
    issues.push({
      path,
      type: strict ? "error" : "warning",
      message: `Container tag "${b.tag}" has textContent`,
      suggestion: "Wrap text in a child <p> or <span> instead",
    })
  }

  // Semantic: <a> should have href
  if (b.tag === "a") {
    const attrs = b.attrs as Record<string, string> | undefined
    if (!attrs?.href) {
      issues.push({
        path,
        type: strict ? "error" : "warning",
        message: "<a> tag should have href attribute",
        suggestion: 'Add attrs: { href: "/path" }',
      })
    }
  }

  // Semantic: <img> must have src
  if (b.tag === "img") {
    const attrs = b.attrs as Record<string, string> | undefined
    if (!attrs?.src) {
      issues.push({
        path,
        type: "error",
        message: "<img> tag requires src attribute",
        suggestion: 'Add attrs: { src: "/image.jpg", alt: "Description" }',
      })
    }
    if (!attrs?.alt) {
      issues.push({
        path,
        type: "warning",
        message: "<img> tag should have alt attribute for accessibility",
        suggestion: 'Add attrs: { alt: "Image description" }',
      })
    }
  }

  // Semantic: <input> should have type
  if (b.tag === "input") {
    const attrs = b.attrs as Record<string, string> | undefined
    if (!attrs?.type) {
      issues.push({
        path,
        type: "warning",
        message: "<input> tag should have type attribute",
        suggestion: 'Add attrs: { type: "text" } or "email", "password", etc.',
      })
    }
  }

  // Validate attrs is an object of strings
  if (b.attrs !== undefined) {
    if (typeof b.attrs !== "object" || b.attrs === null || Array.isArray(b.attrs)) {
      issues.push({
        path,
        type: "error",
        message: '"attrs" must be an object',
        suggestion: 'Use attrs: { href: "...", src: "..." }',
      })
    } else {
      for (const [key, value] of Object.entries(b.attrs)) {
        if (typeof value !== "string") {
          issues.push({
            path: `${path}.attrs.${key}`,
            type: "error",
            message: `Attribute value must be a string, got ${typeof value}`,
            suggestion: `Convert to string: ${JSON.stringify(value)}`,
          })
        }
      }
    }
  }

  // Validate animation if present
  if (b.animation !== undefined) {
    stats.hasAnimations = true
    if (typeof b.animation !== "object" || b.animation === null) {
      issues.push({
        path,
        type: "error",
        message: '"animation" must be an object',
      })
    } else {
      const anim = b.animation as BlockAnimation
      const validTypes = ["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scale", "custom"]
      const validTriggers = ["onMount", "inView", "hover"]

      if (anim.type && !validTypes.includes(anim.type)) {
        issues.push({
          path: `${path}.animation.type`,
          type: "error",
          message: `Invalid animation type "${anim.type}"`,
          suggestion: `Valid types: ${validTypes.join(", ")}`,
        })
      }
      if (anim.trigger && !validTriggers.includes(anim.trigger)) {
        issues.push({
          path: `${path}.animation.trigger`,
          type: "error",
          message: `Invalid animation trigger "${anim.trigger}"`,
          suggestion: `Valid triggers: ${validTriggers.join(", ")}`,
        })
      }
      if (anim.duration !== undefined && (typeof anim.duration !== "number" || anim.duration < 0)) {
        issues.push({
          path: `${path}.animation.duration`,
          type: "error",
          message: "Animation duration must be a positive number",
        })
      }
      if (anim.delay !== undefined && (typeof anim.delay !== "number" || anim.delay < 0)) {
        issues.push({
          path: `${path}.animation.delay`,
          type: "error",
          message: "Animation delay must be a positive number",
        })
      }
    }
  }

  // Validate background if present
  if (b.background !== undefined) {
    stats.hasBackgrounds = true
    if (typeof b.background !== "object" || b.background === null) {
      issues.push({
        path,
        type: "error",
        message: '"background" must be an object',
      })
    } else {
      const bg = b.background as BlockBackground
      if (!bg.url || typeof bg.url !== "string") {
        issues.push({
          path: `${path}.background.url`,
          type: "error",
          message: "Background url is required and must be a string",
        })
      }
      const validSizes = ["cover", "contain", "auto"]
      const validPositions = ["center", "top", "bottom", "left", "right"]
      const validAttachments = ["scroll", "fixed"]

      if (bg.size && !validSizes.includes(bg.size)) {
        issues.push({
          path: `${path}.background.size`,
          type: "error",
          message: `Invalid size. Valid: ${validSizes.join(", ")}`,
        })
      }
      if (bg.position && !validPositions.includes(bg.position)) {
        issues.push({
          path: `${path}.background.position`,
          type: "error",
          message: `Invalid position. Valid: ${validPositions.join(", ")}`,
        })
      }
      if (bg.attachment && !validAttachments.includes(bg.attachment)) {
        issues.push({
          path: `${path}.background.attachment`,
          type: "error",
          message: `Invalid attachment. Valid: ${validAttachments.join(", ")}`,
        })
      }
    }
  }

  // Recurse into children
  if (b.children !== undefined) {
    if (!Array.isArray(b.children)) {
      issues.push({
        path,
        type: "error",
        message: '"children" must be an array',
        suggestion: "Use children: [{ ... }, { ... }]",
      })
    } else {
      b.children.forEach((child, i) => {
        validateBlock(child, `${path}.children[${i}]`, depth + 1, issues, stats, strict)
      })
    }
  }
}

function checkDuplicateIds(blocks: Block[], issues: ValidationIssue[]): void {
  const ids = new Set<string>()

  function collect(block: Block, path: string) {
    if (ids.has(block.id)) {
      issues.push({
        path,
        type: "error",
        message: `Duplicate block ID: "${block.id}"`,
        suggestion: "Every block must have a unique id",
      })
    }
    ids.add(block.id)
    if (block.children) {
      block.children.forEach((child, i) => collect(child, `${path}.children[${i}]`))
    }
  }

  blocks.forEach((block, i) => collect(block, `blocks[${i}]`))
}

// ============================================================
// Tool Definition
// ============================================================

/**
 * Tool to validate Block[] structure
 */
export const validateBlocksTool = {
  name: "validate_blocks",
  description: `Validates Block[] structure for the page builder.
Checks that all blocks have valid tags, required fields, and proper nesting.
Returns validation issues and suggestions for fixes.

IMPORTANT: This validates the NEW Block format (tag, className, children),
NOT the old Puck format (type, props, slots).`,

  inputSchema: {
    type: "object" as const,
    properties: {
      blocks: {
        type: "array",
        description: "Array of Block objects to validate",
      },
      strict: {
        type: "boolean",
        description: "Enable strict validation (warnings become errors)",
      },
    },
    required: ["blocks"],
  },

  async execute(input: ValidateBlocksInput): Promise<AgentToolResult<ValidateBlocksOutput>> {
    try {
      const issues: ValidationIssue[] = []
      const stats = {
        totalBlocks: 0,
        maxDepth: 0,
        tagsUsed: new Set<string>(),
        hasAnimations: false,
        hasBackgrounds: false,
      }

      // Handle different input formats
      let blocks: unknown[]

      if (Array.isArray(input.blocks)) {
        blocks = input.blocks
      } else if (typeof input.blocks === "object" && input.blocks !== null) {
        // Single block
        blocks = [input.blocks]
        issues.push({
          path: "input",
          type: "warning",
          message: "Input is a single block, wrapping in array",
          suggestion: "Pass blocks as an array: [{ ... }]",
        })
      } else {
        return {
          success: false,
          error: "Input must be an array of Block objects",
        }
      }

      // Validate each block
      blocks.forEach((block, i) => {
        validateBlock(block, `blocks[${i}]`, 0, issues, stats, input.strict || false)
      })

      // Check for duplicate IDs
      checkDuplicateIds(blocks as Block[], issues)

      // Check for excessive depth
      if (stats.maxDepth > 15) {
        issues.push({
          path: "structure",
          type: "warning",
          message: `Structure is deeply nested (${stats.maxDepth} levels)`,
          suggestion: "Consider flattening for better performance",
        })
      }

      const hasErrors = issues.some((i) => i.type === "error")

      return {
        success: true,
        data: {
          valid: !hasErrors,
          issues,
          stats: {
            totalBlocks: stats.totalBlocks,
            rootBlocks: blocks.length,
            maxDepth: stats.maxDepth,
            tagsUsed: Array.from(stats.tagsUsed),
            hasAnimations: stats.hasAnimations,
            hasBackgrounds: stats.hasBackgrounds,
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Validation failed: ${(error as Error).message}`,
      }
    }
  },
}

// ============================================================
// Standalone validation function (for use outside agent)
// ============================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateBlocks(blocks: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(blocks)) {
    return { valid: false, errors: ["Input must be an array of Block objects"], warnings: [] }
  }

  const stats = {
    totalBlocks: 0,
    maxDepth: 0,
    tagsUsed: new Set<string>(),
    hasAnimations: false,
    hasBackgrounds: false,
  }

  const issues: ValidationIssue[] = []

  blocks.forEach((block, i) => {
    validateBlock(block, `[${i}]`, 0, issues, stats, false)
  })

  checkDuplicateIds(blocks as Block[], issues)

  for (const issue of issues) {
    if (issue.type === "error") {
      errors.push(`${issue.path}: ${issue.message}`)
    } else {
      warnings.push(`${issue.path}: ${issue.message}`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export default { validateBlocksTool, validateBlocks }
