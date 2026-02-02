/**
 * CMS Features API (Public)
 *
 * Returns all features as enabled. Feature toggling has been removed
 * in favor of having all features available by default.
 */

import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// All CMS features enabled
const allFeaturesEnabled = {
  blog: true,
  pages: true,
  media: true,
  analytics: true,
  forms: true,
  multiLanguage: true,
  scheduling: true,
  ecommerce: {
    enabled: true,
    products: true,
    orders: true,
    customers: true,
    shipping: true,
    inventory: true,
    reviews: true,
    discounts: true,
  },
  email: {
    enabled: true,
    marketing: true,
    transactional: true,
  },
  ai: {
    enabled: true,
    chatbot: true,
    contentGeneration: true,
  },
  plugins: true,
  workflows: true,
}

/**
 * GET /api/cms/features/[subdomain]
 * Returns all features as enabled
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  // All features enabled, no hidden items
  return NextResponse.json({
    features: allFeaturesEnabled,
    hiddenNavItems: [],
    subdomain: subdomain || "",
  })
}
