/**
 * Screenshots API
 *
 * POST /api/cms/screenshots — Save a screenshot PNG to public/screenshots/
 * GET  /api/cms/screenshots — List all saved screenshots
 * GET  /api/cms/screenshots?slug=my-page — Get screenshot for a specific page
 *
 * Screenshots are saved to the filesystem so the CLI can access them
 * for visual diff comparison without needing the browser open.
 */

import { NextRequest, NextResponse } from "next/server"
import { writeFile, readdir, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"

const SCREENSHOTS_DIR = join(process.cwd(), "public", "screenshots")

async function ensureDir() {
  if (!existsSync(SCREENSHOTS_DIR)) {
    await mkdir(SCREENSHOTS_DIR, { recursive: true })
  }
}

// POST — Save a screenshot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataUrl, slug, type = "current" } = body as {
      dataUrl: string
      slug: string
      type?: "current" | "baseline"
    }

    if (!dataUrl || !slug) {
      return NextResponse.json(
        { error: "dataUrl and slug are required" },
        { status: 400 }
      )
    }

    // Validate data URL
    if (!dataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { error: "Only PNG data URLs are supported" },
        { status: 400 }
      )
    }

    // Sanitize slug for filename
    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 100)
    const suffix = type === "baseline" ? "-baseline" : ""
    const filename = `${safeSlug}${suffix}.png`

    await ensureDir()

    // Decode base64 and write file
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const filepath = join(SCREENSHOTS_DIR, filename)

    await writeFile(filepath, buffer)

    return NextResponse.json({
      path: `/screenshots/${filename}`,
      filename,
      size: buffer.length,
    })
  } catch (error) {
    console.error("Save screenshot error:", error)
    return NextResponse.json(
      { error: "Failed to save screenshot" },
      { status: 500 }
    )
  }
}

// GET — List screenshots or get specific one
export async function GET(request: NextRequest) {
  try {
    await ensureDir()

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (slug) {
      // Get specific page screenshots
      const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "-")
      const currentPath = join(SCREENSHOTS_DIR, `${safeSlug}.png`)
      const baselinePath = join(SCREENSHOTS_DIR, `${safeSlug}-baseline.png`)

      const result: Record<string, string | null> = {
        current: null,
        baseline: null,
      }

      if (existsSync(currentPath)) {
        const data = await readFile(currentPath)
        result.current = `data:image/png;base64,${data.toString("base64")}`
      }

      if (existsSync(baselinePath)) {
        const data = await readFile(baselinePath)
        result.baseline = `data:image/png;base64,${data.toString("base64")}`
      }

      return NextResponse.json(result)
    }

    // List all screenshots
    const files = await readdir(SCREENSHOTS_DIR)
    const screenshots = files
      .filter((f) => f.endsWith(".png"))
      .map((f) => ({
        filename: f,
        slug: f.replace(/-baseline\.png$/, "").replace(/\.png$/, ""),
        isBaseline: f.includes("-baseline"),
        path: `/screenshots/${f}`,
      }))

    return NextResponse.json({ screenshots })
  } catch (error) {
    console.error("List screenshots error:", error)
    return NextResponse.json(
      { error: "Failed to list screenshots" },
      { status: 500 }
    )
  }
}
