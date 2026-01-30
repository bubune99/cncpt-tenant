"use server"

import { redis } from "@/lib/redis"
import { prisma } from "@cncpt/cms/lib"
import { isValidIcon } from "@/lib/subdomains"
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
  const icon = formData.get("icon") as string
  const siteName = formData.get("siteName") as string || subdomain
  const contactEmail = formData.get("contactEmail") as string || user.primaryEmail || ""

  if (!subdomain) {
    return { success: false, error: "Subdomain is required" }
  }

  // Icon is now optional - use default if not provided
  const emoji = icon && isValidIcon(icon) ? icon : "🌐"

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      icon,
      success: false,
      error: "Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.",
    }
  }

  // Check minimum length
  if (sanitizedSubdomain.length < 3) {
    return {
      subdomain,
      icon,
      success: false,
      error: "Subdomain must be at least 3 characters long.",
    }
  }

  // Check reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(sanitizedSubdomain)) {
    return {
      subdomain,
      icon,
      success: false,
      error: "This subdomain is reserved. Please choose another.",
    }
  }

  // Check plan limits
  const canCreate = await canCreateSubdomain(user.id)
  if (!canCreate.allowed) {
    return {
      subdomain,
      icon,
      success: false,
      error: canCreate.reason || "You have reached your subdomain limit. Please upgrade your plan.",
      code: "PLAN_LIMIT_REACHED",
      usage: canCreate.usage,
    }
  }

  try {
    // Check if subdomain exists in database using Prisma
    const existingDb = await prisma.subdomain.findUnique({
      where: { subdomain: sanitizedSubdomain },
      select: { id: true },
    })

    if (existingDb) {
      return {
        subdomain,
        icon,
        success: false,
        error: "This subdomain is already taken",
      }
    }

    // Also check Redis for legacy subdomains (backwards compatibility)
    const existingRedis = await redis.get(`subdomain:${sanitizedSubdomain}`)
    if (existingRedis) {
      return {
        subdomain,
        icon,
        success: false,
        error: "This subdomain is already taken",
      }
    }

    // Create subdomain in database using Prisma
    const newSubdomain = await prisma.subdomain.create({
      data: {
        userId: user.id,
        subdomain: sanitizedSubdomain,
        emoji,
      },
    })

    // Also store in Redis for backwards compatibility during migration
    await redis.set(`subdomain:${sanitizedSubdomain}`, {
      emoji,
      siteName,
      createdAt: Date.now(),
      userId: user.id,
    })

    // Create default tenant settings using Prisma
    try {
      await prisma.tenantSetting.upsert({
        where: { tenantId: newSubdomain.id },
        update: {},
        create: {
          tenantId: newSubdomain.id,
          siteTitle: siteName,
          siteDescription: "Welcome to my site",
        },
      })
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
      icon,
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
    // Delete from database using Prisma (only if owned by user)
    const deleted = await prisma.subdomain.deleteMany({
      where: {
        subdomain,
        userId: user.id,
      },
    })

    if (deleted.count === 0) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    // Also delete from Redis for backwards compatibility
    await redis.del(`subdomain:${subdomain}`)

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
    console.log("[actions] getUserSubdomains: No user found")
    return []
  }

  console.log("[actions] getUserSubdomains: Fetching for user:", user.id)

  try {
    // Get subdomains from database using Prisma
    const dbSubdomains = await prisma.subdomain.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        subdomain: true,
        emoji: true,
        createdAt: true,
      },
    })

    console.log("[actions] getUserSubdomains: Prisma returned:", dbSubdomains.length, "subdomains")

    if (dbSubdomains.length > 0) {
      return dbSubdomains.map((row) => ({
        subdomain: row.subdomain,
        emoji: row.emoji || "❓",
        created_at: row.createdAt,
      }))
    }

    // Fallback to Redis for legacy subdomains
    console.log("[actions] getUserSubdomains: Trying Redis fallback")
    try {
      const keys = await redis.keys("subdomain:*")
      if (!keys.length) {
        console.log("[actions] getUserSubdomains: No Redis keys found")
        return []
      }

      const values = await redis.mget(...keys)
      const userSubdomains = keys
        .map((key, index) => {
          const subdomain = key.replace("subdomain:", "")
          const data = values[index] as any
          if (data?.userId === user.id) {
            return {
              subdomain,
              emoji: data.emoji || "❓",
              created_at: new Date(data.createdAt || Date.now()),
            }
          }
          return null
        })
        .filter(Boolean)

      console.log("[actions] getUserSubdomains: Redis returned:", userSubdomains.length, "subdomains")
      return userSubdomains
    } catch (redisError) {
      console.warn("[actions] Redis fallback failed:", redisError)
      return []
    }
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
  const newIcon = formData.get("icon") as string

  if (!newIcon) {
    return { success: false, error: "Icon is required" }
  }

  if (!isValidIcon(newIcon)) {
    return {
      success: false,
      error: "Please enter a valid emoji (maximum 10 characters)",
    }
  }

  const existingData = (await redis.get(`subdomain:${originalSubdomain}`)) as any
  if (existingData && existingData.userId === user.id) {
    await redis.set(`subdomain:${originalSubdomain}`, {
      ...existingData,
      emoji: newIcon,
    })
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
    const existingData = (await redis.get(`subdomain:${subdomain}`)) as any
    if (!existingData || existingData.userId !== user.id) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    await redis.set(`subdomain:${subdomain}`, {
      ...existingData,
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
    const data = (await redis.get(`subdomain:${subdomain}`)) as any
    if (!data || data.userId !== user.id) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    return {
      success: true,
      customCSS: data.customCSS || "",
      customJS: data.customJS || "",
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
    const existingData = (await redis.get(`subdomain:${subdomain}`)) as any
    if (!existingData || existingData.userId !== user.id) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    // Generate a random API key
    const apiKey = `sk_live_${crypto.randomUUID().replace(/-/g, "")}`

    await redis.set(`subdomain:${subdomain}`, {
      ...existingData,
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
    const data = (await redis.get(`subdomain:${subdomain}`)) as any
    if (!data || data.userId !== user.id) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    return {
      success: true,
      apiKey: data.apiKey || null,
      createdAt: data.apiKeyCreatedAt || null,
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
    const existingData = (await redis.get(`subdomain:${subdomain}`)) as any
    if (!existingData || existingData.userId !== user.id) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    await redis.set(`subdomain:${subdomain}`, {
      ...existingData,
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
    const data = (await redis.get(`subdomain:${subdomain}`)) as any
    if (!data || data.userId !== user.id) {
      return { success: false, error: "Subdomain not found or access denied" }
    }

    return {
      success: true,
      webhookUrl: data.webhookUrl || "",
    }
  } catch (error) {
    console.error("[v0] Error loading webhook URL:", error)
    return { success: false, error: "Failed to load webhook URL" }
  }
}
