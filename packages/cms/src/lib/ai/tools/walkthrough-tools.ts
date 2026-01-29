/**
 * AI Walkthrough Tools
 *
 * Tools for AI to dynamically generate and present guided walkthroughs
 * to help users learn the CMS interface.
 *
 * All tools include proper error handling and timeouts to prevent
 * stream hangs during tool execution.
 */

import { tool } from 'ai'
import { z } from 'zod'

/**
 * Timeout wrapper for async operations
 * Prevents indefinite hangs during database operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * Safe database import with error handling
 */
async function getDb() {
  try {
    const { default: db } = await import('../../db')
    return db
  } catch (error) {
    console.error('[Walkthrough] Failed to import database:', error)
    throw new Error('Database connection unavailable')
  }
}

/**
 * Joyride step schema for walkthrough generation
 */
const joyrideStepSchema = z.object({
  target: z.string().describe('CSS selector for the target element (e.g., "[data-help-key=\\"admin.sidebar.products\\"]")'),
  title: z.string().describe('Title shown in the tooltip'),
  content: z.string().describe('Instructional content explaining what this element does'),
  placement: z.enum([
    'top', 'top-start', 'top-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'left-start', 'left-end',
    'right', 'right-start', 'right-end',
    'center', 'auto'
  ]).optional().default('bottom'),
})

/**
 * Suggest Walkthroughs Tool
 *
 * AI suggests relevant walkthroughs based on user context and question.
 * Returns actionable options the user can click to start.
 *
 * This tool is lightweight - it just returns the AI's suggestions without
 * database access, making it fast and reliable.
 */
export const suggestWalkthroughs = tool({
  description: `Suggest relevant guided walkthroughs to help the user learn. Use this when:
- User asks "how do I..." or "show me how to..."
- User seems confused about a feature
- User is new and exploring the admin
- After explaining a concept, to offer hands-on learning

Returns walkthrough options that render as clickable cards in the chat.`,
  inputSchema: z.object({
    context: z.string().describe('What the user is trying to do or learn'),
    suggestions: z.array(z.object({
      id: z.string().describe('Unique ID for this suggestion (e.g., "tour-products")'),
      title: z.string().describe('Short title (e.g., "Add Your First Product")'),
      description: z.string().describe('What the user will learn (1-2 sentences)'),
      estimatedSteps: z.number().describe('Approximate number of steps in the tour'),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Skill level'),
      tourSlug: z.string().optional().describe('Existing tour slug if available, or null to generate on-the-fly'),
    })).min(1).max(4).describe('1-4 walkthrough suggestions'),
  }),
  execute: async ({ context, suggestions }) => {
    // This tool is purely client-side - no database access needed
    // Just format and return the suggestions
    return {
      action: 'suggest_walkthroughs',
      context,
      suggestions: suggestions.map(s => ({
        ...s,
        actionType: s.tourSlug ? 'start_existing' : 'generate_new',
      })),
      message: `I found ${suggestions.length} walkthrough${suggestions.length > 1 ? 's' : ''} that can help you learn this.`,
    }
  },
})

/**
 * Generate Walkthrough Tool
 *
 * AI creates a custom walkthrough on-the-fly based on user needs.
 * Stores it in the database for reuse and analytics.
 */
