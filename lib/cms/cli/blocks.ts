/**
 * CMS CLI — Blocks Domain
 * Add, remove, and manipulate blocks on pages
 */

import { readFileSync, writeFileSync } from "fs"
import {
  prisma, c, sym, table, heading, success, error, warn, info,
  formatStatus, truncate, readStdin,
} from "./utils"
import { importFromReact, exportToReact } from "../block-editor/serialization"
import { preprocessForImport } from "../block-editor/preprocess"
import {
  generateId, findBlockById, insertBlock, removeBlockById, updateBlockInTree,
  countBlocks,
} from "../block-editor/tree-utils"
import { resolveVariantClasses } from "../block-editor/dependency-context"
import type { SourceDeps } from "../block-editor/dependency-context"
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
    case "export": return blocksExport(args[0], flags)
    case "diff": return blocksDiff(args[0], flags)
    case "sync": return blocksSync(args[0], flags)
    case "resolve": return blocksResolve(args[0], args[1], args[2], flags)
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

// ── export ─────────────────────────────────────────────────────────

async function blocksExport(slug: string, flags: Record<string, string | boolean>) {
  if (!slug) { error("Usage: cms blocks export <slug> [--o path] [--source]"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }

  if (flags.source) {
    if (!page.sourceCode) { warn(`No sourceCode stored for /${slug}`); return }
    if (typeof flags.o === "string") {
      writeFileSync(flags.o, page.sourceCode, "utf-8")
      success(`Exported sourceCode to ${flags.o}`)
    } else {
      console.log(page.sourceCode)
    }
    return
  }

  const content = parseContent(page.content)
  if (content.blocks.length === 0) { warn("Page has no blocks to export."); return }

  const jsx = exportToReact(content.blocks)

  if (typeof flags.o === "string") {
    writeFileSync(flags.o, jsx, "utf-8")
    success(`Exported ${countBlocks(content.blocks)} blocks to ${flags.o}`)
  } else {
    console.log(jsx)
  }
}

// ── diff ──────────────────────────────────────────────────────────

async function blocksDiff(slug: string | undefined, flags: Record<string, string | boolean>) {
  if (flags.all) return blocksDiffAll()
  if (!slug) { error("Usage: cms blocks diff <slug> [--all]"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }
  if (!page.sourceCode) { warn(`No sourceCode stored for /${slug}`); return }

  const content = parseContent(page.content)
  const currentJsx = exportToReact(content.blocks)
  const diff = lineDiff(page.sourceCode, currentJsx)

  heading(`Diff: /${slug}`)
  console.log(`  ${c.dim("--- sourceCode (original)")}`)
  console.log(`  ${c.dim("+++ blocks (current)")}\n`)

  for (const line of diff.lines) {
    if (line.type === "add") console.log(c.green(`+ ${line.text}`))
    else if (line.type === "remove") console.log(c.red(`- ${line.text}`))
    else console.log(c.dim(`  ${line.text}`))
  }

  console.log(`\n  ${c.dim(`${diff.added} added, ${diff.removed} removed, ${diff.unchanged} unchanged`)}`)
}

async function blocksDiffAll() {
  const pages = await prisma.page.findMany({
    where: { sourceCode: { not: null } },
    select: { slug: true, title: true, content: true, sourceCode: true },
  })

  if (pages.length === 0) { warn("No pages with stored sourceCode found."); return }

  heading(`Block Diff Summary (${pages.length} pages)`)

  const rows = pages.map((page) => {
    const content = parseContent(page.content)
    const currentJsx = exportToReact(content.blocks)
    const diff = lineDiff(page.sourceCode!, currentJsx)
    return {
      slug: `/${page.slug}`,
      title: truncate(page.title || "", 25),
      added: String(diff.added),
      removed: String(diff.removed),
      status: diff.added === 0 && diff.removed === 0 ? c.green("in sync") : c.yellow("differs"),
    }
  })

  console.log(table([
    { key: "slug", label: "Slug" },
    { key: "title", label: "Title" },
    { key: "added", label: "+Lines", align: "right" as const },
    { key: "removed", label: "-Lines", align: "right" as const },
    { key: "status", label: "Status" },
  ], rows))
  console.log()
}

// ── sync ──────────────────────────────────────────────────────────

async function blocksSync(slug: string | undefined, flags: Record<string, string | boolean>) {
  if (flags.all) return blocksSyncAll(flags)
  if (!slug) { error("Usage: cms blocks sync <slug> [--dry-run] [--all]"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }
  if (!page.sourceCode) { warn(`No sourceCode stored for /${slug}`); return }

  const content = parseContent(page.content)
  const beforeCount = countBlocks(content.blocks)

  const preprocessed = preprocessForImport(page.sourceCode)
  if (preprocessed.warnings.length) {
    warn("Preprocess warnings:")
    for (const w of preprocessed.warnings) console.log(`  ${sym.warn} ${w.message}`)
  }

  const result = importFromReact(preprocessed.code)
  if (result.errors.length) {
    warn("Import warnings:")
    for (const err of result.errors) console.log(`  ${sym.warn} ${err}`)
  }

  const afterCount = countBlocks(result.blocks)

  if (flags["dry-run"]) {
    info(`/${slug}: ${beforeCount} -> ${afterCount} blocks (dry run -- no changes written)`)
    return
  }

  const updated = { ...content, blocks: result.blocks }
  await prisma.page.update({
    where: { slug },
    data: { content: updated as unknown as Record<string, unknown> },
  })

  success(`Synced /${slug}: ${beforeCount} -> ${afterCount} blocks`)
}

async function blocksSyncAll(flags: Record<string, string | boolean>) {
  const pages = await prisma.page.findMany({
    where: { sourceCode: { not: null } },
    select: { slug: true, content: true, sourceCode: true },
  })

  if (pages.length === 0) { warn("No pages with stored sourceCode found."); return }

  heading(`Syncing ${pages.length} pages from sourceCode`)

  let synced = 0

  for (const page of pages) {
    const content = parseContent(page.content)
    const beforeCount = countBlocks(content.blocks)

    const preprocessed = preprocessForImport(page.sourceCode!)
    const result = importFromReact(preprocessed.code)
    const afterCount = countBlocks(result.blocks)

    if (result.errors.length) {
      warn(`/${page.slug}: ${result.errors.length} import warning(s)`)
    }

    console.log(`  ${sym.arrow} /${page.slug}: ${beforeCount} -> ${afterCount} blocks`)

    if (!flags["dry-run"]) {
      const updated = { ...content, blocks: result.blocks }
      await prisma.page.update({
        where: { slug: page.slug },
        data: { content: updated as unknown as Record<string, unknown> },
      })
      synced++
    }
  }

  if (flags["dry-run"]) {
    info(`Dry run -- ${pages.length} page(s) would be updated.`)
  } else {
    success(`Synced ${synced} page(s).`)
  }
}

// ── resolve ─────────────────────────────────────────────────────

async function blocksResolve(
  pageSlug: string,
  usage: string | undefined,
  textContent: string | undefined,
  flags: Record<string, string | boolean>
) {
  if (!pageSlug || !usage) {
    error('Usage: cms blocks resolve <page-slug> "<ComponentName prop=value ...>" [text]')
    return
  }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  // sourceDeps is stored as JSON on the Page record
  const sourceDeps = (page as Record<string, unknown>).sourceDeps as SourceDeps | null | undefined
  if (!sourceDeps || !sourceDeps.components || Object.keys(sourceDeps.components).length === 0) {
    error("No dependency context. Import the project first with `cms import`.")
    return
  }

  // Parse the usage string: "Button variant=destructive size=lg"
  const parts = usage.trim().split(/\s+/)
  const componentName = parts[0]
  const props: Record<string, string> = {}

  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf("=")
    if (eqIdx > 0) {
      props[parts[i].slice(0, eqIdx)] = parts[i].slice(eqIdx + 1)
    }
  }

  const dep = sourceDeps.components[componentName]
  if (!dep) {
    const available = Object.keys(sourceDeps.components).join(", ")
    error(`Component '${componentName}' not found in deps. Available: ${available}`)
    return
  }

  const resolvedClasses = resolveVariantClasses(dep, Object.keys(props).length > 0 ? props : undefined)

  const block = {
    id: generateId(),
    tag: dep.renders || "div",
    className: resolvedClasses,
    ...(textContent ? { textContent } : {}),
  }

  if (flags.json) {
    console.log(JSON.stringify(block, null, 2))
    return
  }

  // Pretty-print
  heading(`Resolved: ${componentName}`)
  console.log(`  ${c.dim("tag")}        ${c.cyan(block.tag)}`)
  console.log(`  ${c.dim("className")}  ${c.green(block.className || "(empty)")}`)
  if (block.textContent) {
    console.log(`  ${c.dim("text")}       ${block.textContent}`)
  }
  console.log(`  ${c.dim("id")}         ${c.dim(block.id)}`)

  if (Object.keys(props).length > 0) {
    console.log(`\n  ${c.dim("Props applied:")}`)
    for (const [k, v] of Object.entries(props)) {
      console.log(`    ${c.yellow(k)}=${c.white(v)}`)
    }
  }
  console.log()
}

// ── Line Diff (LCS) ──────────────────────────────────────────────

interface DiffLine { type: "add" | "remove" | "context"; text: string }
interface DiffResult { lines: DiffLine[]; added: number; removed: number; unchanged: number }

function lineDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split("\n")
  const newLines = newText.split("\n")
  const m = oldLines.length, n = newLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to produce diff
  const lines: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      lines.unshift({ type: "context", text: oldLines[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      lines.unshift({ type: "add", text: newLines[j - 1] })
      j--
    } else {
      lines.unshift({ type: "remove", text: oldLines[i - 1] })
      i--
    }
  }

  return {
    lines,
    added: lines.filter((l) => l.type === "add").length,
    removed: lines.filter((l) => l.type === "remove").length,
    unchanged: lines.filter((l) => l.type === "context").length,
  }
}
