/**
 * Dashboard AI Tools - Wizard & Walkthrough
 *
 * Tools for generating inline step-by-step wizards in chat
 * and managing saved guided tours via HelpTour.
 */

import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/neon"

/**
 * Timeout wrapper for async operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = "Operation timed out"
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

const wizardStepSchema = z.object({
  title: z.string().describe("Short title for this step"),
  content: z
    .string()
    .describe("Markdown content explaining what to do in this step"),
  actionLabel: z
    .string()
    .optional()
    .describe('Label for the action button (e.g., "Go to Settings")'),
  actionUrl: z
    .string()
    .optional()
    .describe("URL to navigate to for this step"),
})

/**
 * Create wizard tools (context-free — no user ID needed)
 */
export function createWizardTools() {
  /**
   * Generate an inline wizard in the chat
   */
  const generateInlineWizard = tool({
    description: `Generate a step-by-step wizard that renders inline in the chat. Use when:
- User asks "how do I..." or "show me how to..."
- User needs guidance on a multi-step process
- User is setting up something for the first time
Returns structured wizard data that renders as an interactive stepper in the chat UI.`,
    inputSchema: z.object({
      title: z.string().describe("Wizard title (e.g., 'Set Up Custom Domain')"),
      description: z
        .string()
        .optional()
        .describe("Brief description of what this wizard accomplishes"),
      steps: z
        .array(wizardStepSchema)
        .min(2)
        .max(10)
        .describe("Ordered steps for the wizard"),
      category: z
        .enum([
          "getting-started",
          "site-setup",
          "domains",
          "branding",
          "teams",
          "editor",
          "billing",
          "advanced",
        ])
        .optional()
        .describe("Category for organizing saved tours"),
    }),
    execute: async ({ title, description, steps, category }) => {
      return {
        action: "inline_wizard",
        wizard: {
          title,
          description,
          steps: steps.map((step, i) => ({
            number: i + 1,
            ...step,
          })),
          category: category || "general",
          totalSteps: steps.length,
        },
      }
    },
  })

  /**
   * Save a wizard as a persistent HelpTour for reuse
   */
  const saveWizardAsTour = tool({
    description:
      "Save a generated wizard as a persistent guided tour (HelpTour). Use when the user wants to save a wizard for later or share it with their team.",
    inputSchema: z.object({
      title: z.string().describe("Tour title"),
      description: z.string().optional().describe("Tour description"),
      slug: z
        .string()
        .describe(
          "URL-friendly slug for the tour (e.g., 'setup-custom-domain')"
        ),
      steps: z
        .array(
          z.object({
            target: z
              .string()
              .describe("CSS selector for the target element"),
            title: z.string().describe("Step title"),
            content: z.string().describe("Step content"),
            placement: z
              .enum([
                "top",
                "bottom",
                "left",
                "right",
                "center",
                "auto",
              ])
              .optional()
              .default("bottom"),
          })
        )
        .min(1)
        .max(15),
      route: z
        .string()
        .optional()
        .describe("Route pattern where this tour applies"),
    }),
    execute: async ({ title, description, slug, steps, route }) => {
      try {
        const stepsJson = JSON.stringify(
          steps.map((s) => ({ ...s, disableBeacon: true }))
        )
        const options = JSON.stringify({
          continuous: true,
          showProgress: true,
          showSkipButton: true,
        })

        const result = await withTimeout(
          sql`
            INSERT INTO help_tours (id, slug, title, description, steps, options, route, is_active)
            VALUES (
              gen_random_uuid()::text,
              ${slug},
              ${title},
              ${description || null},
              ${stepsJson}::jsonb,
              ${options}::jsonb,
              ${route || null},
              true
            )
            ON CONFLICT (slug) DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              steps = EXCLUDED.steps,
              options = EXCLUDED.options,
              route = EXCLUDED.route,
              updated_at = NOW()
            RETURNING id, slug, title
          `,
          5000,
          "Saving tour timed out"
        )

        return {
          action: "tour_saved",
          tour: result[0],
          message: `Tour "${title}" saved successfully. It can be started with the slug "${slug}".`,
        }
      } catch (error) {
        console.error("[wizard-tools] saveWizardAsTour error:", error)
        return {
          action: "tour_save_failed",
          error: "Failed to save tour. The wizard is still available in chat.",
        }
      }
    },
  })

  /**
   * Suggest walkthroughs based on context
   */
  const suggestWalkthroughs = tool({
    description: `Suggest relevant guided walkthroughs for the user. Use when:
- User seems lost or asks general "what can I do?" questions
- User just signed up or created a new subdomain
- After completing an action, to suggest next steps`,
    inputSchema: z.object({
      context: z
        .string()
        .describe("What the user is trying to do or learn about"),
      suggestions: z
        .array(
          z.object({
            title: z.string().describe("Walkthrough title"),
            description: z
              .string()
              .describe("What the user will learn (1-2 sentences)"),
            estimatedSteps: z
              .number()
              .describe("Approximate number of steps"),
            difficulty: z
              .enum(["beginner", "intermediate", "advanced"])
              .describe("Skill level required"),
            tourSlug: z
              .string()
              .optional()
              .describe("Slug of saved tour, or null to generate on-the-fly"),
          })
        )
        .min(1)
        .max(4),
    }),
    execute: async ({ context, suggestions }) => {
      return {
        action: "suggest_walkthroughs",
        context,
        suggestions,
      }
    },
  })

  /**
   * Start a saved walkthrough tour
   */
  const startWalkthrough = tool({
    description:
      "Start a saved guided tour by its slug. Triggers the Joyride runner in the help system.",
    inputSchema: z.object({
      tourSlug: z.string().describe("The slug of the tour to start"),
      navigateFirst: z
        .string()
        .optional()
        .describe("URL to navigate to before starting the tour"),
    }),
    execute: async ({ tourSlug, navigateFirst }) => {
      try {
        // Verify tour exists and increment start count
        const result = await withTimeout(
          sql`
            UPDATE help_tours
            SET times_started = times_started + 1
            WHERE slug = ${tourSlug} AND is_active = true
            RETURNING id, slug, title, steps
          `,
          3000,
          "Tour lookup timed out"
        )

        if (result.length === 0) {
          return {
            action: "tour_not_found",
            error: `No active tour found with slug "${tourSlug}".`,
          }
        }

        return {
          action: "start_walkthrough",
          tourSlug,
          tourTitle: result[0].title,
          navigateFirst,
          message: `Starting tour: ${result[0].title}`,
        }
      } catch (error) {
        console.error("[wizard-tools] startWalkthrough error:", error)
        return {
          action: "tour_start_failed",
          error: "Failed to start tour. Please try again.",
        }
      }
    },
  })

  /**
   * List available tours
   */
  const listTours = tool({
    description:
      "List all available guided tours. Use when the user asks what tours or guides are available.",
    inputSchema: z.object({
      activeOnly: z
        .boolean()
        .optional()
        .default(true)
        .describe("Only show active tours"),
    }),
    execute: async ({ activeOnly }) => {
      try {
        const tours = await withTimeout(
          activeOnly
            ? sql`
                SELECT id, slug, title, description, route, times_started, times_completed
                FROM help_tours
                WHERE is_active = true
                ORDER BY priority DESC, times_started DESC
              `
            : sql`
                SELECT id, slug, title, description, route, is_active, times_started, times_completed
                FROM help_tours
                ORDER BY priority DESC, times_started DESC
              `,
          3000,
          "Listing tours timed out"
        )

        return {
          action: "list_tours",
          tours: tours.map((t) => ({
            slug: t.slug,
            title: t.title,
            description: t.description,
            route: t.route,
            isActive: t.is_active,
            popularity: t.times_started,
            completionRate:
              t.times_started > 0
                ? Math.round((t.times_completed / t.times_started) * 100)
                : 0,
          })),
          count: tours.length,
        }
      } catch (error) {
        console.error("[wizard-tools] listTours error:", error)
        return {
          action: "list_tours_failed",
          tours: [],
          count: 0,
          error: "Could not load tours right now.",
        }
      }
    },
  })

  return {
    generateInlineWizard,
    saveWizardAsTour,
    suggestWalkthroughs,
    startWalkthrough,
    listTours,
  }
}
