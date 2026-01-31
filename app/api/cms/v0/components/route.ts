/**
 * Custom Components API
 *
 * GET /api/v0/components - List all custom components
 * POST /api/v0/components - Create a new custom component manually
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/cms/stack";
import { prisma } from "@/lib/cms/db";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic'

/**
 * GET - List custom components with filtering and pagination
 *
 * Query params:
 * - category: Filter by category
 * - status: Filter by status (DRAFT, ACTIVE, DEPRECATED, ARCHIVED)
 * - published: Filter by published status (true/false)
 * - search: Search by name or description
 * - page: Page number (default 1)
 * - limit: Items per page (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const published = searchParams.get("published");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause
    const where: Prisma.CustomComponentWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status as "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED";
    }

    if (published !== null) {
      where.isPublished = published === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.customComponent.count({ where });

    // Get components
    const components = await prisma.customComponent.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        category: true,
        tags: true,
        sourceUrl: true,
        version: true,
        status: true,
        isPublished: true,
        language: true,
        dependencies: true,
        complexity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get unique categories for filtering
    const categories = await prisma.customComponent.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    return NextResponse.json({
      components,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories: categories.map((c: { category: string }) => c.category),
      },
    });
  } catch (error) {
    console.error("List components error:", error);
    return NextResponse.json(
      { error: "Failed to list components", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a custom component manually (without v0 import)
 *
 * Request body:
 * - name: string (required)
 * - displayName: string (required)
 * - description?: string
 * - category?: string
 * - tags?: string[]
 * - sourceCode: string (required)
 * - puckConfig: object (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.displayName || !body.sourceCode || !body.puckConfig) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["name", "displayName", "sourceCode", "puckConfig"],
        },
        { status: 400 }
      );
    }

    // Check if component with same name exists
    const existing = await prisma.customComponent.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Component with name '${body.name}' already exists` },
        { status: 409 }
      );
    }

    // Create the component
    const component = await prisma.customComponent.create({
      data: {
        name: body.name,
        displayName: body.displayName,
        description: body.description,
        category: body.category || "Custom",
        tags: body.tags || [],
        sourceCode: body.sourceCode,
        puckConfig: body.puckConfig,
        language: body.language || "typescript",
        dependencies: body.dependencies || [],
        complexity: body.complexity || "simple",
        status: "DRAFT",
        isPublished: false,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ component }, { status: 201 });
  } catch (error) {
    console.error("Create component error:", error);
    return NextResponse.json(
      { error: "Failed to create component", details: (error as Error).message },
      { status: 500 }
    );
  }
}
