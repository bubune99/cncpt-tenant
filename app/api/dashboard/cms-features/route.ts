/**
 * CMS Features Configuration API (Deprecated)
 *
 * Feature toggling has been removed. All features are now enabled by default.
 * This API is kept for backwards compatibility but always returns all features enabled.
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

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
 * GET /api/dashboard/cms-features
 * Returns all features as enabled (feature toggling removed)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // All features enabled
    return NextResponse.json({ features: allFeaturesEnabled })
  } catch (error) {
    console.error("[cms-features-api] GET error:", error)
    return NextResponse.json({ features: allFeaturesEnabled })
  }
}

/**
 * POST /api/dashboard/cms-features
 * No-op - feature toggling has been removed
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Feature toggling disabled - just return success
    return NextResponse.json({
      success: true,
      message: "Feature toggling has been disabled. All features are enabled by default."
    })
  } catch (error) {
    console.error("[cms-features-api] POST error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
