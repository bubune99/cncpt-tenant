/**
 * Individual Feedback API
 *
 * GET /api/feedback/[id] - Get single feedback
 * PATCH /api/feedback/[id] - Update feedback status/notes
 * DELETE /api/feedback/[id] - Delete feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { stackServerApp } from '@/lib/cms/stack';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Check if user is superadmin
 */
async function requireSuperAdmin(userId: string) {
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { userId },
  });
  return superAdmin && !superAdmin.revokedAt;
}

/**
 * GET - Get single feedback
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await requireSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

/**
 * PATCH - Update feedback
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await requireSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const validStatuses = ['NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'];
    const updateData: Record<string, unknown> = {};

    if (body.status && validStatuses.includes(body.status)) {
      updateData.status = body.status;
      if (body.status === 'RESOLVED') {
        updateData.resolvedBy = user.id;
        updateData.resolvedAt = new Date();
      }
    }

    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes;
    }

    if (body.priority !== undefined) {
      updateData.priority = parseInt(body.priority, 10);
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

/**
 * DELETE - Delete feedback
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await requireSuperAdmin(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
