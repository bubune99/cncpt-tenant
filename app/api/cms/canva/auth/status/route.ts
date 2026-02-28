/**
 * Canva Connection Status
 *
 * GET /api/canva/auth/status — Check if current user has active Canva connection.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withAuth,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { getConnectionStatus } from "@/lib/cms/canva/client"

export const GET = withAuth(
  async (_request: NextRequest, context: AuthContext) => {
    try {
      const status = await getConnectionStatus(context.user.id)

      return NextResponse.json(status)
    } catch (error) {
      console.error("[canva] Status check error:", error)
      return NextResponse.json(
        { connected: false, error: "Failed to check status" },
        { status: 500 }
      )
    }
  }
)
