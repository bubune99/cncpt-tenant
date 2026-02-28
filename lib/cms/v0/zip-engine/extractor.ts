/**
 * ZIP Extractor
 *
 * Extracts and catalogs files from a v0.dev ZIP export.
 * Identifies page, layout, CSS, and section component files.
 */

import AdmZip from "adm-zip";

export interface ExtractedFile {
  path: string;
  content: string;
}

export interface ExtractedProject {
  pageFile: ExtractedFile | null;
  layoutFile: ExtractedFile | null;
  globalsCss: ExtractedFile | null;
  sectionFiles: ExtractedFile[];
  assets: string[];
}

// Files/dirs to skip entirely
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
  /next\.config\./,
  /tailwind\.config\./,
  /postcss\.config\./,
  /\.eslintrc/,
  /eslint\.config/,
  /README\.md$/i,
  /\.env/,
  /node_modules\//,
];

// Component paths to skip (shadcn UI primitives, etc.)
const COMPONENT_SKIP_PATTERNS = [
  /\/ui\//,             // components/ui/ — shadcn primitives
  /theme-provider/i,
  /providers?\.(tsx?|jsx?)$/i,
  /layout\.(tsx?|jsx?)$/i,  // Skip layout files in components/
];

/**
 * Strip the common root directory prefix from v0 ZIP entries.
 * v0 ZIPs often have a top-level folder like "wellness-website-redesign/"
 */
function stripRootPrefix(entries: AdmZip.IZipEntry[]): string {
  const paths = entries
    .filter((e) => !e.isDirectory)
    .map((e) => e.entryName);

  if (paths.length === 0) return "";

  // Find common prefix
  const firstParts = paths[0].split("/");
  let commonDepth = 0;

  for (let i = 0; i < firstParts.length - 1; i++) {
    const prefix = firstParts.slice(0, i + 1).join("/") + "/";
    if (paths.every((p) => p.startsWith(prefix))) {
      commonDepth = i + 1;
    } else {
      break;
    }
  }

  return commonDepth > 0 ? firstParts.slice(0, commonDepth).join("/") + "/" : "";
}

/**
 * Extract and catalog files from a v0 ZIP buffer.
 */
export function extractZip(buffer: Buffer): ExtractedProject {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const rootPrefix = stripRootPrefix(entries);

  const project: ExtractedProject = {
    pageFile: null,
    layoutFile: null,
    globalsCss: null,
    sectionFiles: [],
    assets: [],
  };

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const fullPath = entry.entryName;

    // Strip root prefix to normalize paths
    const path = rootPrefix ? fullPath.replace(rootPrefix, "") : fullPath;

    if (!path) continue;

    // Skip known non-source files
    if (SKIP_PATTERNS.some((p) => p.test(path))) continue;

    // Asset files (images, fonts, etc.)
    if (path.startsWith("public/")) {
      project.assets.push(path);
      continue;
    }

    // Skip non-source files
    if (!path.match(/\.(tsx?|jsx?|css)$/)) continue;

    const content = entry.getData().toString("utf-8");

    // Identify special files
    if (isPageFile(path)) {
      project.pageFile = { path, content };
      continue;
    }

    if (isLayoutFile(path)) {
      project.layoutFile = { path, content };
      continue;
    }

    if (isGlobalsCss(path)) {
      project.globalsCss = { path, content };
      continue;
    }

    // Section component files
    if (isSectionComponent(path)) {
      project.sectionFiles.push({ path, content });
      continue;
    }
  }

  return project;
}

function isPageFile(path: string): boolean {
  return /^(app\/)?page\.(tsx?|jsx?)$/.test(path) ||
    /^(src\/app\/)?page\.(tsx?|jsx?)$/.test(path);
}

function isLayoutFile(path: string): boolean {
  return /^(app\/)?layout\.(tsx?|jsx?)$/.test(path) ||
    /^(src\/app\/)?layout\.(tsx?|jsx?)$/.test(path);
}

function isGlobalsCss(path: string): boolean {
  return /^(app\/|styles\/|src\/app\/|src\/styles\/)?globals?\.css$/.test(path);
}

function isSectionComponent(path: string): boolean {
  // Must be a TSX/JSX file
  if (!path.match(/\.(tsx?|jsx?)$/)) return false;

  // Must be in components/ or sections/ directory (or root-level component)
  const isComponent =
    path.startsWith("components/") ||
    path.startsWith("src/components/") ||
    path.startsWith("sections/") ||
    path.startsWith("src/sections/");

  if (!isComponent) return false;

  // Skip UI primitives, theme providers, etc.
  if (COMPONENT_SKIP_PATTERNS.some((p) => p.test(path))) return false;

  return true;
}

/**
 * Extract the project title from the ZIP filename or page content.
 */
export function extractProjectTitle(
  zipFilename: string,
  pageContent: string | null
): string {
  // Try to get from page metadata
  if (pageContent) {
    // Look for title in metadata export
    const metadataMatch = pageContent.match(
      /title:\s*["']([^"']+)["']/
    );
    if (metadataMatch) return metadataMatch[1];

    // Look for h1 text content
    const h1Match = pageContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) return h1Match[1].trim();
  }

  // Fall back to filename
  return zipFilename
    .replace(/\.zip$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
