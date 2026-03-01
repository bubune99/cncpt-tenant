#!/usr/bin/env tsx
/**
 * Screenshot Visual Diff CLI
 *
 * Compares page screenshots saved by the browser-side capture tool.
 * Reads PNG files from public/screenshots/ and runs pixel-level comparison.
 *
 * Usage:
 *   pnpm screenshot-diff <slug>              # Compare current vs baseline
 *   pnpm screenshot-diff <slug> --update     # Set current as new baseline
 *   pnpm screenshot-diff <slug> --threshold 5 # Custom threshold (% pixels)
 *   pnpm screenshot-diff --all               # Compare all pages with baselines
 *   pnpm screenshot-diff --list              # List all saved screenshots
 *
 * Exit codes:
 *   0 — All diffs within threshold (pass)
 *   1 — Some diffs exceed threshold (fail)
 *   2 — Error (missing files, invalid args)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync } from "fs"
import { join } from "path"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

/* ------------------------------------------------------------------ */
/*  Constants & Colors                                                 */
/* ------------------------------------------------------------------ */

const SCREENSHOTS_DIR = join(process.cwd(), "public", "screenshots")

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
}

function log(msg: string) { console.log(msg) }
function success(msg: string) { log(`${c.green}✓${c.reset} ${msg}`) }
function fail(msg: string) { log(`${c.red}✗${c.reset} ${msg}`) }
function warn(msg: string) { log(`${c.yellow}!${c.reset} ${msg}`) }
function info(msg: string) { log(`${c.cyan}→${c.reset} ${msg}`) }
function heading(msg: string) { log(`\n${c.bold}${msg}${c.reset}`) }

/* ------------------------------------------------------------------ */
/*  Core: Compare two PNGs                                             */
/* ------------------------------------------------------------------ */

interface DiffResult {
  slug: string
  diffPercent: number
  diffPixels: number
  totalPixels: number
  diffPath: string
  passed: boolean
}

function comparePNGs(
  currentPath: string,
  baselinePath: string,
  diffOutputPath: string,
  threshold: number
): DiffResult {
  const currentBuf = readFileSync(currentPath)
  const baselineBuf = readFileSync(baselinePath)

  const current = PNG.sync.read(currentBuf)
  const baseline = PNG.sync.read(baselineBuf)

  // Use the larger dimensions
  const width = Math.max(current.width, baseline.width)
  const height = Math.max(current.height, baseline.height)

  // Normalize both to same size (pad with white)
  const normCurrent = normalizePNG(current, width, height)
  const normBaseline = normalizePNG(baseline, width, height)

  // Create diff output
  const diff = new PNG({ width, height })

  const diffPixels = pixelmatch(
    normBaseline.data,
    normCurrent.data,
    diff.data,
    width,
    height,
    { threshold: 0.1, alpha: 0.5, diffColor: [255, 0, 0] }
  )

  // Write diff image
  const diffBuffer = PNG.sync.write(diff)
  writeFileSync(diffOutputPath, diffBuffer)

  const totalPixels = width * height
  const diffPercent = Math.round((diffPixels / totalPixels) * 10000) / 100

  const slug = currentPath
    .replace(SCREENSHOTS_DIR + "/", "")
    .replace(SCREENSHOTS_DIR + "\\", "")
    .replace(".png", "")

  return {
    slug,
    diffPercent,
    diffPixels,
    totalPixels,
    diffPath: diffOutputPath,
    passed: diffPercent <= threshold,
  }
}

function normalizePNG(png: PNG, targetWidth: number, targetHeight: number): PNG {
  if (png.width === targetWidth && png.height === targetHeight) return png

  const result = new PNG({ width: targetWidth, height: targetHeight })

  // Fill with white
  for (let i = 0; i < result.data.length; i += 4) {
    result.data[i] = 255     // R
    result.data[i + 1] = 255 // G
    result.data[i + 2] = 255 // B
    result.data[i + 3] = 255 // A
  }

  // Copy source pixels
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const srcIdx = (y * png.width + x) * 4
      const dstIdx = (y * targetWidth + x) * 4
      result.data[dstIdx] = png.data[srcIdx]
      result.data[dstIdx + 1] = png.data[srcIdx + 1]
      result.data[dstIdx + 2] = png.data[srcIdx + 2]
      result.data[dstIdx + 3] = png.data[srcIdx + 3]
    }
  }

  return result
}

/* ------------------------------------------------------------------ */
/*  Commands                                                           */
/* ------------------------------------------------------------------ */

function listScreenshots() {
  if (!existsSync(SCREENSHOTS_DIR)) {
    warn("No screenshots directory found. Capture screenshots in the browser first.")
    return
  }

  const files = readdirSync(SCREENSHOTS_DIR).filter((f) => f.endsWith(".png"))

  if (files.length === 0) {
    warn("No screenshots found. Use the page builder to capture some first.")
    return
  }

  // Group by slug
  const slugs = new Map<string, { current: boolean; baseline: boolean }>()

  for (const file of files) {
    const isBaseline = file.includes("-baseline")
    const slug = file.replace(/-baseline\.png$/, "").replace(/\.png$/, "").replace(/-diff\.png$/, "")

    if (file.includes("-diff")) continue // Skip diff files

    if (!slugs.has(slug)) slugs.set(slug, { current: false, baseline: false })
    const entry = slugs.get(slug)!

    if (isBaseline) entry.baseline = true
    else entry.current = true
  }

  heading("Saved Screenshots")
  log("")

  const maxSlug = Math.max(...[...slugs.keys()].map((s) => s.length), 4)

  log(
    `  ${c.dim}${"SLUG".padEnd(maxSlug)}  CURRENT  BASELINE  DIFF READY${c.reset}`
  )

  for (const [slug, { current, baseline }] of slugs) {
    const canDiff = current && baseline
    log(
      `  ${slug.padEnd(maxSlug)}  ${current ? `${c.green}yes${c.reset}` : `${c.dim}no${c.reset} `}      ${baseline ? `${c.green}yes${c.reset}` : `${c.dim}no${c.reset} `}       ${canDiff ? `${c.cyan}ready${c.reset}` : `${c.dim}—${c.reset}    `}`
    )
  }

  log("")
  log(`  ${c.dim}${files.length} file(s) in ${SCREENSHOTS_DIR}${c.reset}`)
}

