import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { createScopedClient } from '@/lib/cms/db/scoped-client';
import { stackServerApp } from '@/lib/cms/stack';
import { markAsRead, deleteNotification } from '@/lib/cms/notifications/admin';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(request, async () => {
    try {
      const userId = await getDbUserId();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = await params;

      // Use scoped client -- automatically filters by userId
      const scopedDb = createScopedClient(userId);
      const notification = await scopedDb.notification.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!notification) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const updated = await markAsRead(id);
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(request, async () => {
    try {
      const userId = await getDbUserId();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id } = await params;

      // Use scoped client -- automatically filters by userId
      const scopedDb = createScopedClient(userId);
      const notification = await scopedDb.notification.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!notification) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      await deleteNotification(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
  })
}
