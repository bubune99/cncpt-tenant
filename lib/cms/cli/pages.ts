/**
 * CMS CLI — Pages Domain
 * CRUD operations for CMS pages
 */

import { readFileSync, writeFileSync } from "fs"
import {
  prisma, c, sym, table, heading, success, error, warn, info,
  ask, confirm, closeRL, formatStatus, formatDate, truncate, readStdin,
} from "./utils"
import { importFromReact, exportToReact } from "../block-editor/serialization"
import { countBlocks, flattenTree } from "../block-editor/tree-utils"
import { resolveVariantClasses } from "../block-editor/dependency-context"
import type { SourceDeps } from "../block-editor/dependency-context"
import { validateSlug } from "../slug"
import {
  validatePageWrite, isMultiTenant, printPreflightSummary,
} from "./validation"
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

export async function handlePages(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list": return pagesList(flags)
    case "get": return pagesGet(args[0])
    case "create": return pagesCreate(args[0], flags)
    case "delete": return pagesDelete(args[0])
    case "publish": return pagesPublish(args[0])
    case "unpublish": return pagesUnpublish(args[0])
    case "set-slug": return pagesSetSlug(args[0], args[1])
    case "set-layout": return pagesSetLayout(args[0], flags)
    case "export": return pagesExport(args[0], flags)
    case "deps": return pagesDeps(args[0])
    default:
      error(`Unknown pages action: ${action}`)
      info(`Run ${c.cyan("cms help pages")} for available commands.`)
  }
}

// ── list ────────────────────────────────────────────────────────────

async function pagesList(flags: Record<string, string | boolean>) {
  const where: Record<string, unknown> = {}
  if (flags.status && typeof flags.status === "string") {
    where.status = flags.status.toUpperCase()
  }

  const pages = await prisma.page.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      content: true,
      updatedAt: true,
      parentId: true,
    },
  })

  heading("Pages")

  const rows = pages.map((p) => {
    const content = parseContent(p.content)
    return {
      title: truncate(p.title, 30),
      slug: c.cyan(`/${p.slug}`),
      status: formatStatus(p.status),
      blocks: String(countBlocks(content.blocks)),
      updated: formatDate(p.updatedAt),
    }
  })

  console.log(table(
    [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "status", label: "Status" },
      { key: "blocks", label: "Blocks", align: "right" },
      { key: "updated", label: "Updated" },
    ],
    rows,
  ))

  console.log(c.dim(`\n  ${pages.length} page(s) total\n`))
}

// ── get ─────────────────────────────────────────────────────────────

async function pagesGet(slug: string) {
  if (!slug) { error("Usage: cms pages get <slug>"); return }

  const page = await prisma.page.findUnique({
    where: { slug },
    include: { parent: { select: { title: true, slug: true } }, children: { select: { title: true, slug: true } } },
  })

  if (!page) { error(`Page not found: ${slug}`); return }

  const content = parseContent(page.content)

  heading(`Page: ${page.title}`)
  console.log(`  ${c.bold("ID:")}       ${c.dim(page.id)}`)
  console.log(`  ${c.bold("Slug:")}     ${c.cyan(`/${page.slug}`)}`)
  console.log(`  ${c.bold("Status:")}   ${formatStatus(page.status)}`)
  console.log(`  ${c.bold("Blocks:")}   ${countBlocks(content.blocks)}`)
  console.log(`  ${c.bold("Header:")}   ${page.headerMode}`)
  console.log(`  ${c.bold("Footer:")}   ${page.footerMode}`)
  console.log(`  ${c.bold("Created:")}  ${formatDate(page.createdAt)}`)
  console.log(`  ${c.bold("Updated:")}  ${formatDate(page.updatedAt)}`)
  if (page.publishedAt) console.log(`  ${c.bold("Published:")} ${formatDate(page.publishedAt)}`)
  if (page.parent) console.log(`  ${c.bold("Parent:")}   ${page.parent.title} (/${page.parent.slug})`)
  if (page.children.length) {
    console.log(`  ${c.bold("Children:")}`)
    for (const child of page.children) {
      console.log(`    ${sym.arrow} ${child.title} ${c.dim(`(/${child.slug})`)}`)
    }
  }

  // SEO
  if (page.metaTitle || page.metaDescription) {
    console.log(`\n  ${c.bold("SEO:")}`)
    if (page.metaTitle) console.log(`    Title: ${page.metaTitle}`)
    if (page.metaDescription) console.log(`    Desc:  ${truncate(page.metaDescription, 60)}`)
  }

  // Block tree outline
  if (content.blocks.length > 0) {
    console.log(`\n  ${c.bold("Block Tree:")}`)
    printBlockTree(content.blocks, "    ")
  }

  console.log()
}

