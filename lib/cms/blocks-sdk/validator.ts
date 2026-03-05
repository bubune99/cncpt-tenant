/**
 * Block SDK - Validation
 *
 * Validates block trees for correctness before rendering or saving.
 */

import type { Block, BlockTag } from "./types"
import { CONTAINER_TAGS, LEAF_TAGS } from "./types"
import type { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion, ValidationOptions } from "./types"

const ALL_TAGS = new Set<string>([...CONTAINER_TAGS, ...LEAF_TAGS])

const TAGS_REQUIRING_ATTRS: Record<string, string[]> = {
  a: ["href"],
  img: ["src", "alt"],
  video: ["src"],
  input: ["type"],
  label: [], // 'for' is optional
}

const TAGS_WITH_OPTIONAL_ATTRS: Record<string, string[]> = {
  a: ["target", "rel"],
  img: ["loading", "width", "height"],
  video: ["poster", "autoplay", "loop", "muted", "controls"],
  input: ["placeholder", "name", "value", "required", "disabled"],
  textarea: ["placeholder", "name", "rows", "cols", "required"],
  button: ["type", "disabled"],
  form: ["action", "method"],
}

/**
 * Validate a block tree
 */
export function validate(blocks: Block[], options: ValidationOptions = {}): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: ValidationSuggestion[] = []
  const seenIds = new Set<string>()

  const opts: Required<ValidationOptions> = {
    strict: options.strict ?? false,
    checkAccessibility: options.checkAccessibility ?? true,
    checkEmptyContainers: options.checkEmptyContainers ?? true,
    maxDepth: options.maxDepth ?? 20,
  }

  function validateBlock(block: Block, path: string, depth: number, parent: Block | null) {
    // Check depth
    if (depth > opts.maxDepth) {
      errors.push({
        path,
        message: `Maximum nesting depth (${opts.maxDepth}) exceeded`,
        code: "MAX_DEPTH_EXCEEDED",
        blockId: block.id,
      })
      return
    }

    // Check for required id
    if (!block.id) {
      errors.push({
        path,
        message: "Block is missing required 'id' field",
        code: "MISSING_ID",
      })
    }

    // Check for duplicate ids
    if (block.id && seenIds.has(block.id)) {
      errors.push({
        path,
        message: `Duplicate block id: '${block.id}'`,
        code: "DUPLICATE_ID",
        blockId: block.id,
      })
    }
    if (block.id) seenIds.add(block.id)

    // Check for valid tag
    if (!ALL_TAGS.has(block.tag)) {
      errors.push({
        path,
        message: `Invalid tag '${block.tag}'. Valid tags: ${Array.from(ALL_TAGS).join(", ")}`,
        code: "INVALID_TAG",
        blockId: block.id,
      })
    }

    // Check for className (should exist, even if empty)
    if (block.className === undefined) {
      warnings.push({
        path,
        message: "Block is missing 'className' field (should be empty string if no classes)",
        code: "MISSING_CLASSNAME",
        blockId: block.id,
      })
    }

    // Check leaf tags don't have children
    if (LEAF_TAGS.includes(block.tag as BlockTag) && block.children && block.children.length > 0) {
      errors.push({
        path,
        message: `Leaf tag '${block.tag}' cannot have children`,
        code: "LEAF_WITH_CHILDREN",
        blockId: block.id,
      })
    }

    // Check container tags that are empty
    if (opts.checkEmptyContainers && CONTAINER_TAGS.includes(block.tag as BlockTag)) {
      if ((!block.children || block.children.length === 0) && !block.textContent) {
        warnings.push({
          path,
          message: `Container '${block.tag}' is empty (no children or textContent)`,
          code: "EMPTY_CONTAINER",
          blockId: block.id,
        })
      }
    }

    // Check required attributes
    const requiredAttrs = TAGS_REQUIRING_ATTRS[block.tag] || []
    for (const attr of requiredAttrs) {
      if (!block.attrs?.[attr]) {
        if (attr === "alt" && block.tag === "img") {
          // alt is critical for accessibility
          if (opts.checkAccessibility) {
            errors.push({
              path,
              message: `Image is missing required 'alt' attribute for accessibility`,
              code: "MISSING_ALT",
              blockId: block.id,
            })
          }
        } else {
          warnings.push({
            path,
            message: `Tag '${block.tag}' is typically used with '${attr}' attribute`,
            code: "MISSING_RECOMMENDED_ATTR",
            blockId: block.id,
          })
        }
      }
    }

    // Check link has valid href
    if (block.tag === "a" && block.attrs?.href) {
      const href = block.attrs.href
      if (!href.startsWith("/") && !href.startsWith("#") && !href.startsWith("http") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
        warnings.push({
          path,
          message: `Link href '${href}' may be invalid. Expected: relative path (/...), anchor (#...), or full URL`,
          code: "SUSPICIOUS_HREF",
          blockId: block.id,
        })
      }
    }

    // Check image src
    if (block.tag === "img" && block.attrs?.src) {
      const src = block.attrs.src
      if (!src.startsWith("/") && !src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("blob:")) {
        warnings.push({
          path,
          message: `Image src '${src}' may be invalid. Expected: relative path (/...), URL, or data URI`,
          code: "SUSPICIOUS_SRC",
          blockId: block.id,
        })
      }
    }

    // Accessibility suggestions
    if (opts.checkAccessibility) {
      // Buttons should have text content
      if (block.tag === "button" && !block.textContent && !block.attrs?.["aria-label"]) {
        suggestions.push({
          path,
          message: "Button has no text content. Consider adding text or aria-label for accessibility",
          code: "BUTTON_NO_TEXT",
        })
      }

      // Links should have text content
      if (block.tag === "a" && !block.textContent && !block.attrs?.["aria-label"]) {
        suggestions.push({
          path,
          message: "Link has no text content. Consider adding text or aria-label for accessibility",
          code: "LINK_NO_TEXT",
        })
      }

      // Check for heading hierarchy
      if (block.tag.match(/^h[1-6]$/)) {
        const level = parseInt(block.tag[1])
        if (parent && parent.tag.match(/^h[1-6]$/)) {
          const parentLevel = parseInt(parent.tag[1])
          if (level > parentLevel + 1) {
            warnings.push({
              path,
              message: `Heading hierarchy skip: ${parent.tag} followed by ${block.tag}. Consider using h${parentLevel + 1}`,
              code: "HEADING_HIERARCHY_SKIP",
              blockId: block.id,
            })
          }
        }
      }
    }

    // Animation validation
    if (block.animation) {
      if (block.animation.type && !["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "scale", "custom"].includes(block.animation.type)) {
        errors.push({
          path: `${path}.animation.type`,
          message: `Invalid animation type '${block.animation.type}'`,
          code: "INVALID_ANIMATION_TYPE",
          blockId: block.id,
        })
      }
      if (block.animation.trigger && !["onMount", "inView", "hover"].includes(block.animation.trigger)) {
        errors.push({
          path: `${path}.animation.trigger`,
          message: `Invalid animation trigger '${block.animation.trigger}'`,
          code: "INVALID_ANIMATION_TRIGGER",
          blockId: block.id,
        })
      }
    }

    // Background validation
    if (block.background) {
      if (!block.background.url) {
        errors.push({
          path: `${path}.background`,
          message: "Background is missing required 'url' field",
          code: "BACKGROUND_MISSING_URL",
          blockId: block.id,
        })
      }
    }

    // Recursively validate children
    if (block.children) {
      for (let i = 0; i < block.children.length; i++) {
        validateBlock(block.children[i], `${path}.children[${i}]`, depth + 1, block)
      }
    }
  }

  // Validate each root block
  for (let i = 0; i < blocks.length; i++) {
    validateBlock(blocks[i], `blocks[${i}]`, 0, null)
  }

  // In strict mode, warnings become errors
  if (opts.strict) {
    errors.push(...warnings.map(w => ({
      path: w.path,
      message: w.message,
      code: w.code,
      blockId: w.blockId,
    })))
    warnings.length = 0
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  }
}

/**
 * Quick check if a single block is valid
 */
export function isValidBlock(block: Block): boolean {
  if (!block.id || !block.tag || block.className === undefined) return false
  if (!ALL_TAGS.has(block.tag)) return false
  return true
}

/**
 * Quick check if a block tree is valid
 */
export function isValidBlockTree(blocks: Block[]): boolean {
  const result = validate(blocks, { strict: false, checkAccessibility: false })
  return result.valid
}

/**
 * Get validation errors as formatted strings
 */
export function formatValidationErrors(result: ValidationResult): string[] {
  const lines: string[] = []

  for (const error of result.errors) {
    lines.push(`ERROR [${error.code}] ${error.path}: ${error.message}`)
  }

  for (const warning of result.warnings) {
    lines.push(`WARN [${warning.code}] ${warning.path}: ${warning.message}`)
  }

  for (const suggestion of result.suggestions) {
    lines.push(`SUGGESTION [${suggestion.code}] ${suggestion.path}: ${suggestion.message}`)
  }

  return lines
}
