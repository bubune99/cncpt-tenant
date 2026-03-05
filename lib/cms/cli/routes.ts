/**
 * CMS CLI — Routes & Links Domain
 * Page routing, hierarchy, and internal link management
 */

import {
  prisma, c, sym, table, heading, success, error, info,
  formatStatus, truncate,
} from "./utils"
import { flattenTree, findBlockById, updateBlockInTree } from "../block-editor/tree-utils"
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

export async function handleRoutes(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "list": return routesList()
    case "set": return routesSet(args[0], args[1])
    case "tree": return routesTree()
    default:
      error(`Unknown routes action: ${action}`)
      info(`Run ${c.cyan("cms help routes")} for available commands.`)
  }
}

export async function handleLinks(action: string, args: string[], flags: Record<string, string | boolean>) {
  switch (action) {
    case "scan": return linksScan(args[0])
    case "set": return linksSet(args[0], args[1], flags)
    case "check": return linksCheck()
    default:
      error(`Unknown links action: ${action}`)
      info(`Run ${c.cyan("cms help routes")} for available commands.`)
  }
}

// ── routes list ─────────────────────────────────────────────────────

async function routesList() {
  const pages = await prisma.page.findMany({
    orderBy: { slug: "asc" },
    select: { slug: true, title: true, status: true, parentId: true },
  })

  heading("Routes")

  const rows = pages.map((p) => ({
    slug: c.cyan(`/${p.slug}`),
    title: truncate(p.title, 35),
    status: formatStatus(p.status),
    parent: p.parentId ? c.dim("child") : "",
  }))

  console.log(table(
    [
      { key: "slug", label: "Slug" },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "parent", label: "Hierarchy" },
    ],
    rows,
  ))

  console.log(c.dim(`\n  ${pages.length} route(s)\n`))
}

// ── routes set ──────────────────────────────────────────────────────

async function routesSet(oldSlug: string, newSlug: string) {
  if (!oldSlug || !newSlug) { error("Usage: cms routes set <old-slug> <new-slug>"); return }

  const page = await prisma.page.findUnique({ where: { slug: oldSlug } })
  if (!page) { error(`Page not found: ${oldSlug}`); return }

  const conflict = await prisma.page.findUnique({ where: { slug: newSlug } })
  if (conflict) { error(`Slug already in use: ${newSlug}`); return }

  await prisma.page.update({ where: { slug: oldSlug }, data: { slug: newSlug } })
  success(`Renamed: /${oldSlug} ${sym.arrow} /${newSlug}`)
}

// ── routes tree ─────────────────────────────────────────────────────

async function routesTree() {
  const pages = await prisma.page.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true, status: true, parentId: true },
  })

  heading("Route Hierarchy")

  // Build hierarchy
  const roots = pages.filter((p) => !p.parentId)
  const childMap = new Map<string, typeof pages>()
  for (const p of pages) {
    if (p.parentId) {
      const existing = childMap.get(p.parentId) || []
      existing.push(p)
      childMap.set(p.parentId, existing)
    }
  }

  function printPage(page: typeof pages[0], indent: string, isLast: boolean) {
    const prefix = isLast ? sym.treeLast : sym.tree
    const status = page.status === "PUBLISHED" ? c.green("●") : c.yellow("○")
    console.log(`${indent}${prefix} ${status} ${c.cyan(`/${page.slug}`)} ${c.dim(page.title)}`)

    const children = childMap.get(page.id) || []
    const childIndent = indent + (isLast ? sym.treeSpace : sym.treePipe)
    for (let i = 0; i < children.length; i++) {
      printPage(children[i], childIndent, i === children.length - 1)
    }
  }

  if (roots.length === 0) {
    info("No pages found.")
    return
  }

  for (let i = 0; i < roots.length; i++) {
    printPage(roots[i], "  ", i === roots.length - 1)
  }

  console.log()
}

