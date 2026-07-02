/**
 * v0 ZIP Analyze API
 *
 * POST /api/v0/zip — accepts multipart/form-data with a ZIP file,
 * processes it through the mechanical engine, and returns decomposed
 * sections for the UI to display.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  withPermission,
  type AuthContext,
} from "@/lib/cms/permissions/middleware";
import { PERMISSIONS } from "@/lib/cms/permissions";
import { processV0Zip } from "@/lib/cms/v0/zip-engine";

export const POST = withPermission(
  PERMISSIONS.PAGES_CREATE,
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No ZIP file provided" },
          { status: 400 }
        );
      }

      if (!file.name.endsWith(".zip")) {
        return NextResponse.json(
          { error: "File must be a .zip archive" },
          { status: 400 }
        );
      }

      // 50MB limit
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "ZIP file must be under 50MB" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await processV0Zip(buffer, file.name);

      return NextResponse.json({
        sections: result.sections.map((s) => ({
          name: s.name,
          type: s.type,
          componentCount: s.componentCount,
          sourceFile: s.sourceFile,
          // Include content for preview but it can be large
          content: s.content,
        })),
        theme: result.theme,
        pageTitle: result.pageTitle,
        totalSections: result.sections.length,
        totalComponents: result.sections.reduce(
          (sum, s) => sum + s.componentCount,
          0
        ),
      });
    } catch (error) {
      console.error("[v0-zip] Analysis failed:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to process ZIP file",
        },
        { status: 500 }
      );
    }
  }
);
