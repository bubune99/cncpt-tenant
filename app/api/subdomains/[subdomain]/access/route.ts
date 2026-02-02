/**
 * Subdomain Access API
 *
 * GET /api/subdomains/[subdomain]/access?level=view|edit|admin
 *
 * Checks if the current user has access to a subdomain.
 * Returns access type (owner/team) and access level.
 *
 * Special case: "demo" subdomain allows unauthenticated read-only access.
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { canAccessSubdomain } from "@/lib/team-auth";
import { isDemoSubdomain, DEMO_USER } from "@/lib/demo";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ subdomain: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { subdomain } = await params;
    const url = new URL(request.url);
    const requiredLevel = (url.searchParams.get("level") || "view") as "view" | "edit" | "admin";

    // Special handling for demo subdomain - allow unauthenticated access
    if (isDemoSubdomain(subdomain)) {
      return NextResponse.json({
        hasAccess: true,
        accessType: "demo",
        accessLevel: "view", // Read-only access for demo
        isDemo: true,
        userId: DEMO_USER.id,
        subdomain,
      });
    }

    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", hasAccess: false },
        { status: 401 }
      );
    }

    const accessResult = await canAccessSubdomain(user.id, subdomain, requiredLevel);

    return NextResponse.json({
      hasAccess: accessResult.hasAccess,
      accessType: accessResult.accessType,
      accessLevel: accessResult.accessLevel || null,
      teamId: accessResult.teamId,
      userId: user.id,
      subdomain,
    });
  } catch (error) {
    console.error("[subdomain-access] Error:", error);
    return NextResponse.json(
      { error: "Failed to check access", hasAccess: false },
      { status: 500 }
    );
  }
}
