import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getV0ImportAgent } from "@/lib/v0-agent";
import { prisma } from "@/lib/db";

/**
 * POST /api/v0
 *
 * Import a v0 component and optionally create a page from it
 *
 * Body:
 * - url: v0.dev URL to import (optional if code provided)
 * - code: JSX code to import (optional if url provided)
 * - name: Template/page name
 * - description: Optional description
 * - category: Optional category
 * - createPage: Whether to create a page (default: false)
 * - slug: Page slug (required if createPage is true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, code, name, description, category, createPage, slug } = body;

    // Validate input
    if (!url && !code) {
      return NextResponse.json(
        { error: "Either url or code is required" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // Initialize agent
    const agent = getV0ImportAgent({
      verbose: process.env.NODE_ENV === "development",
    });

    // Import the component
    let result;
    if (url) {
      result = await agent.importComponent({
        url,
        name,
        category,
        description,
      });
    } else {
      result = await agent.importFromCode(code, {
        name,
        category,
        description,
      });
    }

    // Check for errors
    if (!result.success || !result.template) {
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 400 }
      );
    }

    // Create a page if requested
    let page;
    if (createPage && result.template) {
      if (!slug) {
        return NextResponse.json(
          { error: "slug is required when createPage is true" },
          { status: 400 }
        );
      }

      // Check if slug is taken
      const existingPage = await prisma.page.findUnique({
        where: { slug },
      });

      if (existingPage) {
        return NextResponse.json(
          { error: `A page with slug '${slug}' already exists` },
          { status: 400 }
        );
      }

      const template = result.template;
      const pageName = name || template.name || "Imported Page";

      // Create page content
      const pageContent = {
        root: { props: { title: pageName } },
        content: [template.root],
        zones: {},
      };

      // Create the page
      const newPage = await prisma.page.create({
        data: {
          title: pageName,
          slug,
          metaDescription: description || template.description,
          status: "DRAFT",
          content: pageContent as unknown as Prisma.InputJsonValue,
        },
      });

      page = {
        id: newPage.id,
        title: newPage.title,
        slug: newPage.slug,
        editorUrl: `/admin/pages/${newPage.id}/edit`,
        previewUrl: `/preview/${newPage.slug}`,
      };
    }

    // Save as PuckTemplate if not creating a page
    let savedTemplate;
    if (!createPage && result.template) {
      try {
        savedTemplate = await prisma.puckTemplate.create({
          data: {
            name: result.template.name,
            slug: `v0-${Date.now()}`,
            description: result.template.description || "",
            category: category || "v0-import",
            type: "SECTION",
            content: { root: result.template.root } as unknown as Prisma.InputJsonValue,
            isSystem: false,
            isActive: true,
          },
        });
      } catch (templateError) {
        console.warn("Could not save as PuckTemplate:", templateError);
        // Non-fatal, continue
      }
    }

    return NextResponse.json({
      success: true,
      template: result.template,
      savedTemplate: savedTemplate
        ? { id: savedTemplate.id, name: savedTemplate.name }
        : undefined,
      page,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error in POST /api/v0:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v0
 *
 * Health check endpoint
 */
export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: "ok",
    hasApiKey,
    message: hasApiKey
      ? "V0 import endpoint is ready"
      : "ANTHROPIC_API_KEY is not configured",
  });
}
