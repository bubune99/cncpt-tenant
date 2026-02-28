import { NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { stackServerApp } from '@/lib/cms/stack';
import { getUnreadCounts } from '@/lib/cms/notifications/admin';

export async function GET() {
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

    const counts = await getUnreadCounts(user.id);
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return NextResponse.json({ counts, total });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ error: 'Failed to fetch unread counts' }, { status: 500 });
  }
}
