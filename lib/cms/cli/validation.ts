/**
 * CLI Pre-Flight Validation
 *
 * Validates data integrity before any DB write in CLI commands and seed scripts.
 * Detects multi-tenant schemas and enforces tenantId requirements.
 */

import { prisma, c, sym } from "./utils"
import { validateSlug } from "../slug"
import type { Block } from "../block-editor/types"

// ── Types ─────────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface PreflightLine {
  ok: boolean
  label: string
  detail: string
  warning?: boolean
}

// ── Schema Introspection ──────────────────────────────────────────

let _isMultiTenantCached: boolean | null = null

/**
 * Detect if the `pages` table has a `tenant_id` column (multi-tenant schema).
 * Result is cached for the process lifetime.
 */
export async function isMultiTenant(): Promise<boolean> {
  if (_isMultiTenantCached !== null) return _isMultiTenantCached

  try {
    const result: { count: bigint }[] = await prisma.$queryRaw`
      SELECT COUNT(*)::bigint as count
      FROM information_schema.columns
      WHERE table_name = 'Page'
        AND column_name = 'tenantId'
    `
    // Also check snake_case variant
    const result2: { count: bigint }[] = await prisma.$queryRaw`
      SELECT COUNT(*)::bigint as count
      FROM information_schema.columns
      WHERE table_name = 'Page'
        AND column_name = 'tenant_id'
    `
    _isMultiTenantCached =
      Number(result[0]?.count ?? 0) > 0 || Number(result2[0]?.count ?? 0) > 0
  } catch {
    // If we can't query information_schema, assume single-tenant
    _isMultiTenantCached = false
  }

  return _isMultiTenantCached
}

/** Reset cached value (for testing) */
export function resetMultiTenantCache() {
  _isMultiTenantCached = null
}

// ── Content Structure Validation ──────────────────────────────────

const VALID_TAGS = new Set([
  "div", "section", "article", "aside", "main", "nav", "header", "footer",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "button",
  "ul", "ol", "li", "img", "video", "audio", "figure", "figcaption",
  "form", "input", "textarea", "select", "label", "table", "thead",
  "tbody", "tr", "th", "td", "blockquote", "pre", "code", "hr", "br",
  "iframe", "svg", "path", "details", "summary", "dialog", "picture",
  "source",
])

function validateBlock(block: unknown, path: string, errors: string[], warnings: string[]): void {
  if (!block || typeof block !== "object") {
    errors.push(`${path}: block is not an object`)
    return
  }

  const b = block as Record<string, unknown>

  if (typeof b.id !== "string" || !b.id) {
    errors.push(`${path}: missing or empty "id"`)
  }

  if (typeof b.tag !== "string" || !b.tag) {
    errors.push(`${path}: missing or empty "tag"`)
  } else if (!VALID_TAGS.has(b.tag as string)) {
    warnings.push(`${path}: unknown tag "${b.tag}" (may be intentional)`)
  }

  if (b.className !== undefined && typeof b.className !== "string") {
    errors.push(`${path}: "className" must be a string`)
  }

  if (b.textContent !== undefined && typeof b.textContent !== "string") {
    errors.push(`${path}: "textContent" must be a string`)
  }

  // Animation without type
  if (b.animation && typeof b.animation === "object") {
    const anim = b.animation as Record<string, unknown>
    if (!anim.type) {
      warnings.push(`${path}: animation data present but missing "type" field`)
    }
  }

  // Recurse into children
  if (b.children !== undefined) {
    if (!Array.isArray(b.children)) {
      errors.push(`${path}: "children" must be an array`)
    } else {
      for (let i = 0; i < b.children.length; i++) {
        validateBlock(b.children[i], `${path}.children[${i}]`, errors, warnings)
      }
    }
  }
}

/**
 * Validate block content JSON structure.
 */