function printBlockTree(blocks: Block[], indent: string) {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const isLast = i === blocks.length - 1
    const prefix = isLast ? sym.treeLast : sym.tree
    const childIndent = indent + (isLast ? sym.treeSpace : sym.treePipe)

    const tag = c.cyan(block.tag)
    const label = block.label ? c.dim(` "${block.label}"`) : ""
    const id = c.dim(` [${block.id}]`)
    const text = block.textContent ? c.dim(` "${truncate(block.textContent, 25)}"`) : ""
    const classes = block.className ? c.dim(` .${truncate(block.className, 30)}`) : ""

    console.log(`${indent}${prefix} ${tag}${label}${text}${classes}${id}`)

    if (block.children && block.children.length > 0) {
      printBlockTree(block.children, childIndent)
    }
  }
}

// ── create ──────────────────────────────────────────────────────────

async function pagesCreate(slug: string, flags: Record<string, string | boolean>) {
  if (!slug) { error("Usage: cms pages create <slug> --title \"Title\""); return }

  // Check uniqueness
  const existing = await prisma.page.findUnique({ where: { slug } })
  if (existing) { error(`Slug already exists: ${slug}`); return }

  const title = (typeof flags.title === "string" ? flags.title : null) || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  let content: PageContent = { version: "2.0", blocks: [] }

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
    content.blocks = result.blocks
    if (result.errors.length) {
      warn(`Import warnings:`)
      for (const err of result.errors) console.log(`  ${sym.warn} ${err}`)
    }
    const source = typeof flags.jsx === "string" ? "inline JSX"
      : flags.stdin ? "stdin"
      : flags.from as string
    info(`Imported ${countBlocks(content.blocks)} blocks from ${source}`)
  }

  // ── Pre-flight validation ───────────────────────────────────────
  const tenantId = typeof flags._tenantId === "string" ? parseInt(flags._tenantId, 10) : null
  const multiTenant = await isMultiTenant()

  const validation = await validatePageWrite({
    slug,
    title,
    content,
    tenantId,
    status: "DRAFT",
  })

  const ok = printPreflightSummary({
    multiTenant,
    tenantId,
    slug,
    title,
    content,
    status: "DRAFT",
    validation,
  })

  if (!ok) return

  // ── Create ──────────────────────────────────────────────────────
  const tenantData = tenantId ? { tenantId } : {}

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      status: "DRAFT",
      content: content as unknown as Record<string, unknown>,
      ...tenantData,
    },
  })

  success(`Created page: ${c.cyan(page.title)} at ${c.cyan(`/${page.slug}`)}`)
  info(`ID: ${c.dim(page.id)}`)
}

// ── delete ──────────────────────────────────────────────────────────

async function pagesDelete(slug: string) {
  if (!slug) { error("Usage: cms pages delete <slug>"); return }

  const page = await prisma.page.findUnique({
    where: { slug },
    include: { children: { select: { id: true } } },
  })

  if (!page) { error(`Page not found: ${slug}`); return }

  if (page.children.length > 0) {
    warn(`This page has ${page.children.length} child page(s). They will become orphaned.`)
  }

  const ok = await confirm(`Delete page "${page.title}" (/${slug})?`, false)
  if (!ok) { info("Cancelled."); closeRL(); return }

  await prisma.page.delete({ where: { slug } })
  success(`Deleted page: ${page.title}`)
  closeRL()
}

// ── publish / unpublish ─────────────────────────────────────────────

