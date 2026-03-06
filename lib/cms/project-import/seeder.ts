/**
 * Project Seeder
 *
 * Takes parsed project data and upserts Pages + Partials into the database.
 * Components become Partials, pages become Pages with PartialReference blocks.
 * Assets are uploaded to media storage.
 */

import { prisma, getCurrentTenant } from "../db"
import type { Block } from "../block-editor/types"
import { generateId } from "../block-editor/tree-utils"
import { buildDependencyManifest } from "../block-editor/dependency-context"
import type { ParsedComponent, ParsedPage } from "./parser"
import type { ResolvedProject } from "./resolver"
import type { AssetFile } from "./scanner"
import { deriveTitle, nameToSlug } from "./resolver"

// ── Types ────────────────────────────────────────────────────────────

export interface SeedOptions {
  status: "DRAFT" | "PUBLISHED"
  slugPrefix?: string
  tenantId?: number | null
}

export interface SeedResult {
  partials: { id: string; name: string; slug: string; blockCount: number }[]
  pages: { id: string; title: string; slug: string; blockCount: number }[]
  assets: { path: string; url: string }[]
  errors: string[]
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Derive partial category from component name or path */
function derivePartialCategory(name: string, path: string): string {
  const lowerName = name.toLowerCase()
  const lowerPath = path.toLowerCase()

  if (lowerName.includes("header") || lowerPath.includes("header")) return "HEADER"
  if (lowerName.includes("navbar") || lowerName === "nav" || lowerName === "navigation") return "HEADER"
  if (lowerName.includes("footer") || lowerPath.includes("footer")) return "FOOTER"
  if (lowerName.includes("sidebar") || lowerPath.includes("sidebar")) return "SIDEBAR"
  return "SECTION"
}

/** Walk all blocks and replace data-partial-slug with actual partialId */
function injectPartialIds(
  blocks: Block[],
  slugToId: Map<string, string>
): void {
  for (const block of blocks) {
    if (block.componentName === "PartialReference" && block.attrs?.["data-partial-slug"]) {
      const slug = block.attrs["data-partial-slug"]
      const partialId = slugToId.get(slug)
      if (partialId) {
        block.partialId = partialId
      }
      delete block.attrs["data-partial-slug"]
      if (block.attrs && Object.keys(block.attrs).length === 0) {
        delete block.attrs
      }
    }

    if (block.children) {
      injectPartialIds(block.children, slugToId)
    }
  }
}

/** Walk all blocks and replace relative asset paths with uploaded URLs */
function rewriteAssetUrls(
  blocks: Block[],
  assetMap: Map<string, string>
): void {
  for (const block of blocks) {
    if (block.attrs) {
      if (block.attrs.src) {
        const rewritten = rewriteUrl(block.attrs.src, assetMap)
        if (rewritten) block.attrs.src = rewritten
      }
      if (block.attrs.poster) {
        const rewritten = rewriteUrl(block.attrs.poster, assetMap)
        if (rewritten) block.attrs.poster = rewritten
      }
    }

    if (block.background?.url) {
      const rewritten = rewriteUrl(block.background.url, assetMap)
      if (rewritten) block.background.url = rewritten
    }

    if (block.children) {
      rewriteAssetUrls(block.children, assetMap)
    }
  }
}

/** Try to rewrite a URL using the asset map */
function rewriteUrl(url: string, assetMap: Map<string, string>): string | null {
  if (assetMap.has(url)) return assetMap.get(url)!
  const stripped = url.replace(/^\//, "")
  if (assetMap.has(stripped)) return assetMap.get(stripped)!
  if (assetMap.has(`public/${stripped}`)) return assetMap.get(`public/${stripped}`)!
  return null
}

/**
 * Build a Block[] document containing a single PartialReference block.
 */
function buildPartialRefDocument(partialId: string): Record<string, unknown> {
  return {
    version: "2.0",
    blocks: [
      {
        id: generateId(),
        tag: "div",
        className: "",
        componentName: "PartialReference",
        partialId,
      },
    ],
  }
}

/**
 * Remove PartialReference blocks that match specific slugs from the page's
 * top-level blocks.
 */
function stripLayoutBlocks(blocks: Block[], slugsToStrip: Set<string>): Block[] {
  return blocks.filter((block) => {
    if (block.componentName === "PartialReference") {
      const slug = block.attrs?.["data-partial-slug"] || ""
      if (slugsToStrip.has(slug)) return false
    }
    return true
  })
}

/** Count total blocks recursively */
function countBlocks(blocks: Block[]): number {
  let count = blocks.length
  for (const block of blocks) {
    if (block.children) count += countBlocks(block.children)
  }
  return count
}

// ── Asset Upload ─────────────────────────────────────────────────────

/**
 * Upload project assets to media storage.
 * Returns a map from original path → uploaded URL.
 */
async function uploadAssets(
  assets: AssetFile[]
): Promise<{ assetMap: Map<string, string>; results: { path: string; url: string }[]; errors: string[] }> {
  const assetMap = new Map<string, string>()
  const results: { path: string; url: string }[] = []
  const errors: string[] = []

  // Dynamic import to avoid importing media in contexts where it's not available
  let generatePresignedUrl: typeof import("../media/upload").generatePresignedUrl
  let createMedia: typeof import("../media").createMedia
  try {
    const uploadModule = await import("../media/upload")
    const mediaModule = await import("../media")
    generatePresignedUrl = uploadModule.generatePresignedUrl
    createMedia = mediaModule.createMedia
  } catch {
    // Media system not available — skip asset uploads
    for (const asset of assets) {
      errors.push(`Skipped asset ${asset.path}: media system not available`)
    }
    return { assetMap, results, errors }
  }

  for (const asset of assets) {
    try {
      const filename = asset.path.split("/").pop() || "file"
      const presigned = await generatePresignedUrl(filename, asset.mimeType, asset.buffer.length)

      const uploadRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body: asset.buffer,
        headers: { "Content-Type": asset.mimeType },
      })

      if (!uploadRes.ok) {
        errors.push(`Failed to upload ${asset.path}: ${uploadRes.statusText}`)
        continue
      }

      await createMedia({
        filename,
        url: presigned.publicUrl,
        key: presigned.key,
        mimeType: asset.mimeType,
        size: asset.buffer.length,
      })

      assetMap.set(asset.path, presigned.publicUrl)
      const stripped = asset.path.replace(/^public\//, "")
      assetMap.set(stripped, presigned.publicUrl)
      assetMap.set("/" + stripped, presigned.publicUrl)

      results.push({ path: asset.path, url: presigned.publicUrl })
    } catch (err) {
      errors.push(`Failed to upload ${asset.path}: ${(err as Error).message}`)
    }
  }

  return { assetMap, results, errors }
}

// ── Main Seeder ──────────────────────────────────────────────────────

/**
 * Seed parsed project data into the database.
 *
 * Phase A: Components → Partials
 * Phase B: Pages → Pages with PartialRefs
 * Phase C: Assets → Media storage
 */
export async function seedProject(
  resolved: ResolvedProject,
  components: ParsedComponent[],
  pages: ParsedPage[],
  options: SeedOptions
): Promise<SeedResult> {
  const result: SeedResult = {
    partials: [],
    pages: [],
    assets: [],
    errors: [],
  }

  const { status, slugPrefix } = options
  const tenantId = options.tenantId ?? getCurrentTenant() ?? null
  const slugToPartialId = new Map<string, string>()

  // ── Phase A: Components → Partials ──────────────────────────────

  for (const comp of components) {
    if (comp.blocks.length === 0) continue

    const name = comp.file.exportName || comp.file.path.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") || "Component"
    const slug = resolved.componentSlugs.get(comp.file.exportName || "") ||
      name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9-]/g, "-")
    const category = derivePartialCategory(name, comp.file.path)
    const displayName = deriveTitle(comp.file.exportName, slug)

