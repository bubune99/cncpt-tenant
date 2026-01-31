/**
 * Individual Custom Component API
 *
 * GET /api/v0/components/[id] - Get component details
 * PATCH /api/v0/components/[id] - Update component
 * DELETE /api/v0/components/[id] - Delete component
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/cms/stack";
import { prisma } from "@/lib/cms/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get component by ID with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const component = await prisma.customComponent.findUnique({
      where: { id },
    });

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ component });
  } catch (error) {
    console.error("Get component error:", error);
    return NextResponse.json(
      { error: "Failed to get component", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update component
 *
 * Request body (all fields optional):
 * - displayName: string
 * - description: string
 * - category: string
 * - tags: string[]
 * - sourceCode: string
 * - puckConfig: object
 * - status: DRAFT | ACTIVE | DEPRECATED | ARCHIVED
 * - isPublished: boolean
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

    // Check if component exists
    const existing = await prisma.customComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedBy: user.id,
    };

    // Only include fields that are provided
    const allowedFields = [
      "displayName",
      "description",
      "category",
      "tags",
      "sourceCode",
      "puckConfig",
      "status",
      "isPublished",
      "language",
      "dependencies",
      "complexity",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Increment version if source code or puck config changed
    if (body.sourceCode || body.puckConfig) {
      updateData.version = existing.version + 1;
    }

    // Update the component
    const component = await prisma.customComponent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ component });
  } catch (error) {
    console.error("Update component error:", error);
    return NextResponse.json(
      { error: "Failed to update component", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete component
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if component exists
    const existing = await prisma.customComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Delete the component
    await prisma.customComponent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Component '${existing.name}' deleted successfully`,
    });
  } catch (error) {
    console.error("Delete component error:", error);
    return NextResponse.json(
      { error: "Failed to delete component", details: (error as Error).message },
      { status: 500 }
    );
  }
}
