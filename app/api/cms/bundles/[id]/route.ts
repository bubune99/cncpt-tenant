/**
 * Bundle Detail API
 *
 * GET /api/bundles/[id] - Get bundle details
 * DELETE /api/bundles/[id] - Delete bundle
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/cms/stack";
import { prisma } from "@/lib/cms/db";
import type { BundleAsset } from "@prisma/client";

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get bundle details
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
      include: {
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        assets: {
          orderBy: { createdAt: "asc" },
        },
        animations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Calculate asset statistics
    const assetStats = {
      total: bundle.assets.length,
      completed: bundle.assets.filter((a: BundleAsset) => a.status === "COMPLETED").length,
      failed: bundle.assets.filter((a: BundleAsset) => a.status === "FAILED").length,
      pending: bundle.assets.filter((a: BundleAsset) => a.status === "PENDING").length,
    };

    return NextResponse.json({
      ...bundle,
      assetStats,
    });
  } catch (error) {
    console.error("Bundle detail error:", error);
    return NextResponse.json(
      { error: "Failed to get bundle", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete bundle and optionally its page
 *
 * Query params:
 * - deletePage: If "true", also delete the associated page
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletePage = searchParams.get("deletePage") === "true";

    // Get bundle to check if it exists and get page reference
    const bundle = await prisma.pageBundle.findUnique({
      where: { id },
      select: { id: true, pageId: true, name: true },
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete bundle (cascades to assets and animations)
      await tx.pageBundle.delete({
        where: { id },
      });

      // Optionally delete the associated page
      if (deletePage && bundle.pageId) {
        await tx.page.delete({
          where: { id: bundle.pageId },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bundle "${bundle.name}" deleted${deletePage ? " along with its page" : ""}`,
      deletedBundleId: id,
      deletedPageId: deletePage ? bundle.pageId : null,
    });
  } catch (error) {
    console.error("Bundle delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete bundle", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update bundle status or metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate that bundle exists
    const existing = await prisma.pageBundle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Update allowed fields
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const updated = await prisma.pageBundle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Bundle update error:", error);
    return NextResponse.json(
      { error: "Failed to update bundle", details: (error as Error).message },
      { status: 500 }
    );
  }
}
