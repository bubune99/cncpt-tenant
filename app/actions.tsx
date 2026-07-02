"use server"

import { sql } from "@/lib/neon"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { rootDomain, protocol } from "@/lib/utils"
import { stackServerApp } from "@/stack"
import { canCreateSubdomain } from "@/lib/subscription"

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  "www", "app", "api", "admin", "dashboard", "mail", "email",
  "ftp", "blog", "shop", "store", "help", "support", "docs",
  "dev", "staging", "test", "demo",
]

/**
 * Load the feature_config JSONB for a subdomain, enforcing owner access.
 * Returns the config object (empty object when unset) if the caller owns the
 * subdomain, or null when the subdomain does not exist or is owned by someone else.
 */
async function getSubdomainFeatureConfig(
  subdomain: string,
  userId: string
): Promise<Record<string, unknown> | null> {
  const rows = await sql`
    SELECT user_id, feature_config FROM subdomains WHERE subdomain = ${subdomain}
  `
  if (rows.length === 0 || rows[0].user_id !== userId) {
    return null
  }
  return (rows[0].feature_config as Record<string, unknown> | null) ?? {}
}

/**
 * Persist a feature_config JSONB payload for a subdomain.
 */
async function saveSubdomainFeatureConfig(
  subdomain: string,
  config: Record<string, unknown>
): Promise<void> {
  await sql`
    UPDATE subdomains
    SET feature_config = ${JSON.stringify(config)}::jsonb, updated_at = now()
    WHERE subdomain = ${subdomain}
  `
}

/**
 * Legacy form-based subdomain creation action
 * Note: The new create-subdomain page uses the API directly
 * This action is kept for backward compatibility
 */
export async function createSubdomainAction(prevState: any, formData: FormData) {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/login")
  }

  const subdomain = formData.get("subdomain") as string
  const siteName = formData.get("siteName") as string || subdomain
  const contactEmail = formData.get("contactEmail") as string || user.primaryEmail || ""

  if (!subdomain) {
    return { success: false, error: "Subdomain is required" }
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      success: false,
      error: "Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.",
    }
  }

  // Check minimum length
  if (sanitizedSubdomain.length < 3) {
    return {
      subdomain,
      success: false,
      error: "Subdomain must be at least 3 characters long.",
    }
  }

  // Check reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(sanitizedSubdomain)) {
    return {
      subdomain,
      success: false,
      error: "This subdomain is reserved. Please choose another.",
    }
  }

  // Check plan limits
  const canCreate = await canCreateSubdomain(user.id)
  if (!canCreate.allowed) {
    return {
      subdomain,
      success: false,
      error: canCreate.reason || "You have reached your subdomain limit. Please upgrade your plan.",
      code: "PLAN_LIMIT_REACHED",
      usage: canCreate.usage,
    }
  }

  try {
    // Check if subdomain exists in database
    const existingDb = await sql`
      SELECT id FROM subdomains WHERE subdomain = ${sanitizedSubdomain}
    `

    if (existingDb.length > 0) {
      return {
        subdomain,
        success: false,
        error: "This subdomain is already taken",
      }
    }

    // Create subdomain in database with configuration
    await sql`
      INSERT INTO subdomains (user_id, subdomain, site_name, contact_email, onboarding_completed)
      VALUES (${user.id}, ${sanitizedSubdomain}, ${siteName}, ${contactEmail}, false)
    `

    // Create default tenant settings
    try {
      await sql`
        INSERT INTO tenant_settings (subdomain, site_name, site_description, contact_email)
        VALUES (${sanitizedSubdomain}, ${siteName}, 'Welcome to my site', ${contactEmail})
        ON CONFLICT (subdomain) DO NOTHING
      `
    } catch (settingsError) {
      console.warn("[actions] Failed to create tenant settings:", settingsError)
    }

    return {
      success: true,
      redirectUrl: `${protocol}://${sanitizedSubdomain}.${rootDomain}`,
      subdomain: sanitizedSubdomain,
    }
  } catch (error) {
    console.error("[actions] Error creating subdomain:", error)
    return {
      subdomain,
      success: false,
      error: "Failed to create subdomain. Please try again.",
    }
  }
}

