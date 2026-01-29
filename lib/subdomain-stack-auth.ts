import { StackServerApp, StackClientApp } from "@stackframe/stack"
import { sql } from "@/lib/neon"
import { cache } from "react"

// =============================================================================
// TYPES
// =============================================================================

export interface SubdomainAuthConfig {
  id: string
  subdomain: string
  stack_auth_project_id: string
  stack_auth_publishable_key: string
  stack_auth_secret_key: string | null
  stack_auth_base_url: string | null
  branding_logo_url: string | null
  branding_primary_color: string
  branding_name: string | null
  enable_social_auth: boolean
  enable_magic_link: boolean
  enable_password_auth: boolean
  created_at: Date
  updated_at: Date
}

// Client-safe config (no secret key)
export interface SubdomainAuthConfigPublic {
  subdomain: string
  stack_auth_project_id: string
  stack_auth_publishable_key: string
  stack_auth_base_url: string | null
  branding_logo_url: string | null
  branding_primary_color: string
  branding_name: string | null
  enable_social_auth: boolean
  enable_magic_link: boolean
  enable_password_auth: boolean
}

// =============================================================================
// DATABASE QUERIES (React cached for deduplication)
// =============================================================================

/**
 * Get full auth config for a subdomain (server-only, includes secret key)
 */
export const getSubdomainAuthConfig = cache(
  async (subdomain: string): Promise<SubdomainAuthConfig | null> => {
    try {
      const result = await sql`
        SELECT * FROM subdomain_auth_config WHERE subdomain = ${subdomain}
      `

      if (result.length === 0) return null

      const row = result[0]
      return {
        id: row.id as string,
        subdomain: row.subdomain as string,
        stack_auth_project_id: row.stack_auth_project_id as string,
        stack_auth_publishable_key: row.stack_auth_publishable_key as string,
        stack_auth_secret_key: row.stack_auth_secret_key as string | null,
        stack_auth_base_url: row.stack_auth_base_url as string | null,
        branding_logo_url: row.branding_logo_url as string | null,
        branding_primary_color: (row.branding_primary_color as string) || "#0891b2",
        branding_name: row.branding_name as string | null,
        enable_social_auth: row.enable_social_auth as boolean,
        enable_magic_link: row.enable_magic_link as boolean,
        enable_password_auth: row.enable_password_auth as boolean,
        created_at: new Date(row.created_at as string),
        updated_at: new Date(row.updated_at as string),
      }
    } catch (error) {
      console.error("[subdomain-auth] Error fetching auth config:", error)
      return null
    }
  }
)

/**
 * Get public auth config for a subdomain (safe to pass to client)
 */
export const getSubdomainAuthConfigPublic = cache(
  async (subdomain: string): Promise<SubdomainAuthConfigPublic | null> => {
    const config = await getSubdomainAuthConfig(subdomain)
    if (!config) return null

    // Return only client-safe fields
    return {
      subdomain: config.subdomain,
      stack_auth_project_id: config.stack_auth_project_id,
      stack_auth_publishable_key: config.stack_auth_publishable_key,
      stack_auth_base_url: config.stack_auth_base_url,
      branding_logo_url: config.branding_logo_url,
      branding_primary_color: config.branding_primary_color,
      branding_name: config.branding_name,
      enable_social_auth: config.enable_social_auth,
      enable_magic_link: config.enable_magic_link,
      enable_password_auth: config.enable_password_auth,
    }
  }
)

// =============================================================================
// STACK AUTH FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a StackServerApp for a specific subdomain's auth configuration
 * Use this in server components and API routes
 */
export function createSubdomainStackServerApp(
  config: SubdomainAuthConfig
): StackServerApp {
  if (!config.stack_auth_secret_key) {
    throw new Error(
      `[subdomain-auth] Secret key not configured for subdomain: ${config.subdomain}`
    )
  }

  const options: ConstructorParameters<typeof StackServerApp>[0] = {
    projectId: config.stack_auth_project_id,
    publishableClientKey: config.stack_auth_publishable_key,
    secretServerKey: config.stack_auth_secret_key,
    tokenStore: "nextjs-cookie",
  }

  // Add custom base URL for self-hosted Stack Auth
  if (config.stack_auth_base_url) {
    options.urls = {
      api: config.stack_auth_base_url,
    }
  }

  return new StackServerApp(options)
}

