/**
 * Project Scanner
 *
 * Extracts and classifies files from a ZIP buffer into a structured ProjectManifest.
 * Identifies pages, components, assets, styles, and config files.
 * Builds an import graph showing which files import which.
 */

import AdmZip from "adm-zip"

// ── Types ────────────────────────────────────────────────────────────

export interface ImportDeclaration {
  source: string              // "@/components/header" or "./header"
  specifiers: string[]        // ["Header", "default"]
  resolvedPath: string | null // Resolved to actual file path in project
}

export interface ProjectFile {
  path: string
  content: string
  exportName: string | null   // "HeroSection", "Header", etc.
  imports: ImportDeclaration[]
}

export interface AssetFile {
  path: string
  buffer: Buffer
  mimeType: string
}

export interface ProjectManifest {
  pages: ProjectFile[]
  components: ProjectFile[]
  layouts: ProjectFile[]           // layout.tsx files (contain header/footer wrapping {children})
  assets: AssetFile[]
  styles: ProjectFile[]
  config: ProjectFile[]
  importGraph: Map<string, string[]> // file → [imported file paths]
}

// ── Skip patterns ────────────────────────────────────────────────────

const SKIP_PATTERNS = [
  /^__MACOSX\//,
  /\.DS_Store$/,
  /\.gitignore$/,
  /package\.json$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /bun\.lockb$/,
  /tsconfig\.json$/,
  /README\.md$/i,
  /\.env/,
  /node_modules\//,
  /\.next\//,
  /\.git\//,
  /\.turbo\//,
  /dist\//,
  /\.cache\//,
]

/** Provider/layout files that aren't meaningful components */
const PROVIDER_PATTERNS = [
  /theme-provider/i,
  /providers?\.(tsx?|jsx?)$/i,
]

const ASSET_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|ogg|mp3|woff|woff2|ttf|eot|otf|avif)$/i

const MIME_MAP: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".ico": "image/x-icon", ".avif": "image/avif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg",
  ".mp3": "audio/mpeg",
  ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject", ".otf": "font/otf",
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Strip the common root directory prefix from ZIP entries */
function stripRootPrefix(entries: AdmZip.IZipEntry[]): string {
  const paths = entries.filter((e) => !e.isDirectory).map((e) => e.entryName)
  if (paths.length === 0) return ""

  const firstParts = paths[0].split("/")
  let commonDepth = 0

  for (let i = 0; i < firstParts.length - 1; i++) {
    const prefix = firstParts.slice(0, i + 1).join("/") + "/"
    if (paths.every((p) => p.startsWith(prefix))) {
      commonDepth = i + 1
    } else {
      break
    }
  }

  return commonDepth > 0 ? firstParts.slice(0, commonDepth).join("/") + "/" : ""
}

/** Extract the default export name from source code */
export function extractExportName(code: string): string | null {
  // export default function FooPage(
  const funcMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/)
  if (funcMatch) return funcMatch[1]

  // const FooPage = () => ...  \n export default FooPage
  const constMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=/)
  const defaultExport = code.match(/export\s+default\s+(\w+)/)
  if (defaultExport) return defaultExport[1]
  if (constMatch) return constMatch[1]

  return null
}

/** Parse import statements from source code */
export function parseImports(code: string): ImportDeclaration[] {
  const imports: ImportDeclaration[] = []

  // Match: import { X, Y } from "path"
  // Match: import X from "path"
  // Match: import X, { Y } from "path"
  // Match: import * as X from "path"
  // Match: import "path" (side-effect)
  const importRe = /import\s+(?:(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\}\s*)?(?:\*\s+as\s+(\w+)\s*)?)\s*(?:from\s+)?["']([^"']+)["']/g
  let m: RegExpExecArray | null

  while ((m = importRe.exec(code)) !== null) {
    const [, defaultImport, namedImports, starImport, source] = m
    const specifiers: string[] = []

    if (defaultImport) specifiers.push(defaultImport)
    if (starImport) specifiers.push(starImport)
    if (namedImports) {
      namedImports.split(",").forEach((s) => {
        const name = s.trim().split(/\s+as\s+/).pop()?.trim()
        if (name) specifiers.push(name)
      })
    }

    // Skip non-local imports (node_modules)
    if (!source.startsWith(".") && !source.startsWith("@/") && !source.startsWith("~/")) {
      continue
    }

    imports.push({ source, specifiers, resolvedPath: null })
  }

  return imports
}

