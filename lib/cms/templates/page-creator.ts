/**
 * Page Creator
 *
 * Creates pages from templates or v0 imports
 */

import { prisma } from "@/lib/cms/db";
import { Prisma } from "@prisma/client";
import { getTemplateRegistry } from "./registry";
import {
  CreatePageFromTemplateRequest,
  CreatePageFromTemplateResult,
  V0PageImportRequest,
  V0PageImportResult,
  PuckPageContent,
} from "./types";
import { getV0ImportAgent } from "../v0-agent";

/**
 * Create a page from a seed template
 */
export async function createPageFromTemplate(
  request: CreatePageFromTemplateRequest,
  userId?: string
): Promise<CreatePageFromTemplateResult> {
  try {
    const registry = getTemplateRegistry();

    // Get the template
    const template = await registry.getTemplate(request.templateId);
    if (!template) {
      return {
        success: false,
        error: `Template '${request.templateId}' not found`,
      };
    }

    // Check if slug is already taken
    const existingPage = await prisma.page.findFirst({
      where: { slug: request.slug, tenantId: null },
    });

    if (existingPage) {
      return {
        success: false,
        error: `A page with slug '${request.slug}' already exists`,
      };
    }

    // Create the page
    const page = await prisma.page.create({
      data: {
        title: request.title,
        slug: request.slug,
        metaDescription: request.description || template.description,
        status: "DRAFT",
        content: template.content as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        editorUrl: `/admin/pages/${page.id}/edit`,
        previewUrl: `/preview/${page.slug}`,
      },
    };
  } catch (error) {
    console.error("Failed to create page from template:", error);
    return {
      success: false,
      error: `Failed to create page: ${(error as Error).message}`,
    };
  }
}

/**
 * Import a v0 component as a full page
 */
export async function importV0AsPage(
  request: V0PageImportRequest,
  userId?: string
): Promise<V0PageImportResult> {
  try {
    // Check if slug is already taken
    const existingPage = await prisma.page.findFirst({
      where: { slug: request.slug, tenantId: null },
    });

    if (existingPage) {
      return {
        success: false,
        errors: [`A page with slug '${request.slug}' already exists`],
      };
    }

    // Get the v0 import agent
    const agent = getV0ImportAgent({
      verbose: process.env.NODE_ENV === "development",
    });

    // Import the component
    const importResult = await agent.importComponent({
      url: request.url,
      name: request.title,
      category: request.category,
      description: request.description,
    });

    if (!importResult.success || !importResult.template) {
      return {
        success: false,
        errors: importResult.errors || ["Failed to import v0 component"],
        warnings: importResult.warnings,
      };
    }

    // Convert template to page content
    const pageContent: PuckPageContent = {
      root: { props: {} },
      content: [importResult.template.root],
      zones: {},
    };

    // Create the page
    const page = await prisma.page.create({
      data: {
        title: request.title,
        slug: request.slug,
        metaDescription: request.description || importResult.template.description,
        status: "DRAFT",
        content: pageContent as unknown as Prisma.InputJsonValue,
      },
    });

    // Optionally save as a reusable template too
    let savedTemplate = null;
    try {
      savedTemplate = await prisma.puckTemplate.create({
        data: {
          name: importResult.template.name,
          slug: `v0-${Date.now()}`,
          description: importResult.template.description,
          category: request.category || "v0-import",
          content: { root: importResult.template.root } as unknown as Prisma.InputJsonValue,
          createdById: userId,
        },
      });
    } catch (templateError) {
      console.warn("Could not save as template:", templateError);
      // Non-fatal, continue
    }

    return {
      success: true,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        editorUrl: `/admin/pages/${page.id}/edit`,
        previewUrl: `/preview/${page.slug}`,
      },
      template: savedTemplate
        ? {
            id: savedTemplate.id,
            name: savedTemplate.name,
          }
        : undefined,
      warnings: importResult.warnings,
    };
  } catch (error) {
    console.error("Failed to import v0 as page:", error);
    return {
      success: false,
      errors: [`Failed to import: ${(error as Error).message}`],
    };
  }
}

/**
 * List all available templates
 */
export async function listTemplates() {
  const registry = getTemplateRegistry();
  return await registry.getAllTemplates();
}

/**
 * List templates by category
 */
export async function listTemplatesByCategory(category: string) {
  const registry = getTemplateRegistry();
  return await registry.getTemplatesByCategory(category as Parameters<typeof registry.getTemplatesByCategory>[0]);
}

/**
 * Search templates
 */
export async function searchTemplates(query: string) {
  const registry = getTemplateRegistry();
  return await registry.searchTemplates(query);
}
