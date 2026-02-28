/**
 * Canva OAuth Disconnect
 *
 * POST /api/canva/auth/disconnect — Revokes tokens and deletes connection.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withAuth,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { removeCanvaConnection } from "@/lib/cms/canva/client"

export const POST = withAuth(
  async (_request: NextRequest, context: AuthContext) => {
    try {
      await removeCanvaConnection(context.user.id)

      return NextResponse.json({
        success: true,
        message: "Canva account disconnected",
      })
    } catch (error) {
      console.error("[canva] Disconnect error:", error)
      return NextResponse.json(
        { error: "Failed to disconnect Canva account" },
        { status: 500 }
      )
    }
  }
)
