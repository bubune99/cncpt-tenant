/**
 * Block SDK Utilities
 */

import type { Block } from "./types"

// Re-export tree utils from block-editor
export { generateId, rehydrateParentIds, stripParentIds } from "@/lib/cms/block-editor/tree-utils"

/**
 * Deep clone a block tree
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Normalize blocks - ensure all required fields exist
 */
export function normalizeBlocks(blocks: Block[]): Block[] {
  return blocks.map(normalizeBlock)
}

function normalizeBlock(block: Partial<Block> & { tag: Block["tag"] }): Block {
  return {
    id: block.id || generateId(),
    tag: block.tag,
    className: block.className || "",
    textContent: block.textContent,
    attrs: block.attrs,
    children: block.children ? block.children.map(normalizeBlock as (b: Block) => Block) : undefined,
    parentId: block.parentId,
    animation: block.animation,
    background: block.background,
    label: block.label,
    hidden: block.hidden,
    locked: block.locked,
    commerce: block.commerce,
    componentName: block.componentName,
    frameworkRequirement: block.frameworkRequirement,
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `block_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Count total blocks in a tree
 */
export function countBlocks(blocks: Block[]): number {
  let count = 0
  for (const block of blocks) {
    count++
    if (block.children) {
      count += countBlocks(block.children)
    }
  }
  return count
}

/**
 * Get the depth of a block tree
 */
export function getTreeDepth(blocks: Block[]): number {
  if (blocks.length === 0) return 0
  let maxDepth = 1
  for (const block of blocks) {
    if (block.children && block.children.length > 0) {
      maxDepth = Math.max(maxDepth, 1 + getTreeDepth(block.children))
    }
  }
  return maxDepth
}

/**
 * Flatten a block tree to a single array (pre-order traversal)
 */
export function flattenBlocks(blocks: Block[]): Block[] {
  const result: Block[] = []
  for (const block of blocks) {
    result.push(block)
    if (block.children) {
      result.push(...flattenBlocks(block.children))
    }
  }
  return result
}

/**
 * Get all unique class names used in a block tree
 */
export function getAllClassNames(blocks: Block[]): string[] {
  const classes = new Set<string>()
  for (const block of flattenBlocks(blocks)) {
    if (block.className) {
      block.className.split(/\s+/).forEach(c => {
        if (c) classes.add(c)
      })
    }
  }
  return Array.from(classes).sort()
}

/**
 * Get all unique tags used in a block tree
 */
export function getAllTags(blocks: Block[]): string[] {
  const tags = new Set<string>()
  for (const block of flattenBlocks(blocks)) {
    tags.add(block.tag)
  }
  return Array.from(tags).sort()
}

/**
 * Check if two blocks are structurally equal (ignoring ids)
 */
export function blocksEqual(a: Block, b: Block, ignoreIds = true): boolean {
  if (a.tag !== b.tag) return false
  if (a.className !== b.className) return false
  if (a.textContent !== b.textContent) return false
  if (JSON.stringify(a.attrs) !== JSON.stringify(b.attrs)) return false

  const aChildren = a.children || []
  const bChildren = b.children || []
  if (aChildren.length !== bChildren.length) return false

  for (let i = 0; i < aChildren.length; i++) {
    if (!blocksEqual(aChildren[i], bChildren[i], ignoreIds)) return false
  }

  if (!ignoreIds && a.id !== b.id) return false

  return true
}

/**
 * Merge class names, deduplicating and sorting
 */
export function mergeClassNames(...classNames: (string | undefined)[]): string {
  const classes = new Set<string>()
  for (const cn of classNames) {
    if (cn) {
      cn.split(/\s+/).forEach(c => {
        if (c) classes.add(c)
      })
    }
  }
  return Array.from(classes).join(" ")
}

/**
 * Parse a Tailwind class string into categories
 */
export function parseClassNames(className: string): {
  layout: string[]
  spacing: string[]
  typography: string[]
  colors: string[]
  effects: string[]
  responsive: string[]
  other: string[]
} {
  const result = {
    layout: [] as string[],
    spacing: [] as string[],
    typography: [] as string[],
    colors: [] as string[],
    effects: [] as string[],
    responsive: [] as string[],
    other: [] as string[],
  }

  const classes = className.split(/\s+/).filter(Boolean)

  for (const c of classes) {
    // Responsive prefixes
    if (/^(sm:|md:|lg:|xl:|2xl:)/.test(c)) {
      result.responsive.push(c)
    }
    // Layout
    else if (/^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|w-|h-|min-|max-|aspect-)/.test(c)) {
      result.layout.push(c)
    }
    // Spacing
    else if (/^(p-|px-|py-|pt-|pr-|pb-|pl-|m-|mx-|my-|mt-|mr-|mb-|ml-|gap-|space-)/.test(c)) {
      result.spacing.push(c)
    }
    // Typography
    else if (/^(text-|font-|leading-|tracking-|uppercase|lowercase|capitalize|truncate)/.test(c)) {
      result.typography.push(c)
    }
    // Colors
    else if (/^(bg-|border-|text-|from-|to-|via-)/.test(c)) {
      result.colors.push(c)
    }
    // Effects
    else if (/^(shadow|rounded|opacity|blur|backdrop|transition|transform|animate|hover:|focus:|active:)/.test(c)) {
      result.effects.push(c)
    }
    else {
      result.other.push(c)
    }
  }

  return result
}
