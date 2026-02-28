/**
 * Canva Import API
 *
 * POST /api/canva/import — Start importing a Canva design into CMS media library.
 *
 * Workflow:
 * 1. Create Canva export job
 * 2. Wait for export to complete (async polling)
 * 3. Download exported file
 * 4. Upload to CMS storage (S3/R2/local)
 * 5. Create Media record with metadata
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { PERMISSIONS } from "@/lib/cms/permissions"
import {
  getValidAccessToken,
  getDesign,
  createExportJob,
  waitForExport,
  downloadExport,
} from "@/lib/cms/canva/client"
import { generatePresignedUrl, processUpload } from "@/lib/cms/media/upload"
import type { CanvaExportFormat } from "@/lib/cms/canva/types"
import type { StorageProvider } from "@/lib/cms/media/types"

const FORMAT_MIME_MAP: Record<CanvaExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  gif: "image/gif",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp4: "video/mp4",
}

export const POST = withPermission(
  PERMISSIONS.MEDIA_UPLOAD,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json()
      const {
        designId,
        format = "png",
        width,
        height,
        quality,
        lossless,
        folderId,
        tagIds,
        title,
      } = body as {
        designId: string
        format?: CanvaExportFormat
        width?: number
        height?: number
        quality?: number
        lossless?: boolean
        folderId?: string
        tagIds?: string[]
        title?: string
      }

      if (!designId) {
        return NextResponse.json(
          { error: "designId is required" },
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

      // Get design metadata for naming
      const design = await getDesign(accessToken, designId)
      const designTitle = title || design.title || "Canva Design"

      // Create export job
      const exportJob = await createExportJob(accessToken, {
        designId,
        format,
        width,
        height,
        quality,
        lossless,
      })

      // Wait for export to complete (up to 2 minutes)
      const completedJob = await waitForExport(accessToken, exportJob.id, 120000)

      if (completedJob.status === "failed") {
        return NextResponse.json(
          {
            error: completedJob.error?.message || "Canva export failed",
            code: completedJob.error?.code,
          },
          { status: 502 }
        )
      }

      if (!completedJob.urls || completedJob.urls.length === 0) {
        return NextResponse.json(
          { error: "Export completed but no download URL provided" },
          { status: 502 }
        )
      }

      // Download the exported file
      const { buffer, contentType } = await downloadExport(completedJob.urls[0])

      const mimeType = FORMAT_MIME_MAP[format] || contentType
      const extension = format === "jpg" ? "jpeg" : format
      const sanitizedName = designTitle
        .replace(/[^a-zA-Z0-9\s-_]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
      const filename = `${sanitizedName}.${extension}`

      // Upload to CMS storage
      const presigned = await generatePresignedUrl(filename, mimeType, buffer.length)

      // Upload the buffer to the presigned URL
      if (presigned.provider === "LOCAL") {
        // For local storage, write the file directly
        const fs = await import("fs/promises")
        const path = await import("path")
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          path.dirname(presigned.key)
        )
        await fs.mkdir(uploadDir, { recursive: true })
        await fs.writeFile(
          path.join(process.cwd(), "public", "uploads", presigned.key),
          buffer
        )
      } else {
        // S3/R2 — PUT to presigned URL
        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(buffer.length),
          },
          body: new Uint8Array(buffer),
        })

        if (!uploadResponse.ok) {
          throw new Error(`Storage upload failed: ${uploadResponse.status}`)
        }
      }

      // Create Media record
      const media = await processUpload(
        filename,
        designTitle,
        mimeType,
        buffer.length,
        presigned.publicUrl,
        presigned.key,
        presigned.bucket,
        presigned.provider as StorageProvider,
        { folderId, tagIds, title: designTitle },
        context.user.id
      )

      // Update with canvaDesignId for re-edit capability
      const { prisma } = await import("@/lib/cms/db")
      await (prisma as any).media.update({
        where: { id: media.id },
        data: { canvaDesignId: designId },
      })

      return NextResponse.json({
        success: true,
        media: {
          id: media.id,
          filename: media.filename,
          url: media.url,
          mimeType: media.mimeType,
          size: media.size,
          canvaDesignId: designId,
        },
      })
    } catch (error) {
      console.error("[canva] Import error:", error)
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to import from Canva",
        },
        { status: 500 }
      )
    }
  }
)
