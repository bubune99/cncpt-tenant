/**
 * Scan Page Tool
 *
 * Lets the AI assistant dynamically discover the DOM structure of the page
 * the user is currently looking at. Used as a planning step before any
 * spotlight tour or UI explanation — agents should NOT guess selectors.
 *
 * This is a CLIENT-EXECUTION tool. The server returns a sentinel
 * `{ __requires_client_execution: true, name, arguments }` object; the chat
 * component intercepts the tool call, runs `runScanPage` in the user's
 * browser, and feeds the real result back to the model on the next turn.
 *
 * The actual DOM walker lives in `./scan-page-client.ts`.
 */
import { tool } from 'ai'
import { z } from 'zod'

export const scanPageInputSchema = z.object({
  surface: z
    .enum(['interactive', 'all'])
    .default('interactive')
    .describe(
      "interactive = buttons/links/inputs only; all = also headings + cards"
    ),
  maxItems: z
    .number()
    .min(1)
    .max(200)
    .default(60)
    .describe('Maximum number of landmarks to return.'),
})

export type ScanPageInput = z.infer<typeof scanPageInputSchema>

/**
 * Categorization for a scanned landmark.
 */
export type ScanPageKind =
  | 'nav'
  | 'button'
  | 'link'
  | 'input'
  | 'heading'
  | 'card'

/**
 * A single discovered landmark on the page.
 */
export interface ScanPageItem {
  selector: string
  role: string
  label: string
  kind: ScanPageKind
}

/**
 * Sentinel returned by the server-side tool execute. The chat client
 * intercepts this and runs the real scan in the browser.
 */
export interface ClientExecutionSentinel {
  __requires_client_execution: true
  name: string
  arguments: ScanPageInput
}

export const scanPageTool = tool({
  description: `Scan the current page's DOM and return a list of meaningful interactive landmarks. Use this BEFORE planning a tour to discover what's actually on the page — don't guess selectors. Returns an array of { selector, role, label, kind } where 'kind' is 'nav' | 'button' | 'link' | 'input' | 'heading' | 'card'. Prefer this over assuming the layout.`,
  inputSchema: scanPageInputSchema,
  execute: async (args: ScanPageInput): Promise<ClientExecutionSentinel> => ({
    __requires_client_execution: true,
    name: 'scan_page',
    arguments: args,
  }),
})
