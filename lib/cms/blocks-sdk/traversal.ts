/**
 * Block SDK - Tree Traversal & Manipulation
 *
 * Functions for walking, querying, and transforming block trees.
 */

import type { Block } from "./types"
import type { WalkCallback, TransformCallback, FilterCallback } from "./types"
import { deepClone, generateId } from "./utils"

// ============================================================
// Tree Walking
// ============================================================

/**
 * Walk all blocks in a tree (pre-order traversal)
 *
 * @param callback - Return false to stop traversal
 *
 * @example
 * ```ts
 * walk(blocks, (block, path, parent, index) => {
 *   console.log(`${path}: ${block.tag}`)
 * })
 * ```
 */
export function walk(
  blocks: Block[],
  callback: WalkCallback,
  parent: Block | null = null,
  basePath = "blocks"
): void {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const path = `${basePath}[${i}]`

    const shouldContinue = callback(block, path, parent, i)
    if (shouldContinue === false) return

    if (block.children) {
      walk(block.children, callback, block, `${path}.children`)
    }
  }
}

/**
 * Walk all blocks in reverse (post-order traversal)
 * Useful for safe removal during iteration
 */
export function walkReverse(
  blocks: Block[],
  callback: WalkCallback,
  parent: Block | null = null,
  basePath = "blocks"
): void {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]
    const path = `${basePath}[${i}]`

    if (block.children) {
      walkReverse(block.children, callback, block, `${path}.children`)
    }

    const shouldContinue = callback(block, path, parent, i)
    if (shouldContinue === false) return
  }
}

// ============================================================
// Querying
// ============================================================

/**
 * Find the first block matching a predicate
 *
 * @example
 * ```ts
 * const heading = find(blocks, b => b.tag === 'h1')
 * ```
 */
export function find(blocks: Block[], predicate: FilterCallback): Block | null {
  let result: Block | null = null

  walk(blocks, (block, path, parent) => {
    if (predicate(block, path, parent)) {
      result = block
      return false // Stop traversal
    }
  })

  return result
}

/**
 * Find all blocks matching a predicate
 *
 * @example
 * ```ts
 * const links = findAll(blocks, b => b.tag === 'a')
 * ```
 */
export function findAll(blocks: Block[], predicate: FilterCallback): Block[] {
  const results: Block[] = []

  walk(blocks, (block, path, parent) => {
    if (predicate(block, path, parent)) {
      results.push(block)
    }
  })

  return results
}

/**
 * Find a block by its ID
 */
export function findById(blocks: Block[], id: string): Block | null {
  return find(blocks, block => block.id === id)
}

/**
 * Find all blocks with a specific tag
 */
export function findByTag(blocks: Block[], tag: string): Block[] {
  return findAll(blocks, block => block.tag === tag)
}

/**
 * Find all blocks containing a specific class
 */
export function findByClass(blocks: Block[], className: string): Block[] {
  return findAll(blocks, block => {
    const classes = block.className?.split(/\s+/) || []
    return classes.includes(className)
  })
}

/**
 * Get a block by path string
 *
 * @example
 * ```ts
 * const block = getByPath(blocks, "blocks[0].children[2]")
 * ```
 */
export function getByPath(blocks: Block[], path: string): Block | null {
  const parts = path.match(/\[(\d+)\]/g)
  if (!parts) return null

  let current: Block | Block[] = blocks

  for (const part of parts) {
    const index = parseInt(part.slice(1, -1))

    if (Array.isArray(current)) {
      if (index >= current.length) return null
      current = current[index]
    } else if (current.children) {
      if (index >= current.children.length) return null
      current = current.children[index]
    } else {
      return null
    }
  }

  return Array.isArray(current) ? null : current
}

/**
 * Get the path to a block by ID
 */
export function getPathById(blocks: Block[], id: string): string | null {
  let foundPath: string | null = null

  walk(blocks, (block, path) => {
    if (block.id === id) {
      foundPath = path
      return false
    }
  })

  return foundPath
}

/**
 * Get the parent of a block by ID
 */
export function getParent(blocks: Block[], id: string): Block | null {
  let parent: Block | null = null

  walk(blocks, (block, path, p) => {
    if (block.id === id) {
      parent = p
      return false
    }
  })

  return parent
}

/**
 * Get all ancestors of a block
 */
export function getAncestors(blocks: Block[], id: string): Block[] {
  const ancestors: Block[] = []
  const path = getPathById(blocks, id)
  if (!path) return ancestors

  // Parse path and collect ancestors
  const parts = path.split(".children")
  let current = blocks

  for (let i = 0; i < parts.length - 1; i++) {
    const indexMatch = parts[i].match(/\[(\d+)\]/)
    if (!indexMatch) break

    const index = parseInt(indexMatch[1])
    const block = current[index]
    if (!block) break

    ancestors.push(block)
    current = block.children || []
  }

  return ancestors
}

/**
 * Get all siblings of a block
 */