/** Determine if a path is a page file */
function isPageFile(path: string): boolean {
  // Next.js App Router pages
  if (/(?:^|\/)page\.(tsx?|jsx?)$/.test(path)) return true
  // Pages Router files
  if (/^pages\//.test(path) && !path.includes("_app") && !path.includes("_document") && !path.includes("api/")) return true
  if (/^src\/pages\//.test(path) && !path.includes("_app") && !path.includes("_document") && !path.includes("api/")) return true
  return false
}

/** Determine if a path is a layout file (skip these) */
function isLayoutFile(path: string): boolean {
  return /(?:^|\/)layout\.(tsx?|jsx?)$/.test(path)
}

/** Determine if a path is a component file */
function isComponentFile(path: string): boolean {
  if (!path.match(/\.(tsx?|jsx?)$/)) return false
  if (isPageFile(path)) return false
  if (isLayoutFile(path)) return false
  if (PROVIDER_PATTERNS.some((p) => p.test(path))) return false

  // Files in components/, sections/, or features/ directories
  const componentDirs = ["components/", "sections/", "features/", "partials/", "blocks/"]
  return componentDirs.some((dir) => path.includes(dir)) || /^[A-Z]\w+\.(tsx?|jsx?)$/.test(path.split("/").pop() || "")
}

/** Determine if a path is a CSS file */
function isStyleFile(path: string): boolean {
  return /\.(css|scss|sass)$/.test(path)
}

/** Determine if a path is a config file */
function isConfigFile(path: string): boolean {
  return /(?:tailwind|postcss|next)\.config\./i.test(path)
}

/** Get MIME type from file extension */
function getMimeType(path: string): string {
  const ext = "." + path.split(".").pop()?.toLowerCase()
  return MIME_MAP[ext] || "application/octet-stream"
}

/** Resolve a relative import path to an actual file path in the project */
export function resolveImportPath(
  importSource: string,
  importerPath: string,
  allPaths: string[]
): string | null {
  let target: string

  // Handle alias imports (@/, ~/)
  if (importSource.startsWith("@/")) {
    target = importSource.replace("@/", "src/")
  } else if (importSource.startsWith("~/")) {
    target = importSource.replace("~/", "")
  } else if (importSource.startsWith(".")) {
    // Relative import — resolve from the importer's directory
    const importerDir = importerPath.split("/").slice(0, -1).join("/")
    const parts = [...(importerDir ? importerDir.split("/") : []), ...importSource.split("/")]
    const resolved: string[] = []
    for (const part of parts) {
      if (part === "." || part === "") continue
      if (part === "..") { resolved.pop(); continue }
      resolved.push(part)
    }
    target = resolved.join("/")
  } else {
    return null // Node module import
  }

  // Try with extensions
  const extensions = [".tsx", ".ts", ".jsx", ".js"]
  for (const ext of extensions) {
    if (allPaths.includes(target + ext)) return target + ext
  }
  // Try index files
  for (const ext of extensions) {
    if (allPaths.includes(target + "/index" + ext)) return target + "/index" + ext
  }
  // Already has extension
  if (allPaths.includes(target)) return target

  // Try without src/ prefix
  const withoutSrc = target.replace(/^src\//, "")
  for (const ext of extensions) {
    if (allPaths.includes(withoutSrc + ext)) return withoutSrc + ext
  }
  for (const ext of extensions) {
    if (allPaths.includes(withoutSrc + "/index" + ext)) return withoutSrc + "/index" + ext
  }

  return null
}

// ── Main Scanner ─────────────────────────────────────────────────────

/**
 * Scan a ZIP buffer and classify its contents into a ProjectManifest.
 */
export function scanProject(buffer: Buffer): ProjectManifest {
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries()
  const rootPrefix = stripRootPrefix(entries)

  const manifest: ProjectManifest = {
    pages: [],
    components: [],
    layouts: [],
    assets: [],
    styles: [],
    config: [],
    importGraph: new Map(),
  }

  // First pass: collect all file paths and contents
  const allFiles = new Map<string, { content: string; buffer: Buffer }>()

  for (const entry of entries) {
    if (entry.isDirectory) continue

    const fullPath = entry.entryName
    const path = rootPrefix ? fullPath.replace(rootPrefix, "") : fullPath
    if (!path) continue

    // Skip known non-source files
    if (SKIP_PATTERNS.some((p) => p.test(path))) continue

    const data = entry.getData()
    allFiles.set(path, {
      content: data.toString("utf-8"),
      buffer: data,
    })
  }

  const allPaths = Array.from(allFiles.keys())

  // Second pass: classify files
  for (const [path, { content, buffer: fileBuffer }] of allFiles) {
    // Asset files
    if (ASSET_EXTENSIONS.test(path)) {
      manifest.assets.push({
        path,
        buffer: fileBuffer,
        mimeType: getMimeType(path),
      })
      continue
    }

    // Style files
    if (isStyleFile(path)) {
      manifest.styles.push({ path, content, exportName: null, imports: [] })
      continue
    }

    // Config files
    if (isConfigFile(path)) {
      manifest.config.push({ path, content, exportName: null, imports: [] })
      continue
    }

    // Only process source files from here
    if (!path.match(/\.(tsx?|jsx?)$/)) continue

    const exportName = extractExportName(content)
    const imports = parseImports(content)

    // Resolve import paths
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
    // Note: other source files (utilities, hooks, etc.) are tracked in import graph but not classified
  }

  // Build import graph
  for (const [path, { content }] of allFiles) {
    if (!path.match(/\.(tsx?|jsx?)$/)) continue
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

  // Third pass: find components that aren't in components/ but ARE imported by pages or layouts
  const pageImportedFiles = new Set<string>()
  for (const page of manifest.pages) {
    for (const imp of page.imports) {
      if (imp.resolvedPath) pageImportedFiles.add(imp.resolvedPath)
    }
  }
  for (const layout of manifest.layouts) {
    for (const imp of layout.imports) {
      if (imp.resolvedPath) pageImportedFiles.add(imp.resolvedPath)
    }
  }

  const existingComponentPaths = new Set(manifest.components.map((c) => c.path))
  for (const importedPath of pageImportedFiles) {
    if (existingComponentPaths.has(importedPath)) continue
    const fileData = allFiles.get(importedPath)
    if (!fileData) continue
    if (!importedPath.match(/\.(tsx?|jsx?)$/)) continue

    const exportName = extractExportName(fileData.content)
    const imports = parseImports(fileData.content)
    for (const imp of imports) {
      imp.resolvedPath = resolveImportPath(imp.source, importedPath, allPaths)
    }

    manifest.components.push({
      path: importedPath,
      content: fileData.content,
      exportName,
      imports,
    })
    existingComponentPaths.add(importedPath)
  }

  // Transitive: components imported by components imported by pages
  let changed = true
  while (changed) {
    changed = false
    for (const comp of [...manifest.components]) {
      for (const imp of comp.imports) {
        if (!imp.resolvedPath) continue
        if (existingComponentPaths.has(imp.resolvedPath)) continue
        const fileData = allFiles.get(imp.resolvedPath)
        if (!fileData) continue
        if (!imp.resolvedPath.match(/\.(tsx?|jsx?)$/)) continue

        const exportName = extractExportName(fileData.content)
        const imports = parseImports(fileData.content)
        for (const i of imports) {
          i.resolvedPath = resolveImportPath(i.source, imp.resolvedPath, allPaths)
        }

        manifest.components.push({
          path: imp.resolvedPath,
          content: fileData.content,
          exportName,
          imports,
        })
        existingComponentPaths.add(imp.resolvedPath)
        changed = true
      }
    }
  }

  return manifest
}

/**
 * Extract a project title from the ZIP filename or page content.
 */
export function extractProjectTitle(
  zipFilename: string,
  pages: ProjectFile[]
): string {
  // Try first page's metadata
  for (const page of pages) {
    const metadataMatch = page.content.match(/title:\s*["']([^"']+)["']/)
    if (metadataMatch) return metadataMatch[1]

    const h1Match = page.content.match(/<h1[^>]*>([^<]+)<\/h1>/)
    if (h1Match) return h1Match[1].trim()
  }

  // Fall back to filename
  return zipFilename
    .replace(/\.zip$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
