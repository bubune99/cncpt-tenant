/**
 * Dashboard AI Tools - Onboarding
 *
 * Tools for checking and managing onboarding checklist progress
 * from within the AI chat.
 */

import { tool } from "ai"
import { z } from "zod"
import { sql } from "@/lib/neon"

/**
 * Create onboarding tools with user context
 */
export function createOnboardingTools(userId: string) {
  /**
   * Get onboarding status for a subdomain
   */
  const getOnboardingStatus = tool({
    description: `Get the current onboarding checklist status for a subdomain. Use when:
- User asks about what they need to do next
- User seems new and needs guidance
- You want to proactively suggest next steps
- At the start of a conversation to understand the user's setup state`,
    parameters: z.object({
      subdomainId: z
        .number()
        .optional()
        .describe(
          "Subdomain ID to check. If omitted, checks the first subdomain."
        ),
    }),
    execute: async ({ subdomainId }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        // If no subdomainId, find the user's first subdomain
        let sid = subdomainId
        if (!sid) {
          const subs = await sql`
            SELECT id FROM subdomains WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 1
          `
          if (subs.length === 0) {
            return {
              action: "no_subdomains",
              message:
                "You don't have any subdomains yet. Would you like to create one?",
            }
          }
          sid = subs[0].id
        }

        const rows = await sql`
          SELECT id, items, dismissed, completed_at
          FROM onboarding_checklists
          WHERE user_id = ${userId} AND subdomain_id = ${sid}
          LIMIT 1
        `

        if (rows.length === 0) {
          return {
            action: "onboarding_not_started",
            subdomainId: sid,
            message:
              "No onboarding checklist found. It will be created when you visit the dashboard.",
          }
        }

        const checklist = rows[0]
        const items = checklist.items as Array<{
          key: string
          title: string
          completed: boolean
        }>
        const completed = items.filter((i) => i.completed).length
        const total = items.length
        const percentage = Math.round((completed / total) * 100)

        const pendingItems = items
          .filter((i) => !i.completed)
          .map((i) => i.title)

        return {
          action: "onboarding_status",
          subdomainId: sid,
          dismissed: checklist.dismissed,
          fullyCompleted: !!checklist.completed_at,
          progress: { completed, total, percentage },
          pendingItems,
          completedItems: items
            .filter((i) => i.completed)
            .map((i) => i.title),
        }
      } catch (error) {
        console.error("[onboarding-tools] getOnboardingStatus error:", error)
        return { error: "Failed to fetch onboarding status" }
      }
    },
  })

  /**
   * Complete an onboarding step
   */
  const completeOnboardingStep = tool({
    description:
      "Mark an onboarding checklist item as complete. Use when the user has completed a task mentioned in their onboarding checklist.",
    parameters: z.object({
      subdomainId: z.number().describe("Subdomain ID"),
      itemKey: z
        .enum([
          "first_page",
          "configure_brand",
          "custom_domain",
          "invite_team",
          "explore_editor",
          "publish_page",
        ])
        .describe("The checklist item key to mark as complete"),
    }),
    execute: async ({ subdomainId, itemKey }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        const rows = await sql`
          SELECT id, items FROM onboarding_checklists
          WHERE user_id = ${userId} AND subdomain_id = ${subdomainId}
          LIMIT 1
        `

        if (rows.length === 0) {
          return { error: "No onboarding checklist found for this subdomain" }
        }

        const items = rows[0].items as Array<{
          key: string
          title: string
          completed: boolean
          completedAt: string | null
        }>
        const now = new Date().toISOString()

        const updatedItems = items.map((item) =>
          item.key === itemKey && !item.completed
            ? { ...item, completed: true, completedAt: now }
            : item
        )

        const allComplete = updatedItems.every((i) => i.completed)

        await sql`
          UPDATE onboarding_checklists
          SET items = ${JSON.stringify(updatedItems)}::jsonb,
              completed_at = ${allComplete ? now : null},
              updated_at = NOW()
          WHERE user_id = ${userId} AND subdomain_id = ${subdomainId}
        `

        const completed = updatedItems.filter((i) => i.completed).length
        const remaining = updatedItems.filter((i) => !i.completed)

        return {
          action: "step_completed",
          itemKey,
          progress: {
            completed,
            total: updatedItems.length,
            percentage: Math.round(
              (completed / updatedItems.length) * 100
            ),
          },
          allComplete,
          remaining: remaining.map((i) => i.title),
          message: allComplete
            ? "Congratulations! You've completed all onboarding steps!"
            : `Great progress! ${remaining.length} step${remaining.length === 1 ? "" : "s"} remaining.`,
        }
      } catch (error) {
        console.error(
          "[onboarding-tools] completeOnboardingStep error:",
          error
        )
        return { error: "Failed to complete onboarding step" }
      }
    },
  })

  /**
   * Suggest next step based on onboarding progress
   */
  const suggestNextStep = tool({
    description: `Suggest the best next action based on the user's onboarding progress. Use proactively when:
- Starting a new conversation
- User asks "what should I do next?"
- After completing a task`,
    parameters: z.object({
      subdomainId: z
        .number()
        .optional()
        .describe("Subdomain ID. If omitted, uses the first subdomain."),
    }),
    execute: async ({ subdomainId }) => {
      if (!userId) {
        return { error: "User not authenticated" }
      }

      try {
        let sid = subdomainId
        if (!sid) {
          const subs = await sql`
            SELECT id, subdomain FROM subdomains WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 1
          `
          if (subs.length === 0) {
            return {
              action: "suggest_create_subdomain",
              suggestion: {
                title: "Create Your First Site",
                description:
                  "Start by creating a subdomain — it takes less than a minute.",
                actionUrl: "/dashboard/create-subdomain",
              },
            }
          }
          sid = subs[0].id
        }

        const rows = await sql`
          SELECT items, dismissed, completed_at
          FROM onboarding_checklists
          WHERE user_id = ${userId} AND subdomain_id = ${sid}
          LIMIT 1
        `

        if (rows.length === 0 || rows[0].completed_at || rows[0].dismissed) {
          return {
            action: "onboarding_complete",
            message:
              "Your onboarding is complete! Feel free to ask me anything about managing your site.",
          }
        }

        const items = rows[0].items as Array<{
          key: string
          title: string
          description: string
          completed: boolean
          url: string
        }>

        // Find the first incomplete item — they're ordered by priority
        const nextItem = items.find((i) => !i.completed)
        if (!nextItem) {
          return {
            action: "onboarding_complete",
            message: "All onboarding steps are done!",
          }
        }

        return {
          action: "suggest_next_step",
          subdomainId: sid,
          suggestion: {
            key: nextItem.key,
            title: nextItem.title,
            description: nextItem.description,
            actionUrl: nextItem.url,
          },
          progress: {
            completed: items.filter((i) => i.completed).length,
            total: items.length,
          },
        }
      } catch (error) {
        console.error("[onboarding-tools] suggestNextStep error:", error)
        return { error: "Failed to determine next step" }
      }
    },
  })

  return {
    getOnboardingStatus,
    completeOnboardingStep,
    suggestNextStep,
  }
}
