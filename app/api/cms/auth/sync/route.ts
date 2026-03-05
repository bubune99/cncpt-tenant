import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/cms/db';
import { syncUserToDb, recordSignIn } from "@/lib/auth-sync";

export const dynamic = 'force-dynamic'

/**
 * POST /api/cms/auth/sync
 * Syncs a Stack Auth user to both:
 * 1. CMS User model (Prisma) — for CMS admin, page editing, blog authoring
 * 2. Platform users table (raw SQL) — for dashboard, billing, credits
 *
 * Called after successful authentication to ensure user exists in both DBs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stackAuthId, email, name, avatar } = body;

    if (!stackAuthId || !email) {
      return NextResponse.json(
        { error: "stackAuthId and email are required" },
        { status: 400 }
      );
    }

    // ---- CMS User sync (Prisma) ----

    // First check if user exists by stackAuthId
    let user = await prisma.user.findUnique({
      where: { stackAuthId },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { stackAuthId },
        data: {
          email,
          name: name || undefined,
          avatar: avatar || undefined,
        },
      });
    } else {
      // Check if email already exists (user may have been created before Stack Auth sync)
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        // Link existing user to Stack Auth
        user = await prisma.user.update({
          where: { email },
          data: {
            stackAuthId,
            name: name || existingByEmail.name,
            avatar: avatar || existingByEmail.avatar,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            stackAuthId,
            email,
            name: name || null,
            avatar: avatar || null,
            role: "CUSTOMER",
          },
        });
      }
    }

    // ---- Platform users table sync (raw SQL) ----
    // This ensures the platform DB has a record for subscription/billing/credits
    try {
      await syncUserToDb({
        id: stackAuthId,
        primaryEmail: email,
        displayName: name || null,
        profileImageUrl: avatar || null,
      });

      // Record login activity
      const ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        undefined;
      await recordSignIn(stackAuthId, ipAddress);
    } catch (platformError) {
      // Platform sync failure is non-critical — log and continue
      console.warn("[cms/auth/sync] Platform users table sync failed (non-critical):", platformError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        stackAuthId: user.stackAuthId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("User sync error:", error);

    // Handle unique constraint violation (email already exists with different stackAuthId)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Email already registered with different account" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sync?stackAuthId=xxx
 * Get user by Stack Auth ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stackAuthId = searchParams.get("stackAuthId");

    if (!stackAuthId) {
      return NextResponse.json(
        { error: "stackAuthId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { stackAuthId },
      select: {
        id: true,
        stackAuthId: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup user" },
      { status: 500 }
    );
  }
}
