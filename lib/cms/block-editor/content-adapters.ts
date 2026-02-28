/**
 * Content Adapters
 *
 * Factory functions that return ContentAdapter instances for different content sources.
 * Each adapter provides load/save for a specific content type (partial, site header/footer).
 */

import type { ContentAdapter } from "./editor-context"
import type { Block } from "./types"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface BlockDocument {
  version: string
  blocks: Block[]
}

function toBlockDocument(blocks: Block[]): BlockDocument {
  return { version: "2.0", blocks }
}

function fromBlockDocument(content: unknown): Block[] {
  if (!content || typeof content !== "object") return []
  const doc = content as Record<string, unknown>
  if (doc.version === "2.0" && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[]
  }
  return []
}

/* ------------------------------------------------------------------ */
/*  Partial Adapter                                                    */
/* ------------------------------------------------------------------ */

/** Adapter for editing a Partial record */
export function partialAdapter(partialId: string): ContentAdapter {
  return {
    async load() {
      const res = await fetch(`/api/cms/admin/partials/${partialId}`)
      if (!res.ok) throw new Error("Failed to load partial")
      const data = await res.json()
      return {
        blocks: fromBlockDocument(data.content),
        title: data.name || "Untitled Partial",
        id: data.id,
      }
    },
    async save(blocks: Block[], title: string) {
      const res = await fetch(`/api/cms/admin/partials/${partialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          content: toBlockDocument(blocks),
        }),
      })
      if (!res.ok) throw new Error("Failed to save partial")
      const data = await res.json()
      return { id: data.id }
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Site Header Adapter                                                */
/* ------------------------------------------------------------------ */

/** Adapter for editing the global header (SiteSettings.header) as Block[] */
export function siteHeaderAdapter(): ContentAdapter {
  return {
    async load() {
      const res = await fetch("/api/cms/admin/site-settings/header")
      if (!res.ok) throw new Error("Failed to load header settings")
      const data = await res.json()
      const blocks = fromBlockDocument(data.header)
      return {
        blocks,
        title: "Global Header",
        id: "site-header",
      }
    },
    async save(blocks: Block[]) {
      const res = await fetch("/api/cms/admin/site-settings/header", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          header: toBlockDocument(blocks),
        }),
      })
      if (!res.ok) throw new Error("Failed to save header")
      return { id: "site-header" }
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Site Footer Adapter                                                */
/* ------------------------------------------------------------------ */

/** Adapter for editing the global footer (SiteSettings.footer) as Block[] */
export function siteFooterAdapter(): ContentAdapter {
  return {
    async load() {
      const res = await fetch("/api/cms/admin/site-settings/footer")
      if (!res.ok) throw new Error("Failed to load footer settings")
      const data = await res.json()
      const blocks = fromBlockDocument(data.footer)
      return {
        blocks,
        title: "Global Footer",
        id: "site-footer",
      }
    },
    async save(blocks: Block[]) {
      const res = await fetch("/api/cms/admin/site-settings/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          footer: toBlockDocument(blocks),
        }),
      })
      if (!res.ok) throw new Error("Failed to save footer")
      return { id: "site-footer" }
    },
  }
}
