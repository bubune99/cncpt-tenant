/**
 * Bundle Status API
 *
 * GET /api/bundles/[id]/status - Get import progress/status
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/cms/stack";
import { prisma } from "@/lib/cms/db";
import type { AssetUploadStatus } from "@prisma/client";

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface AssetStatusInfo {
  id: string;
  status: AssetUploadStatus;
  errorMessage: string | null;
  originalPath: string;
  storageUrl: string | null;
}

/**
 * GET - Get bundle import status and progress
 *
 * Returns current status and asset upload progress
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bundle = await prisma.pageBundle.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        importedAt: true,
        pageId: true,
        assets: {
          select: {
            id: true,
            status: true,
            errorMessage: true,
            originalPath: true,
            storageUrl: true,
          },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Calculate progress
    const totalAssets = bundle.assets.length;
    const completedAssets = bundle.assets.filter(
      (a: AssetStatusInfo) => a.status === "COMPLETED"
    ).length;
    const failedAssets = bundle.assets.filter(
      (a: AssetStatusInfo) => a.status === "FAILED"
    ).length;
    const pendingAssets = bundle.assets.filter(
      (a: AssetStatusInfo) => a.status === "PENDING" || a.status === "UPLOADING"
    ).length;

    const progress =
      totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 100;

    // Determine overall status message
    let statusMessage: string;
    switch (bundle.status) {
      case "PENDING":
        statusMessage = `Importing... ${completedAssets}/${totalAssets} assets uploaded`;
        break;
      case "ACTIVE":
        statusMessage = "Import completed successfully";
        break;
      case "FAILED":
        statusMessage = `Import failed - ${failedAssets} asset(s) could not be uploaded`;
        break;
      case "ARCHIVED":
        statusMessage = "Bundle has been archived";
        break;
      default:
        statusMessage = "Unknown status";
    }

    // Get failed asset details if any
    const failedDetails = bundle.assets
      .filter((a: AssetStatusInfo) => a.status === "FAILED")
      .map((a: AssetStatusInfo) => ({
        path: a.originalPath,
        error: a.errorMessage,
      }));

    return NextResponse.json({
      bundleId: bundle.id,
      name: bundle.name,
      status: bundle.status,
      statusMessage,
      pageId: bundle.pageId,
      importedAt: bundle.importedAt,
      progress: {
        percent: progress,
        total: totalAssets,
        completed: completedAssets,
        failed: failedAssets,
        pending: pendingAssets,
      },
      ...(failedDetails.length > 0 && { failedAssets: failedDetails }),
    });
  } catch (error) {
    console.error("Bundle status error:", error);
    return NextResponse.json(
      { error: "Failed to get bundle status", details: (error as Error).message },
      { status: 500 }
    );
  }
}
