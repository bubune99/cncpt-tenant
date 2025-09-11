"use server"

import { sql } from "@/lib/neon"
import { isValidIcon } from "@/lib/subdomains"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { rootDomain, protocol } from "@/lib/utils"
import { requireAuth } from "@/lib/auth"
import { createDefaultTenantContent } from "@/lib/tenant"

export async function createSubdomainAction(prevState: any, formData: FormData) {
  const user = await requireAuth()

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

  const result = await sql`
    INSERT INTO subdomains (subdomain, emoji, user_id)
    VALUES (${sanitizedSubdomain}, ${icon}, ${user.id})
    RETURNING id
  `

  const tenantId = result[0].id

  await createDefaultTenantContent(tenantId, sanitizedSubdomain)

  redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`)
}

export async function deleteSubdomainAction(prevState: any, formData: FormData) {
  const user = await requireAuth()
  const subdomain = formData.get("subdomain")

  await sql`
    DELETE FROM subdomains 
    WHERE subdomain = ${subdomain} AND user_id = ${user.id}
  `

  revalidatePath("/dashboard")
  return { success: "Domain deleted successfully" }
}

export async function getUserSubdomains() {
  const user = await requireAuth()

  const subdomains = await sql`
    SELECT s.subdomain, s.emoji, s.created_at
    FROM subdomains s
    WHERE s.user_id = ${user.id}
    ORDER BY s.created_at DESC
  `

  return subdomains
}

export async function updateSubdomainAction(prevState: any, formData: FormData) {
  const user = await requireAuth()
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
