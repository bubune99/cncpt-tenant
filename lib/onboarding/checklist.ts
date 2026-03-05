/**
 * Onboarding Checklist Library
 * Manages per-user per-subdomain onboarding progress
 */

import { sql } from "@/lib/neon"

export interface ChecklistItem {
  key: string
  title: string
  description: string
  completed: boolean
  completedAt: string | null
  url: string
}

export interface OnboardingChecklist {
  id: string
  userId: string
  subdomainId: number
  items: ChecklistItem[]
  dismissed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "completed" | "completedAt">[] = [
  {
    key: "first_page",
    title: "Create your first page",
    description: "Build a landing page with the visual editor",
    url: "/admin/pages",
  },
  {
    key: "configure_brand",
    title: "Configure your brand",
    description: "Set your logo, colors, and favicon",
    url: "/dashboard?section=branding",
  },
  {
    key: "custom_domain",
    title: "Add a custom domain",
    description: "Connect your own domain name",
    url: "/dashboard?section=domains",
  },
  {
    key: "invite_team",
    title: "Invite a team member",
    description: "Collaborate with your team",
    url: "/teams",
  },
  {
    key: "explore_editor",
    title: "Explore the block editor",
    description: "Drag and drop blocks to build pages",
    url: "/admin/pages",
  },
  {
    key: "publish_page",
    title: "Publish a page",
    description: "Make your first page live",
    url: "/admin/pages",
  },
]

/**
 * Get or create an onboarding checklist for a user+subdomain pair
 */
export async function getOrCreateChecklist(
  userId: string,
  subdomainId: number
): Promise<OnboardingChecklist> {
  // Try to fetch existing
  const existing = await sql`
    SELECT id, user_id, subdomain_id, items, dismissed, completed_at, created_at, updated_at
    FROM onboarding_checklists
    WHERE user_id = ${userId} AND subdomain_id = ${subdomainId}
    LIMIT 1
  `

  if (existing.length > 0) {
    const row = existing[0]
    return {
      id: row.id,
      userId: row.user_id,
      subdomainId: row.subdomain_id,
      items: row.items as ChecklistItem[],
      dismissed: row.dismissed,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  // Create new checklist with default items
  const items: ChecklistItem[] = DEFAULT_ITEMS.map((item) => ({
    ...item,
    completed: false,
    completedAt: null,
  }))

  const result = await sql`
    INSERT INTO onboarding_checklists (id, user_id, subdomain_id, items, dismissed)
    VALUES (
      gen_random_uuid()::text,
      ${userId},
      ${subdomainId},
      ${JSON.stringify(items)}::jsonb,
      false
    )
    ON CONFLICT (user_id, subdomain_id) DO UPDATE SET
      updated_at = NOW()
    RETURNING id, user_id, subdomain_id, items, dismissed, completed_at, created_at, updated_at
  `

  const row = result[0]
  return {
    id: row.id,
    userId: row.user_id,
    subdomainId: row.subdomain_id,
    items: row.items as ChecklistItem[],
    dismissed: row.dismissed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Mark a checklist item as complete
 */
export async function completeItem(
  userId: string,
  subdomainId: number,
  itemKey: string
): Promise<OnboardingChecklist> {
  const checklist = await getOrCreateChecklist(userId, subdomainId)

  const now = new Date().toISOString()
  const updatedItems = checklist.items.map((item) =>
    item.key === itemKey && !item.completed
      ? { ...item, completed: true, completedAt: now }
      : item
  )

  const allComplete = updatedItems.every((item) => item.completed)

  const result = await sql`
    UPDATE onboarding_checklists
    SET items = ${JSON.stringify(updatedItems)}::jsonb,
        completed_at = ${allComplete ? now : null},
        updated_at = NOW()
    WHERE user_id = ${userId} AND subdomain_id = ${subdomainId}
    RETURNING id, user_id, subdomain_id, items, dismissed, completed_at, created_at, updated_at
  `

  const row = result[0]
  return {
    id: row.id,
    userId: row.user_id,
    subdomainId: row.subdomain_id,
    items: row.items as ChecklistItem[],
    dismissed: row.dismissed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Dismiss the onboarding checklist
 */
export async function dismissChecklist(
  userId: string,
  subdomainId: number
): Promise<void> {
  await sql`
    UPDATE onboarding_checklists
    SET dismissed = true, updated_at = NOW()
    WHERE user_id = ${userId} AND subdomain_id = ${subdomainId}
  `
}

/**
 * Get progress stats for a checklist
 */
export function getProgress(items: ChecklistItem[]): {
  completed: number
  total: number
  percentage: number
} {
  const completed = items.filter((item) => item.completed).length
  const total = items.length
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Get default checklist item keys (for reference in other systems)
 */
export function getDefaultItemKeys(): string[] {
  return DEFAULT_ITEMS.map((item) => item.key)
}
