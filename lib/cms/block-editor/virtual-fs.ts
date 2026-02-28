/**
 * Virtual File System for the Code Editor
 *
 * Projects pages and templates into a file tree structure that the code editor
 * can display and navigate. Uses the CMS API for pages and localStorage for
 * custom templates (matching storage.ts patterns).
 */

import { getCustomTemplates, getCustomTemplate, saveCustomTemplate, slugify } from "./storage"
import type { SavedPage, CustomTemplate } from "./storage"
import { serializeBlocksToJSX, parseJSXToBlocks } from "./serialization"
import { BLOCK_TEMPLATES, BLOCK_CATEGORIES } from "./block-templates"
import type { BlockTemplate } from "./types"
import { generateId } from "./tree-utils"

// ============================================================
// Types
// ============================================================

export interface VirtualFile {
  path: string
  content: string
  language: "tsx"
  source: {
    type: "page" | "component" | "layout" | "template"
    id: string
    title: string
  }
  isReadOnly: boolean
  isDirty: boolean
  lastModified: string
}

export interface VirtualDirectory {
  name: string
  path: string
  children: (VirtualFile | VirtualDirectory)[]
}

export type NewFileType = "page" | "component"

// ============================================================
// File Tree Building
// ============================================================

/**
 * Build a virtual file tree from saved pages, templates, and built-in components.
 * Pages come from the API (passed in), templates from localStorage, blocks are built-in.
 */
export function buildFileTree(pages: SavedPage[]): VirtualDirectory {
  const customTemplates = getCustomTemplates()

  const root: VirtualDirectory = {
    name: "src",
    path: "src",
    children: [],
  }

  const pagesDir: VirtualDirectory = {
    name: "pages",
    path: "src/pages",
    children: pages.map((page) => pageToFile(page)),
  }

  const componentsDir: VirtualDirectory = {
    name: "components",
    path: "src/components",
    children: customTemplates.map((template) => customTemplateToFile(template)),
  }

  const blocksDir: VirtualDirectory = {
    name: "blocks",
    path: "src/blocks",
    children: BLOCK_CATEGORIES.map((category) => ({
      name: category.id,
      path: `src/blocks/${category.id}`,
      children: BLOCK_TEMPLATES
        .filter((t) => t.category === category.id)
        .map((template) => builtInTemplateToFile(template, category.id)),
    })),
  }

  const themeDir: VirtualDirectory = {
    name: "theme",
    path: "src/theme",
    children: [
      {
        path: "src/theme/tokens.ts",
        content: `// Design tokens - coming soon\nexport const tokens = {}`,
        language: "tsx",
        source: { type: "layout", id: "theme-tokens", title: "Design Tokens" },
        isReadOnly: true,
        isDirty: false,
        lastModified: new Date().toISOString(),
      },
    ],
  }

  root.children = [pagesDir, componentsDir, blocksDir, themeDir]
  return root
}

function pageToFile(page: SavedPage): VirtualFile {
  return {
    path: `src/pages/${page.slug ? page.slug.replace(/^\//, "") : slugify(page.title)}.tsx`,
    content: serializeBlocksToJSX(page.blocks, { componentName: toPascalCase(page.title) }),
    language: "tsx",
    source: { type: "page", id: page.id, title: page.title },
    isReadOnly: false,
    isDirty: false,
    lastModified: page.updatedAt,
  }
}

function customTemplateToFile(template: CustomTemplate): VirtualFile {
  return {
    path: `src/components/${slugify(template.name) || template.id}.tsx`,
    content: serializeBlocksToJSX(template.blocks, { componentName: toPascalCase(template.name) }),
    language: "tsx",
    source: { type: "template", id: template.id, title: template.name },
    isReadOnly: false,
    isDirty: false,
    lastModified: template.createdAt,
  }
}

