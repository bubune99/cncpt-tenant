/**
 * Subdomain API Routes
 * CRUD operations for user subdomains with plan limit validation
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { canCreateSubdomain, getSubdomainUsage } from "@/lib/subscription"
import { rootDomain, protocol } from "@/lib/utils"

export const dynamic = 'force-dynamic'

// Validation helpers
const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/
const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "mail",
  "email",
  "ftp",
  "blog",
  "shop",
  "store",
  "help",
  "support",
  "docs",
  "dev",
  "staging",
  "test",
  "demo",
]

function isValidSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!subdomain) {
    return { valid: false, error: "Subdomain is required" }
  }

  if (subdomain.length < 3) {
    return { valid: false, error: "Subdomain must be at least 3 characters" }
  }

  if (subdomain.length > 63) {
    return { valid: false, error: "Subdomain must be at most 63 characters" }
  }

  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    return {
      valid: false,
      error: "Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)",
    }
  }

  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return { valid: false, error: "This subdomain is reserved" }
  }

  return { valid: true }
}

function isValidIcon(icon: string): boolean {
  if (!icon || icon.length > 10) return false
  // Allow emoji characters
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Component}]+$/u
  return emojiRegex.test(icon)
}

/**
 * GET /api/dashboard/subdomain
 * List all subdomains for the authenticated user
 */
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subdomains from database
    const subdomains = await sql`
      SELECT
        id,
        subdomain,
        emoji,
        created_at,
        updated_at
      FROM subdomains
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    // Get usage stats
    const usage = await getSubdomainUsage(user.id)

    return NextResponse.json({
      subdomains: subdomains.map((s) => ({
        id: s.id,
        subdomain: s.subdomain,
        emoji: s.emoji || "🌐",
        url: `${protocol}://${s.subdomain}.${rootDomain}`,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        canCreate: usage.canCreate,
      },
    })
  } catch (error) {
    console.error("[subdomain-api] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subdomains" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/subdomain
 * Create a new subdomain for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      // Site configuration
      subdomain,
      siteName,
      siteDescription,
      contactEmail,
      timezone,
      primaryLanguage,
      customDomain,
      // Business insights
      useCase,
      industry,
      referralSource,
      referralOther,
      teamSize,
      techExperience,
      // Legacy support
      icon,
    } = body

    // Validate subdomain
    const sanitizedSubdomain = subdomain?.toLowerCase().trim()
    const validation = isValidSubdomain(sanitizedSubdomain)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Validate required fields
    if (!siteName?.trim()) {
      return NextResponse.json({ error: "Site name is required" }, { status: 400 })
    }

    if (!contactEmail?.trim()) {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 })
    }

    // Check plan limits
    const canCreate = await canCreateSubdomain(user.id)
    if (!canCreate.allowed) {
      return NextResponse.json(
        {
          error: canCreate.reason,
          code: "PLAN_LIMIT_REACHED",
          usage: canCreate.usage,
        },
        { status: 403 }
      )
    }

    // Check if subdomain is already taken
    const existing = await sql`
      SELECT id FROM subdomains WHERE subdomain = ${sanitizedSubdomain}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 409 }
      )
    }

    // Create the subdomain in database with full configuration
    const result = await sql`
      INSERT INTO subdomains (
        user_id,
        subdomain,
        emoji,
        site_name,
        site_description,
        contact_email,
        timezone,
        primary_language,
        custom_domain,
        use_case,
        industry,
        referral_source,
        team_size,
        tech_experience,
        onboarding_completed,
        onboarding_completed_at
      )
      VALUES (
        ${user.id},
        ${sanitizedSubdomain},
        ${icon || "🌐"},
        ${siteName?.trim()},
        ${siteDescription?.trim() || null},
        ${contactEmail?.trim()},
        ${timezone || "UTC"},
        ${primaryLanguage || "en"},
        ${customDomain || null},
        ${useCase || null},
        ${industry || null},
        ${referralSource === "other" ? referralOther : referralSource || null},
        ${teamSize || null},
        ${techExperience || null},
        true,
        NOW()
      )
      RETURNING id, subdomain, site_name, created_at
    `

    const newSubdomain = result[0]

    // Create tenant_settings record with site configuration
    try {
      await sql`
        INSERT INTO tenant_settings (
          subdomain,
          site_name,
          site_description,
          contact_email,
          timezone,
          primary_language
        )
        VALUES (
          ${sanitizedSubdomain},
          ${siteName?.trim()},
          ${siteDescription?.trim() || 'Welcome to my site'},
          ${contactEmail?.trim()},
          ${timezone || 'UTC'},
          ${primaryLanguage || 'en'}
        )
        ON CONFLICT (subdomain) DO UPDATE SET
          site_name = EXCLUDED.site_name,
          site_description = EXCLUDED.site_description,
          contact_email = EXCLUDED.contact_email,
          timezone = EXCLUDED.timezone,
          primary_language = EXCLUDED.primary_language,
          updated_at = NOW()
      `
    } catch (settingsError) {
      console.warn("[subdomain-api] Failed to create tenant_settings:", settingsError)
    }

    // Initialize default features for the subdomain based on tier
    try {
      await initializeSubdomainFeatures(newSubdomain.id as string, user.id)
    } catch (featureError) {
      console.warn("[subdomain-api] Failed to initialize features:", featureError)
    }

    const redirectUrl = `${protocol}://${sanitizedSubdomain}.${rootDomain}`

    return NextResponse.json({
      success: true,
      subdomain: {
        id: newSubdomain.id,
        subdomain: newSubdomain.subdomain,
        siteName: newSubdomain.site_name,
        url: redirectUrl,
        createdAt: newSubdomain.created_at,
      },
      redirectUrl,
    })
  } catch (error) {
    console.error("[subdomain-api] POST error:", error)
    return NextResponse.json(
      { error: "Failed to create subdomain. Please try again." },
      { status: 500 }
    )
  }
}

