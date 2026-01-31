/**
 * v0 Import API
 *
 * POST /api/v0/import - Import v0 component using AI agent
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/lib/cms/stack";
import { getV0ImportAgent } from "@/lib/cms/v0-agent";
import type { V0ImportRequest } from "@/lib/cms/v0-agent";

/**
 * POST - Import a v0 component
 *
 * Request body:
 * - url: string - v0.dev URL to import
 * - code?: string - Raw component code (alternative to URL)
 * - name?: string - Override template name
 * - category?: string - Category for the template
 * - description?: string - Custom description
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    if (!body.url && !body.code) {
      return NextResponse.json(
        { error: "Either 'url' or 'code' must be provided" },
        { status: 400 }
      );
    }

    // Get the v0 import agent
    const agent = getV0ImportAgent({
      verbose: process.env.NODE_ENV === "development",
    });

    let result;

    if (body.url) {
      // Import from v0.dev URL
      const importRequest: V0ImportRequest = {
        url: body.url,
        name: body.name,
        category: body.category,
        description: body.description,
      };

      result = await agent.importComponent(importRequest);
    } else {
      // Import from pasted code
      result = await agent.importFromCode(body.code, {
        name: body.name,
        category: body.category,
        description: body.description,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      template: result.template,
      message: "Component imported successfully",
    });
  } catch (error) {
    console.error("v0 import error:", error);
    return NextResponse.json(
      {
        success: false,
        errors: ["Failed to import component", (error as Error).message],
      },
      { status: 500 }
    );
  }
}
