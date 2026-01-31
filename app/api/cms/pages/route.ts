/**
 * Pages API for Puck Editor
 *
 * GET /api/pages?id={pageId} - Get page Puck data
 * PUT /api/pages - Update page Puck data
 *
 * This is a simplified API for the visual editor. For full CRUD, use /api/admin/pages
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/cms/db";
import { stackServerApp } from "@/lib/cms/stack";
import { Data } from "@puckeditor/core";

// Default empty Puck data structure
const defaultData: Data = {
  content: [],
  root: {
    props: {
      title: "New Page",
    },
  },
};

/**
 * GET - Get page Puck data for the editor
 * Returns the Puck Data object directly (not wrapped in a page object)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      );
    }

    const page = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Return the Puck data directly, or default if empty
    const puckData = (page.content as Data) || {
      ...defaultData,
      root: {
        props: {
          title: page.title,
        },
      },
    };

    return NextResponse.json(puckData);
  } catch (error) {
    console.error("Get page data error:", error);
    return NextResponse.json(
      { error: "Failed to get page data" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update page Puck data
 * Expects: { id: string, data: Data }
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Page data is required" },
        { status: 400 }
      );
    }

    // Check if page exists
    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Update the page content
    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        content: data,
        // Also update title if it's in the root props
        title: data.root?.props?.title || existing.title,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: updatedPage.id,
        title: updatedPage.title,
        slug: updatedPage.slug,
        updatedAt: updatedPage.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update page data error:", error);
    return NextResponse.json(
      { error: "Failed to update page data" },
      { status: 500 }
    );
  }
}
