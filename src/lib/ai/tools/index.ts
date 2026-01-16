/**
 * Admin Chat Tools
 *
 * Tools available to the AI assistant for admin operations.
 * These enable the AI to perform actions within the CMS.
 */

import { tool } from 'ai';
import { z } from 'zod';

/**
 * Navigation Tool
 * Allows the AI to navigate the user to different admin pages
 */
export const navigateTo = tool({
  description: 'Navigate the user to a different page in the admin panel. Use this when the user asks to go somewhere or when you need to show them something specific.',
  inputSchema: z.object({
    path: z.string().describe('The path to navigate to, e.g., "/admin/products" or "/admin/orders/123"'),
    reason: z.string().describe('Brief explanation of why navigating here'),
  }),
  execute: async ({ path, reason }: { path: string; reason: string }) => {
    // The actual navigation happens client-side via the tool result
    return {
      action: 'navigate',
      path,
      reason,
      success: true,
    };
  },
});

/**
 * Search Products Tool
 */
export const searchProducts = tool({
  description: 'Search for products in the store by title, SKU, or description',
  inputSchema: z.object({
    query: z.string().describe('Search query for products'),
    limit: z.number().optional().default(10).describe('Maximum number of results'),
  }),
  execute: async ({ query, limit }: { query: string; limit?: number }) => {
    // Import prisma dynamically to avoid issues
    const { prisma } = await import('../../db');
    const searchLimit = limit ?? 10;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        sku: true,
        basePrice: true,
        status: true,
      },
      take: searchLimit,
    });

    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        price: p.basePrice / 100, // Convert cents to dollars
        status: p.status,
        adminUrl: `/admin/products/${p.id}`,
      })),
    };
  },
});

/**
 * Search Orders Tool
 */
export const searchOrders = tool({
  description: 'Search for orders by order number, customer email, or status',
  inputSchema: z.object({
    query: z.string().optional().describe('Search query (order number or email)'),
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ query, status, limit }: { query?: string; status?: string; limit?: number }) => {
    const { prisma } = await import('../../db');
    const searchLimit = limit ?? 10;

    type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    const orders = await prisma.order.findMany({
      where: {
        AND: [
          status ? { status: status as OrderStatus } : {},
          query
            ? {
                OR: [
                  { orderNumber: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: searchLimit,
    });

    return {
      count: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        email: o.email,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        adminUrl: `/admin/orders/${o.id}`,
      })),
    };
  },
});

/**
 * Get Dashboard Stats Tool
 */
export const getDashboardStats = tool({
  description: 'Get overview statistics for the admin dashboard including orders, revenue, and product counts',
  inputSchema: z.object({
    period: z.enum(['today', 'week', 'month', 'year']).optional().default('month'),
  }),
  execute: async ({ period }: { period?: 'today' | 'week' | 'month' | 'year' }) => {
    const { prisma } = await import('../../db');
    const selectedPeriod = period ?? 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [orderStats, productCount, userCount] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: startDate } },
        _count: true,
        _sum: { total: true },
      }),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
    ]);

    return {
      period: selectedPeriod,
      orders: orderStats._count,
      revenue: orderStats._sum.total || 0,
      activeProducts: productCount,
      totalUsers: userCount,
    };
  },
});

/**
 * Get Recent Activity Tool
 */
export const getRecentActivity = tool({
  description: 'Get recent activity in the store including new orders, new users, and product updates',
  inputSchema: z.object({
    limit: z.number().optional().default(10),
  }),
  execute: async ({ limit }: { limit?: number }) => {
    const activityLimit = limit ?? 10;
    const { prisma } = await import('../../db');

    const [recentOrders, recentUsers] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: activityLimit,
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      recentOrders: recentOrders.map((o) => ({
        type: 'order',
        id: o.id,
        description: `Order ${o.orderNumber} - ${o.status}`,
        amount: o.total,
        createdAt: o.createdAt,
      })),
      recentUsers: recentUsers.map((u) => ({
        type: 'user',
        id: u.id,
        description: `New user: ${u.name || u.email}`,
        createdAt: u.createdAt,
      })),
    };
  },
});

// Re-export artifact tools for use in chat
export { createDocument } from './create-document';
export { updateDocument } from './update-document';
export { requestSuggestions } from './request-suggestions';

/**
 * All admin tools combined
 */
export const adminTools = {
  navigateTo,
  searchProducts,
  searchOrders,
  getDashboardStats,
  getRecentActivity,
};
