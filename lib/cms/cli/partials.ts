/**
 * CMS CLI — Partials Domain
 * CRUD for shared reusable block compositions
 */

import { readFileSync } from "fs"
import { Prisma } from "@prisma/client"
import {
  prisma, c, sym, table, heading, success, error, warn, info,
  confirm, closeRL, formatStatus, formatDate, truncate,
} from "./utils"
import { importFromReact } from "../block-editor/serialization"
import { countBlocks } from "../block-editor/tree-utils"
import { printBlockTree } from "./pages"
import { validateSlug } from "../slug"
import { validatePartialWrite } from "./validation"
import type { Block } from "../block-editor/types"

interface PartialContent {
  version: string
  blocks: Block[]
}

function parseContent(content: unknown): PartialContent {
  if (!content || typeof content !== "object") return { version: "2.0", blocks: [] }
  const raw = content as Record<string, unknown>
  return {
    version: (raw.version as string) || "2.0",
    blocks: Array.isArray(raw.blocks) ? (raw.blocks as Block[]) : [],
  }
}

const VALID_CATEGORIES = ["HEADER", "FOOTER", "ANNOUNCEMENT", "SIDEBAR", "SECTION"]

export async function handlePartials(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list": return partialsList(flags)
    case "get": return partialsGet(args[0])
    case "create": return partialsCreate(args[0], flags)
    case "delete": return partialsDelete(args[0])
    case "set-default": return partialsSetDefault(args[0])
    default:
      error(`Unknown partials action: ${action}`)
      info(`Run ${c.cyan("cms help partials")} for available commands.`)
  }
}

// ── list ────────────────────────────────────────────────────────────

async function partialsList(flags: Record<string, string | boolean>) {
  const where: Record<string, unknown> = {}
  if (flags.category && typeof flags.category === "string") {
    where.category = flags.category.toUpperCase()
  }

  const partials = await prisma.partial.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  heading("Partials")

  const rows = partials.map((p) => {
    const content = parseContent(p.content)
    return {
      name: truncate(p.name, 30),
      slug: c.cyan(p.slug),
      category: c.magenta(p.category),
      status: formatStatus(p.status),
      default: p.isDefault ? c.green("YES") : c.dim("—"),
      blocks: String(countBlocks(content.blocks)),
      updated: formatDate(p.updatedAt),
    }
  })

  console.log(table(
    [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "default", label: "Default" },
      { key: "blocks", label: "Blocks", align: "right" },
    ],
    rows,
  ))

  console.log(c.dim(`\n  ${partials.length} partial(s) total\n`))
}

// ── get ─────────────────────────────────────────────────────────────

async function partialsGet(slug: string) {
  if (!slug) { error("Usage: cms partials get <slug>"); return }

  const partial = await prisma.partial.findFirst({ where: { slug } })
  if (!partial) { error(`Partial not found: ${slug}`); return }

  const content = parseContent(partial.content)

  heading(`Partial: ${partial.name}`)
  console.log(`  ${c.bold("ID:")}        ${c.dim(partial.id)}`)
  console.log(`  ${c.bold("Slug:")}      ${c.cyan(partial.slug)}`)
  console.log(`  ${c.bold("Category:")}  ${c.magenta(partial.category)}`)
  console.log(`  ${c.bold("Status:")}    ${formatStatus(partial.status)}`)
  console.log(`  ${c.bold("Default:")}   ${partial.isDefault ? c.green("YES") : "No"}`)
  console.log(`  ${c.bold("Blocks:")}    ${countBlocks(content.blocks)}`)
  if (partial.description) console.log(`  ${c.bold("Desc:")}      ${partial.description}`)

  if (content.blocks.length > 0) {
    console.log(`\n  ${c.bold("Block Tree:")}`)
    printBlockTree(content.blocks, "    ")
  }

  console.log()
}

// ── create ──────────────────────────────────────────────────────────

async function partialsCreate(slug: string, flags: Record<string, string | boolean>) {
  if (!slug) {
    error("Usage: cms partials create <slug> --name \"Name\" --category HEADER")
    return
  }

  const existing = await prisma.partial.findFirst({ where: { slug } })
  if (existing) { error(`Slug already exists: ${slug}`); return }

  const name = typeof flags.name === "string" ? flags.name : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const category = typeof flags.category === "string" ? flags.category.toUpperCase() : "SECTION"

  let content: PartialContent = { version: "2.0", blocks: [] }

  if (typeof flags.from === "string") {
    try {
      const code = readFileSync(flags.from, "utf-8")
      const result = importFromReact(code)
      content.blocks = result.blocks
      if (result.errors.length) {
        warn("Import warnings:")
        for (const err of result.errors) console.log(`  ${sym.warn} ${err}`)
      }
      info(`Imported ${countBlocks(content.blocks)} blocks from ${flags.from}`)
    } catch (err) {
      error(`Failed to read file: ${(err as Error).message}`)
      return
    }
  }

  // ── Pre-flight validation ─────────────────────────────────────
  const validation = await validatePartialWrite({
    slug,
    name,
    content,
    category,
  })

  if (validation.warnings.length > 0) {
    for (const w of validation.warnings) console.log(`  ${sym.warn} ${w}`)
  }

  if (!validation.valid) {
    error("Pre-flight validation failed:")
    for (const e of validation.errors) console.log(`  ${sym.cross} ${e}`)
    return
  }

  const partial = await prisma.partial.create({
    data: {
      name,
      slug,
      category: category as unknown as Prisma.PartialCreateInput["category"],
      content: content as unknown as Prisma.InputJsonValue,
      status: "DRAFT",
    },
  })

  success(`Created partial: ${c.cyan(partial.name)} (${c.magenta(category)})`)
  info(`ID: ${c.dim(partial.id)}`)
}

// ── delete ──────────────────────────────────────────────────────────

async function partialsDelete(slug: string) {
  if (!slug) { error("Usage: cms partials delete <slug>"); return }

  const partial = await prisma.partial.findFirst({ where: { slug } })
  if (!partial) { error(`Partial not found: ${slug}`); return }

  const ok = await confirm(`Delete partial "${partial.name}" (${partial.category})?`, false)
  if (!ok) { info("Cancelled."); closeRL(); return }

  await prisma.partial.delete({ where: { id: partial.id } })
  success(`Deleted partial: ${partial.name}`)
  closeRL()
}

// ── set-default ─────────────────────────────────────────────────────

async function partialsSetDefault(slug: string) {
  if (!slug) { error("Usage: cms partials set-default <slug>"); return }

  const partial = await prisma.partial.findFirst({ where: { slug } })
  if (!partial) { error(`Partial not found: ${slug}`); return }

  if (partial.isDefault) { info("Already the default."); return }

  // Unset other defaults in this category
  await prisma.partial.updateMany({
    where: { category: partial.category, isDefault: true },
    data: { isDefault: false },
  })

  await prisma.partial.update({
    where: { id: partial.id },
    data: { isDefault: true },
  })

  success(`Set "${partial.name}" as default for ${c.magenta(partial.category)}`)
}
