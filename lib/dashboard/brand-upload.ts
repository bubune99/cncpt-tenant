/**
 * Rules for a logo or icon uploaded from the workspace's Branding tab (POST /api/dashboard/branding/upload).
 * Check: lib/dashboard/brand-upload.assert.ts
 */

export const BRAND_SLOTS = ["logo", "logo_dark", "favicon", "apple_touch_icon"] as const
export type BrandSlot = (typeof BRAND_SLOTS)[number]

export const BRAND_MAX_BYTES = 2 * 1024 * 1024

// SVG is not accepted: served inline, an unsanitised SVG is stored XSS (same rule as the CMS image upload).
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }

export function checkBrandImage(f: { type: string; size: number }): { ok: boolean; error?: string } {
  if (!EXT[f.type]) return { ok: false, error: "Use a PNG, JPEG, WebP or GIF image." }
  if (f.size <= 0) return { ok: false, error: "The file is empty." }
  if (f.size > BRAND_MAX_BYTES) return { ok: false, error: "The image is larger than 2 MB." }
  return { ok: true }
}

export function isBrandSlot(v: unknown): v is BrandSlot {
  return typeof v === "string" && (BRAND_SLOTS as readonly string[]).includes(v)
}

/** The stored file name: from the slot and type only, so nothing the uploader named reaches the path. */
export function brandFileName(slot: BrandSlot, type: string, now: number): string {
  if (!isBrandSlot(slot)) throw new Error("Unknown brand slot")
  const ext = EXT[type]
  if (!ext) throw new Error("Unsupported image type")
  return `brand-${slot}-${now}.${ext}`
}
