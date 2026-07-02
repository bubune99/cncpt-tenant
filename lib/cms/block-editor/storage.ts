/**
 * Persistence layer for the block editor.
 *
 * Pages are stored in the database via `/api/cms/admin/pages` API routes.
 * Custom templates and uploaded images remain in localStorage (admin convenience).
 */

import type { Block, PageLayout, PageDocument, AnnotationPin } from "./types"
import { formatSlug as slugify } from "../slug"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SavedPage {
  id: string
  slug: string
  title: string
  blocks: Block[]
  layout?: PageLayout
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
  publishedAt?: string
  thumbnail?: string
  /** Visual diff baseline screenshot (data URL) */
  baseline?: string
  /** Original React source code — AI reference for block refinement */
  sourceCode?: string | null
  /** Component dependency manifest — resolved imports for AI context */
  sourceDeps?: Record<string, unknown> | null
  /** Builder annotations — notes pinned to blocks (annotate mode). */
  annotations?: AnnotationPin[]
}

export interface CustomTemplate {
  id: string
  name: string
  category: string
  description?: string
  blocks: Block[]
  createdAt: string
  thumbnail?: string
}

export interface UploadedImage {
  id: string
  url: string
  name: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** @deprecated Use `formatSlug` from `@/lib/cms/slug` instead */
export { formatSlug as slugify } from "../slug"

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/* ------------------------------------------------------------------ */
/*  Content format helpers                                             */
/* ------------------------------------------------------------------ */

/** Wrap blocks into the PageDocument format stored in Page.content */
function toPageDocument(blocks: Block[], layout?: PageLayout, annotations?: AnnotationPin[]): PageDocument {
  return {
    version: "2.0",
    blocks,
    layout,
    ...(annotations && annotations.length > 0 ? { annotations } : {}),
  }
}

/** Extract blocks, layout & annotations from Page.content JSON */
function fromPageContent(content: unknown): { blocks: Block[]; layout?: PageLayout; annotations?: AnnotationPin[] } {
  if (!content || typeof content !== "object") return { blocks: [] }

  const doc = content as Record<string, unknown>

  // Block editor format: { version: "2.0", blocks: [...] }
  if (doc.version === "2.0" && Array.isArray(doc.blocks)) {
    return {
      blocks: doc.blocks as Block[],
      layout: doc.layout as PageLayout | undefined,
      annotations: Array.isArray(doc.annotations) ? (doc.annotations as AnnotationPin[]) : undefined,
    }
  }

  // Not block editor content (legacy format or empty)
  return { blocks: [] }
}

/** Map API response to SavedPage */
function apiResponseToSavedPage(data: Record<string, unknown>): SavedPage {
  const { blocks, layout, annotations } = fromPageContent(data.content)
  return {
    id: data.id as string,
    slug: (data.slug as string) || "",
    title: (data.title as string) || "Untitled",
    blocks,
    layout,
    annotations,
    status: (data.status as string) === "published" ? "published" : "draft",
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    updatedAt: (data.updatedAt as string) || new Date().toISOString(),
    publishedAt: (data.publishedAt as string) || undefined,
    sourceCode: (data.sourceCode as string) || null,
    sourceDeps: (data.sourceDeps as Record<string, unknown>) || null,
  }
}

/* ------------------------------------------------------------------ */
/*  Pages CRUD (API-backed)                                            */
/* ------------------------------------------------------------------ */

export async function getPagesList(): Promise<SavedPage[]> {
  try {
    const res = await fetch("/api/cms/admin/pages?limit=100")
    if (!res.ok) return []
    const data = await res.json()
    return (data.pages || []).map((p: Record<string, unknown>) => apiResponseToSavedPage(p))
  } catch {
    return []
  }
}

export async function getPage(id: string): Promise<SavedPage | null> {
  try {
    const res = await fetch(`/api/cms/admin/pages/${id}`)
    if (!res.ok) return null
    const data = await res.json()
    return apiResponseToSavedPage(data)
  } catch {
    return null
  }
}

export async function getPageBySlug(slug: string): Promise<SavedPage | null> {
  try {
    const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`
    const res = await fetch(`/api/cms/admin/pages?search=${encodeURIComponent(normalizedSlug)}&limit=10`)
    if (!res.ok) return null
    const data = await res.json()
    const pages = (data.pages || []) as Record<string, unknown>[]
    const match = pages.find((p) => p.slug === normalizedSlug && p.status === "published")
    return match ? apiResponseToSavedPage(match) : null
  } catch {
    return null
  }
}

/** Result of a save attempt — distinguishes a stale-write conflict from a
 *  generic failure so the editor can react differently (409 vs everything else). */
export type SavePageResult =
  | { status: "ok"; page: SavedPage }
  | { status: "conflict"; remoteUpdatedAt: string | null }
  | { status: "error" }

export interface SavePageOptions {
  /** The updatedAt the page was loaded with — enables 409 conflict detection. */
  lastKnownUpdatedAt?: string
  /** Skip conflict detection and overwrite the remote row unconditionally. */
  force?: boolean
}

export async function savePage(
  page: SavedPage,
  opts: SavePageOptions = {}
): Promise<SavePageResult> {
  try {
    const content = toPageDocument(page.blocks, page.layout, page.annotations)
    const normalizedSlug = page.slug.startsWith("/") ? page.slug : `/${page.slug}`
    const status = page.status === "published" ? "PUBLISHED" : "DRAFT"

    // Check if page exists in the database
    const checkRes = await fetch(`/api/cms/admin/pages/${page.id}`)
    const exists = checkRes.ok

    if (exists) {
      // Update existing page. Send lastKnownUpdatedAt (unless forcing an
      // overwrite) so the server can reject stale writes with a 409.
      const res = await fetch(`/api/cms/admin/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          slug: normalizedSlug,
          content,
          status,
          ...(opts.force ? {} : { lastKnownUpdatedAt: opts.lastKnownUpdatedAt }),
        }),
      })
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        return { status: "conflict", remoteUpdatedAt: data?.conflict?.remoteUpdatedAt ?? null }
      }
      if (!res.ok) return { status: "error" }
      const data = await res.json()
      return { status: "ok", page: apiResponseToSavedPage(data) }
    } else {
      // Create new page
      const res = await fetch("/api/cms/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: page.title,
          slug: normalizedSlug,
          content,
          status,
        }),
      })
      if (!res.ok) return { status: "error" }
      const data = await res.json()
      return { status: "ok", page: apiResponseToSavedPage(data) }
    }
  } catch {
    return { status: "error" }
  }
}

