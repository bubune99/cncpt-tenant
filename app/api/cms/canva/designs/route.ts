/**
 * Canva Designs API
 *
 * GET /api/canva/designs — List/search user's Canva designs.
 * Proxies to Canva API with user's stored access token.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { PERMISSIONS } from "@/lib/cms/permissions"
import {
  getValidAccessToken,
  listDesigns,
} from "@/lib/cms/canva/client"

export const GET = withPermission(
  PERMISSIONS.MEDIA_VIEW,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const accessToken = await getValidAccessToken(context.user.id)

      if (!accessToken) {
        return NextResponse.json(
          { error: "Canva account not connected" },
          { status: 401 }
        )
      }

      const { searchParams } = new URL(request.url)
      const query = searchParams.get("query") || undefined
      const continuation = searchParams.get("continuation") || undefined
      const limit = searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined

      const result = await listDesigns(accessToken, {
        query,
        continuation,
        limit,
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error("[canva] List designs error:", error)
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch Canva designs",
        },
        { status: 500 }
      )
    }
  }
)
