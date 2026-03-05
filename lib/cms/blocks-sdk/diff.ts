/**
 * Block SDK - Diff & Patch
 *
 * Compare block trees and apply changes for sync operations.
 */

import type { Block } from "./types"
import type { DiffResult, DiffEntry, ConflictEntry, DiffOptions, PatchOptions } from "./types"
import { deepClone, blocksEqual } from "./utils"
import { walk, findById, replaceById, insertAt, removeById } from "./traversal"

/**
 * Compare two block trees and return differences
 *
 * @example
 * ```ts
 * const changes = diff(localBlocks, remoteBlocks)
 * if (changes.hasConflicts) {
 *   // Handle conflicts
 * }
 * ```
 */
export function diff(
  local: Block[],
  remote: Block[],
  options: DiffOptions = {}
): DiffResult {
  const opts: Required<DiffOptions> = {
    ignoreWhitespace: options.ignoreWhitespace ?? true,
    ignoreClassOrder: options.ignoreClassOrder ?? true,
    ignoreIds: options.ignoreIds ?? false,
  }

  const result: DiffResult = {
    hasChanges: false,
    hasConflicts: false,
    added: [],
    removed: [],
    modified: [],
    moved: [],
    conflicts: [],
  }

  // Build maps for O(1) lookup
  const localById = new Map<string, { block: Block; path: string }>()
  const remoteById = new Map<string, { block: Block; path: string }>()

  walk(local, (block, path) => {
    localById.set(block.id, { block, path })
  })

  walk(remote, (block, path) => {
    remoteById.set(block.id, { block, path })
  })

  // Find added blocks (in remote but not local)
  for (const [id, { block, path }] of remoteById) {
    if (!localById.has(id)) {
      result.added.push({ blockId: id, block, path })
    }
  }

  // Find removed blocks (in local but not remote)
  for (const [id, { block, path }] of localById) {
    if (!remoteById.has(id)) {
      result.removed.push({ blockId: id, block, path })
    }
  }

  // Find modified and moved blocks
  for (const [id, localEntry] of localById) {
    const remoteEntry = remoteById.get(id)
    if (!remoteEntry) continue

    const localBlock = localEntry.block
    const remoteBlock = remoteEntry.block

    // Check if moved (different path)
    if (localEntry.path !== remoteEntry.path) {
      result.moved.push({
        blockId: id,
        block: remoteBlock,
        path: remoteEntry.path,
      })
    }

    // Check if modified
    if (!blocksAreEqual(localBlock, remoteBlock, opts)) {
      // Determine if this is a conflict (both changed from common ancestor)
      // For simplicity, we'll treat any modification as potential conflict
      const contentChanged = !contentEqual(localBlock, remoteBlock, opts)
      const structureChanged = !structureEqual(localBlock, remoteBlock)

      if (contentChanged || structureChanged) {
        result.modified.push({
          blockId: id,
          block: remoteBlock,
          path: remoteEntry.path,
        })

        // Mark as conflict if both content and structure changed
        if (contentChanged && structureChanged) {
          result.conflicts.push({
            blockId: id,
            local: localBlock,
            remote: remoteBlock,
            path: remoteEntry.path,
            type: "both",
          })
        } else if (contentChanged) {
          result.conflicts.push({
            blockId: id,
            local: localBlock,
            remote: remoteBlock,
            path: remoteEntry.path,
            type: "content",
          })
        }
      }
    }
  }

  result.hasChanges =
    result.added.length > 0 ||
    result.removed.length > 0 ||
    result.modified.length > 0 ||
    result.moved.length > 0

  result.hasConflicts = result.conflicts.length > 0

  return result
}

/**
 * Apply diff changes to a block tree
 *
 * @example
 * ```ts
 * const merged = patch(localBlocks, diffResult, {
 *   strategy: 'prefer-remote',
 * })
 * ```
 */
export function patch(
  blocks: Block[],
  changes: DiffResult,
  options: PatchOptions = {}
): Block[] {
  const strategy = options.strategy ?? "prefer-remote"
  let result = deepClone(blocks)

  // Apply removals first
  for (const entry of changes.removed) {
    result = removeById(result, entry.blockId)
  }

  // Apply additions
  for (const entry of changes.added) {
    // Parse path to find parent and index
    const { parentId, index } = parsePathForInsert(entry.path)
    result = insertAt(result, parentId, index, entry.block)
  }

  // Apply modifications (handle conflicts based on strategy)
  for (const entry of changes.modified) {
    const conflict = changes.conflicts.find(c => c.blockId === entry.blockId)

    if (conflict) {
      // Handle conflict
      let resolvedBlock: Block

      if (options.onConflict) {
        resolvedBlock = options.onConflict(conflict.local, conflict.remote)
      } else if (strategy === "prefer-remote") {
        resolvedBlock = conflict.remote
      } else if (strategy === "prefer-local") {
        resolvedBlock = conflict.local
      } else {
        // Manual strategy - skip conflicts (they need explicit resolution)
        continue
      }

      result = replaceById(result, entry.blockId, resolvedBlock)
    } else {
      // No conflict, apply remote changes
      result = replaceById(result, entry.blockId, entry.block)
    }
  }

  return result
}

/**
 * Create a three-way merge (with common ancestor)
 */