export const generateWalkthrough = tool({
  description: `Generate a custom guided walkthrough with Joyride steps. Use this when:
- No existing tour matches user needs
- User wants to learn a specific workflow
- Creating personalized training content

The generated tour is saved and can be reused.`,
  inputSchema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/).describe('URL-friendly identifier (lowercase, hyphens only)'),
    title: z.string().describe('Tour title shown to user'),
    description: z.string().describe('What this tour teaches'),
    steps: z.array(joyrideStepSchema).min(2).max(15).describe('Joyride step configurations'),
    route: z.string().optional().describe('Route pattern where this tour applies (e.g., "/admin/products")'),
    autoStart: z.boolean().optional().default(false).describe('Start the tour immediately after creation'),
  }),
  execute: async ({ slug, title, description, steps, route, autoStart }) => {
    try {
      const db = await getDb()

      // Check if tour already exists (with timeout)
      const existing = await withTimeout(
        db.helpTour.findUnique({ where: { slug } }),
        3000,
        'Database query timed out while checking existing tour'
      )

      if (existing) {
        return {
          action: 'walkthrough_exists',
          tourId: existing.id,
          slug: existing.slug,
          message: `A tour with slug "${slug}" already exists. Use startWalkthrough to launch it.`,
        }
      }

      // Create the tour (with timeout)
      const tour = await withTimeout(
        db.helpTour.create({
          data: {
            slug,
            title,
            description,
            steps: steps.map(step => ({
              ...step,
              disableBeacon: true,
            })),
            options: {
              continuous: true,
              scrollToFirstStep: true,
              showProgress: true,
              showSkipButton: true,
            },
            route,
            isActive: true,
          },
        }),
        5000,
        'Database query timed out while creating tour'
      )

      return {
        action: autoStart ? 'start_walkthrough' : 'walkthrough_created',
        tourId: tour.id,
        slug: tour.slug,
        title: tour.title,
        stepsCount: steps.length,
        message: autoStart
          ? `I've created and started a ${steps.length}-step walkthrough: "${title}"`
          : `I've created a ${steps.length}-step walkthrough: "${title}". Click to start it when ready.`,
      }
    } catch (error) {
      console.error('[Walkthrough] generateWalkthrough error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to create walkthrough: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      }
    }
  },
})

/**
 * Start Walkthrough Tool
 *
 * Triggers an existing walkthrough to begin for the user.
 */