// ── links scan ──────────────────────────────────────────────────────

async function linksScan(pageSlug: string) {
  if (!pageSlug) { error("Usage: cms links scan <page-slug>"); return }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  const content = parseContent(page.content)
  const flat = flattenTree(content.blocks)

  heading(`Links in /${pageSlug}`)

  const links: { blockId: string; tag: string; href: string }[] = []

  for (const block of flat) {
    if (block.attrs?.href) {
      links.push({ blockId: block.id, tag: block.tag, href: block.attrs.href })
    }
    if (block.attrs?.src) {
      links.push({ blockId: block.id, tag: block.tag, href: block.attrs.src })
    }
  }

  if (links.length === 0) {
    info("No links found in this page.")
    return
  }

  const rows = links.map((l) => ({
    tag: c.cyan(l.tag),
    href: l.href.startsWith("/") ? c.green(l.href) : c.dim(l.href),
    blockId: c.dim(l.blockId),
  }))

  console.log(table(
    [
      { key: "tag", label: "Tag" },
      { key: "href", label: "Href / Src" },
      { key: "blockId", label: "Block ID" },
    ],
    rows,
  ))

  console.log(c.dim(`\n  ${links.length} link(s) found\n`))
}

// ── links set ───────────────────────────────────────────────────────

async function linksSet(pageSlug: string, blockId: string, flags: Record<string, string | boolean>) {
  if (!pageSlug || !blockId) { error("Usage: cms links set <page-slug> <block-id> --href /new"); return }

  const href = typeof flags.href === "string" ? flags.href : null
  if (!href) { error("Provide --href value"); return }

  const page = await prisma.page.findUnique({ where: { slug: pageSlug } })
  if (!page) { error(`Page not found: ${pageSlug}`); return }

  const content = parseContent(page.content)
  const target = findBlockById(content.blocks, blockId)

  if (!target) { error(`Block not found: ${blockId}`); return }

  const blocks = updateBlockInTree(content.blocks, blockId, {
    attrs: { ...(target.attrs || {}), href },
  })

  await prisma.page.update({
    where: { slug: pageSlug },
    data: { content: { ...content, blocks } as unknown as Record<string, unknown> },
  })

  success(`Updated href on ${c.cyan(target.tag)} ${c.dim(`[${blockId}]`)}: ${c.green(href)}`)
}

// ── links check ─────────────────────────────────────────────────────

async function linksCheck() {
  const pages = await prisma.page.findMany({
    select: { slug: true, title: true, content: true },
  })

  const allSlugs = new Set(pages.map((p) => `/${p.slug}`))
  allSlugs.add("/") // Root is always valid

  heading("Broken Link Check")

  const broken: { pageSlug: string; blockId: string; href: string }[] = []

  for (const page of pages) {
    const content = parseContent(page.content)
    const flat = flattenTree(content.blocks)

    for (const block of flat) {
      if (block.attrs?.href) {
        const href = block.attrs.href
        // Only check internal links (starting with /)
        if (href.startsWith("/") && !href.startsWith("//") && href !== "#") {
          // Normalize: strip trailing slash, query params, hash
          const normalized = href.split("?")[0].split("#")[0].replace(/\/$/, "") || "/"
          if (!allSlugs.has(normalized)) {
            broken.push({ pageSlug: page.slug, blockId: block.id, href })
          }
        }
      }
    }
  }

  if (broken.length === 0) {
    success("No broken internal links found!")
    return
  }

  const rows = broken.map((b) => ({
    page: c.cyan(`/${b.pageSlug}`),
    href: c.red(b.href),
    blockId: c.dim(b.blockId),
  }))

  console.log(table(
    [
      { key: "page", label: "Page" },
      { key: "href", label: "Broken Link" },
      { key: "blockId", label: "Block ID" },
    ],
    rows,
  ))

  console.log(c.red(`\n  ${broken.length} broken link(s) found\n`))
}
