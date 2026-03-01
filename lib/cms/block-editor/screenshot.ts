/**
 * Screenshot Capture & Visual Diff Utilities
 *
 * Browser-side DOM capture using html-to-image (SVG foreignObject).
 * Pixel-level comparison using pixelmatch for visual regression detection.
 */

import { toPng } from "html-to-image"

/* ------------------------------------------------------------------ */
/*  Capture                                                            */
/* ------------------------------------------------------------------ */

export interface CaptureOptions {
  /** DPI multiplier (default 2 for retina clarity) */
  scale?: number
  /** Constrain output width in pixels */
  maxWidth?: number
  /** Background color (default: white) */
  backgroundColor?: string
}

/**
 * Capture a DOM element as a PNG data URL.
 */
export async function captureScreenshot(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  const { scale = 2, backgroundColor = "#ffffff" } = options

  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor,
    cacheBust: true,
    // Skip cross-origin images that would taint the canvas
    filter: (node: HTMLElement) => {
      // Skip script and style tags
      if (node.tagName === "SCRIPT" || node.tagName === "NOSCRIPT") return false
      return true
    },
  })

  // If maxWidth is set, scale down the image
  if (options.maxWidth) {
    return scaleDataUrl(dataUrl, options.maxWidth)
  }

  return dataUrl
}

/**
 * Capture a small thumbnail for page cards.
 * Uses lower resolution for smaller data URL size.
 */
export async function captureAsThumbnail(
  element: HTMLElement
): Promise<string> {
  return captureScreenshot(element, {
    scale: 0.5,
    maxWidth: 400,
  })
}

/* ------------------------------------------------------------------ */
/*  Visual Diff                                                        */
/* ------------------------------------------------------------------ */

export interface DiffResult {
  /** Percentage of pixels that differ (0-100) */
  diffPercent: number
  /** Total number of differing pixels */
  diffPixels: number
  /** Total pixels compared */
  totalPixels: number
  /** Data URL of the diff image (changed pixels highlighted in red) */
  diffDataUrl: string
  /** Whether the diff exceeds the threshold */
  failed: boolean
}

/**
 * Compare two screenshot data URLs pixel-by-pixel.
 * Returns a diff image with changed pixels highlighted in red.
 */
export async function compareScreenshots(
  baseline: string,
  current: string,
  threshold = 0.01 // 1% default threshold
): Promise<DiffResult> {
  // Dynamic import to avoid bundling in production
  const pixelmatch = (await import("pixelmatch")).default

  // Load both images onto canvases
  const [baseImg, currImg] = await Promise.all([
    loadImageData(baseline),
    loadImageData(current),
  ])

  // Use the larger dimensions (pad smaller image with white)
  const width = Math.max(baseImg.width, currImg.width)
  const height = Math.max(baseImg.height, currImg.height)

  // Normalize both to same size
  const baseData = normalizeImageData(baseImg, width, height)
  const currData = normalizeImageData(currImg, width, height)

  // Create diff output
  const diffCanvas = document.createElement("canvas")
  diffCanvas.width = width
  diffCanvas.height = height
  const diffCtx = diffCanvas.getContext("2d")!
  const diffImageData = diffCtx.createImageData(width, height)

  // Run pixel comparison
  const diffPixels = pixelmatch(
    baseData.data,
    currData.data,
    diffImageData.data,
    width,
    height,
    { threshold: 0.1, alpha: 0.5, diffColor: [255, 0, 0] }
  )

  diffCtx.putImageData(diffImageData, 0, 0)

  const totalPixels = width * height
  const diffPercent = (diffPixels / totalPixels) * 100

  return {
    diffPercent: Math.round(diffPercent * 100) / 100,
    diffPixels,
    totalPixels,
    diffDataUrl: diffCanvas.toDataURL("image/png"),
    failed: diffPercent / 100 > threshold,
  }
}

/* ------------------------------------------------------------------ */
/*  Download / Clipboard                                               */
/* ------------------------------------------------------------------ */

/**
 * Download a data URL as a file.
 */
export function downloadScreenshot(dataUrl: string, filename: string): void {
  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Copy a data URL image to the clipboard.
 */
export async function copyScreenshotToClipboard(dataUrl: string): Promise<void> {
  const blob = await dataUrlToBlob(dataUrl)
  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ])
}

/* ------------------------------------------------------------------ */
/*  Persistence (save to API for CLI access)                           */
/* ------------------------------------------------------------------ */

/**
 * Save a screenshot to the server filesystem for CLI access.
 */
export async function saveScreenshotToServer(
  dataUrl: string,
  slug: string,
  type: "current" | "baseline" = "current"
): Promise<string> {
  const res = await fetch("/api/cms/screenshots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, slug, type }),
  })
  if (!res.ok) throw new Error("Failed to save screenshot")
  const data = await res.json()
  return data.path as string
}

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

interface ImageInfo {
  data: Uint8ClampedArray
  width: number
  height: number
}

function loadImageData(dataUrl: string): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      resolve({ data: imageData.data, width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

function normalizeImageData(
  info: ImageInfo,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext("2d")!

  // Fill with white background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  // Draw the source image (top-left aligned)
  const srcCanvas = document.createElement("canvas")
  srcCanvas.width = info.width
  srcCanvas.height = info.height
  const srcCtx = srcCanvas.getContext("2d")!
  const srcImageData = srcCtx.createImageData(info.width, info.height)
  srcImageData.data.set(info.data)
  srcCtx.putImageData(srcImageData, 0, 0)

  ctx.drawImage(srcCanvas, 0, 0)
  return ctx.getImageData(0, 0, targetWidth, targetHeight)
}

function scaleDataUrl(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(dataUrl)
        return
      }
      const scale = maxWidth / img.width
      const canvas = document.createElement("canvas")
      canvas.width = maxWidth
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob())
}
