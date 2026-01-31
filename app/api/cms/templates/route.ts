import { NextRequest, NextResponse } from "next/server";
import {
  listTemplates,
  listTemplatesByCategory,
  searchTemplates,
  createPageFromTemplate,
  importV0AsPage,
  ensureTemplatesInitialized,
  TemplateCategory,
} from "@/lib/cms/templates";
import { getTemplateRegistry } from "@/lib/cms/templates/registry";

export const dynamic = 'force-dynamic'

/**
 * GET /api/templates
 *
 * Query params:
 * - category: Filter by category
 * - search: Search templates
 * - id: Get specific template
 * - categories: Return list of categories (set to "true")
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure templates are initialized
    ensureTemplatesInitialized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category") as TemplateCategory | null;
    const search = searchParams.get("search");
    const categoriesOnly = searchParams.get("categories") === "true";

    // Return list of categories
    if (categoriesOnly) {
      const templates = await listTemplates();
      const categories = [...new Set(templates.map((t) => t.category))];
      return NextResponse.json({ categories });
    }

    // Get specific template
    if (id) {
      const registry = getTemplateRegistry();
      const template = await registry.getTemplate(id);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // Search templates
    if (search) {
      const templates = await searchTemplates(search);
      return NextResponse.json({ templates });
    }

    // Filter by category
    if (category) {
      const templates = await listTemplatesByCategory(category);
      return NextResponse.json({ templates });
    }

    // Return all templates
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error in GET /api/templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 *
 * Create a page from a template or import from v0
 *
 * Body for template:
 * - templateId: Template to use
 * - title: Page title
 * - slug: Page slug
 * - description: Optional description
 *
 * Body for v0 import:
 * - v0Url: v0.dev URL to import
 * - title: Page title
 * - slug: Page slug
 * - description: Optional description
 * - category: Optional category
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure templates are initialized
    ensureTemplatesInitialized();

    const body = await request.json();

    // V0 import mode
    if (body.v0Url) {
      const { v0Url, title, slug, description, category } = body;

      if (!title) {
        return NextResponse.json(
          { error: "title is required" },
          { status: 400 }
        );
      }

      if (!slug) {
        return NextResponse.json(
          { error: "slug is required" },
          { status: 400 }
        );
      }

      const result = await importV0AsPage({
        url: v0Url,
        title,
        slug,
        description,
        category,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.errors?.join(", ") || "Import failed" },
          { status: 400 }
        );
      }

      return NextResponse.json(result);
    }

    // Template mode
    const { templateId, title, slug, description } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    const result = await createPageFromTemplate({
      templateId,
      title,
      slug,
      description,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
