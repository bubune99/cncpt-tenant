/**
 * Admin Chat Tools
 *
 * Tools available to the AI assistant for admin operations.
 * These enable the AI to perform actions within the CMS.
 *
 * All tools include proper error handling and timeouts to prevent
 * stream hangs during tool execution.
 */

import { tool } from 'ai';
import { z } from 'zod';

/**
 * Timeout wrapper for async operations
 * Prevents indefinite hangs during database operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Safe database import with error handling
 */
async function getDb() {
  try {
    const { prisma } = await import('../../db');
    return prisma;
  } catch (error) {
    console.error('[AdminTools] Failed to import database:', error);
    throw new Error('Database connection unavailable');
  }
}

/**
 * Navigation Tool
 * Allows the AI to navigate the user to different admin pages
 * This is a lightweight tool - no database access needed
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
    try {
      const prisma = await getDb();
      const searchLimit = Math.min(limit ?? 10, 50); // Cap at 50 results

      const products = await withTimeout(
        prisma.product.findMany({
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
        }),
        5000,
        'Product search timed out'
      );

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
    } catch (error) {
      console.error('[AdminTools] searchProducts error:', error);
      return {
        action: 'error',
        count: 0,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
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
    try {
      const prisma = await getDb();
      const searchLimit = Math.min(limit ?? 10, 50); // Cap at 50 results

      type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
      const orders = await withTimeout(
        prisma.order.findMany({
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
        }),
        5000,
        'Order search timed out'
      );

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
    } catch (error) {
      console.error('[AdminTools] searchOrders error:', error);
      return {
        action: 'error',
        count: 0,
        orders: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to search orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
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
    try {
      const prisma = await getDb();
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

      const [orderStats, productCount, userCount] = await withTimeout(
        Promise.all([
          prisma.order.aggregate({
            where: { createdAt: { gte: startDate } },
            _count: true,
            _sum: { total: true },
          }),
          prisma.product.count({ where: { status: 'ACTIVE' } }),
          prisma.user.count(),
        ]),
        5000,
        'Dashboard stats query timed out'
      );

      return {
        period: selectedPeriod,
        orders: orderStats._count,
        revenue: orderStats._sum.total || 0,
        activeProducts: productCount,
        totalUsers: userCount,
      };
    } catch (error) {
      console.error('[AdminTools] getDashboardStats error:', error);
      return {
        action: 'error',
        period: period ?? 'month',
        orders: 0,
        revenue: 0,
        activeProducts: 0,
        totalUsers: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to get dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
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
    try {
      const prisma = await getDb();
      const activityLimit = Math.min(limit ?? 10, 50); // Cap at 50 results

      const [recentOrders, recentUsers] = await withTimeout(
        Promise.all([
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
        ]),
        5000,
        'Recent activity query timed out'
      );

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
    } catch (error) {
      console.error('[AdminTools] getRecentActivity error:', error);
      return {
        action: 'error',
        recentOrders: [],
        recentUsers: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to get recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// Re-export artifact tools for use in chat
export { createDocument } from './create-document';
export { updateDocument } from './update-document';
export { requestSuggestions } from './request-suggestions';

// Re-export walkthrough tools for AI-guided learning
export {
  suggestWalkthroughs,
  generateWalkthrough,
  startWalkthrough,
  createHelpContent,
  listWalkthroughs,
  explainElement,
  highlightElement,
  startGuidedExplanation,
  walkthroughTools,
} from './walkthrough-tools';

// Re-export help management tools for content lifecycle
export {
  listHelpKeys,
  getHelpContent,
  updateHelpContent,
  scanForMissingHelp,
  batchGenerateHelp,
  reviewOrphanedHelp,
  markHelpOrphaned,
  manageHelpStatus,
  purgeDeletedHelp,
  generateEntityHelp,
  helpManagementTools,
} from './help-management-tools';

// Re-export entity tools for context awareness
export {
  getEntityDetails,
  searchEntities,
  getEntityStats,
  entityTools,
} from './entity-tools';

/**
 * Task Completion Tool (Termination Pattern)
 *
 * This tool has NO execute function, which signals the AI SDK to stop the agent loop.
 * The agent MUST call this tool when it has completed all requested steps.
 * This prevents the agent from stopping after just one tool call.
 *
 * @see https://ai-sdk.dev/docs/agents/loop-control#forced-tool-calling-pattern
 */
export const taskComplete = tool({
  description: `Signal that you have completed ALL steps of the user's request.
You MUST call this tool when finished with multi-step tasks.
DO NOT call this until you have actually executed all the tools needed to complete the request.
If the user asked you to list AND update something, you must do BOTH before calling this.`,
  inputSchema: z.object({
    summary: z.string().describe('Brief summary of all actions taken and their results'),
    stepsCompleted: z.number().describe('Total number of tool calls/steps you executed'),
    toolsUsed: z.array(z.string()).describe('Names of all tools you called to complete this task'),
  }),
  // NO execute function - this stops the agent loop per AI SDK documentation
});

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

/**
 * Workflow control tools for multi-step task completion
 */
export const workflowTools = {
  taskComplete,
};