export function merge(
  base: Block[],
  local: Block[],
  remote: Block[]
): { blocks: Block[]; conflicts: ConflictEntry[] } {
  const localChanges = diff(base, local)
  const remoteChanges = diff(base, remote)

  // Start with base
  let result = deepClone(base)
  const conflicts: ConflictEntry[] = []

  // Apply non-conflicting local changes
  for (const entry of localChanges.added) {
    const conflictingRemote = remoteChanges.removed.find(r => r.blockId === entry.blockId)
    if (!conflictingRemote) {
      const { parentId, index } = parsePathForInsert(entry.path)
      result = insertAt(result, parentId, index, entry.block)
    }
  }

  // Apply non-conflicting remote changes
  for (const entry of remoteChanges.added) {
    const conflictingLocal = localChanges.removed.find(l => l.blockId === entry.blockId)
    if (!conflictingLocal) {
      const { parentId, index } = parsePathForInsert(entry.path)
      result = insertAt(result, parentId, index, entry.block)
    }
  }

  // Apply removals (only if not modified on the other side)
  for (const entry of localChanges.removed) {
    const modifiedInRemote = remoteChanges.modified.find(m => m.blockId === entry.blockId)
    if (!modifiedInRemote) {
      result = removeById(result, entry.blockId)
    } else {
      conflicts.push({
        blockId: entry.blockId,
        local: entry.block,
        remote: modifiedInRemote.block,
        path: entry.path,
        type: "structure",
      })
    }
  }

  for (const entry of remoteChanges.removed) {
    const modifiedInLocal = localChanges.modified.find(m => m.blockId === entry.blockId)
    if (!modifiedInLocal) {
      result = removeById(result, entry.blockId)
    } else {
      conflicts.push({
        blockId: entry.blockId,
        local: modifiedInLocal.block,
        remote: entry.block,
        path: entry.path,
        type: "structure",
      })
    }
  }

  // Handle modifications
  for (const localMod of localChanges.modified) {
    const remoteMod = remoteChanges.modified.find(r => r.blockId === localMod.blockId)

    if (remoteMod) {
      // Both modified - conflict
      conflicts.push({
        blockId: localMod.blockId,
        local: localMod.block,
        remote: remoteMod.block,
        path: localMod.path,
        type: "content",
      })
    } else {
      // Only local modified - apply
      result = replaceById(result, localMod.blockId, localMod.block)
    }
  }

  for (const remoteMod of remoteChanges.modified) {
    const localMod = localChanges.modified.find(l => l.blockId === remoteMod.blockId)

    if (!localMod) {
      // Only remote modified - apply
      result = replaceById(result, remoteMod.blockId, remoteMod.block)
    }
    // If both modified, conflict was already added above
  }

  return { blocks: result, conflicts }
}

// ============================================================
// Helper Functions
// ============================================================

function blocksAreEqual(a: Block, b: Block, opts: Required<DiffOptions>): boolean {
  return contentEqual(a, b, opts) && structureEqual(a, b)
}

function contentEqual(a: Block, b: Block, opts: Required<DiffOptions>): boolean {
  // Compare tag
  if (a.tag !== b.tag) return false

  // Compare className
  let aClass = a.className || ""
  let bClass = b.className || ""

  if (opts.ignoreClassOrder) {
    aClass = aClass.split(/\s+/).sort().join(" ")
    bClass = bClass.split(/\s+/).sort().join(" ")
  }
  if (aClass !== bClass) return false

  // Compare textContent
  let aText = a.textContent || ""
  let bText = b.textContent || ""

  if (opts.ignoreWhitespace) {
    aText = aText.trim().replace(/\s+/g, " ")
    bText = bText.trim().replace(/\s+/g, " ")
  }
  if (aText !== bText) return false

  // Compare attrs
  const aAttrs = JSON.stringify(a.attrs || {})
  const bAttrs = JSON.stringify(b.attrs || {})
  if (aAttrs !== bAttrs) return false

  return true
}

function structureEqual(a: Block, b: Block): boolean {
  const aChildCount = a.children?.length || 0
  const bChildCount = b.children?.length || 0

  if (aChildCount !== bChildCount) return false

  if (a.children && b.children) {
    for (let i = 0; i < a.children.length; i++) {
      if (a.children[i].id !== b.children[i].id) return false
    }
  }

  return true
}

function parsePathForInsert(path: string): { parentId: string | null; index: number } {
  // Example paths: "blocks[0]", "blocks[0].children[1]", etc.
  const parts = path.split(".children")

  if (parts.length === 1) {
    // Root level: "blocks[0]"
    const indexMatch = path.match(/\[(\d+)\]/)
    return { parentId: null, index: indexMatch ? parseInt(indexMatch[1]) : 0 }
  }

  // Has parent: "blocks[0].children[1]"
  const lastPart = parts[parts.length - 1]
  const indexMatch = lastPart.match(/\[(\d+)\]/)
  const index = indexMatch ? parseInt(indexMatch[1]) : 0

  // Extract parent ID from parent path (we'd need the actual blocks to do this properly)
  // For now, return a simplified version
  return { parentId: null, index }
}

/**
 * Format diff result as human-readable summary
 */
export function formatDiffSummary(result: DiffResult): string {
  const lines: string[] = []

  if (!result.hasChanges) {
    return "No changes detected."
  }

  if (result.added.length > 0) {
    lines.push(`+ ${result.added.length} block(s) added`)
  }
  if (result.removed.length > 0) {
    lines.push(`- ${result.removed.length} block(s) removed`)
  }
  if (result.modified.length > 0) {
    lines.push(`~ ${result.modified.length} block(s) modified`)
  }
  if (result.moved.length > 0) {
    lines.push(`> ${result.moved.length} block(s) moved`)
  }
  if (result.conflicts.length > 0) {
    lines.push(`! ${result.conflicts.length} conflict(s) detected`)
  }

  return lines.join("\n")
}
