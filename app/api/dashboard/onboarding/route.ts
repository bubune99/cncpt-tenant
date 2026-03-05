/**
 * Onboarding Checklist API
 * GET  - Fetch checklist for user + subdomain
 * PUT  - Complete an item or dismiss the checklist
 * POST - Initialize checklist after subdomain creation
 */

import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import {
  getOrCreateChecklist,
  completeItem,
  dismissChecklist,
  getProgress,
} from "@/lib/onboarding/checklist"

export const dynamic = "force-dynamic"

/**
 * GET /api/dashboard/onboarding?subdomainId=123
 * Fetch the onboarding checklist for the current user and subdomain
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subdomainId = request.nextUrl.searchParams.get("subdomainId")
    if (!subdomainId) {
      return NextResponse.json(
        { error: "subdomainId is required" },
        { status: 400 }
      )
    }

    const checklist = await getOrCreateChecklist(
      user.id,
      parseInt(subdomainId, 10)
    )
    const progress = getProgress(checklist.items)

    return NextResponse.json({ checklist, progress })
  } catch (error) {
    console.error("[onboarding-api] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding checklist" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/dashboard/onboarding
 * Body: { subdomainId, action: "complete" | "dismiss", itemKey?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subdomainId, action, itemKey } = body

    if (!subdomainId) {
      return NextResponse.json(
        { error: "subdomainId is required" },
        { status: 400 }
      )
    }

    const sid = parseInt(subdomainId, 10)

    if (action === "dismiss") {
      await dismissChecklist(user.id, sid)
      return NextResponse.json({ success: true })
    }

    if (action === "complete" && itemKey) {
      const checklist = await completeItem(user.id, sid, itemKey)
      const progress = getProgress(checklist.items)
      return NextResponse.json({ checklist, progress })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[onboarding-api] PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update onboarding checklist" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/onboarding
 * Body: { subdomainId }
 * Initialize a new checklist after subdomain creation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subdomainId } = body

    if (!subdomainId) {
      return NextResponse.json(
        { error: "subdomainId is required" },
        { status: 400 }
      )
    }

    const checklist = await getOrCreateChecklist(
      user.id,
      parseInt(subdomainId, 10)
    )
    const progress = getProgress(checklist.items)

    return NextResponse.json({ checklist, progress })
  } catch (error) {
    console.error("[onboarding-api] POST error:", error)
    return NextResponse.json(
      { error: "Failed to initialize onboarding checklist" },
      { status: 500 }
    )
  }
}