/**
 * Create a StackClientApp for a specific subdomain's auth configuration
 * Use this in client components via SubdomainStackProvider
 */
export function createSubdomainStackClientApp(
  config: SubdomainAuthConfigPublic
): StackClientApp {
  const options: ConstructorParameters<typeof StackClientApp>[0] = {
    projectId: config.stack_auth_project_id,
    publishableClientKey: config.stack_auth_publishable_key,
    tokenStore: "nextjs-cookie",
  }

  // Add custom base URL for self-hosted Stack Auth
  if (config.stack_auth_base_url) {
    options.urls = {
      api: config.stack_auth_base_url,
    }
  }

  return new StackClientApp(options)
}

// =============================================================================
// ADMIN OPERATIONS (for auth config management)
// =============================================================================

export interface CreateSubdomainAuthConfigInput {
  subdomain: string
  stack_auth_project_id: string
  stack_auth_publishable_key: string
  stack_auth_secret_key?: string
  stack_auth_base_url?: string
  branding_logo_url?: string
  branding_primary_color?: string
  branding_name?: string
  enable_social_auth?: boolean
  enable_magic_link?: boolean
  enable_password_auth?: boolean
  created_by?: string
}

/**
 * Create or update subdomain auth configuration
 */
export async function upsertSubdomainAuthConfig(
  input: CreateSubdomainAuthConfigInput,
  updatedBy?: string
): Promise<SubdomainAuthConfig | null> {
  try {
    const result = await sql`
      INSERT INTO subdomain_auth_config (
        subdomain,
        stack_auth_project_id,
        stack_auth_publishable_key,
        stack_auth_secret_key,
        stack_auth_base_url,
        branding_logo_url,
        branding_primary_color,
        branding_name,
        enable_social_auth,
        enable_magic_link,
        enable_password_auth,
        created_by,
        updated_by
      ) VALUES (
        ${input.subdomain},
        ${input.stack_auth_project_id},
        ${input.stack_auth_publishable_key},
        ${input.stack_auth_secret_key || null},
        ${input.stack_auth_base_url || null},
        ${input.branding_logo_url || null},
        ${input.branding_primary_color || "#0891b2"},
        ${input.branding_name || null},
        ${input.enable_social_auth ?? true},
        ${input.enable_magic_link ?? true},
        ${input.enable_password_auth ?? true},
        ${input.created_by || null},
        ${updatedBy || null}
      )
      ON CONFLICT (subdomain) DO UPDATE SET
        stack_auth_project_id = EXCLUDED.stack_auth_project_id,
        stack_auth_publishable_key = EXCLUDED.stack_auth_publishable_key,
        stack_auth_secret_key = COALESCE(EXCLUDED.stack_auth_secret_key, subdomain_auth_config.stack_auth_secret_key),
        stack_auth_base_url = EXCLUDED.stack_auth_base_url,
        branding_logo_url = EXCLUDED.branding_logo_url,
        branding_primary_color = EXCLUDED.branding_primary_color,
        branding_name = EXCLUDED.branding_name,
        enable_social_auth = EXCLUDED.enable_social_auth,
        enable_magic_link = EXCLUDED.enable_magic_link,
        enable_password_auth = EXCLUDED.enable_password_auth,
        updated_by = ${updatedBy || null}
      RETURNING *
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id as string,
      subdomain: row.subdomain as string,
      stack_auth_project_id: row.stack_auth_project_id as string,
      stack_auth_publishable_key: row.stack_auth_publishable_key as string,
      stack_auth_secret_key: row.stack_auth_secret_key as string | null,
      stack_auth_base_url: row.stack_auth_base_url as string | null,
      branding_logo_url: row.branding_logo_url as string | null,
      branding_primary_color: (row.branding_primary_color as string) || "#0891b2",
      branding_name: row.branding_name as string | null,
      enable_social_auth: row.enable_social_auth as boolean,
      enable_magic_link: row.enable_magic_link as boolean,
      enable_password_auth: row.enable_password_auth as boolean,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    }
  } catch (error) {
    console.error("[subdomain-auth] Error upserting auth config:", error)
    return null
  }
}

/**
 * Delete subdomain auth configuration
 */
export async function deleteSubdomainAuthConfig(
  subdomain: string
): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM subdomain_auth_config WHERE subdomain = ${subdomain}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error("[subdomain-auth] Error deleting auth config:", error)
    return false
  }
}