export const startWalkthrough = tool({
  description: `Start a guided walkthrough for the user. Use this when:
- User selects a suggested walkthrough
- User explicitly asks to start a tour
- Guiding user through a specific workflow

This will highlight elements and show step-by-step instructions.`,
  inputSchema: z.object({
    tourSlug: z.string().describe('The slug of the tour to start'),
    navigateFirst: z.string().optional().describe('Optional path to navigate to before starting'),
  }),
  execute: async ({ tourSlug, navigateFirst }) => {
    try {
      const db = await getDb()

      const tour = await withTimeout(
        db.helpTour.findUnique({
          where: { slug: tourSlug },
          select: {
            id: true,
            slug: true,
            title: true,
            route: true,
            steps: true,
          },
        }),
        3000,
        'Database query timed out while fetching tour'
      )

      if (!tour) {
        return {
          action: 'error',
          message: `Tour "${tourSlug}" not found. I can generate a new one if you'd like.`,
        }
      }

      // Increment times started (fire and forget - don't wait)
      db.helpTour.update({
        where: { id: tour.id },
        data: { timesStarted: { increment: 1 } },
      }).catch(err => console.warn('[Walkthrough] Failed to increment tour stats:', err))

      const stepsArray = tour.steps as unknown[]

      return {
        action: 'start_walkthrough',
        tourId: tour.id,
        tourSlug: tour.slug,
        title: tour.title,
        stepsCount: Array.isArray(stepsArray) ? stepsArray.length : 0,
        navigateTo: navigateFirst || tour.route,
        message: `Starting walkthrough: "${tour.title}"`,
      }
    } catch (error) {
      console.error('[Walkthrough] startWalkthrough error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to start walkthrough: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      }
    }
  },
})

/**
 * Create Help Content Tool
 *
 * AI creates contextual help for specific UI elements.
 */
export const createHelpContent = tool({
  description: `Create or update help content for a UI element. Use this when:
- Explaining what a button/field/section does
- Adding context that will appear in help mode (Ctrl+Q)
- Building documentation for custom components

The content becomes available when users click elements in help mode.`,
  inputSchema: z.object({
    elementKey: z.string().describe('Unique key for the UI element (e.g., "admin.products.addButton")'),
    title: z.string().describe('Short title for the element'),
    summary: z.string().describe('One-line description'),
    details: z.string().optional().describe('Detailed explanation with markdown support'),
    relatedKeys: z.array(z.string()).optional().describe('Related element keys for cross-referencing'),
  }),
  execute: async ({ elementKey, title, summary, details, relatedKeys }) => {
    try {
      const db = await getDb()

      // Find existing or create new help content
      const existing = await withTimeout(
        db.helpContent.findFirst({
          where: {
            elementKey,
            storeId: null, // Global content
          },
        }),
        3000,
        'Database query timed out'
      )

      const content = existing
        ? await withTimeout(
            db.helpContent.update({
              where: { id: existing.id },
              data: {
                title,
                summary,
                details,
                relatedKeys: relatedKeys || [],
                createdBy: 'AI',
                updatedAt: new Date(),
              },
            }),
            3000,
            'Database update timed out'
          )
        : await withTimeout(
            db.helpContent.create({
              data: {
                elementKey,
                title,
                summary,
                details,
                relatedKeys: relatedKeys || [],
                createdBy: 'AI',
              },
            }),
            3000,
            'Database create timed out'
          )

      return {
        action: 'help_content_created',
        contentId: content.id,
        elementKey: content.elementKey,
        message: `Help content created for "${elementKey}". Users will see this in help mode (Ctrl+Q).`,
      }
    } catch (error) {
      console.error('[Walkthrough] createHelpContent error:', error)
      return {
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to create help content: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      }
    }
  },
})

/**
 * List Available Walkthroughs Tool
 *
 * Returns all available walkthroughs for the current context.
 */
export const listWalkthroughs = tool({
  description: 'List all available guided walkthroughs. Use this to see what tours exist before suggesting or creating new ones.',
  inputSchema: z.object({
    route: z.string().optional().describe('Filter by route pattern'),
    activeOnly: z.boolean().optional().default(true).describe('Only show active tours'),
  }),
  execute: async ({ route, activeOnly }) => {
    try {
      const db = await getDb()

      const tours = await withTimeout(
        db.helpTour.findMany({
          where: {
            ...(activeOnly !== false ? { isActive: true } : {}),
            ...(route ? { route: { contains: route } } : {}),
          },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            route: true,
            steps: true,
            timesStarted: true,
            timesCompleted: true,
            isActive: true,
          },
          orderBy: { title: 'asc' },
          take: 50, // Limit results
        }),
        5000,
        'Database query timed out while listing tours'
      )

      return {
        count: tours.length,
        tours: tours.map(t => {
          const stepsArray = t.steps as unknown[]
          return {
            slug: t.slug,
            title: t.title,
            description: t.description,
            route: t.route,
            stepsCount: Array.isArray(stepsArray) ? stepsArray.length : 0,
            popularity: t.timesStarted,
            completionRate: t.timesStarted > 0
              ? Math.round((t.timesCompleted / t.timesStarted) * 100)
              : 0,
            isActive: t.isActive,
          }
        }),
      }
    } catch (error) {
      console.error('[Walkthrough] listWalkthroughs error:', error)
      return {
        action: 'error',
        count: 0,
        tours: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to list walkthroughs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  },
})

/**
 * Explain UI Element Tool
 *
 * AI provides a quick explanation of a UI element, optionally creating
 * persistent help content.
 *
 * This is a lightweight tool that returns immediately with the explanation.
 * Database operations (saveAsHelp, suggestWalkthrough) are optional and
 * handled with timeouts.
 */
export const explainElement = tool({
  description: `Explain what a UI element does to the user. Use this when:
- User asks "what does this button do?"
- User points at or mentions a specific UI element
- Providing context about interface components

Can optionally save the explanation as permanent help content.`,
  inputSchema: z.object({
    elementKey: z.string().describe('The element key or description'),
    explanation: z.string().describe('Clear explanation of what the element does'),
    saveAsHelp: z.boolean().optional().default(false).describe('Save this as persistent help content'),
    suggestWalkthrough: z.boolean().optional().default(true).describe('Suggest a related walkthrough if available'),
  }),
  execute: async ({ elementKey, explanation, saveAsHelp, suggestWalkthrough }) => {
    // Start with the basic response - this is returned immediately
    const result: Record<string, unknown> = {
      action: 'explain_element',
      elementKey,
      explanation,
    }

    // Database operations are optional and non-blocking
    try {
      if (saveAsHelp || suggestWalkthrough) {
        const db = await getDb()

        // Save help content if requested
        if (saveAsHelp) {
          try {
            // Extract title from explanation (first sentence or first 50 chars)
            const title = explanation.split(/[.!?]/)[0].slice(0, 50)

            const existingHelp = await withTimeout(
              db.helpContent.findFirst({
                where: {
                  elementKey,
                  storeId: null,
                },
              }),
              2000,
              'Timeout checking existing help'
            )

            if (existingHelp) {
              await withTimeout(
                db.helpContent.update({
                  where: { id: existingHelp.id },
                  data: {
                    summary: explanation.slice(0, 200),
                    details: explanation,
                    createdBy: 'AI',
                    updatedAt: new Date(),
                  },
                }),
                2000,
                'Timeout updating help content'
              )
            } else {
              await withTimeout(
                db.helpContent.create({
                  data: {
                    elementKey,
                    title,
                    summary: explanation.slice(0, 200),
                    details: explanation,
                    createdBy: 'AI',
                  },
                }),
                2000,
                'Timeout creating help content'
              )
            }

            result.savedAsHelp = true
          } catch (helpError) {
            console.warn('[Walkthrough] Failed to save help content:', helpError)
            result.savedAsHelp = false
            result.helpError = helpError instanceof Error ? helpError.message : 'Unknown error'
          }
        }

        // Find related walkthrough if requested
        if (suggestWalkthrough) {
          try {
            const searchTerm = elementKey.split('.')[1] || ''
            if (searchTerm) {
              const relatedTour = await withTimeout(
                db.helpTour.findFirst({
                  where: {
                    isActive: true,
                    OR: [
                      { slug: { contains: searchTerm } },
                      { title: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                  },
                  select: { slug: true, title: true },
                }),
                2000,
                'Timeout finding related tour'
              )

              if (relatedTour) {
                result.relatedTour = {
                  slug: relatedTour.slug,
                  title: relatedTour.title,
                  message: `Want to learn more? Try the "${relatedTour.title}" walkthrough.`,
                }
              }
            }
          } catch (tourError) {
            console.warn('[Walkthrough] Failed to find related tour:', tourError)
            // Don't add error to result - this is optional
          }
        }
      }
    } catch (dbError) {
      console.warn('[Walkthrough] Database operations failed:', dbError)
      // Still return the explanation even if DB operations fail
    }

    return result
  },
})

/**
 * Highlight Element Tool
 *
 * AI highlights a specific UI element and optionally overrides
 * the default help content with custom, context-aware information.
 * This is the primary tool for embedding tribal knowledge.
 */
export const highlightElement = tool({
  description: `Highlight a UI element and show contextual help. This is the primary tool for tribal knowledge delivery.

Use this when:
- Explaining something specific about an element in context (e.g., "this product's inventory is low because...")
- Guiding users through context-sensitive information
- The default help content isn't sufficient for the current situation
- Teaching workflows where generic help doesn't capture nuances

The AI can either:
1. Use existing help content (if sufficient for the context)
2. Override with custom content for context-specific guidance
3. Augment existing content with additional context

This tool triggers the help mode UI to highlight and explain the element.`,
  inputSchema: z.object({
    elementKey: z.string().describe('The help element key (e.g., "admin.products.inventory", "admin.orders.status")'),
    useExistingContent: z.boolean().optional().default(true).describe('Whether to show existing help content. Set false to fully override.'),
    customContent: z.object({
      title: z.string().optional().describe('Override title (e.g., "Low Inventory Alert")'),
      summary: z.string().optional().describe('Override summary - one line context-aware explanation'),
      details: z.string().optional().describe('Override details - full markdown explanation with context'),
      tips: z.array(z.string()).optional().describe('Context-specific tips or actions'),
      severity: z.enum(['info', 'warning', 'error', 'success']).optional().describe('Visual indicator for the content type'),
    }).optional().describe('Custom content to show instead of or alongside existing help'),
    sequence: z.number().optional().describe('Step number if part of a multi-step guided explanation (1-based)'),
    totalSteps: z.number().optional().describe('Total steps if part of a sequence'),
    autoAdvanceMs: z.number().optional().describe('Auto-advance to next step after this many milliseconds'),
    navigateTo: z.string().optional().describe('Navigate to this path before highlighting'),
  }),
  execute: async ({ elementKey, useExistingContent, customContent, sequence, totalSteps, autoAdvanceMs, navigateTo }) => {
    // Build the result - this triggers client-side help mode
    const result: Record<string, unknown> = {
      action: 'highlight_element',
      elementKey,
      useExistingContent: useExistingContent !== false,
    }

    // Add custom content if provided
    if (customContent) {
      result.customContent = {
        ...customContent,
        // Mark as AI-generated for display purposes
        source: 'ai_contextual',
      }
    }

    // Add sequence info if this is part of a guided tour
    if (sequence !== undefined) {
      result.sequence = {
        current: sequence,
        total: totalSteps || sequence,
        autoAdvanceMs,
      }
    }

    // Add navigation if needed
    if (navigateTo) {
      result.navigateTo = navigateTo
    }

    // Optionally try to fetch existing content to include
    if (useExistingContent !== false) {
      try {
        const db = await getDb()
        const existingContent = await withTimeout(
          db.helpContent.findFirst({
            where: {
              elementKey,
              storeId: null, // Global content
            },
            select: {
              title: true,
              summary: true,
              details: true,
            },
          }),
          2000,
          'Timeout fetching help content'
        )

        if (existingContent) {
          result.existingContent = existingContent
        }
      } catch (error) {
        // Non-fatal - custom content is the priority
        console.warn('[Walkthrough] Failed to fetch existing content:', error)
      }
    }

    return result
  },
})

/**
 * Start Guided Explanation Tool
 *
 * Begins a multi-step guided explanation using highlightElement
 * for each step. This is for complex tribal knowledge scenarios.
 */
export const startGuidedExplanation = tool({
  description: `Start a multi-step guided explanation that highlights multiple elements in sequence.

Use this for:
- Explaining complex workflows (e.g., "let me show you how to process a refund")
- Teaching related features together
- Providing context across multiple UI elements
- Tribal knowledge that spans multiple parts of the interface

This creates a sequence of highlights with optional custom content for each.`,
  inputSchema: z.object({
    title: z.string().describe('Title of the guided explanation'),
    context: z.string().describe('Why this explanation is being given'),
    steps: z.array(z.object({
      elementKey: z.string().describe('Element key to highlight'),
      explanation: z.string().describe('Context-aware explanation for this step'),
      tips: z.array(z.string()).optional().describe('Tips specific to this step'),
      navigateTo: z.string().optional().describe('Navigate to this path before this step'),
    })).min(2).max(10).describe('Steps in the guided explanation'),
    autoAdvance: z.boolean().optional().default(false).describe('Automatically advance through steps'),
    autoAdvanceDelayMs: z.number().optional().default(5000).describe('Delay between auto-advance steps'),
  }),
  execute: async ({ title, context, steps, autoAdvance, autoAdvanceDelayMs }) => {
    return {
      action: 'start_guided_explanation',
      title,
      context,
      steps: steps.map((step, index) => ({
        ...step,
        sequence: index + 1,
        totalSteps: steps.length,
        autoAdvanceMs: autoAdvance ? autoAdvanceDelayMs : undefined,
      })),
      stepsCount: steps.length,
      autoAdvance,
      message: `Starting guided explanation: "${title}" (${steps.length} steps)`,
    }
  },
})

/**
 * All walkthrough tools combined
 */
export const walkthroughTools = {
  suggestWalkthroughs,
  generateWalkthrough,
  startWalkthrough,
  createHelpContent,
  listWalkthroughs,
  explainElement,
  highlightElement,
  startGuidedExplanation,
}
