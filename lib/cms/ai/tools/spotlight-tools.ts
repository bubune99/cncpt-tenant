/**
 * Spotlight Tools
 *
 * AI tools for the visual spotlight tour system. The server-side tool
 * returns a sentinel result (`__requires_client_execution: true`) which
 * the chat client intercepts and forwards to the global spotlight engine.
 *
 * Pair with `navigate_to` for multi-screen tours: the AI emits
 * spotlight_steps -> navigate_to -> spotlight_steps -> navigate_to ...
 * and the spotlight host (mounted in the root layout) keeps the overlay
 * alive across every navigation.
 */

import { tool } from 'ai'
import { z } from 'zod'

const stepSchema = z.object({
  target: z
    .string()
    .describe(
      'CSS selector for the element to highlight, e.g. nav a[href="/admin/products"], [data-stat="revenue"], input[name="title"]'
    ),
  caption: z
    .string()
    .describe('Tooltip caption shown next to the spotlight'),
  position: z
    .enum(['top', 'bottom', 'left', 'right', 'auto'])
    .optional()
    .default('auto')
    .describe('Preferred tooltip placement around the highlighted element'),
})

/**
 * spotlight_steps — play a visual spotlight tour highlighting real DOM
 * elements with captions. The agent should ALWAYS prefer this over a text
 * description when the user asks to be shown around / where something is /
 * how to do something.
 *
 * CLIENT-EXECUTED: returns a sentinel; the client's onToolCall picks it up
 * and drives the SpotlightHost.
 */
export const spotlightSteps = tool({
  description: [
    'Play a visual spotlight tour highlighting specific DOM elements with captions.',
    'Use this WHENEVER the user asks to be shown around, asks where something is, or asks how to do something — instead of describing in text, highlight the real elements.',
    'Steps fire sequentially with a Next/Skip/Done UI; combine with navigate_to to span multiple screens.',
  ].join(' '),
  inputSchema: z.object({
    steps: z.array(stepSchema).min(1).max(12).describe('Sequence of spotlight steps'),
    title: z
      .string()
      .optional()
      .describe('Tour title shown in the chat acknowledgement'),
  }),
  execute: async ({ steps, title }) => {
    // Client-side execution sentinel. The chat client intercepts results
    // shaped like this and forwards to the SpotlightHost / spotlight store.
    return {
      __requires_client_execution: true,
      name: 'spotlight_steps',
      arguments: { steps, title: title ?? 'Tour' },
      // Human-readable message so the AI can compose a natural follow-up.
      message: title
        ? `Started "${title}" — highlighting ${steps.length} element${steps.length === 1 ? '' : 's'}.`
        : `Started tour — highlighting ${steps.length} element${steps.length === 1 ? '' : 's'}.`,
    }
  },
})

/**
 * navigate_to_route — change the user's route while a tour is active.
 * Pair with spotlight_steps for multi-screen tours. CLIENT-EXECUTED.
 *
 * This is intentionally separate from the existing server-side `navigateTo`
 * tool (which only returns a hint) — this one runs Next's router on the
 * client and waits enough for the next page's DOM to settle before the
 * subsequent spotlight_steps call resolves its target.
 */
export const navigateToRoute = tool({
  description: [
    'Navigate the user to a specific admin route.',
    'Use this DURING a tour to move between screens — e.g. when explaining how to publish a blog post, navigate to /admin/blog before spotlighting the New Post button, then navigate to /admin/blog/new before spotlighting the title field.',
    'The spotlight overlay survives the navigation; the next spotlight_steps call will wait for the new page DOM to settle before measuring targets.',
  ].join(' '),
  inputSchema: z.object({
    path: z
      .string()
      .describe('App path like /admin/products or /admin/blog/new'),
    reason: z
      .string()
      .optional()
      .describe('Brief reason shown to the user, e.g. "Going to the blog list"'),
  }),
  execute: async ({ path, reason }) => {
    return {
      __requires_client_execution: true,
      name: 'navigate_to_route',
      arguments: { path, reason },
      message: reason ? `Navigating: ${reason}` : `Navigating to ${path}`,
    }
  },
})

export const spotlightTools = {
  spotlight_steps: spotlightSteps,
  navigate_to_route: navigateToRoute,
}
