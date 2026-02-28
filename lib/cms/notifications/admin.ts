import { prisma } from '../db';
import type { NotificationType } from '@prisma/client';

export interface ListNotificationsOptions {
  type?: NotificationType;
  unread?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface ListNotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
  total: number;
}

export async function listNotifications(
  userId: string,
  options: ListNotificationsOptions = {}
): Promise<ListNotificationsResult> {
  const { type, unread, limit = 20, offset = 0 } = options;

  const where: Record<string, unknown> = { userId };
  if (type) where.type = type;
  if (unread !== undefined) where.read = !unread;

  const [items, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, unreadCount, total };
}

export async function getUnreadCounts(
  userId: string
): Promise<Record<string, number>> {
  const groups = await prisma.notification.groupBy({
    by: ['entityType'],
    where: { userId, read: false },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const group of groups) {
    const key = group.entityType || 'system';
    counts[key] = (counts[key] || 0) + group._count.id;
  }
  return counts;
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({ where: { id } });
}
