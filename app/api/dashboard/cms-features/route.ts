/**
 * CMS Features Configuration API
 * Manage which CMS features are enabled per subdomain
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { logPlatformActivity } from "@/lib/super-admin"

export const dynamic = "force-dynamic"

// Default CMS features configuration
const defaultFeatures = {
  blog: true,
  pages: true,
  media: true,
  analytics: true,
  forms: false,
  multiLanguage: false,
  scheduling: false,
  ecommerce: {
    enabled: false,
    products: false,
    orders: false,
    customers: false,
    shipping: false,
    inventory: false,
    reviews: false,
    discounts: false,
  },
  email: {
    enabled: false,
    marketing: false,
    transactional: false,
  },
  ai: {
    enabled: true,
    chatbot: true,
    contentGeneration: true,
  },
  plugins: false,
  workflows: false,
}

/**
 * GET /api/dashboard/cms-features
 * Get CMS feature configuration for a subdomain
 */
export async function GET(request: NextRequest) {
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

    // Verify user owns this subdomain
    const ownerCheck = await sql`
      SELECT id FROM subdomains
      WHERE subdomain = ${subdomain} AND user_id = ${user.id}
    `

    if (ownerCheck.length === 0) {
      // Check if super admin
      const adminCheck = await sql`
        SELECT is_super_admin FROM users WHERE id = ${user.id}
      `
      if (!adminCheck[0]?.is_super_admin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Get tenant settings with CMS features
    const settings = await sql`
      SELECT cms_features
      FROM tenant_settings
      WHERE subdomain = ${subdomain}
    `

    const features = settings.length > 0 && settings[0].cms_features
      ? { ...defaultFeatures, ...settings[0].cms_features }
      : defaultFeatures

    return NextResponse.json({ features })
  } catch (error) {
    console.error("[cms-features-api] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch CMS features" }, { status: 500 })
  }
}

/**
 * POST /api/dashboard/cms-features
 * Save CMS feature configuration for a subdomain
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subdomain, features } = body

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
    }

    if (!features) {
      return NextResponse.json({ error: "Features configuration is required" }, { status: 400 })
    }

    // Verify user owns this subdomain
    const ownerCheck = await sql`
      SELECT id FROM subdomains
      WHERE subdomain = ${subdomain} AND user_id = ${user.id}
    `

    if (ownerCheck.length === 0) {
      // Check if super admin
      const adminCheck = await sql`
        SELECT is_super_admin FROM users WHERE id = ${user.id}
      `
      if (!adminCheck[0]?.is_super_admin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Upsert tenant settings with CMS features
    await sql`
      INSERT INTO tenant_settings (subdomain, cms_features, updated_at)
      VALUES (${subdomain}, ${JSON.stringify(features)}::jsonb, NOW())
      ON CONFLICT (subdomain) DO UPDATE SET
        cms_features = ${JSON.stringify(features)}::jsonb,
        updated_at = NOW()
    `

    // Log activity
    await logPlatformActivity(
      "cms.features.update",
      { subdomain, features },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "subdomain",
        targetId: subdomain,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[cms-features-api] POST error:", error)
    return NextResponse.json({ error: "Failed to save CMS features" }, { status: 500 })
  }
}