function builtInTemplateToFile(template: BlockTemplate, category: string): VirtualFile {
  const blockFromTemplate = {
    id: `template-${slugify(template.label)}`,
    tag: template.tag,
    className: template.defaultClassName || "",
    textContent: template.defaultTextContent,
    attrs: template.defaultAttrs,
    children: template.isContainer ? [] : undefined,
    commerce: template.defaultCommerce,
    componentName: template.componentName,
    frameworkRequirement: template.frameworkRequirement,
  }

  const componentName = toPascalCase(template.label)
  const jsx = `// Built-in ${template.label} component
// Category: ${category}
${template.description ? `// ${template.description}\n` : ""}export function ${componentName}() {
  return (
${serializeBlocksToJSX([blockFromTemplate]).split("\n").map(line => "    " + line).join("\n")}
  )
}`

  return {
    path: `src/blocks/${category}/${slugify(template.label)}.tsx`,
    content: jsx,
    language: "tsx",
    source: { type: "component", id: `builtin-${slugify(template.label)}`, title: template.label },
    isReadOnly: true,
    isDirty: false,
    lastModified: new Date().toISOString(),
  }
}

function toPascalCase(str: string): string {
  return str
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

// ============================================================
// File Operations
// ============================================================

export function getFileContent(path: string, pages: SavedPage[]): VirtualFile | null {
  const tree = buildFileTree(pages)
  return findFileInTree(tree, path)
}

function findFileInTree(node: VirtualDirectory | VirtualFile, targetPath: string): VirtualFile | null {
  if ("content" in node) {
    return node.path === targetPath ? node : null
  }
  for (const child of node.children) {
    const found = findFileInTree(child, targetPath)
    if (found) return found
  }
  return null
}

/**
 * Save file content back to storage.
 * Pages are saved via the provided callback, templates to localStorage.
 */
export function saveFileContent(
  path: string,
  jsx: string,
  pages: SavedPage[],
  savePage: (page: SavedPage) => Promise<SavedPage | null>,
): { success: boolean; errors: string[] } {
  const file = getFileContent(path, pages)
  if (!file) return { success: false, errors: [`File not found: ${path}`] }
  if (file.isReadOnly) return { success: false, errors: [`File is read-only: ${path}`] }

  const { blocks, errors } = parseJSXToBlocks(jsx)
  if (errors.length > 0 && blocks.length === 0) return { success: false, errors }

  if (file.source.type === "template") {
    const template = getCustomTemplate(file.source.id)
    if (template) {
      saveCustomTemplate({ ...template, blocks, createdAt: new Date().toISOString() })
      return { success: true, errors }
    }
    return { success: false, errors: [`Template not found: ${file.source.id}`] }
  }

  if (file.source.type === "component") {
    return { success: false, errors: ["Built-in components are read-only"] }
  }

  return { success: false, errors: [`Unknown file type: ${file.source.type}`] }
}

export function flattenFileTree(tree: VirtualDirectory): VirtualFile[] {
  const files: VirtualFile[] = []
  function traverse(node: VirtualDirectory | VirtualFile) {
    if ("content" in node) { files.push(node) }
    else { for (const child of node.children) traverse(child) }
  }
  traverse(tree)
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

export function getFileBySourceId(sourceId: string, pages: SavedPage[]): VirtualFile | null {
  const files = flattenFileTree(buildFileTree(pages))
  return files.find((f) => f.source.id === sourceId) || null
}

export function isDirectory(node: VirtualDirectory | VirtualFile): node is VirtualDirectory {
  return "children" in node
}

// ============================================================
// File Creation
// ============================================================

export function getAllowedFileTypes(dirPath: string): NewFileType[] {
  if (dirPath === "src/pages" || dirPath.startsWith("src/pages/")) return ["page"]
  if (dirPath === "src/components" || dirPath.startsWith("src/components/")) return ["component"]
  if (dirPath === "src") return ["page", "component"]
  return []
}

export function isWritableDirectory(dirPath: string): boolean {
  return (
    dirPath === "src" ||
    dirPath === "src/pages" ||
    dirPath === "src/components" ||
    dirPath.startsWith("src/pages/") ||
    dirPath.startsWith("src/components/")
  )
}
