/**
 * Smart Block Data Resolver
 *
 * Server-side utility that scans a Block[] tree for smart blocks,
 * collects their data requirements, fetches everything in parallel,
 * and returns a map of blockId -> data.
 *
 * Called from server components (page routes) before rendering.
 */

import type { Block } from '../types'
import { getSmartBlock } from './registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SmartBlockDataMap = Map<string, Record<string, unknown>>

/** A fetcher function registered in the fetcher registry */
type DataFetcher = (args: Record<string, unknown>) => Promise<unknown>

// ---------------------------------------------------------------------------
// Fetcher Registry
// ---------------------------------------------------------------------------

const fetcherRegistry = new Map<string, DataFetcher>()

/** Register a data fetcher function by name */
export function registerFetcher(name: string, fn: DataFetcher): void {
  fetcherRegistry.set(name, fn)
}

/** Get a registered fetcher */
export function getFetcher(name: string): DataFetcher | undefined {
  return fetcherRegistry.get(name)
}

// ---------------------------------------------------------------------------
// Tree Scanner
// ---------------------------------------------------------------------------

interface PendingFetch {
  blockId: string
  key: string
  fetcher: string
  args: Record<string, unknown>
}

/** Recursively scan blocks for smart block data requirements */
function collectRequirements(blocks: Block[]): PendingFetch[] {
  const pending: PendingFetch[] = []

  function walk(block: Block) {
    if (block.componentName) {
      const def = getSmartBlock(block.componentName)
      if (def) {
        const reqs = def.dataRequirements(block)
        for (const req of reqs) {
          pending.push({
            blockId: block.id,
            key: req.key,
            fetcher: req.fetcher,
            args: req.args,
          })
        }
      }
    }
    if (block.children) {
      for (const child of block.children) {
        walk(child)
      }
    }
  }

  for (const block of blocks) {
    walk(block)
  }

  return pending
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve all smart block data for a block tree.
 *
 * Scans the tree for blocks with `componentName`, collects data requirements,
 * fetches everything in parallel, and returns a serializable map.
 */
export async function resolveSmartBlockData(blocks: Block[]): Promise<SmartBlockDataMap> {
  const pending = collectRequirements(blocks)

  if (pending.length === 0) {
    return new Map()
  }

  // Fetch all data in parallel
  const results = await Promise.allSettled(
    pending.map(async (p) => {
      const fn = getFetcher(p.fetcher)
      if (!fn) {
        console.warn(`[smart-blocks] No fetcher registered for "${p.fetcher}"`)
        return { blockId: p.blockId, key: p.key, data: null }
      }
      const data = await fn(p.args)
      return { blockId: p.blockId, key: p.key, data }
    })
  )

  // Build the map
  const dataMap: SmartBlockDataMap = new Map()

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { blockId, key, data } = result.value
      const existing = dataMap.get(blockId) || {}
      existing[key] = data
      dataMap.set(blockId, existing)
    }
  }

  return dataMap
}

/**
 * Serialize SmartBlockDataMap to a plain object for client component props.
 */
export function serializeSmartBlockData(dataMap: SmartBlockDataMap): Record<string, Record<string, unknown>> {
  const obj: Record<string, Record<string, unknown>> = {}
  for (const [blockId, data] of dataMap) {
    obj[blockId] = data
  }
  return obj
}

/**
 * Deserialize plain object back to SmartBlockDataMap.
 */
export function deserializeSmartBlockData(obj: Record<string, Record<string, unknown>>): SmartBlockDataMap {
  const map: SmartBlockDataMap = new Map()
  for (const [blockId, data] of Object.entries(obj)) {
    map.set(blockId, data)
  }
  return map
}
