'use client'

import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { Block } from '@/lib/cms/block-editor/types'
import { BlockRenderer } from '@/components/cms/block-editor/block-renderer'

/**
 * Apply overrides from the reference block onto the partial's block tree.
 * Only textContent, className, and attrs are overridable.
 * Orphaned overrides (block IDs that no longer exist in the partial) are silently ignored.
 */
function applyOverrides(
  blocks: Block[],
  overrides: Record<string, Partial<Pick<Block, 'textContent' | 'className' | 'attrs'>>>
): Block[] {
  return blocks.map((block) => {
    const override = overrides[block.id]
    const merged = override
      ? {
          ...block,
          ...(override.textContent !== undefined ? { textContent: override.textContent } : {}),
          ...(override.className !== undefined ? { className: override.className } : {}),
          ...(override.attrs !== undefined ? { attrs: { ...block.attrs, ...override.attrs } } : {}),
        }
      : block

    if (merged.children && merged.children.length > 0) {
      return { ...merged, children: applyOverrides(merged.children, overrides) }
    }

    return merged
  })
}

export default function PartialReference({ block, data }: SmartBlockProps) {
  const result = data.blocks as { blocks: Block[]; error?: string } | undefined

  if (!result || !result.blocks || result.blocks.length === 0) {
    if (process.env.NODE_ENV === 'development' && result?.error) {
      return (
        <div className="p-4 border border-dashed border-yellow-500/30 rounded text-sm text-yellow-600">
          Partial error: {result.error}
        </div>
      )
    }
    return null
  }

  let resolvedBlocks = result.blocks

  // Apply per-block overrides if present
  if (block.partialOverrides && Object.keys(block.partialOverrides).length > 0) {
    resolvedBlocks = applyOverrides(resolvedBlocks, block.partialOverrides)
  }

  const renderChildren = (children: Block[]) => {
    return children.map((child) => (
      <BlockRenderer
        key={child.id}
        block={child}
        renderChildren={renderChildren}
        isPreview
      />
    ))
  }

  return (
    <>
      {resolvedBlocks.map((b) => (
        <BlockRenderer
          key={b.id}
          block={b}
          renderChildren={renderChildren}
          isPreview
        />
      ))}
    </>
  )
}
