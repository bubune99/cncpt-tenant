"use server"

import { sql } from "@/lib/neon"
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

  const existingSubdomain = await sql`
    SELECT subdomain FROM subdomains WHERE subdomain = ${sanitizedSubdomain}
  `

  if (existingSubdomain.length > 0) {
    return {
      subdomain,
      icon,
      success: false,
      error: "This subdomain is already taken",
    }
  }

  try {
    await sql`
      INSERT INTO users (id, email, name, password_hash) 
      VALUES (${user.id}, ${user.primaryEmail || user.clientMetadata?.email || "unknown@example.com"}, ${user.displayName || "Unknown User"}, NULL)
      ON CONFLICT (id) DO NOTHING
    `

    const result = await sql`
      INSERT INTO subdomains (subdomain, emoji, user_id)
      VALUES (${sanitizedSubdomain}, ${icon}, ${user.id})
      RETURNING id
    `

    const subdomainId = result[0].id

    await sql`
      INSERT INTO tenant_settings (tenant_id, site_title, site_description)
      VALUES (${subdomainId}, ${`${sanitizedSubdomain} Site`}, ${`Welcome to ${sanitizedSubdomain}`})
      ON CONFLICT (tenant_id) DO NOTHING
    `

    await sql`
      INSERT INTO tenant_pages (tenant_id, title, content, slug, published)
      VALUES (
        ${subdomainId}, 
        'Home', 
        ${`<h1>Welcome to ${sanitizedSubdomain}</h1><p>This is your custom subdomain site. You can customize this content from your dashboard.</p>`},
        'home',
        true
      )
      ON CONFLICT (tenant_id, slug) DO NOTHING
    `

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

  await sql`
    DELETE FROM subdomains 
    WHERE subdomain = ${subdomain} AND user_id = ${user.id}
  `

  revalidatePath("/dashboard")
  return { success: "Domain deleted successfully" }
}

export async function getUserSubdomains() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return []
  }

  try {
    await sql`
      INSERT INTO users (id, email, name, password_hash) 
      VALUES (${user.id}, ${user.primaryEmail || user.clientMetadata?.email || "unknown@example.com"}, ${user.displayName || "Unknown User"}, NULL)
      ON CONFLICT (id) DO NOTHING
    `

    const subdomains = await sql`
      SELECT s.subdomain, s.emoji, s.created_at
      FROM subdomains s
      WHERE s.user_id = ${user.id}
      ORDER BY s.created_at DESC
    `

    return subdomains || []
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

  await sql`
    UPDATE subdomains 
    SET emoji = ${newIcon}
    WHERE subdomain = ${originalSubdomain} AND user_id = ${user.id}
  `

  revalidatePath("/dashboard")
  return { success: true, message: "Subdomain updated successfully" }
}