export async function deleteSubdomainAction(prevState: any, formData: FormData) {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/login")
  }
  const subdomain = formData.get("subdomain") as string

  if (!subdomain) {
    return { success: false, error: "Subdomain is required" }
  }

  try {
    // Delete from database (only if owned by user)
    const result = await sql`
      DELETE FROM subdomains
      WHERE subdomain = ${subdomain} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    // Clean up tenant settings
    try {
      await sql`DELETE FROM tenant_settings WHERE subdomain = ${subdomain}`
    } catch (settingsError) {
      console.warn("[actions] Failed to delete tenant settings:", settingsError)
    }

    revalidatePath("/dashboard")
    return { success: true, message: "Subdomain deleted successfully" }
  } catch (error) {
    console.error("[actions] Error deleting subdomain:", error)
    return { success: false, error: "Failed to delete subdomain" }
  }
}

export async function getUserSubdomains() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return []
  }

  try {
    // Get subdomains from database
    const dbSubdomains = await sql`
      SELECT subdomain, created_at
      FROM subdomains
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    return dbSubdomains.map((row) => ({
      subdomain: row.subdomain as string,
      created_at: new Date(row.created_at as string),
    }))
  } catch (error) {
    console.error("[actions] Error fetching subdomains:", error)
    return []
  }
}

export async function updateSubdomainAction(prevState: any, formData: FormData) {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/login")
  }

  const originalSubdomain = formData.get("originalSubdomain") as string

  const rows = await sql`
    SELECT user_id FROM subdomains WHERE subdomain = ${originalSubdomain}
  `
  if (rows.length === 0 || rows[0].user_id !== user.id) {
    return { success: false, error: "Subdomain not found or access denied" }
  }

  revalidatePath("/dashboard")
  return { success: true, message: "Subdomain updated successfully" }
}

// Developer Tools - Custom Code
export async function saveCustomCode(subdomain: string, customCSS: string, customJS: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const config = await getSubdomainFeatureConfig(subdomain, user.id)
    if (!config) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    await saveSubdomainFeatureConfig(subdomain, {
      ...config,
      customCSS,
      customJS,
      updatedAt: Date.now(),
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Custom code saved successfully" }
  } catch (error) {
    console.error("[v0] Error saving custom code:", error)
    return { success: false, error: "Failed to save custom code" }
  }
}

export async function getCustomCode(subdomain: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const config = await getSubdomainFeatureConfig(subdomain, user.id)
    if (!config) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    return {
      success: true,
      customCSS: (config.customCSS as string) || "",
      customJS: (config.customJS as string) || "",
    }
  } catch (error) {
    console.error("[v0] Error loading custom code:", error)
    return { success: false, error: "Failed to load custom code" }
  }
}

// Developer Tools - API Keys
export async function generateApiKey(subdomain: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const config = await getSubdomainFeatureConfig(subdomain, user.id)
    if (!config) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    // Generate a random API key
    const apiKey = `sk_live_${crypto.randomUUID().replace(/-/g, "")}`

    await saveSubdomainFeatureConfig(subdomain, {
      ...config,
      apiKey,
      apiKeyCreatedAt: Date.now(),
    })

    revalidatePath("/dashboard")
    return { success: true, apiKey }
  } catch (error) {
    console.error("[v0] Error generating API key:", error)
    return { success: false, error: "Failed to generate API key" }
  }
}

export async function getApiKey(subdomain: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const config = await getSubdomainFeatureConfig(subdomain, user.id)
    if (!config) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    return {
      success: true,
      apiKey: (config.apiKey as string) || null,
      createdAt: (config.apiKeyCreatedAt as number) || null,
    }
  } catch (error) {
    console.error("[v0] Error loading API key:", error)
    return { success: false, error: "Failed to load API key" }
  }
}

export async function saveWebhookUrl(subdomain: string, webhookUrl: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const config = await getSubdomainFeatureConfig(subdomain, user.id)
    if (!config) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    await saveSubdomainFeatureConfig(subdomain, {
      ...config,
      webhookUrl,
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Webhook URL saved successfully" }
  } catch (error) {
    console.error("[v0] Error saving webhook URL:", error)
    return { success: false, error: "Failed to save webhook URL" }
  }
}

export async function getWebhookUrl(subdomain: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const config = await getSubdomainFeatureConfig(subdomain, user.id)
    if (!config) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    return {
      success: true,
      webhookUrl: (config.webhookUrl as string) || "",
    }
  } catch (error) {
    console.error("[v0] Error loading webhook URL:", error)
    return { success: false, error: "Failed to load webhook URL" }
  }
}
