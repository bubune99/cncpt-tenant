/**
 * Notification Tools — Atlas Redesign G11
 *
 * Agent tools for reading and marking notifications.
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { NotificationType } from '@prisma/client'

async function getDb() {
  const { prisma } = await import('../../db')
  return prisma
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId!)
    throw error
  }
}

export const listNotifications = tool({
  description: 'List notifications for a tenant. Supports filtering by unread status and type.',
  inputSchema: z.object({
    tenantId: z.number().int(),
    unreadOnly: z.boolean().optional(),
    type: z.string().optional().describe('Filter by NotificationType e.g. ORDER_PLACED'),
    limit: z.number().int().optional(),
    offset: z.number().int().optional(),
  }),
  execute: async ({ tenantId, unreadOnly, type, limit, offset }) => {
    try {
      const prisma = await getDb()
      const take = Math.min(limit ?? 20, 100)
      const skip = offset ?? 0

      const [notifications, unreadCount] = await withTimeout(
        Promise.all([
          prisma.notification.findMany({
            where: {
              tenantId,
              ...(unreadOnly ? { read: false } : {}),
              ...(type ? { type: type as NotificationType } : {}),
            },
            take,
            skip,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.notification.count({ where: { tenantId, read: false } }),
        ]),
        5000,
        'List notifications timed out'
      )

      return { success: true, notifications, count: notifications.length, unreadCount }
    } catch (error: unknown) {
      return { success: false, notifications: [], count: 0, unreadCount: 0, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const markNotificationRead = tool({
  description: 'Mark a specific notification as read.',
  inputSchema: z.object({
    id: z.string().describe('Notification ID'),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb()

      const notification = await withTimeout(
        prisma.notification.update({
          where: { id },
          data: { read: true, readAt: new Date() },
          select: { id: true, read: true, readAt: true },
        }),
        5000,
        'Mark notification read timed out'
      )

      return { success: true, notification }
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark notification read' }
    }
  },
})

export const markAllNotificationsRead = tool({
  description: 'Mark all unread notifications for a tenant as read.',
  inputSchema: z.object({
    tenantId: z.number().int(),
  }),
  execute: async ({ tenantId }) => {
    try {
      const prisma = await getDb()

      const result = await withTimeout(
        prisma.notification.updateMany({
          where: { tenantId, read: false },
          data: { read: true, readAt: new Date() },
        }),
        5000,
        'Mark all notifications read timed out'
      )

      return { success: true, markedRead: result.count, message: `${result.count} notifications marked as read` }
    } catch (error: unknown) {
      return { success: false, markedRead: 0, error: error instanceof Error ? error.message : 'Failed' }
    }
  },
})

export const notificationTools = { listNotifications, markNotificationRead, markAllNotificationsRead }