/**
 * Initialize features for a new subdomain based on user's tier
 */
async function initializeSubdomainFeatures(subdomainId: string, userId: string): Promise<void> {
  try {
    // Get user's tier to determine which features to enable
    const userTier = await sql`
      SELECT t.name as tier_name
      FROM users u
      LEFT JOIN subscription_tiers t ON u.tier_id = t.id
      WHERE u.id = ${userId}
      UNION
      SELECT t.name as tier_name
      FROM platform_clients c
      LEFT JOIN subscription_tiers t ON c.tier_id = t.id
      WHERE c.user_id = ${userId}
      LIMIT 1
    `

    const tierName = (userTier[0]?.tier_name as string) || "free"

    // Get all features that should be enabled for this tier
    const features = await sql`
      SELECT id FROM cms_features
      WHERE is_active = true
      AND (
        minimum_tier = 'free'
        OR (minimum_tier = 'pro' AND ${tierName} IN ('pro', 'enterprise'))
        OR (minimum_tier = 'enterprise' AND ${tierName} = 'enterprise')
      )
    `

    // Enable each feature for this subdomain
    for (const feature of features) {
      await sql`
        INSERT INTO subdomain_features (subdomain_id, feature_id, is_enabled)
        VALUES (${subdomainId}, ${feature.id}, true)
        ON CONFLICT (subdomain_id, feature_id) DO NOTHING
      `
    }
  } catch (error) {
    console.error("[subdomain-api] Error initializing features:", error)
    // Don't throw - feature initialization is non-critical
  }
}

/**
 * PATCH /api/dashboard/subdomain
 * Update a subdomain's emoji
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain, icon } = body

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
    }

    // Validate icon
    if (icon && !isValidIcon(icon)) {
      return NextResponse.json(
        { error: "Invalid emoji (maximum 10 characters)" },
        { status: 400 }
      )
    }

    // Update the subdomain (only if owned by user)
    const result = await sql`
      UPDATE subdomains
      SET
        emoji = COALESCE(${icon || null}, emoji),
        updated_at = NOW()
      WHERE subdomain = ${subdomain} AND user_id = ${user.id}
      RETURNING id, subdomain, emoji, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Subdomain not found or access denied" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      subdomain: {
        id: result[0].id,
        subdomain: result[0].subdomain,
        emoji: result[0].emoji,
        updatedAt: result[0].updated_at,
      },
    })
  } catch (error) {
    console.error("[subdomain-api] PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update subdomain" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dashboard/subdomain
 * Delete a subdomain
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get("subdomain")

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
    }

    // Delete the subdomain (only if owned by user)
    const result = await sql`
      DELETE FROM subdomains
      WHERE subdomain = ${subdomain} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Subdomain not found or access denied" },
        { status: 404 }
      )
    }

    // Also clean up tenant_settings
    try {
      await sql`DELETE FROM tenant_settings WHERE subdomain = ${subdomain}`
    } catch (settingsError) {
      console.warn("[subdomain-api] Failed to delete tenant_settings:", settingsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[subdomain-api] DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete subdomain" },
      { status: 500 }
    )
  }
}
