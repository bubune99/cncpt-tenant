/**
 * CMS CLI — Blocks Domain
 * Add, remove, and manipulate blocks on pages
 */

import { readFileSync } from "fs"
import {
  prisma, c, sym, table, heading, success, error, warn, info,
  formatStatus, truncate, readStdin,
} from "./utils"
import { importFromReact } from "../block-editor/serialization"
import {
  generateId, findBlockById, insertBlock, removeBlockById, updateBlockInTree,
  countBlocks,
} from "../block-editor/tree-utils"
import {
  BLOCK_TEMPLATES, BLOCK_CATEGORIES, getTemplateByLabel, getTemplatesByCategory,
} from "../block-editor/block-templates"
import { validateContentStructure } from "./validation"
import { printBlockTree } from "./pages"
import type { Block } from "../block-editor/types"

interface PageContent {
  version: string
  blocks: Block[]
  layout?: { header?: string; footer?: string }
}

function parseContent(content: unknown): PageContent {
  if (!content || typeof content !== "object") return { version: "2.0", blocks: [] }
  const raw = content as Record<string, unknown>
  return {
    version: (raw.version as string) || "2.0",
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as Block[]) : [],
    layout: raw.layout as PageContent["layout"],
  }
}

export async function handleBlocks(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list-templates": return blocksListTemplates(flags)
    case "add": return blocksAdd(args[0], args[1], flags)
    case "remove": return blocksRemove(args[0], args[1])
    case "tree": return blocksTree(args[0])
    case "set": return blocksSet(args[0], args[1], flags)
    default:
      error(`Unknown blocks action: ${action}`)
      info(`Run ${c.cyan("cms help blocks")} for available commands.`)
  }
}

// ── list-templates ──────────────────────────────────────────────────

async function blocksListTemplates(flags: Record<string, string | boolean>) {
  const categoryFilter = typeof flags.category === "string" ? flags.category.toLowerCase() : null

  heading("Block Templates")

  const categories = categoryFilter
    ? BLOCK_CATEGORIES.filter((cat) => cat.id === categoryFilter)
    : [...BLOCK_CATEGORIES]

  if (categories.length === 0 && categoryFilter) {
    error(`Unknown category: ${categoryFilter}`)
    info(`Valid categories: ${BLOCK_CATEGORIES.map((c) => c.id).join(", ")}`)
    return
  }

  for (const cat of categories) {
    const templates = getTemplatesByCategory(cat.id)
    console.log(`\n  ${c.bold(c.magenta(cat.label))} ${c.dim(`(${templates.length})`)}`)

    for (const tmpl of templates) {
      const desc = tmpl.description ? c.dim(` — ${tmpl.description}`) : ""
      const provider = tmpl.commerceProvider ? c.dim(` [${tmpl.commerceProvider}]`) : ""
      const container = tmpl.isContainer ? c.dim(" [container]") : ""
      console.log(`    ${c.cyan(tmpl.label)}${container}${provider}${desc}`)
    }
  }

  console.log(c.dim(`\n  ${BLOCK_TEMPLATES.length} templates across ${BLOCK_CATEGORIES.length} categories\n`))
}

// ── add ─────────────────────────────────────────────────────────────

async function blocksAdd(pageSlug: string, templateLabel: string, flags: Record<string, string | boolean>) {
  if (!pageSlug) { error("Usage: cms blocks add <page-slug> <template-label>"); return }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  const content = parseContent(page.content)
  let newBlocks: Block[] = []

  // Resolve JSX source: --jsx (inline), --stdin (piped), or --from (file)
  let jsxCode: string | null = null

  if (typeof flags.jsx === "string") {
    jsxCode = flags.jsx
  } else if (flags.stdin === true) {
    jsxCode = await readStdin()
    if (!jsxCode) { error("No input received on stdin. Pipe JSX or use a heredoc."); return }
  } else if (typeof flags.from === "string") {
    try {
      jsxCode = readFileSync(flags.from, "utf-8")
    } catch (err) {
      error(`Failed to read file: ${(err as Error).message}`)
      return
    }
  }

  if (jsxCode) {
    const result = importFromReact(jsxCode)
    newBlocks = result.blocks
    if (result.errors.length) {
      warn("Import warnings:")
      for (const err of result.errors) console.log(`  ${sym.warn} ${err}`)
    }
  }
  // Add partial reference
  else if (typeof flags.partial === "string") {
    const partial = await prisma.partial.findUnique({ where: { slug: flags.partial } })
    if (!partial) { error(`Partial not found: ${flags.partial}`); return }

    newBlocks = [{
      id: generateId(),
      tag: "div" as const,
      className: "",
      componentName: "PartialReference",
      partialId: partial.id,
      label: `Partial: ${partial.name}`,
    }]
  }
  // Add from template
  else {
    if (!templateLabel) { error("Provide a template label, --from file.tsx, or --partial slug"); return }

    const template = getTemplateByLabel(templateLabel)
    if (!template) {
      error(`Template not found: "${templateLabel}"`)
      info("Run cms blocks list-templates to see available templates.")
      return
    }

    const block: Block = {
      id: generateId(),
      tag: template.tag as Block["tag"],
      className: template.defaultClassName || "",
      label: template.label,
    }
    if (template.defaultTextContent) block.textContent = template.defaultTextContent
    if (template.defaultAttrs) block.attrs = { ...template.defaultAttrs }
    if (template.isContainer) block.children = []
    if (template.componentName) block.componentName = template.componentName
    if (template.defaultCommerce) block.commerce = { ...template.defaultCommerce } as Block["commerce"]

    newBlocks = [block]
  }

  if (newBlocks.length === 0) { warn("No blocks to add."); return }

  // Insert at position
  const atPos = typeof flags.at === "string" ? parseInt(flags.at, 10) : undefined

  let blocks = content.blocks
  for (const newBlock of newBlocks) {
    blocks = insertBlock(blocks, newBlock, null, atPos)
  }

  // Validate resulting content structure
  const updatedContent = { ...content, blocks }
  const contentCheck = validateContentStructure(updatedContent)
  if (contentCheck.warnings.length > 0) {
    for (const w of contentCheck.warnings) console.log(`  ${sym.warn} ${w}`)
  }
  if (!contentCheck.valid) {
    error("Content validation failed after adding blocks:")
    for (const e of contentCheck.errors) console.log(`  ${sym.cross} ${e}`)
    return
  }

  await prisma.page.update({
    where: { slug: pageSlug },
    data: { content: updatedContent as unknown as Record<string, unknown> },
  })

  success(`Added ${newBlocks.length} block(s) to /${pageSlug}`)
  for (const b of newBlocks) {
    console.log(`  ${sym.arrow} ${c.cyan(b.tag)} ${b.label ? c.dim(`"${b.label}"`) : ""} ${c.dim(`[${b.id}]`)}`)
  }
}

