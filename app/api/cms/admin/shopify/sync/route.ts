/**
 * Shopify Product Sync API
 *
 * Admin-only endpoint to trigger manual product sync from Shopify.
 *
 * POST /api/cms/admin/shopify/sync
 * Body: { mode: "full" | "delta" }
 *
 * Returns a sync report with created, updated, skipped, and error counts.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware"
import { PERMISSIONS, logAuditEvent } from "@/lib/cms/permissions"
import { runShopifySync } from "@/lib/cms/commerce/sync/shopify-sync"

export const dynamic = "force-dynamic"

export const POST = withPermission(
  PERMISSIONS.PRODUCTS_EDIT,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json().catch(() => ({}))
      const mode = body.mode === "delta" ? "delta" : "full"

      console.log(
        `[shopify-sync-api] Sync triggered by ${context.user.email} (mode: ${mode})`
      )

      const report = await runShopifySync({ mode })

      // Log the sync action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: "shopify.sync",
        targetType: "product",
        targetId: "shopify-sync",
        details: {
          mode,
          total: report.total,
          created: report.created,
          updated: report.updated,
          skipped: report.skipped,
          errorCount: report.errors.length,
          duration: report.duration,
        },
      })

      return NextResponse.json(report)
    } catch (error) {
      console.error("[shopify-sync-api] Error:", error)
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to run Shopify sync",
        },
        { status: 500 }
      )
    }
  }
)
