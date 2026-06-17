/**
 * Client Tool Handlers Registry
 *
 * Some AI tools have to run in the user's browser (DOM scans, spotlight
 * driving, etc.). Server-side those tools return a sentinel of the form
 * `{ __requires_client_execution: true, name, arguments }`. The chat panel
 * inspects every tool result, looks up the matching handler in this
 * registry, runs it locally, and feeds the real result back to the model
 * on the next turn.
 *
 * Phase 1 (`spotlight_steps`) registers itself here when it merges; this
 * file is the shared meeting point so the two phases don't collide on the
 * chat-panel component.
 */
import { runScanPage } from './tools/scan-page-client'
import type { ScanPageInput, ScanPageItem } from './tools/scan-page'

/**
 * Shape of a sentinel returned by the server for client-executed tools.
 */
export interface ClientToolSentinel {
  __requires_client_execution: true
  name: string
  arguments: unknown
}

/**
 * Type-guard for the client-execution sentinel.
 */
export function isClientToolSentinel(value: unknown): value is ClientToolSentinel {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).__requires_client_execution === true &&
    typeof (value as Record<string, unknown>).name === 'string'
  )
}

/**
 * Result returned by `runScanPage`.
 */
export interface ScanPageResult {
  items: ScanPageItem[]
  total: number
  surface: string
}

/**
 * A client tool handler runs a sentinel's arguments in the browser and
 * returns the value the model should see on its next turn.
 */
export type ClientToolHandler = (args: unknown) => Promise<unknown>

/**
 * Registry of client-side handlers keyed by the tool name returned in
 * the sentinel. Phase 1 will add `spotlight_steps` next to `scan_page`.
 */
export const clientToolHandlers: Record<string, ClientToolHandler> = {
  scan_page: (args: unknown) => runScanPage(args as ScanPageInput),
}

/**
 * Convenience wrapper: given a sentinel, run the matching handler.
 * Returns `null` if no handler is registered (the sentinel is then a
 * harmless no-op rather than a runtime error).
 */
export async function runClientTool(
  sentinel: ClientToolSentinel
): Promise<unknown | null> {
  const handler = clientToolHandlers[sentinel.name]
  if (!handler) return null
  return handler(sentinel.arguments)
}