// ── remove ──────────────────────────────────────────────────────────

async function blocksRemove(pageSlug: string, blockId: string) {
  if (!pageSlug || !blockId) { error("Usage: cms blocks remove <page-slug> <block-id>"); return }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  const content = parseContent(page.content)
  const target = findBlockById(content.blocks, blockId)

  if (!target) { error(`Block not found: ${blockId}`); return }

  const blocks = removeBlockById(content.blocks, blockId)

  await prisma.page.update({
    where: { slug: pageSlug },
    data: { content: { ...content, blocks } as unknown as Record<string, unknown> },
  })

  success(`Removed block ${c.dim(blockId)} (${c.cyan(target.tag)}) from /${pageSlug}`)
}

// ── tree ────────────────────────────────────────────────────────────

async function blocksTree(pageSlug: string) {
  if (!pageSlug) { error("Usage: cms blocks tree <page-slug>"); return }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  const content = parseContent(page.content)

  heading(`Block Tree: /${pageSlug}`)
  console.log(`  ${c.dim(`${countBlocks(content.blocks)} blocks total`)}\n`)

  if (content.blocks.length === 0) {
    info("Page has no blocks.")
    return
  }

  printBlockTree(content.blocks, "  ")
  console.log()
}

// ── set ─────────────────────────────────────────────────────────────

async function blocksSet(pageSlug: string, blockId: string, flags: Record<string, string | boolean>) {
  if (!pageSlug || !blockId) { error("Usage: cms blocks set <page-slug> <block-id> --text \"...\" --class \"...\""); return }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  const content = parseContent(page.content)
  const target = findBlockById(content.blocks, blockId)

  if (!target) { error(`Block not found: ${blockId}`); return }

  const updates: Partial<Block> = {}
  const changes: string[] = []

  if (typeof flags.text === "string") {
    updates.textContent = flags.text
    changes.push(`text → "${truncate(flags.text, 30)}"`)
  }

  if (typeof flags.class === "string") {
    updates.className = flags.class
    changes.push(`class → "${truncate(flags.class, 30)}"`)
  }

  if (typeof flags.label === "string") {
    updates.label = flags.label
    changes.push(`label → "${flags.label}"`)
  }

  if (typeof flags.tag === "string") {
    updates.tag = flags.tag as Block["tag"]
    changes.push(`tag → ${flags.tag}`)
  }

  // Handle --attr key=value
  if (typeof flags.attr === "string") {
    const eqIdx = flags.attr.indexOf("=")
    if (eqIdx > 0) {
      const key = flags.attr.slice(0, eqIdx)
      const value = flags.attr.slice(eqIdx + 1)
      updates.attrs = { ...(target.attrs || {}), [key]: value }
      changes.push(`attr ${key}="${truncate(value, 20)}"`)
    } else {
      error("--attr must be key=value format")
      return
    }
  }

  if (changes.length === 0) {
    error("No changes specified. Use --text, --class, --label, --tag, or --attr key=value")
    return
  }

  const blocks = updateBlockInTree(content.blocks, blockId, updates)

  await prisma.page.update({
    where: { slug: pageSlug },
    data: { content: { ...content, blocks } as unknown as Record<string, unknown> },
  })

  success(`Updated block ${c.dim(blockId)} on /${pageSlug}:`)
  for (const change of changes) {
    console.log(`  ${sym.arrow} ${change}`)
  }
}