export async function deletePage(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cms/admin/pages/${id}`, { method: "DELETE" })
    return res.ok
  } catch {
    return false
  }
}

export function createNewPage(title = "Untitled Page"): SavedPage {
  const now = new Date().toISOString()
  return {
    id: "", // Empty ID signals a new page that needs to be created via API
    slug: slugify(title) || "untitled",
    title,
    blocks: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  }
}

/* ------------------------------------------------------------------ */
/*  Current Page (session state — localStorage)                        */
/* ------------------------------------------------------------------ */

const CURRENT_PAGE_KEY = "block-editor:current-page"

export function getCurrentPageId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CURRENT_PAGE_KEY)
}

export function setCurrentPageId(id: string | null): void {
  if (typeof window === "undefined") return
  if (id) {
    localStorage.setItem(CURRENT_PAGE_KEY, id)
  } else {
    localStorage.removeItem(CURRENT_PAGE_KEY)
  }
}

/* ------------------------------------------------------------------ */
/*  Custom Templates (localStorage for now)                            */
/* ------------------------------------------------------------------ */

const TEMPLATES_KEY = "block-editor:templates-custom"

export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(TEMPLATES_KEY)
  return safeJsonParse<CustomTemplate[]>(data, [])
}

export function getCustomTemplate(id: string): CustomTemplate | undefined {
  return getCustomTemplates().find((t) => t.id === id)
}

export function saveCustomTemplate(template: CustomTemplate): void {
  if (typeof window === "undefined") return
  const templates = getCustomTemplates()
  const existing = templates.findIndex((t) => t.id === template.id)

  if (existing >= 0) {
    templates[existing] = template
  } else {
    templates.push(template)
  }

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function deleteCustomTemplate(id: string): void {
  if (typeof window === "undefined") return
  const templates = getCustomTemplates()
  const filtered = templates.filter((t) => t.id !== id)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered))
}

/* ------------------------------------------------------------------ */
/*  Uploaded Images (localStorage for now)                             */
/* ------------------------------------------------------------------ */

const IMAGES_KEY = "block-editor:images"

export function getUploadedImages(): UploadedImage[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(IMAGES_KEY)
  return safeJsonParse<UploadedImage[]>(data, [])
}

export function saveUploadedImage(image: UploadedImage): void {
  if (typeof window === "undefined") return
  const images = getUploadedImages()
  images.unshift(image)

  // Limit to 50 images to avoid localStorage limits
  const limited = images.slice(0, 50)
  localStorage.setItem(IMAGES_KEY, JSON.stringify(limited))
}

export function deleteUploadedImage(id: string): void {
  if (typeof window === "undefined") return
  const images = getUploadedImages()
  const filtered = images.filter((i) => i.id !== id)
  localStorage.setItem(IMAGES_KEY, JSON.stringify(filtered))
}
