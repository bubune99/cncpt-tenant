/**
 * Analytics Primitives
 *
 * AI-callable primitives for event tracking and analytics.
 * Integrates with the existing analytics system in src/lib/analytics/.
 */

import { CreatePrimitiveRequest } from '../types';

export const ANALYTICS_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // TRACK EVENT
  // ============================================================================
  {
    name: 'analytics.trackEvent',
    description: 'Track a custom analytics event',
    category: 'analytics',
    tags: ['analytics', 'tracking', 'events'],
    icon: 'Activity',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'string',
          description: 'Event name (e.g., button_click, form_submit)',
          minLength: 1,
          maxLength: 100,
        },
        category: {
          type: 'string',
          description: 'Event category (e.g., engagement, conversion)',
        },
        properties: {
          type: 'object',
          description: 'Additional event properties',
        },
        userId: {
          type: 'string',
          description: 'User ID (if authenticated)',
        },
        sessionId: {
          type: 'string',
          description: 'Session ID',
        },
      },
      required: ['event'],
    },
    handler: `
      const { event, category, properties = {}, userId, sessionId } = input;

      const analyticsEvent = await prisma.analyticsEvent.create({
        data: {
          event,
          category: category || 'custom',
          properties,
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date(),
          url: properties.url || null,
          referrer: properties.referrer || null,
          userAgent: properties.userAgent || null,
        },
      });

      return {
        tracked: true,
        eventId: analyticsEvent.id,
        event,
        category: category || 'custom',
        timestamp: analyticsEvent.timestamp,
      };
    `,
  },

  // ============================================================================
  // TRACK PAGE VIEW
  // ============================================================================
  {
    name: 'analytics.trackPageView',
    description: 'Track a page view event',
    category: 'analytics',
    tags: ['analytics', 'tracking', 'pageview'],
    icon: 'Eye',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Page URL',
        },
        title: {
          type: 'string',
          description: 'Page title',
        },
        referrer: {
          type: 'string',
          description: 'Referrer URL',
        },
        userId: {
          type: 'string',
          description: 'User ID (if authenticated)',
        },
        sessionId: {
          type: 'string',
          description: 'Session ID',
        },
        userAgent: {
          type: 'string',
          description: 'User agent string',
        },
      },
      required: ['url'],
    },
    handler: `
      const { url, title, referrer, userId, sessionId, userAgent } = input;

      const event = await prisma.analyticsEvent.create({
        data: {
          event: 'page_view',
          category: 'navigation',
          properties: { title },
          url,
          referrer: referrer || null,
          userId: userId || null,
          sessionId: sessionId || null,
          userAgent: userAgent || null,
          timestamp: new Date(),
        },
      });

      return {
        tracked: true,
        eventId: event.id,
        url,
        title,
        timestamp: event.timestamp,
      };
    `,
  },

  // ============================================================================
  // TRACK PURCHASE
  // ============================================================================
  {
    name: 'analytics.trackPurchase',
    description: 'Track an e-commerce purchase event',
    category: 'analytics',
    tags: ['analytics', 'tracking', 'ecommerce', 'purchase'],
    icon: 'ShoppingCart',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID',
        },
        total: {
          type: 'number',
          description: 'Order total',
        },
        currency: {
          type: 'string',
          description: 'Currency code',
          default: 'USD',
        },
        items: {
          type: 'array',
          description: 'Purchased items',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
            },
          },
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        sessionId: {
          type: 'string',
          description: 'Session ID',
        },
      },
      required: ['orderId', 'total'],
    },
    handler: `
      const { orderId, total, currency = 'USD', items = [], userId, sessionId } = input;

      const event = await prisma.analyticsEvent.create({
        data: {
          event: 'purchase',
          category: 'ecommerce',
          properties: {
            orderId,
            total,
            currency,
            items,
            itemCount: items.length,
          },
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date(),
        },
      });

      return {
        tracked: true,
        eventId: event.id,
        orderId,
        total,
        currency,
        itemCount: items.length,
        timestamp: event.timestamp,
      };
    `,
  },

  // ============================================================================
  // GET EVENTS
  // ============================================================================
  {
    name: 'analytics.getEvents',
    description: 'Query analytics events with filtering',
    category: 'analytics',
    tags: ['analytics', 'reporting', 'events'],
    icon: 'BarChart',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'string',
          description: 'Filter by event name',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        userId: {
          type: 'string',
          description: 'Filter by user ID',
        },
        startDate: {
          type: 'string',
          description: 'Start date (ISO 8601)',
        },
        endDate: {
          type: 'string',
          description: 'End date (ISO 8601)',
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 50,
          maximum: 200,
        },
      },
      required: [],
    },
    handler: `
      const { event, category, userId, startDate, endDate, page = 1, limit = 50 } = input;

      const where = {};
      if (event) where.event = event;
      if (category) where.category = category;
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const [events, total] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.analyticsEvent.count({ where }),
      ]);

      return {
        events: events.map(e => ({
          id: e.id,
          event: e.event,
          category: e.category,
          properties: e.properties,
          url: e.url,
          userId: e.userId,
          sessionId: e.sessionId,
          timestamp: e.timestamp,
        })),
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
  // GET AGGREGATED STATS
  // ============================================================================
  {
    name: 'analytics.getStats',
    description: 'Get aggregated analytics statistics',
    category: 'analytics',
    tags: ['analytics', 'reporting', 'statistics'],
    icon: 'TrendingUp',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Time period',
          enum: ['today', 'yesterday', '7d', '30d', '90d', 'custom'],
          default: '7d',
        },
        startDate: {
          type: 'string',
          description: 'Custom start date (ISO 8601)',
        },
        endDate: {
          type: 'string',
          description: 'Custom end date (ISO 8601)',
        },
        metrics: {
          type: 'array',
          description: 'Metrics to include',
          items: {
            type: 'string',
            enum: ['pageViews', 'uniqueVisitors', 'purchases', 'revenue', 'topPages', 'topEvents'],
          },
        },
      },
      required: [],
    },
    handler: `
      const { period = '7d', startDate, endDate, metrics = ['pageViews', 'uniqueVisitors', 'purchases', 'revenue'] } = input;

      // Calculate date range
      let start, end = new Date();
      if (period === 'custom' && startDate) {
        start = new Date(startDate);
        if (endDate) end = new Date(endDate);
      } else {
        const days = { today: 0, yesterday: 1, '7d': 7, '30d': 30, '90d': 90 }[period] || 7;
        start = new Date();
        start.setDate(start.getDate() - days);
        if (period === 'yesterday') {
          end = new Date(start);
          end.setDate(end.getDate() + 1);
        }
      }

      const where = {
        timestamp: { gte: start, lte: end },
      };

      const stats = {};

      if (metrics.includes('pageViews')) {
        stats.pageViews = await prisma.analyticsEvent.count({
          where: { ...where, event: 'page_view' },
        });
      }

      if (metrics.includes('uniqueVisitors')) {
        const visitors = await prisma.analyticsEvent.findMany({
          where: { ...where, event: 'page_view', sessionId: { not: null } },
          select: { sessionId: true },
          distinct: ['sessionId'],
        });
        stats.uniqueVisitors = visitors.length;
      }

      if (metrics.includes('purchases')) {
        stats.purchases = await prisma.analyticsEvent.count({
          where: { ...where, event: 'purchase' },
        });
      }

      if (metrics.includes('revenue')) {
        const purchases = await prisma.analyticsEvent.findMany({
          where: { ...where, event: 'purchase' },
          select: { properties: true },
        });
        stats.revenue = purchases.reduce((sum, p) => sum + (p.properties?.total || 0), 0);
      }

      if (metrics.includes('topPages')) {
        const pages = await prisma.analyticsEvent.groupBy({
          by: ['url'],
          where: { ...where, event: 'page_view', url: { not: null } },
          _count: { url: true },
          orderBy: { _count: { url: 'desc' } },
          take: 10,
        });
        stats.topPages = pages.map(p => ({ url: p.url, views: p._count.url }));
      }

      if (metrics.includes('topEvents')) {
        const events = await prisma.analyticsEvent.groupBy({
          by: ['event'],
          where,
          _count: { event: true },
          orderBy: { _count: { event: 'desc' } },
          take: 10,
        });
        stats.topEvents = events.map(e => ({ event: e.event, count: e._count.event }));
      }

      return {
        period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...stats,
      };
    `,
  },

  // ============================================================================
  // TRACK ADD TO CART
  // ============================================================================
  {
    name: 'analytics.trackAddToCart',
    description: 'Track add to cart event for e-commerce analytics',
    category: 'analytics',
    tags: ['analytics', 'tracking', 'ecommerce', 'cart'],
    icon: 'ShoppingBag',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        variantId: {
          type: 'string',
          description: 'Variant ID',
        },
        productName: {
          type: 'string',
          description: 'Product name',
        },
        price: {
          type: 'number',
          description: 'Product price',
        },
        quantity: {
          type: 'number',
          description: 'Quantity added',
          default: 1,
        },
        currency: {
          type: 'string',
          description: 'Currency code',
          default: 'USD',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        sessionId: {
          type: 'string',
          description: 'Session ID',
        },
      },
      required: ['productId'],
    },
    handler: `
      const { productId, variantId, productName, price, quantity = 1, currency = 'USD', userId, sessionId } = input;

      const event = await prisma.analyticsEvent.create({
        data: {
          event: 'add_to_cart',
          category: 'ecommerce',
          properties: {
            productId,
            variantId,
            productName,
            price,
            quantity,
            currency,
            value: (price || 0) * quantity,
          },
          userId: userId || null,
          sessionId: sessionId || null,
          timestamp: new Date(),
        },
      });

      return {
        tracked: true,
        eventId: event.id,
        productId,
        quantity,
        timestamp: event.timestamp,
      };
    `,
  },
];
