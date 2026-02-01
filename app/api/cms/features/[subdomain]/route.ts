/**
 * CMS Features API (Public)
 * Used by CMS admin to get feature configuration for a subdomain
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

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
 * GET /api/cms/features/[subdomain]
 * Get CMS feature configuration for a subdomain (used by CMS admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
    }

    // Get tenant settings with CMS features
    const settings = await sql`
      SELECT cms_features
      FROM tenant_settings
      WHERE subdomain = ${subdomain}
    `

    // Deep merge with defaults
    const dbFeatures = settings.length > 0 && settings[0].cms_features
      ? settings[0].cms_features
      : {}

    const features = deepMerge(defaultFeatures, dbFeatures as Record<string, unknown>)

    // Also return navigation items that should be hidden based on features
    const hiddenNavItems = getHiddenNavItems(features)

    return NextResponse.json({
      features,
      hiddenNavItems,
      subdomain,
    })
  } catch (error) {
    console.error("[cms-features-public-api] GET error:", error)
    // Return defaults on error to not break CMS
    return NextResponse.json({
      features: defaultFeatures,
      hiddenNavItems: [],
      subdomain: "",
    })
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output = { ...target }

  for (const key in source) {
    if (source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (key in target && typeof target[key] === "object") {
        output[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
      } else {
        output[key] = source[key]
      }
    } else {
      output[key] = source[key]
    }
  }

  return output
}

/**
 * Get navigation items to hide based on disabled features
 */
function getHiddenNavItems(features: Record<string, unknown>): string[] {
  const hidden: string[] = []

  // Core features
  if (!features.blog) hidden.push("blog")
  if (!features.pages) hidden.push("pages")
  if (!features.media) hidden.push("media")
  if (!features.analytics) hidden.push("analytics")
  if (!features.forms) hidden.push("forms")

  // E-commerce
  const ecommerce = features.ecommerce as Record<string, boolean> | undefined
  if (!ecommerce?.enabled) {
    hidden.push("products", "orders", "order-workflows", "shipping", "customers", "reviews", "discounts")
  } else {
    if (!ecommerce.products) hidden.push("products")
    if (!ecommerce.orders) hidden.push("orders", "order-workflows")
    if (!ecommerce.customers) hidden.push("customers")
    if (!ecommerce.shipping) hidden.push("shipping")
    if (!ecommerce.reviews) hidden.push("reviews")
    if (!ecommerce.discounts) hidden.push("discounts")
  }

  // Email
  const email = features.email as Record<string, boolean> | undefined
  if (!email?.enabled) {
    hidden.push("email-marketing")
  }

  // Advanced
  if (!features.plugins) hidden.push("plugins")
  if (!features.workflows) hidden.push("workflows")

  return hidden
}