    const content = {
      version: "2.0",
      blocks: comp.blocks,
    }

    try {
      const partial = await prisma.partial.upsert({
        where: { tenantId_slug: { tenantId: tenantId as number, slug } },
        update: {
          name: displayName,
          status,
          content: content as Record<string, unknown>,
          category,
          sourceCode: comp.file.content,
        },
        create: {
          name: displayName,
          slug,
          status,
          content: content as Record<string, unknown>,
          category,
          sourceCode: comp.file.content,
          ...(tenantId != null ? { tenant: { connect: { id: tenantId } } } : {}),
        },
      })

      slugToPartialId.set(slug, partial.id)
      result.partials.push({
        id: partial.id,
        name: displayName,
        slug,
        blockCount: countBlocks(comp.blocks),
      })
    } catch (err) {
      result.errors.push(`Failed to seed partial "${name}": ${(err as Error).message}`)
    }
  }

  // ── Phase C: Assets → Media storage (before pages so URLs are ready) ──

  const { assetMap, results: assetResults, errors: assetErrors } =
    await uploadAssets(resolved.manifest.assets)
  result.assets = assetResults
  result.errors.push(...assetErrors)

  // ── Phase B: Pages → Pages with PartialRefs ─────────────────────

  const { layout } = resolved
  const headerSlug = layout.headerName ? nameToSlug(layout.headerName) : null
  const footerSlug = layout.footerName ? nameToSlug(layout.footerName) : null
  const headerPartialId = headerSlug ? slugToPartialId.get(headerSlug) || null : null
  const footerPartialId = footerSlug ? slugToPartialId.get(footerSlug) || null : null

  const layoutSlugsToStrip = new Set<string>()
  if (headerSlug) layoutSlugsToStrip.add(headerSlug)
  if (footerSlug) layoutSlugsToStrip.add(footerSlug)

  for (const page of pages) {
    if (page.blocks.length === 0) continue

    injectPartialIds(page.blocks, slugToPartialId)

    let pageBlocks = page.blocks
    if (layoutSlugsToStrip.size > 0) {
      pageBlocks = stripLayoutBlocks(pageBlocks, layoutSlugsToStrip)
      for (const block of pageBlocks) {
        if (block.children) {
          block.children = stripLayoutBlocks(block.children, layoutSlugsToStrip)
        }
      }
    }

    rewriteAssetUrls(pageBlocks, assetMap)

    const pageSlug = resolved.pageSlugs.get(page.file.path) || "imported-page"
    const finalSlug = slugPrefix ? `${slugPrefix}/${pageSlug}` : pageSlug
    const title = deriveTitle(page.file.exportName, pageSlug)

    const hasLayoutHeader = !!headerPartialId
    const hasLayoutFooter = !!footerPartialId
    const headerMode = hasLayoutHeader ? "CUSTOM" : "NONE"
    const footerMode = hasLayoutFooter ? "CUSTOM" : "NONE"
    const layoutConfig = {
      header: hasLayoutHeader ? "custom" as const : "none" as const,
      footer: hasLayoutFooter ? "custom" as const : "none" as const,
    }

    const content = {
      version: "2.0",
      blocks: pageBlocks,
      layout: layoutConfig,
    }

    try {
      const sourceDeps = buildDependencyManifest(page.file, resolved.componentMap)
      const hasDeps = Object.keys(sourceDeps.components).length > 0 || (sourceDeps.unresolved?.length ?? 0) > 0

      const dbPage = await prisma.page.upsert({
        where: { tenantId_slug: { tenantId: tenantId as number, slug: finalSlug } },
        update: {
          title,
          status,
          content: content as Record<string, unknown>,
          sourceCode: page.file.content,
          sourceDeps: hasDeps ? (JSON.parse(JSON.stringify(sourceDeps))) : undefined,
          headerMode,
          footerMode,
          customHeader: hasLayoutHeader ? buildPartialRefDocument(headerPartialId!) : undefined,
          customFooter: hasLayoutFooter ? buildPartialRefDocument(footerPartialId!) : undefined,
          ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
        },
        create: {
          title,
          slug: finalSlug,
          status,
          content: content as Record<string, unknown>,
          sourceCode: page.file.content,
          sourceDeps: hasDeps ? (JSON.parse(JSON.stringify(sourceDeps))) : undefined,
          headerMode,
          footerMode,
          customHeader: hasLayoutHeader ? buildPartialRefDocument(headerPartialId!) : undefined,
          customFooter: hasLayoutFooter ? buildPartialRefDocument(footerPartialId!) : undefined,
          ...(tenantId != null ? { tenant: { connect: { id: tenantId } } } : {}),
          ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
        },
      })

      result.pages.push({
        id: dbPage.id,
        title,
        slug: finalSlug,
        blockCount: countBlocks(pageBlocks),
      })
    } catch (err) {
      result.errors.push(`Failed to seed page "${title}": ${(err as Error).message}`)
    }
  }

  // Also rewrite asset URLs in partials
  if (assetMap.size > 0) {
    for (const comp of components) {
      rewriteAssetUrls(comp.blocks, assetMap)
      const slug = resolved.componentSlugs.get(comp.file.exportName || "")
      if (slug) {
        const partialId = slugToPartialId.get(slug)
        if (partialId) {
          try {
            await prisma.partial.update({
              where: { id: partialId },
              data: {
                content: { version: "2.0", blocks: comp.blocks } as Record<string, unknown>,
              },
            })
          } catch {
            // Non-critical — partial was already created
          }
        }
      }
    }
  }

  return result
}
