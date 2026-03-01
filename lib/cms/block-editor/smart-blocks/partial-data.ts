/**
 * Partial Data Fetcher
 *
 * Server-side Prisma query that resolves a Partial's blocks by ID.
 * Includes circular reference and depth guards.
 * Registered as a named fetcher in the data resolver.
 */

import { prisma } from '@/lib/cms/db'
import { registerFetcher } from './data-resolver'
import type { Block } from '../types'

const MAX_DEPTH = 3

interface PartialFetchArgs extends Record<string, unknown> {
  partialId?: string
  _visited?: string[]
  _depth?: number
}

async function fetchPartialBlocks(args: PartialFetchArgs): Promise<{ blocks: Block[]; error?: string }> {
  const { partialId, _visited = [], _depth = 0 } = args

  if (!partialId) {
    return { blocks: [], error: 'No partialId provided' }
  }

  // Circular reference guard
  if (_visited.includes(partialId)) {
    return { blocks: [], error: `Circular reference detected for partial ${partialId}` }
  }

  // Depth guard
  if (_depth >= MAX_DEPTH) {
    return { blocks: [], error: `Max partial nesting depth (${MAX_DEPTH}) exceeded` }
  }

  const partial = await prisma.partial.findUnique({
    where: { id: partialId },
  })

  if (!partial || partial.status !== 'PUBLISHED') {
    return { blocks: [], error: partial ? 'Partial is not published' : 'Partial not found' }
  }

  // Parse blocks from partial content
  const content = partial.content as Record<string, unknown> | null
  if (!content || typeof content !== 'object') {
    return { blocks: [] }
  }

  let blocks: Block[]
  if (content.version === '2.0' && Array.isArray(content.blocks)) {
    blocks = content.blocks as Block[]
  } else if (Array.isArray(content)) {
    blocks = content as Block[]
  } else {
    return { blocks: [] }
  }

  return { blocks }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerPartialFetchers(): void {
  registerFetcher('fetchPartialBlocks', fetchPartialBlocks as (args: Record<string, unknown>) => Promise<unknown>)
}
