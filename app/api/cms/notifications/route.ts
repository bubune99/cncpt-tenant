import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { createScopedClient } from '@/lib/cms/db/scoped-client';
import { stackServerApp } from '@/lib/cms/stack';
import { listNotifications } from '@/lib/cms/notifications/admin';
import type { NotificationType } from '@prisma/client';
import { withTenant } from '@/lib/cms/api/tenant';

async function getDbUserId(): Promise<string | null> {
  const stackUser = await stackServerApp.getUser();
  if (!stackUser) return null;
  const user = await prisma.user.findUnique({
    where: { stackAuthId: stackUser.id },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const userId = await getDbUserId();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type') as NotificationType | null;
      const unreadParam = searchParams.get('unread');
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const result = await listNotifications(userId, {
        type: type || undefined,
        unread: unreadParam === 'true' ? true : unreadParam === 'false' ? false : undefined,
        limit: Math.min(limit, 100),
        offset,
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
  })
}

export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const stackUser = await stackServerApp.getUser();
      if (!stackUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const dbUser = await prisma.user.findUnique({
        where: { stackAuthId: stackUser.id },
        select: { id: true },
      });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const body = await request.json();
      const { userId, type, title, message, link, entityType, entityId } = body;

      if (!userId || !type || !title || !message) {
        return NextResponse.json(
          { error: 'userId, type, title, and message are required' },
          { status: 400 }
        );
      }

      // Use scoped client -- ensures the creator's userId is enforced
      const scopedDb = createScopedClient(dbUser.id);
      const notification = await scopedDb.notification.create({
        data: { userId, type, title, message, link, entityType, entityId },
      });

      return NextResponse.json(notification, { status: 201 });
    } catch (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
  })
}
