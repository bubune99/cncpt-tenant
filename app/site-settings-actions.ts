"use server"

import { stackServerApp } from "@/stack"
import { sql } from "@/lib/neon"
import { revalidatePath } from "next/cache"

// Helper to get current user from Stack Auth
async function getCurrentUser() {
  const user = await stackServerApp.getUser()
  return user
}

export interface SiteSettings {
  id: string
  subdomain: string

  // General
  site_title: string | null
  site_tagline: string | null
  site_description: string | null
  visibility: "public" | "private" | "maintenance"

  // Appearance
  primary_color: string
  secondary_color: string
  accent_color: string
  font_heading: string
  font_body: string
  theme_preset: string

  // SEO
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  favicon_url: string | null
  robots_txt: string | null
  sitemap_enabled: boolean

  // Security
  password_protected: boolean
  security_headers_enabled: boolean

  // Frontend VPS (Dokploy)
  frontend_enabled: boolean
  frontend_app_id: string | null
  frontend_domain: string | null
  frontend_status: "not_deployed" | "deploying" | "running" | "stopped" | "error"
  frontend_last_deployed_at: string | null
  frontend_env_vars: Record<string, string>

  created_at: string
  updated_at: string
}

export interface GeneralSettings {
  site_title: string
  site_tagline: string
  site_description: string
  visibility: "public" | "private" | "maintenance"
}

export interface AppearanceSettings {
  primary_color: string
  secondary_color: string
  accent_color: string
  font_heading: string
  font_body: string
  theme_preset: string
}

export interface SeoSettings {
  meta_title: string
  meta_description: string
  og_image_url: string
  favicon_url: string
  sitemap_enabled: boolean
}

export interface SecuritySettings {
  password_protected: boolean
  password: string | null
  security_headers_enabled: boolean
}

export interface FrontendSettings {
  frontend_enabled: boolean
  frontend_domain: string
  frontend_env_vars: Record<string, string>
}

// Ensure table exists
async function ensureSiteSettingsTableExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subdomain VARCHAR(255) NOT NULL UNIQUE,
      site_title VARCHAR(255),
      site_tagline VARCHAR(500),
      site_description TEXT,
      visibility VARCHAR(50) DEFAULT 'public',
      primary_color VARCHAR(7) DEFAULT '#3b82f6',
      secondary_color VARCHAR(7) DEFAULT '#6b7280',
      accent_color VARCHAR(7) DEFAULT '#10b981',
      font_heading VARCHAR(100) DEFAULT 'Inter',
      font_body VARCHAR(100) DEFAULT 'Inter',
      theme_preset VARCHAR(50) DEFAULT 'default',
      meta_title VARCHAR(255),
      meta_description TEXT,
      og_image_url TEXT,
      favicon_url TEXT,
      robots_txt TEXT,
      sitemap_enabled BOOLEAN DEFAULT true,
      password_protected BOOLEAN DEFAULT false,
      password_hash TEXT,
      security_headers_enabled BOOLEAN DEFAULT true,
      frontend_enabled BOOLEAN DEFAULT false,
      frontend_app_id VARCHAR(255),
      frontend_domain VARCHAR(255),
      frontend_status VARCHAR(50) DEFAULT 'not_deployed',
      frontend_last_deployed_at TIMESTAMP WITH TIME ZONE,
      frontend_env_vars JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
}

// Get settings for a subdomain
export async function getSiteSettings(subdomain: string): Promise<SiteSettings | null> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    await ensureSiteSettingsTableExists()

    const result = await sql`
      SELECT * FROM site_settings WHERE subdomain = ${subdomain}
    `

    if (result.length === 0) {
      // Create default settings
      const newSettings = await sql`
        INSERT INTO site_settings (subdomain)
        VALUES (${subdomain})
        RETURNING *
      `
      return newSettings[0] as SiteSettings
    }

    return result[0] as SiteSettings
  } catch (error) {
    console.error("Failed to get site settings:", error)
    throw error
  }
}

