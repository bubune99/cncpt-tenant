/**
 * Feedback API
 *
 * POST /api/feedback - Submit user feedback
 * GET /api/feedback - Get feedback (superadmin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { stackServerApp } from '@/lib/cms/stack';

export const dynamic = 'force-dynamic';

/**
 * POST - Submit feedback
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, subject, message, pageUrl, tenantId } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate feedback type
    const validTypes = ['BUG', 'FEATURE', 'GENERAL', 'OTHER'];
    const feedbackType = validTypes.includes(type) ? type : 'GENERAL';

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        userEmail: user.primaryEmail || '',
        userName: user.displayName || undefined,
        tenantId: tenantId ? parseInt(tenantId, 10) : null,
        type: feedbackType,
        subject: subject?.trim() || null,
        message: message.trim(),
        pageUrl: pageUrl || null,
        userAgent: request.headers.get('user-agent') || null,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

/**
 * GET - List feedback (superadmin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { userId: user.id },
    });

    if (!superAdmin || superAdmin.revokedAt) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({ feedback, total, limit, offset });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
