import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/cms/db';

/**
 * POST /api/auth/sync
 * Syncs a Stack Auth user to the local database.
 * Called after successful authentication to ensure user exists in DB.
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