// Update general settings
export async function updateGeneralSettings(
  subdomain: string,
  settings: GeneralSettings
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    await ensureSiteSettingsTableExists()

    // Upsert settings
    await sql`
      INSERT INTO site_settings (subdomain, site_title, site_tagline, site_description, visibility)
      VALUES (${subdomain}, ${settings.site_title}, ${settings.site_tagline}, ${settings.site_description}, ${settings.visibility})
      ON CONFLICT (subdomain) DO UPDATE SET
        site_title = ${settings.site_title},
        site_tagline = ${settings.site_tagline},
        site_description = ${settings.site_description},
        visibility = ${settings.visibility},
        updated_at = NOW()
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update general settings:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to save settings" }
  }
}

// Update appearance settings
export async function updateAppearanceSettings(
  subdomain: string,
  settings: AppearanceSettings
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    await ensureSiteSettingsTableExists()

    await sql`
      INSERT INTO site_settings (subdomain, primary_color, secondary_color, accent_color, font_heading, font_body, theme_preset)
      VALUES (${subdomain}, ${settings.primary_color}, ${settings.secondary_color}, ${settings.accent_color}, ${settings.font_heading}, ${settings.font_body}, ${settings.theme_preset})
      ON CONFLICT (subdomain) DO UPDATE SET
        primary_color = ${settings.primary_color},
        secondary_color = ${settings.secondary_color},
        accent_color = ${settings.accent_color},
        font_heading = ${settings.font_heading},
        font_body = ${settings.font_body},
        theme_preset = ${settings.theme_preset},
        updated_at = NOW()
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update appearance settings:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to save settings" }
  }
}

// Update SEO settings
export async function updateSeoSettings(
  subdomain: string,
  settings: SeoSettings
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    await ensureSiteSettingsTableExists()

    await sql`
      INSERT INTO site_settings (subdomain, meta_title, meta_description, og_image_url, favicon_url, sitemap_enabled)
      VALUES (${subdomain}, ${settings.meta_title}, ${settings.meta_description}, ${settings.og_image_url}, ${settings.favicon_url}, ${settings.sitemap_enabled})
      ON CONFLICT (subdomain) DO UPDATE SET
        meta_title = ${settings.meta_title},
        meta_description = ${settings.meta_description},
        og_image_url = ${settings.og_image_url},
        favicon_url = ${settings.favicon_url},
        sitemap_enabled = ${settings.sitemap_enabled},
        updated_at = NOW()
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update SEO settings:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to save settings" }
  }
}

// Update security settings
export async function updateSecuritySettings(
  subdomain: string,
  settings: SecuritySettings
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    await ensureSiteSettingsTableExists()

    // Hash password if provided
    let passwordHash = null
    if (settings.password_protected && settings.password) {
      // Simple hash for demo - in production use bcrypt
      passwordHash = Buffer.from(settings.password).toString("base64")
    }

    if (passwordHash) {
      await sql`
        INSERT INTO site_settings (subdomain, password_protected, password_hash, security_headers_enabled)
        VALUES (${subdomain}, ${settings.password_protected}, ${passwordHash}, ${settings.security_headers_enabled})
        ON CONFLICT (subdomain) DO UPDATE SET
          password_protected = ${settings.password_protected},
          password_hash = ${passwordHash},
          security_headers_enabled = ${settings.security_headers_enabled},
          updated_at = NOW()
      `
    } else {
      await sql`
        INSERT INTO site_settings (subdomain, password_protected, security_headers_enabled)
        VALUES (${subdomain}, ${settings.password_protected}, ${settings.security_headers_enabled})
        ON CONFLICT (subdomain) DO UPDATE SET
          password_protected = ${settings.password_protected},
          security_headers_enabled = ${settings.security_headers_enabled},
          updated_at = NOW()
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update security settings:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to save settings" }
  }
}

// Update frontend VPS settings (Dokploy)
export async function updateFrontendSettings(
  subdomain: string,
  settings: FrontendSettings
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    await ensureSiteSettingsTableExists()

    await sql`
      INSERT INTO site_settings (subdomain, frontend_enabled, frontend_domain, frontend_env_vars)
      VALUES (${subdomain}, ${settings.frontend_enabled}, ${settings.frontend_domain}, ${JSON.stringify(settings.frontend_env_vars)})
      ON CONFLICT (subdomain) DO UPDATE SET
        frontend_enabled = ${settings.frontend_enabled},
        frontend_domain = ${settings.frontend_domain},
        frontend_env_vars = ${JSON.stringify(settings.frontend_env_vars)},
        updated_at = NOW()
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update frontend settings:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to save settings" }
  }
}

// Update frontend deployment status (called by Dokploy webhook or polling)
export async function updateFrontendStatus(
  subdomain: string,
  status: "not_deployed" | "deploying" | "running" | "stopped" | "error",
  appId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureSiteSettingsTableExists()

    if (appId) {
      await sql`
        UPDATE site_settings
        SET
          frontend_status = ${status},
          frontend_app_id = ${appId},
          frontend_last_deployed_at = ${status === "running" ? new Date().toISOString() : null},
          updated_at = NOW()
        WHERE subdomain = ${subdomain}
      `
    } else {
      await sql`
        UPDATE site_settings
        SET
          frontend_status = ${status},
          frontend_last_deployed_at = ${status === "running" ? new Date().toISOString() : null},
          updated_at = NOW()
        WHERE subdomain = ${subdomain}
      `
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update frontend status:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update status" }
  }
}
