/**
 * Filesystem Scanner
 *
 * Reads a local project directory and produces the same ProjectManifest
 * that scanProject() produces from a ZIP buffer. Used by MCP tools
 * for local filesystem imports.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { join, relative, extname } from "path"
import type { ProjectManifest, ProjectFile, AssetFile } from "./scanner"
import { extractExportName, parseImports, resolveImportPath } from "./scanner"

// ── Skip patterns ────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", ".turbo", "dist", ".cache",
  "__MACOSX", ".vercel", ".output", "coverage",
])

const SKIP_FILES = new Set([
  ".DS_Store", ".gitignore", ".env", ".env.local", ".env.production",
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
  "bun.lockb", "tsconfig.json", "README.md",
])

const ASSET_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".avif",
  ".mp4", ".webm", ".ogg", ".mp3",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
])

const SOURCE_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"])
const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass"])

const MIME_MAP: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".ico": "image/x-icon", ".avif": "image/avif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg",
  ".mp3": "audio/mpeg",
  ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject", ".otf": "font/otf",
}

const PROVIDER_PATTERNS = [/theme-provider/i, /providers?\.(tsx?|jsx?)$/i]

// ── Helpers ──────────────────────────────────────────────────────────

function isPageFile(path: string): boolean {
  if (/(?:^|\/)page\.(tsx?|jsx?)$/.test(path)) return true
  if (/^pages\//.test(path) && !path.includes("_app") && !path.includes("_document") && !path.includes("api/")) return true
  if (/^src\/pages\//.test(path) && !path.includes("_app") && !path.includes("_document") && !path.includes("api/")) return true
  return false
}

function isLayoutFile(path: string): boolean {
  return /(?:^|\/)layout\.(tsx?|jsx?)$/.test(path)
}

function isComponentFile(path: string): boolean {
  if (isPageFile(path) || isLayoutFile(path)) return false
  if (PROVIDER_PATTERNS.some((p) => p.test(path))) return false
  const componentDirs = ["components/", "sections/", "features/", "partials/", "blocks/"]
  return componentDirs.some((dir) => path.includes(dir)) ||
    /^[A-Z]\w+\.(tsx?|jsx?)$/.test(path.split("/").pop() || "")
}

function isConfigFile(path: string): boolean {
  return /(?:tailwind|postcss|next)\.config\./i.test(path)
}

// ── Recursive directory reader ───────────────────────────────────────

function walkDir(dir: string, rootDir: string): { path: string; fullPath: string }[] {
  const results: { path: string; fullPath: string }[] = []

  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return results
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue
    if (SKIP_FILES.has(entry)) continue

    const fullPath = join(dir, entry)
    let stat
    try {
      stat = statSync(fullPath)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath, rootDir))
    } else {
      const relPath = relative(rootDir, fullPath).replace(/\\/g, "/")
      results.push({ path: relPath, fullPath })
    }
  }

  return results
}

// ── Main Scanner ─────────────────────────────────────────────────────

/**
 * Scan a local directory and classify its contents into a ProjectManifest.
 * Produces the same output shape as scanProject() from scanner.ts.
 */
export function scanDirectory(dirPath: string): ProjectManifest {
  if (!existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`)
  }

  const stat = statSync(dirPath)
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`)
  }

  const manifest: ProjectManifest = {
    pages: [],
    components: [],
    layouts: [],
    assets: [],
    styles: [],
    config: [],
    importGraph: new Map(),
  }

  const files = walkDir(dirPath, dirPath)
  const allPaths = files.map((f) => f.path)

  // Classify files
  for (const { path, fullPath } of files) {
    const ext = extname(path).toLowerCase()

    // Assets
    if (ASSET_EXTENSIONS.has(ext)) {
      try {
        const buffer = readFileSync(fullPath)
        manifest.assets.push({
          path,
          buffer,
          mimeType: MIME_MAP[ext] || "application/octet-stream",
        })
      } catch {
        // Skip unreadable files
      }
      continue
    }

    // Styles
    if (STYLE_EXTENSIONS.has(ext)) {
      try {
        const content = readFileSync(fullPath, "utf-8")
        manifest.styles.push({ path, content, exportName: null, imports: [] })
      } catch {
        // Skip
      }
      continue
    }

    // Config files
    if (isConfigFile(path)) {
      try {
        const content = readFileSync(fullPath, "utf-8")
        manifest.config.push({ path, content, exportName: null, imports: [] })
      } catch {
        // Skip
      }
      continue
    }

    // Source files only from here
    if (!SOURCE_EXTENSIONS.has(ext)) continue

    let content: string
    try {
      content = readFileSync(fullPath, "utf-8")
    } catch {
      continue
    }

    const exportName = extractExportName(content)
    const imports = parseImports(content)

    for (const imp of imports) {
      imp.resolvedPath = resolveImportPath(imp.source, path, allPaths)
    }

    const file: ProjectFile = { path, content, exportName, imports }

    if (isPageFile(path)) {
      manifest.pages.push(file)
    } else if (isLayoutFile(path)) {
      manifest.layouts.push(file)
    } else if (isComponentFile(path)) {
      manifest.components.push(file)
    }
  }

  // Build import graph
  for (const { path, fullPath } of files) {
    const ext = extname(path).toLowerCase()
    if (!SOURCE_EXTENSIONS.has(ext)) continue

    let content: string
    try {
      content = readFileSync(fullPath, "utf-8")
    } catch {
      continue
    }

    const imports = parseImports(content)
    const resolvedImports: string[] = []
    for (const imp of imports) {
      const resolved = resolveImportPath(imp.source, path, allPaths)
      if (resolved) resolvedImports.push(resolved)
    }
    if (resolvedImports.length > 0) {
      manifest.importGraph.set(path, resolvedImports)
    }
  }

  // Discover transitive components
  const existingComponentPaths = new Set(manifest.components.map((c) => c.path))
  const queue = [...manifest.pages, ...manifest.layouts]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const file = queue.pop()!
    for (const imp of file.imports) {
      if (!imp.resolvedPath) continue
      if (existingComponentPaths.has(imp.resolvedPath)) continue
      if (visited.has(imp.resolvedPath)) continue
      visited.add(imp.resolvedPath)

      const entry = files.find((f) => f.path === imp.resolvedPath)
      if (!entry) continue
      if (!SOURCE_EXTENSIONS.has(extname(entry.path).toLowerCase())) continue

      let content: string
      try {
        content = readFileSync(entry.fullPath, "utf-8")
      } catch {
        continue
      }

      const exportName = extractExportName(content)
      const fileImports = parseImports(content)
      for (const i of fileImports) {
        i.resolvedPath = resolveImportPath(i.source, entry.path, allPaths)
      }

      const compFile: ProjectFile = { path: entry.path, content, exportName, imports: fileImports }
      manifest.components.push(compFile)
      existingComponentPaths.add(entry.path)
      queue.push(compFile)
    }
  }

  return manifest
}
