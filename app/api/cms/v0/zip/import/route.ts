/**
 * v0 ZIP Import API
 *
 * POST /api/v0/zip/import — creates PuckTemplates and/or Pages from
 * previously analyzed sections.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware";
import { PERMISSIONS, logAuditEvent } from "@/lib/cms/permissions";
import { prisma } from "@/lib/cms/db";
import { processV0Zip } from "@/lib/cms/v0/zip-engine";
import {
  buildTemplatePaylod,
  buildPageTemplatePayload,
} from "@/lib/cms/v0/zip-engine/template-assembler";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST = withPermission(
  PERMISSIONS.PUCK_TEMPLATES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const selectedSectionsStr = formData.get("selectedSections") as string | null;
      const createFullPage = formData.get("createFullPage") === "true";

      if (!file) {
        return NextResponse.json(
          { error: "No ZIP file provided" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await processV0Zip(buffer, file.name);

      // Filter sections if selection provided
      let sectionsToImport = result.sections;
      if (selectedSectionsStr) {
        try {
          const selected: string[] = JSON.parse(selectedSectionsStr);
          sectionsToImport = result.sections.filter((s) =>
            selected.includes(s.name)
          );
        } catch {
          // If JSON parse fails, import all sections
        }
      }

      const createdTemplates: Array<{
        id: string;
        name: string;
        slug: string;
        type: string;
      }> = [];

      // Create section templates
      for (const section of sectionsToImport) {
        const payload = buildTemplatePaylod(section);

        let slug = generateSlug(payload.name);
        const existing = await prisma.puckTemplate.findUnique({
          where: { slug },
        });
        if (existing) {
          slug = `${slug}-${Date.now()}`;
        }

        const template = await prisma.puckTemplate.create({
          data: {
            name: payload.name,
            slug,
            description: payload.description,
            type: payload.type,
            compatibleConfigs: payload.compatibleConfigs,
            content: JSON.parse(JSON.stringify(payload.content)),
            category: payload.category,
            tags: payload.tags,
            isSystem: false,
            isActive: true,
            createdById: context.user.id,
          },
        });

        createdTemplates.push({
          id: template.id,
          name: template.name,
          slug: template.slug,
          type: template.type,
        });
      }

      // Optionally create full-page template
      if (createFullPage && sectionsToImport.length > 0) {
        const pagePayload = buildPageTemplatePayload(
          sectionsToImport,
          result.pageTitle
        );

        let slug = generateSlug(pagePayload.name);
        const existing = await prisma.puckTemplate.findUnique({
          where: { slug },
        });
        if (existing) {
          slug = `${slug}-${Date.now()}`;
        }

        const pageTemplate = await prisma.puckTemplate.create({
          data: {
            name: pagePayload.name,
            slug,
            description: pagePayload.description,
            type: pagePayload.type,
            compatibleConfigs: pagePayload.compatibleConfigs,
            content: JSON.parse(JSON.stringify(pagePayload.content)),
            category: pagePayload.category,
            tags: pagePayload.tags,
            isSystem: false,
            isActive: true,
            createdById: context.user.id,
          },
        });

        createdTemplates.push({
          id: pageTemplate.id,
          name: pageTemplate.name,
          slug: pageTemplate.slug,
          type: pageTemplate.type,
        });
      }

      // Audit log
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: "puck_template.create",
        targetType: "puck_template",
        targetId: createdTemplates[0]?.id || "",
        details: {
          zipFilename: file.name,
          sectionsImported: sectionsToImport.length,
          templatesCreated: createdTemplates.length,
          templateNames: createdTemplates.map((t) => t.name),
        },
      });

      return NextResponse.json({
        success: true,
        templates: createdTemplates,
        totalImported: createdTemplates.length,
        theme: result.theme,
      });
    } catch (error) {
      console.error("[v0-zip] Import failed:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to import ZIP sections",
        },
        { status: 500 }
      );
    }
  }
);
