/**
 * Bundle Export API
 *
 * POST /api/bundles/export - Export a page as a .puckbundle file
 */

import { NextRequest, NextResponse } from "next/server";
import { exportBundle, getBundleFilename, validateExportOptions } from '@/lib/cms/bundles/exporter";
import { BundleExportOptions } from '@/lib/cms/bundles/types";
import { stackServerApp } from '@/lib/cms/stack";

/**
 * POST /api/bundles/export
 *
 * Export a page as a .puckbundle file
 *
 * Request body:
 * {
 *   pageId: string;           // Required: ID of the page to export
 *   includeAssets?: boolean;  // Include referenced assets (default: true)
 *   includeAnimations?: boolean; // Include animation definitions (default: true)
 *   metadata?: {              // Optional additional metadata
 *     description?: string;
 *     category?: string;
 *     tags?: string[];
 *     author?: string;
 *   }
 * }
 *
 * Response: Binary .puckbundle file download
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const options: BundleExportOptions = {
      pageId: body.pageId,
      includeAssets: body.includeAssets ?? true,
      includeAnimations: body.includeAnimations ?? true,
      metadata: body.metadata,
    };

    // Validate options
    const errors = validateExportOptions(options);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid export options", details: errors },
        { status: 400 }
      );
    }

    // Generate the bundle
    const { zip, manifest, bundleId } = await exportBundle(options);

    // Create filename
    const filename = getBundleFilename(manifest.page.title, bundleId);

    // Return the zip file as a download
    return new NextResponse(zip as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zip.length.toString(),
        "X-Bundle-Id": bundleId,
        "X-Bundle-Version": manifest.version,
      },
    });
  } catch (error) {
    console.error("Bundle export error:", error);

    if (error instanceof Error && error.message.includes("Page not found")) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to export bundle", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bundles/export
 *
 * Get export options or status (health check)
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/bundles/export",
    method: "POST",
    description: "Export a page as a .puckbundle file",
    requiredParams: ["pageId"],
    optionalParams: ["includeAssets", "includeAnimations", "metadata"],
  });
}
