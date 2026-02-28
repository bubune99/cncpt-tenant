/**
 * Canva Export Job Status
 *
 * GET /api/canva/import/[jobId] — Poll export job status.
 * Used by frontend for progress tracking during async export.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { PERMISSIONS } from "@/lib/cms/permissions"
import { getValidAccessToken, getExportJob } from "@/lib/cms/canva/client"

export const GET = withPermission(
  PERMISSIONS.MEDIA_UPLOAD,
  async (
    request: NextRequest,
    context: AuthContext,
    { params }: { params: Promise<{ jobId: string }> }
  ) => {
    try {
      const { jobId } = await params

      if (!jobId) {
        return NextResponse.json(
          { error: "Job ID is required" },
          { status: 400 }
        )
      }

      const accessToken = await getValidAccessToken(context.user.id)
      if (!accessToken) {
        return NextResponse.json(
          { error: "Canva account not connected" },
          { status: 401 }
        )
      }

      const job = await getExportJob(accessToken, jobId)

      return NextResponse.json({
        id: job.id,
        status: job.status,
        error: job.error || null,
      })
    } catch (error) {
      console.error("[canva] Export status error:", error)
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to check export status",
        },
        { status: 500 }
      )
    }
  }
)