export function validateContentStructure(content: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!content || typeof content !== "object") {
    errors.push('Content must be an object')
    return { valid: false, errors, warnings }
  }

  const raw = content as Record<string, unknown>

  if (raw.version !== "2.0") {
    errors.push(`Content version must be "2.0", got "${raw.version}"`)
  }

  if (!Array.isArray(raw.blocks)) {
    errors.push('Content "blocks" must be an array')
    return { valid: false, errors, warnings }
  }

  for (let i = 0; i < raw.blocks.length; i++) {
    validateBlock(raw.blocks[i], `blocks[${i}]`, errors, warnings)
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ── Page Validation ───────────────────────────────────────────────

const VALID_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"]

/**
 * Validate all fields of a page before create/upsert.
 */
export async function validatePageWrite(data: {
  slug: string
  title: string
  content?: unknown
  tenantId?: number | null
  status?: string
}): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Slug
  if (!data.slug) {
    errors.push("Slug is required")
  } else {
    const slugCheck = validateSlug(data.slug)
    if (!slugCheck.valid) {
      errors.push(`Slug: ${slugCheck.error}`)
    }
  }

  // Title
  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.push("Title is required and must be a non-empty string")
  }

  // Status
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(", ")}. Got: "${data.status}"`)
  }

  // Content structure
  if (data.content) {
    const contentCheck = validateContentStructure(data.content)
    errors.push(...contentCheck.errors)
    warnings.push(...contentCheck.warnings)
  }

  // Tenant ID
  const multiTenant = await isMultiTenant()
  if (multiTenant) {
    if (data.tenantId == null) {
      errors.push("Multi-tenant schema detected but no tenantId provided. Use --tenant <subdomain>")
    } else if (typeof data.tenantId !== "number" || data.tenantId <= 0) {
      errors.push(`tenantId must be a positive integer, got: ${data.tenantId}`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ── Partial Validation ────────────────────────────────────────────

const VALID_PARTIAL_CATEGORIES = ["HEADER", "FOOTER", "ANNOUNCEMENT", "SIDEBAR", "SECTION"]

/**
 * Validate partial data before create/upsert.
 */
export async function validatePartialWrite(data: {
  slug: string
  name: string
  content?: unknown
  category?: string
}): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Slug
  if (!data.slug) {
    errors.push("Slug is required")
  } else {
    const slugCheck = validateSlug(data.slug)
    if (!slugCheck.valid) {
      errors.push(`Slug: ${slugCheck.error}`)
    }
  }

  // Name
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.push("Name is required and must be a non-empty string")
  }

  // Category
  if (data.category && !VALID_PARTIAL_CATEGORIES.includes(data.category.toUpperCase())) {
    errors.push(`Category must be one of: ${VALID_PARTIAL_CATEGORIES.join(", ")}. Got: "${data.category}"`)
  }

  // Content structure
  if (data.content) {
    const contentCheck = validateContentStructure(data.content)
    errors.push(...contentCheck.errors)
    warnings.push(...contentCheck.warnings)
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ── Preflight Summary Banner ──────────────────────────────────────

function countTotalBlocks(blocks: unknown[]): number {
  let total = 0
  for (const block of blocks) {
    total++
    const b = block as Record<string, unknown>
    if (Array.isArray(b.children)) {
      total += countTotalBlocks(b.children)
    }
  }
  return total
}

/**
 * Print a pre-flight check summary banner.
 * Returns false if any errors were found.
 */
export function printPreflightSummary(opts: {
  multiTenant: boolean
  tenantLabel?: string | null
  tenantId?: number | null
  slug?: string
  title?: string
  content?: unknown
  status?: string
  validation: ValidationResult
}): boolean {
  const lines: PreflightLine[] = []

  // Schema type
  lines.push({
    ok: true,
    label: "Schema",
    detail: opts.multiTenant
      ? "multi-tenant (tenant_id column detected)"
      : "single-tenant",
  })

  // Tenant
  if (opts.multiTenant) {
    if (opts.tenantLabel && opts.tenantId) {
      lines.push({ ok: true, label: "Tenant", detail: opts.tenantLabel })
    } else {
      lines.push({
        ok: false,
        label: "Tenant",
        detail: "not specified (use --tenant <subdomain>)",
      })
    }
  }

  // Slug
  if (opts.slug) {
    const slugValid = opts.validation.errors.every(e => !e.startsWith("Slug"))
    lines.push({
      ok: slugValid,
      label: "Slug",
      detail: slugValid ? opts.slug : `${opts.slug} (invalid)`,
    })
  }

  // Title
  if (opts.title) {
    lines.push({ ok: true, label: "Title", detail: opts.title })
  }

  // Content
  if (opts.content && typeof opts.content === "object") {
    const raw = opts.content as Record<string, unknown>
    if (Array.isArray(raw.blocks)) {
      const topLevel = raw.blocks.length
      const total = countTotalBlocks(raw.blocks)
      lines.push({
        ok: true,
        label: "Content",
        detail: `${topLevel} top-level blocks, ${total} total`,
      })
    }
  }

  // Status
  if (opts.status) {
    const publishNote = opts.status === "PUBLISHED" ? " (publishedAt will be set)" : ""
    lines.push({ ok: true, label: "Status", detail: `${opts.status}${publishNote}` })
  }

  // Print
  console.log(`\n${c.bold("Pre-flight Check")}`)

  for (const line of lines) {
    const icon = line.warning ? sym.warn : line.ok ? sym.check : sym.cross
    console.log(`  ${icon} ${c.bold(line.label + ":")} ${line.detail}`)
  }

  // Warnings
  for (const w of opts.validation.warnings) {
    console.log(`  ${sym.warn} ${c.yellow(w)}`)
  }

  // Errors
  for (const e of opts.validation.errors) {
    if (e.includes("tenantId") && opts.multiTenant && !opts.tenantId) continue
    console.log(`  ${sym.cross} ${c.red(e)}`)
  }

  const hasErrors = !opts.validation.valid
  if (hasErrors) {
    const errCount = opts.validation.errors.length
    console.log(
      `\n${sym.cross} ${c.red(`Aborting: ${errCount} error(s) found. Fix the above issues and retry.`)}\n`
    )
  } else {
    console.log()
  }

  return !hasErrors
}
