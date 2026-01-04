"use server"

import { redis } from "@/lib/redis"
import { isValidIcon } from "@/lib/subdomains"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { rootDomain, protocol } from "@/lib/utils"
import { stackServerApp } from "@/stack"

export async function createSubdomainAction(prevState: any, formData: FormData) {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/login")
  }

  const subdomain = formData.get("subdomain") as string
  const icon = formData.get("icon") as string

  if (!subdomain || !icon) {
    return { success: false, error: "Subdomain and icon are required" }
  }

  if (!isValidIcon(icon)) {
    return {
      subdomain,
      icon,
      success: false,
      error: "Please enter a valid emoji (maximum 10 characters)",
    }
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "")

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      icon,
      success: false,
      error: "Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.",
    }
  }

  const existingSubdomain = await redis.get(`subdomain:${sanitizedSubdomain}`)

  if (existingSubdomain) {
    return {
      subdomain,
      icon,
      success: false,
      error: "This subdomain is already taken",
    }
  }

  try {
    await redis.set(`subdomain:${sanitizedSubdomain}`, {
      emoji: icon,
      createdAt: Date.now(),
      userId: user.id,
    })

    return {
      success: true,
      redirectUrl: `${protocol}://${sanitizedSubdomain}.${rootDomain}`,
      subdomain: sanitizedSubdomain,
    }
  } catch (error) {
    console.error("[v0] Error creating subdomain:", error)
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
  const subdomain = formData.get("subdomain")

  await redis.del(`subdomain:${subdomain}`)

  revalidatePath("/dashboard")
  return { success: "Domain deleted successfully" }
}

export async function getUserSubdomains() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return []
  }

  try {
    const keys = await redis.keys("subdomain:*")
    if (!keys.length) {
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

    return userSubdomains
  } catch (error) {
    console.error("[v0] Error fetching subdomains:", error)
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
