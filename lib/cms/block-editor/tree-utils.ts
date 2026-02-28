import type { Block } from "./types"

/**
 * Generate a unique block ID
 */
export function generateId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Recursively find a block by ID in the tree
 */
export function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block
    if (block.children) {
      const found = findBlockById(block.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Find the parent block of a given block ID
 */
export function findParentBlock(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.children) {
      for (const child of block.children) {
        if (child.id === id) return block
      }
      const found = findParentBlock(block.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Insert a block at a specific position in the tree
 */
export function insertBlock(
  blocks: Block[],
  newBlock: Block,
  parentId: string | null,
  index?: number
): Block[] {
  if (!parentId) {
    const cloned = [...blocks]
    const i = index !== undefined ? index : cloned.length
    cloned.splice(i, 0, { ...newBlock, parentId: null })
    return cloned
  }

  return blocks.map((block) => {
    if (block.id === parentId) {
      const children = [...(block.children || [])]
      const i = index !== undefined ? index : children.length
      children.splice(i, 0, { ...newBlock, parentId })
      return { ...block, children }
    }
    if (block.children) {
      return { ...block, children: insertBlock(block.children, newBlock, parentId, index) }
    }
    return block
  })
}

/**
 * Remove a block by ID from anywhere in the tree
 */
export function removeBlockById(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => {
      if (block.children) {
        return { ...block, children: removeBlockById(block.children, id) }
      }
      return block
    })
}

/**
 * Strip undefined and null values from an object
 */
function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key]
    }
  }
  return result as Partial<T>
}

/**
 * Update a block anywhere in the tree.
 * Only non-null/non-undefined fields from `updates` are merged.
 */
export function updateBlockInTree(
  blocks: Block[],
  id: string,
  updates: Partial<Block>
): Block[] {
  return blocks.map((block) => {
    if (block.id === id) {
      const cleaned = pickDefined(updates as Record<string, unknown>)
      const newAttrs =
        updates.attrs && block.attrs
          ? { ...block.attrs, ...pickDefined(updates.attrs as Record<string, unknown>) }
          : updates.attrs || block.attrs
      // Allow explicit clearing of animation (undefined means "remove")
      const result = {
        ...block,
        ...cleaned,
        attrs: newAttrs,
      } as Block
      if ("animation" in updates && updates.animation === undefined) {
        delete result.animation
      }
      return result
    }
    if (block.children) {
      return { ...block, children: updateBlockInTree(block.children, id, updates) }
    }
    return block
  })
}

/**
 * Move a block to a new position in the tree
 */
export function moveBlockInTree(
  blocks: Block[],
  blockId: string,
  newParentId: string | null,
  targetIndex: number
): Block[] {
  const block = findBlockById(blocks, blockId)
  if (!block) return blocks

  let result = removeBlockById(blocks, blockId)
  result = insertBlock(result, { ...block, parentId: newParentId }, newParentId, targetIndex)
  return result
}

/**
 * Deep clone a block and all children with new IDs
 */
export function duplicateBlockDeep(block: Block): Block {
  const newId = generateId()
  const cloned: Block = {
    ...block,
    id: newId,
    attrs: block.attrs ? { ...block.attrs } : undefined,
  }
  if (block.children) {
    cloned.children = block.children.map((child) => {
      const dup = duplicateBlockDeep(child)
      dup.parentId = newId
      return dup
    })
  }
  return cloned
}

/**
 * Flatten the tree into a single array
 */
export function flattenTree(blocks: Block[]): Block[] {
  const result: Block[] = []
  for (const block of blocks) {
    result.push(block)
    if (block.children) {
      result.push(...flattenTree(block.children))
    }
  }
  return result
}

/**
 * Get the path from root to a block
 */
export function getBlockPath(blocks: Block[], id: string): Block[] {
  for (const block of blocks) {
    if (block.id === id) return [block]
    if (block.children) {
      const path = getBlockPath(block.children, id)
      if (path.length > 0) return [block, ...path]
    }
  }
  return []
}

/**
 * Count total blocks in the tree
 */
export function countBlocks(blocks: Block[]): number {
  return blocks.reduce((count, block) => {
    return count + 1 + (block.children ? countBlocks(block.children) : 0)
  }, 0)
}

/**
 * Set parentId references throughout the tree (after import / AI generation)
 */
export function rehydrateParentIds(blocks: Block[], parentId: string | null = null): Block[] {
  return blocks.map((block) => {
    const updated = { ...block, parentId }
    if (block.children) {
      updated.children = rehydrateParentIds(block.children, block.id)
    }
    return updated
  })
}

/**
 * Strip parentId from blocks for clean export / sending to AI
 */
export function stripParentIds(blocks: Block[]): Omit<Block, "parentId">[] {
  return blocks.map((block) => {
    const { parentId, ...rest } = block
    void parentId
    if (rest.children) {
      rest.children = stripParentIds(rest.children) as Block[]
    }
    return rest
  })
}
