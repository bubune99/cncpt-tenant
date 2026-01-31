import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { canAccessSubdomain } from "@/lib/team-auth"
import {
  getSubdomainAuthConfigPublic,
  getSubdomainAuthConfig,
  upsertSubdomainAuthConfig,
  deleteSubdomainAuthConfig,
  type CreateSubdomainAuthConfigInput,
} from "@/lib/subdomain-stack-auth"

export const dynamic = 'force-dynamic'

// =============================================================================
// GET - Fetch auth config (excludes secret key for non-owners)
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check subdomain access (admin level required)
    const access = await canAccessSubdomain(user.id, subdomain, "admin")

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "No access to this subdomain" },
        { status: 403 }
      )
    }

    // Owners get full config (including masked secret), others get public config
    if (access.accessType === "owner") {
      const config = await getSubdomainAuthConfig(subdomain)

      if (!config) {
        return NextResponse.json(
          { error: "Auth config not found", exists: false },
          { status: 404 }
        )
      }

      // Mask the secret key for security (show only last 4 chars)
      return NextResponse.json({
        ...config,
        stack_auth_secret_key: config.stack_auth_secret_key
          ? `sk_***${config.stack_auth_secret_key.slice(-4)}`
          : null,
        exists: true,
      })
    }

    // Team members get public config only
    const config = await getSubdomainAuthConfigPublic(subdomain)

    if (!config) {
      return NextResponse.json(
        { error: "Auth config not found", exists: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ ...config, exists: true })
  } catch (error) {
    console.error("[api/auth-config] GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT - Create or update auth config (owner/admin only)
// =============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only owners and team admins can modify auth config
    const access = await canAccessSubdomain(user.id, subdomain, "admin")

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "No access to this subdomain" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields for new configs
    const existingConfig = await getSubdomainAuthConfig(subdomain)
    const isNewConfig = !existingConfig

    if (isNewConfig) {
      if (!body.stack_auth_project_id || !body.stack_auth_publishable_key) {
        return NextResponse.json(
          {
            error:
              "stack_auth_project_id and stack_auth_publishable_key are required",
          },
          { status: 400 }
        )
      }
    }

    const input: CreateSubdomainAuthConfigInput = {
      subdomain,
      stack_auth_project_id:
        body.stack_auth_project_id || existingConfig?.stack_auth_project_id,
      stack_auth_publishable_key:
        body.stack_auth_publishable_key ||
        existingConfig?.stack_auth_publishable_key,
      stack_auth_secret_key: body.stack_auth_secret_key, // Only set if provided
      stack_auth_base_url: body.stack_auth_base_url,
      branding_logo_url: body.branding_logo_url,
      branding_primary_color: body.branding_primary_color,
      branding_name: body.branding_name,
      enable_social_auth: body.enable_social_auth,
      enable_magic_link: body.enable_magic_link,
      enable_password_auth: body.enable_password_auth,
      created_by: isNewConfig ? user.id : undefined,
    }

    const config = await upsertSubdomainAuthConfig(input, user.id)

    if (!config) {
      return NextResponse.json(
        { error: "Failed to save auth config" },
        { status: 500 }
      )
    }

    // Return config with masked secret
    return NextResponse.json({
      ...config,
      stack_auth_secret_key: config.stack_auth_secret_key
        ? `sk_***${config.stack_auth_secret_key.slice(-4)}`
        : null,
      created: isNewConfig,
    })
  } catch (error) {
    console.error("[api/auth-config] PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE - Remove auth config (owner only)
// =============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only owners can delete auth config
    const access = await canAccessSubdomain(user.id, subdomain, "admin")

    if (!access.hasAccess || access.accessType !== "owner") {
      return NextResponse.json(
        { error: "Only subdomain owners can delete auth config" },
        { status: 403 }
      )
    }

    const deleted = await deleteSubdomainAuthConfig(subdomain)

    if (!deleted) {
      return NextResponse.json(
        { error: "Auth config not found or already deleted" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error("[api/auth-config] DELETE error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
