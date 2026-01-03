/**
 * Notification Primitives
 *
 * AI-callable primitives for user notifications.
 * Enables in-app notifications for orders, promotions, etc.
 */

import { CreatePrimitiveRequest } from '../types';

export const NOTIFICATION_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // LIST NOTIFICATIONS
  // ============================================================================
  {
    name: 'notification.list',
    description: 'Get user notifications with filtering',
    category: 'notification',
    tags: ['notification', 'user', 'alerts'],
    icon: 'Bell',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        type: {
          type: 'string',
          description: 'Filter by notification type',
          enum: ['ORDER', 'SHIPPING', 'PROMOTION', 'REVIEW', 'SYSTEM', 'PRICE_DROP', 'BACK_IN_STOCK'],
        },
        unreadOnly: {
          type: 'boolean',
          description: 'Only unread notifications',
          default: false,
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId, type, unreadOnly = false, page = 1, limit = 20 } = input;

      const where = { userId };
      if (type) where.type = type;
      if (unreadOnly) where.readAt = null;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, readAt: null } }),
      ]);

      return {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          actionUrl: n.actionUrl,
          imageUrl: n.imageUrl,
          read: !!n.readAt,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `,
  },

  // ============================================================================
  // MARK AS READ
  // ============================================================================
  {
    name: 'notification.markRead',
    description: 'Mark a notification as read',
    category: 'notification',
    tags: ['notification', 'read', 'update'],
    icon: 'CheckCircle',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        notificationId: {
          type: 'string',
          description: 'Notification ID',
        },
        userId: {
          type: 'string',
          description: 'User ID (for authorization)',
        },
      },
      required: ['notificationId', 'userId'],
    },
    handler: `
      const { notificationId, userId } = input;

      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.readAt) {
        return { id: notificationId, alreadyRead: true };
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });

      return { id: notificationId, markedAsRead: true };
    `,
  },

  // ============================================================================
  // MARK ALL AS READ
  // ============================================================================
  {
    name: 'notification.markAllRead',
    description: 'Mark all notifications as read for a user',
    category: 'notification',
    tags: ['notification', 'read', 'bulk'],
    icon: 'CheckCheck',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        type: {
          type: 'string',
          description: 'Only mark specific type as read',
          enum: ['ORDER', 'SHIPPING', 'PROMOTION', 'REVIEW', 'SYSTEM', 'PRICE_DROP', 'BACK_IN_STOCK'],
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId, type } = input;

      const where = { userId, readAt: null };
      if (type) where.type = type;

      const result = await prisma.notification.updateMany({
        where,
        data: { readAt: new Date() },
      });

      return {
        markedAsRead: result.count,
        userId,
        type: type || 'all',
      };
    `,
  },

  // ============================================================================
  // DELETE NOTIFICATION
  // ============================================================================
  {
    name: 'notification.delete',
    description: 'Delete a notification',
    category: 'notification',
    tags: ['notification', 'delete'],
    icon: 'Trash2',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        notificationId: {
          type: 'string',
          description: 'Notification ID',
        },
        userId: {
          type: 'string',
          description: 'User ID (for authorization)',
        },
      },
      required: ['notificationId', 'userId'],
    },
    handler: `
      const { notificationId, userId } = input;

      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await prisma.notification.delete({ where: { id: notificationId } });

      return { deleted: true, notificationId };
    `,
  },

  // ============================================================================
  // GET UNREAD COUNT
  // ============================================================================
  {
    name: 'notification.getUnreadCount',
    description: 'Get count of unread notifications',
    category: 'notification',
    tags: ['notification', 'count', 'badge'],
    icon: 'Hash',
    timeout: 2000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId } = input;

      const count = await prisma.notification.count({
        where: { userId, readAt: null },
      });

      return { userId, unreadCount: count };
    `,
  },

  // ============================================================================
  // CREATE NOTIFICATION (Admin/System)
  // ============================================================================
  {
    name: 'notification.create',
    description: 'Create a new notification for a user',
    category: 'notification',
    tags: ['notification', 'create', 'admin'],
    icon: 'BellPlus',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Target user ID',
        },
        type: {
          type: 'string',
          description: 'Notification type',
          enum: ['ORDER', 'SHIPPING', 'PROMOTION', 'REVIEW', 'SYSTEM', 'PRICE_DROP', 'BACK_IN_STOCK'],
        },
        title: {
          type: 'string',
          description: 'Notification title',
          maxLength: 200,
        },
        message: {
          type: 'string',
          description: 'Notification message',
          maxLength: 1000,
        },
        actionUrl: {
          type: 'string',
          description: 'URL to navigate when clicked',
        },
        imageUrl: {
          type: 'string',
          description: 'Image URL to display',
        },
        data: {
          type: 'object',
          description: 'Additional data (orderId, productId, etc.)',
        },
      },
      required: ['userId', 'type', 'title', 'message'],
    },
    handler: `
      const { userId, type, title, message, actionUrl, imageUrl, data } = input;

      // Verify user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          actionUrl: actionUrl || null,
          imageUrl: imageUrl || null,
          data: data || {},
        },
      });

      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        createdAt: notification.createdAt,
      };
    `,
  },

  // ============================================================================
  // GET NOTIFICATION PREFERENCES
  // ============================================================================
  {
    name: 'notification.getPreferences',
    description: 'Get user notification preferences',
    category: 'notification',
    tags: ['notification', 'preferences', 'settings'],
    icon: 'Settings',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId } = input;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Default preferences if not set
      const defaults = {
        orderUpdates: true,
        shippingUpdates: true,
        promotions: true,
        priceDrops: true,
        backInStock: true,
        reviewReminders: true,
        emailNotifications: true,
        pushNotifications: false,
      };

      return {
        userId,
        preferences: { ...defaults, ...(user.notificationPreferences || {}) },
      };
    `,
  },

  // ============================================================================
  // UPDATE NOTIFICATION PREFERENCES
  // ============================================================================
  {
    name: 'notification.updatePreferences',
    description: 'Update user notification preferences',
    category: 'notification',
    tags: ['notification', 'preferences', 'settings'],
    icon: 'Settings2',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        preferences: {
          type: 'object',
          description: 'Preference settings to update',
          properties: {
            orderUpdates: { type: 'boolean' },
            shippingUpdates: { type: 'boolean' },
            promotions: { type: 'boolean' },
            priceDrops: { type: 'boolean' },
            backInStock: { type: 'boolean' },
            reviewReminders: { type: 'boolean' },
            emailNotifications: { type: 'boolean' },
            pushNotifications: { type: 'boolean' },
          },
        },
      },
      required: ['userId', 'preferences'],
    },
    handler: `
      const { userId, preferences } = input;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: {
            ...(user.notificationPreferences || {}),
            ...preferences,
          },
        },
        select: { notificationPreferences: true },
      });

      return {
        userId,
        preferences: updated.notificationPreferences,
        updated: true,
      };
    `,
  },
];