export function getSiblings(blocks: Block[], id: string): Block[] {
  const parent = getParent(blocks, id)
  const siblings = parent?.children || blocks
  return siblings.filter(b => b.id !== id)
}

// ============================================================
// Transformation
// ============================================================

/**
 * Transform all blocks (returns new tree)
 *
 * @example
 * ```ts
 * const updated = transform(blocks, block => ({
 *   ...block,
 *   className: block.className + ' animate-fadeIn'
 * }))
 * ```
 */
export function transform(blocks: Block[], callback: TransformCallback): Block[] {
  function transformBlock(block: Block, path: string, parent: Block | null): Block {
    const transformed = callback(block, path, parent)

    if (transformed.children) {
      return {
        ...transformed,
        children: transformed.children.map((child, i) =>
          transformBlock(child, `${path}.children[${i}]`, transformed)
        ),
      }
    }

    return transformed
  }

  return blocks.map((block, i) => transformBlock(block, `blocks[${i}]`, null))
}

/**
 * Map over all blocks (like Array.map but for trees)
 */
export function map<T>(blocks: Block[], callback: (block: Block, path: string, parent: Block | null) => T): T[] {
  const results: T[] = []

  walk(blocks, (block, path, parent) => {
    results.push(callback(block, path, parent))
  })

  return results
}

/**
 * Filter blocks (returns new tree with only matching blocks)
 */
export function filter(blocks: Block[], predicate: FilterCallback): Block[] {
  function filterBlock(block: Block, path: string, parent: Block | null): Block | null {
    if (!predicate(block, path, parent)) return null

    if (block.children) {
      const filteredChildren = block.children
        .map((child, i) => filterBlock(child, `${path}.children[${i}]`, block))
        .filter((child): child is Block => child !== null)

      return { ...block, children: filteredChildren }
    }

    return block
  }

  return blocks
    .map((block, i) => filterBlock(block, `blocks[${i}]`, null))
    .filter((block): block is Block => block !== null)
}

// ============================================================
// Mutation Helpers (return new trees)
// ============================================================

/**
 * Insert a block at a specific position
 */
export function insertAt(
  blocks: Block[],
  parentId: string | null,
  index: number,
  newBlock: Block
): Block[] {
  const cloned = deepClone(blocks)

  if (parentId === null) {
    // Insert at root level
    cloned.splice(index, 0, { ...newBlock, id: newBlock.id || generateId() })
    return cloned
  }

  const parent = findById(cloned, parentId)
  if (!parent) return cloned

  if (!parent.children) parent.children = []
  parent.children.splice(index, 0, { ...newBlock, id: newBlock.id || generateId() })

  return cloned
}

/**
 * Remove a block by ID
 */
export function removeById(blocks: Block[], id: string): Block[] {
  return filter(blocks, block => block.id !== id)
}

/**
 * Remove a block at a specific path
 */
export function removeAt(blocks: Block[], path: string): Block[] {
  const cloned = deepClone(blocks)

  const lastBracket = path.lastIndexOf("[")
  const parentPath = path.slice(0, lastBracket)
  const indexMatch = path.slice(lastBracket).match(/\[(\d+)\]/)
  if (!indexMatch) return cloned

  const index = parseInt(indexMatch[1])

  if (parentPath === "blocks") {
    cloned.splice(index, 1)
  } else {
    const parent = getByPath(cloned, parentPath)
    if (parent?.children) {
      parent.children.splice(index, 1)
    }
  }

  return cloned
}

/**
 * Move a block to a new position
 */
export function moveTo(
  blocks: Block[],
  blockId: string,
  newParentId: string | null,
  newIndex: number
): Block[] {
  const block = findById(blocks, blockId)
  if (!block) return blocks

  // Remove from current position
  let updated = removeById(blocks, blockId)

  // Insert at new position
  updated = insertAt(updated, newParentId, newIndex, block)

  return updated
}

/**
 * Replace a block by ID
 */
export function replaceById(blocks: Block[], id: string, newBlock: Block): Block[] {
  return transform(blocks, block => {
    if (block.id === id) return { ...newBlock, id }
    return block
  })
}

/**
 * Update a block's properties by ID
 */
export function updateById(blocks: Block[], id: string, updates: Partial<Block>): Block[] {
  return transform(blocks, block => {
    if (block.id === id) return { ...block, ...updates }
    return block
  })
}

/**
 * Add a class to a block by ID
 */
export function addClassById(blocks: Block[], id: string, className: string): Block[] {
  return transform(blocks, block => {
    if (block.id === id) {
      const existing = block.className?.split(/\s+/).filter(Boolean) || []
      if (!existing.includes(className)) {
        return { ...block, className: [...existing, className].join(" ") }
      }
    }
    return block
  })
}

/**
 * Remove a class from a block by ID
 */
export function removeClassById(blocks: Block[], id: string, className: string): Block[] {
  return transform(blocks, block => {
    if (block.id === id) {
      const existing = block.className?.split(/\s+/).filter(Boolean) || []
      return { ...block, className: existing.filter(c => c !== className).join(" ") }
    }
    return block
  })
}
