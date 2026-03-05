import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { stackServerApp } from '@/lib/cms/stack';
import { markAllAsRead } from '@/lib/cms/notifications/admin';
import { withTenant } from '@/lib/cms/api/tenant';

export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
    try {
      const stackUser = await stackServerApp.getUser();
      if (!stackUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { stackAuthId: stackUser.id },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await markAllAsRead(user.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error marking all as read:', error);
      return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
    }
  })
}
