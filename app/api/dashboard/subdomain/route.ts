/**
 * Subdomain API Routes
 * CRUD operations for user subdomains with plan limit validation
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { canCreateSubdomain, getSubdomainUsage } from "@/lib/subscription"
import { rootDomain, protocol } from "@/lib/utils"
import { logPlatformActivity } from "@/lib/super-admin"
import { checkAddress } from "@/lib/dashboard/site-address"
import { featuresForTier } from "@/lib/dashboard/tier-features"

export const dynamic = 'force-dynamic'

// Address rules are shared with the New client site panel (lib/dashboard/site-address.ts).
const isValidSubdomain = checkAddress

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

    // Log subdomain creation activity
    await logPlatformActivity(
      "subdomain.create",
      {
        subdomain: sanitizedSubdomain,
        siteName: siteName?.trim(),
        useCase,
        industry,
      },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "subdomain",
        targetId: sanitizedSubdomain,
      }
    )

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

    // The features this plan starts with (lib/dashboard/tier-features; no plan reads as free).
    const active = await sql`SELECT id, minimum_tier FROM cms_features WHERE is_active = true`
    const features = featuresForTier(active as { id: unknown; minimum_tier: string | null }[], userTier[0]?.tier_name as string | undefined)

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
 * Update a subdomain
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain } = body

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
    }

    // Update the subdomain (only if owned by user)
    const result = await sql`
      UPDATE subdomains
      SET
        updated_at = NOW()
      WHERE subdomain = ${subdomain} AND user_id = ${user.id}
      RETURNING id, subdomain, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Subdomain not found or access denied" },
        { status: 404 }
      )
    }

    // Log subdomain update activity
    await logPlatformActivity(
      "subdomain.update",
      { subdomain },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "subdomain",
        targetId: subdomain,
      }
    )

    return NextResponse.json({
      success: true,
      subdomain: {
        id: result[0].id,
        subdomain: result[0].subdomain,
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

    // Log subdomain deletion activity
    await logPlatformActivity(
      "subdomain.delete",
      { subdomain },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "subdomain",
        targetId: subdomain,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[subdomain-api] DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete subdomain" },
      { status: 500 }
    )
  }
}