function compareOne(slug: string, threshold: number): DiffResult | null {
  const currentPath = join(SCREENSHOTS_DIR, `${slug}.png`)
  const baselinePath = join(SCREENSHOTS_DIR, `${slug}-baseline.png`)
  const diffPath = join(SCREENSHOTS_DIR, `${slug}-diff.png`)

  if (!existsSync(currentPath)) {
    fail(`No current screenshot for "${slug}". Capture one in the browser first.`)
    return null
  }

  if (!existsSync(baselinePath)) {
    warn(`No baseline for "${slug}". Use --update to set the current as baseline.`)
    return null
  }

  const result = comparePNGs(currentPath, baselinePath, diffPath, threshold)

  if (result.passed) {
    success(
      `${slug}: ${c.green}${result.diffPercent}%${c.reset} changed (${result.diffPixels.toLocaleString()} px) — ${c.green}PASS${c.reset}`
    )
  } else {
    fail(
      `${slug}: ${c.red}${result.diffPercent}%${c.reset} changed (${result.diffPixels.toLocaleString()} px) — ${c.red}FAIL${c.reset} (threshold: ${threshold}%)`
    )
  }

  info(`Diff image: ${diffPath}`)

  return result
}

function updateBaseline(slug: string) {
  const currentPath = join(SCREENSHOTS_DIR, `${slug}.png`)
  const baselinePath = join(SCREENSHOTS_DIR, `${slug}-baseline.png`)

  if (!existsSync(currentPath)) {
    fail(`No current screenshot for "${slug}". Capture one in the browser first.`)
    process.exit(2)
  }

  copyFileSync(currentPath, baselinePath)
  success(`Updated baseline for "${slug}"`)
}

function compareAll(threshold: number) {
  if (!existsSync(SCREENSHOTS_DIR)) {
    warn("No screenshots directory found.")
    process.exit(2)
  }

  const files = readdirSync(SCREENSHOTS_DIR).filter(
    (f) => f.endsWith(".png") && !f.includes("-baseline") && !f.includes("-diff")
  )

  if (files.length === 0) {
    warn("No current screenshots found.")
    process.exit(2)
  }

  heading(`Comparing ${files.length} page(s)`)
  log("")

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const file of files) {
    const slug = file.replace(/\.png$/, "")
    const result = compareOne(slug, threshold)

    if (!result) {
      skipped++
    } else if (result.passed) {
      passed++
    } else {
      failed++
    }
  }

  log("")
  heading("Summary")
  if (passed > 0) success(`${passed} passed`)
  if (failed > 0) fail(`${failed} failed`)
  if (skipped > 0) warn(`${skipped} skipped (no baseline)`)

  if (failed > 0) process.exit(1)
}

/* ------------------------------------------------------------------ */
/*  CLI Entry                                                          */
/* ------------------------------------------------------------------ */

function printHelp() {
  log(`
${c.bold}screenshot-diff${c.reset} — Visual regression testing for page builder screenshots

${c.bold}Usage:${c.reset}
  pnpm screenshot-diff <slug>                Compare current vs baseline
  pnpm screenshot-diff <slug> --update       Set current as new baseline
  pnpm screenshot-diff <slug> --threshold 5  Custom diff threshold (default: 1%)
  pnpm screenshot-diff --all                 Compare all pages with baselines
  pnpm screenshot-diff --list                List all saved screenshots
  pnpm screenshot-diff --help                Show this help

${c.bold}How it works:${c.reset}
  1. Capture screenshots in the browser (page builder → ... → Capture Screenshot)
  2. Save to baseline (Screenshot dialog → Save as Baseline)
  3. Make changes to the page
  4. Capture again
  5. Run this CLI to compare: ${c.cyan}pnpm screenshot-diff my-page${c.reset}

${c.bold}Exit codes:${c.reset}
  0  All diffs within threshold
  1  Some diffs exceed threshold
  2  Error (missing files, bad args)
`)
}

const args = process.argv.slice(2)

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printHelp()
  process.exit(0)
}

if (args.includes("--list")) {
  listScreenshots()
  process.exit(0)
}

// Parse threshold
const thresholdIdx = args.indexOf("--threshold")
const threshold = thresholdIdx >= 0 ? parseFloat(args[thresholdIdx + 1] || "1") : 1

if (args.includes("--all")) {
  compareAll(threshold)
} else {
  const slug = args.find((a) => !a.startsWith("--"))

  if (!slug) {
    fail("Please provide a page slug or use --all")
    process.exit(2)
  }

  if (args.includes("--update")) {
    updateBaseline(slug)
  } else {
    const result = compareOne(slug, threshold)
    if (!result) process.exit(2)
    if (!result.passed) process.exit(1)
  }
}
