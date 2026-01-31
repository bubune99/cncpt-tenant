/**
 * Bundles API
 *
 * POST /api/bundles - Import a bundle (multipart/form-data)
 * GET /api/bundles - List imported bundles
 */

import { NextRequest, NextResponse } from "next/server";
import { importBundle, previewBundle } from '@/lib/cms/bundles/importer";
import { BundleImportOptions } from '@/lib/cms/bundles/types";
import { stackServerApp } from '@/lib/cms/stack";
import { prisma } from '@/lib/cms/db";

/**
 * POST - Import a bundle or preview it
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const previewOnly = formData.get("preview") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Preview mode - just validate and return manifest
    if (previewOnly) {
      const preview = await previewBundle(buffer);
      return NextResponse.json(preview);
    }

    // Import mode
    const options: BundleImportOptions = {
      targetSlug: formData.get("targetSlug") as string | undefined,
      storageProvider: formData.get("storageProvider") as
        | "s3"
        | "r2"
        | "vercel-blob"
        | "local"
        | undefined,
    };

    const result = await importBundle(buffer, options);

    if (result.status === "failed") {
      return NextResponse.json(
        { error: "Import failed", details: result.warnings },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bundle import error:", error);
    return NextResponse.json(
      { error: "Failed to import bundle", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET - List imported bundles
 *
 * Query params:
 * - status: Filter by status (PENDING, ACTIVE, FAILED, ARCHIVED)
 * - category: Filter by category
 * - limit: Max results (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }

    // Fetch bundles with pagination
    const [bundles, total] = await Promise.all([
      prisma.pageBundle.findMany({
        where,
        orderBy: { importedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          page: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
          },
          _count: {
            select: {
              assets: true,
              animations: true,
            },
          },
        },
      }),
      prisma.pageBundle.count({ where }),
    ]);

    return NextResponse.json({
      bundles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + bundles.length < total,
      },
    });
  } catch (error) {
    console.error("Bundle list error:", error);
    return NextResponse.json(
      { error: "Failed to list bundles", details: (error as Error).message },
      { status: 500 }
    );
  }
}