async function pagesPublish(slug: string) {
  if (!slug) { error("Usage: cms pages publish <slug>"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }

  if (page.status === "PUBLISHED") { info("Page is already published."); return }

  await prisma.page.update({
    where: { slug },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  })

  success(`Published: ${page.title}`)
}

async function pagesUnpublish(slug: string) {
  if (!slug) { error("Usage: cms pages unpublish <slug>"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }

  if (page.status === "DRAFT") { info("Page is already a draft."); return }

  await prisma.page.update({
    where: { slug },
    data: { status: "DRAFT" },
  })

  success(`Unpublished: ${page.title}`)
}

// ── set-slug ────────────────────────────────────────────────────────

async function pagesSetSlug(oldSlug: string, newSlug: string) {
  if (!oldSlug || !newSlug) { error("Usage: cms pages set-slug <old-slug> <new-slug>"); return }

  // Validate new slug
  const slugCheck = validateSlug(newSlug)
  if (!slugCheck.valid) { error(slugCheck.error!); return }

  const page = await prisma.page.findUnique({ where: { slug: oldSlug } })
  if (!page) { error(`Page not found: ${oldSlug}`); return }

  const conflict = await prisma.page.findUnique({ where: { slug: newSlug } })
  if (conflict) { error(`Slug already in use: ${newSlug}`); return }

  await prisma.page.update({ where: { slug: oldSlug }, data: { slug: newSlug } })
  success(`Renamed: /${oldSlug} ${sym.arrow} /${newSlug}`)
}

// ── set-layout ──────────────────────────────────────────────────────

async function pagesSetLayout(slug: string, flags: Record<string, string | boolean>) {
  if (!slug) { error("Usage: cms pages set-layout <slug> --header GLOBAL --footer NONE"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }

  const validModes = ["GLOBAL", "CUSTOM", "NONE"]
  const data: Record<string, string> = {}

  if (typeof flags.header === "string") {
    const mode = flags.header.toUpperCase()
    if (!validModes.includes(mode)) { error(`Invalid header mode: ${mode}. Use GLOBAL, CUSTOM, or NONE`); return }
    data.headerMode = mode
  }

  if (typeof flags.footer === "string") {
    const mode = flags.footer.toUpperCase()
    if (!validModes.includes(mode)) { error(`Invalid footer mode: ${mode}. Use GLOBAL, CUSTOM, or NONE`); return }
    data.footerMode = mode
  }

  if (Object.keys(data).length === 0) {
    error("Provide --header and/or --footer mode")
    return
  }

  await prisma.page.update({ where: { slug }, data })
  success(`Updated layout for "${page.title}":`)
  if (data.headerMode) console.log(`  Header: ${data.headerMode}`)
  if (data.footerMode) console.log(`  Footer: ${data.footerMode}`)
}

// ── export ──────────────────────────────────────────────────────────

async function pagesExport(slug: string, flags: Record<string, string | boolean>) {
  if (!slug) { error("Usage: cms pages export <slug> [-o path]"); return }

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) { error(`Page not found: ${slug}`); return }

  const content = parseContent(page.content)

  if (content.blocks.length === 0) {
    warn("Page has no blocks to export.")
    return
  }

  const jsx = exportToReact(content.blocks)

  if (typeof flags.o === "string") {
    writeFileSync(flags.o, jsx, "utf-8")
    success(`Exported to ${flags.o}`)
  } else {
    console.log(jsx)
  }
}

// ── deps ───────────────────────────────────────────────────────────

async function pagesDeps(slug: string) {
  if (!slug) { error("Usage: cms pages deps <slug>"); return }

  // Try with and without leading slash
  const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug
  const page = await prisma.page.findUnique({
    where: { slug: normalizedSlug },
    select: { title: true, slug: true, sourceDeps: true },
  })

  if (!page) { error(`Page not found: ${normalizedSlug}`); return }

  const sourceDeps = page.sourceDeps as unknown as SourceDeps | null
  if (!sourceDeps || !sourceDeps.components || Object.keys(sourceDeps.components).length === 0) {
    info("No dependency context stored for this page.")
    if (!sourceDeps) {
      info(`Import a project with ${c.cyan("cms import <path>")} to generate dependency data.`)
    }
    return
  }

  heading(`Page: ${page.title} (/${page.slug})`)

  const components = Object.entries(sourceDeps.components)
  if (components.length > 0) {
    console.log(`\n  ${c.bold("Component Dependencies:")}`)

    for (const [name, dep] of components) {
      console.log(`\n    ${c.bold(c.cyan(name))} ${c.dim(`(${dep.file})`)}`)
      console.log(`      Renders: ${c.cyan(`<${dep.renders}>`)}`)

      if (dep.defaultClasses) {
        console.log(`      Base:    ${c.dim(truncate(dep.defaultClasses, 70))}`)
      }

      // Variant table
      if (dep.variants && Object.keys(dep.variants).length > 0) {
        console.log(`      ${c.bold("Variants:")}`)

        for (const [variantName, valueMap] of Object.entries(dep.variants)) {
          console.log(`        ${c.yellow(variantName)}:`)
          for (const [valueName, classes] of Object.entries(valueMap)) {
            const isDefault = dep.defaultVariants?.[variantName] === valueName
            const defaultTag = isDefault ? c.green(" (default)") : ""
            console.log(`          ${valueName}${defaultTag}: ${c.dim(truncate(classes, 60))}`)
          }
        }
      }

      // Default resolution
      if (dep.variants && dep.defaultVariants && Object.keys(dep.defaultVariants).length > 0) {
        const resolved = resolveVariantClasses(dep)
        console.log(`      ${c.bold("Default resolution:")} ${c.dim(truncate(resolved, 70))}`)
      }

      // Other props
      if (dep.props && dep.props.length > 0) {
        console.log(`      Props:   ${dep.props.join(", ")}`)
      }
    }
  }

  // Unresolved imports
  if (sourceDeps.unresolved && sourceDeps.unresolved.length > 0) {
    console.log(`\n  ${c.bold("Unresolved imports:")} ${c.dim(sourceDeps.unresolved.join(", "))}`)
  }

  console.log()
}

// Re-export the tree printer for blocks module
export { printBlockTree }
