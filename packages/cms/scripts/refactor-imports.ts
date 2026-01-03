/**
 * Refactor @/ imports to relative imports
 *
 * This makes the CMS work both as:
 * 1. Standalone Next.js app
 * 2. Importable npm package
 *
 * Run with: npx tsx scripts/refactor-imports.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.join(__dirname, '..', 'src')

function getAllFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      getAllFiles(fullPath, files)
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

function getRelativePath(fromFile: string, toPath: string): string {
  const fromDir = path.dirname(fromFile)
  let relative = path.relative(fromDir, toPath)

  // Ensure it starts with ./ or ../
  if (!relative.startsWith('.')) {
    relative = './' + relative
  }

  // Convert Windows backslashes to forward slashes
  relative = relative.replace(/\\/g, '/')

  return relative
}

function refactorFile(filePath: string): { changed: boolean; count: number } {
  let content = fs.readFileSync(filePath, 'utf-8')
  const originalContent = content
  let count = 0

  // Match imports like: from '@/lib/utils' or from "@/lib/utils"
  const importRegex = /from\s+['"]@\/([^'"]+)['"]/g

  content = content.replace(importRegex, (match, importPath) => {
    count++
    const absoluteImportPath = path.join(SRC_DIR, importPath)
    const relativePath = getRelativePath(filePath, absoluteImportPath)
    return `from '${relativePath}'`
  })

  // Also handle dynamic imports: import('@/lib/utils')
  const dynamicImportRegex = /import\s*\(\s*['"]@\/([^'"]+)['"]\s*\)/g

  content = content.replace(dynamicImportRegex, (match, importPath) => {
    count++
    const absoluteImportPath = path.join(SRC_DIR, importPath)
    const relativePath = getRelativePath(filePath, absoluteImportPath)
    return `import('${relativePath}')`
  })

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { changed: true, count }
  }

  return { changed: false, count: 0 }
}

function main() {
  console.log('Refactoring @/ imports to relative imports...\n')

  const files = getAllFiles(SRC_DIR)
  let totalChanged = 0
  let totalImports = 0

  for (const file of files) {
    const { changed, count } = refactorFile(file)
    if (changed) {
      const relativePath = path.relative(SRC_DIR, file)
      console.log(`  ✓ ${relativePath} (${count} imports)`)
      totalChanged++
      totalImports += count
    }
  }

  console.log(`\n✅ Refactored ${totalImports} imports in ${totalChanged} files`)
  console.log('\nNext steps:')
  console.log('1. Remove "paths" from tsconfig.json (optional, for consistency)')
  console.log('2. Test: pnpm run dev')
  console.log('3. Build: pnpm run build')
}

main()
