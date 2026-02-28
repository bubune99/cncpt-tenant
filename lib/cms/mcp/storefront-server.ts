/**
 * Storefront MCP Server
 *
 * Public MCP endpoint for AI shopping agents. Exposes product catalog,
 * reviews, and UCP checkout creation as MCP tools.
 *
 * Tools:
 * - search_products  — Search/list products with filters
 * - get_product      — Get product details with variants and images
 * - get_product_reviews — Get reviews and rating stats for a product
 * - get_store_info   — Get store metadata and capabilities
 * - create_checkout  — Create a UCP checkout session
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '../db';
import { createUcpSession } from '../ucp/sessions';
import {
  ucpEnvelope,
  stripePaymentHandler,
  getBaseUrl,
  type UcpCheckoutSession,
  type UcpLineItem,
  type UcpTotal,
  type UcpMessage,
} from '../ucp/types';

/**
 * Creates a new storefront MCP server instance with all tools registered.
 * Each request gets a fresh server+transport pair (stateless mode).
 */
export function createStorefrontServer(): McpServer {
  const server = new McpServer(
    {
      name: 'dzidzor-storefront',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // --- search_products ---
  server.tool(
    'search_products',
    'Search the product catalog. Returns active products with pricing, images, and stock info.',
    {
      search: z.string().optional().describe('Search query to filter by title'),
      category: z.string().optional().describe('Filter by category ID'),
      min_price: z.number().optional().describe('Minimum price in cents'),
      max_price: z.number().optional().describe('Maximum price in cents'),
      in_stock: z.boolean().optional().describe('Filter to only in-stock items'),
      limit: z.number().optional().describe('Max results (1-100, default 20)'),
      offset: z.number().optional().describe('Pagination offset (default 0)'),
    },
    async (args) => {
      const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
      const offset = Math.max(args.offset ?? 0, 0);

      const where: Record<string, unknown> = { status: 'ACTIVE' as const };

      if (args.search) {
        where.title = { contains: args.search, mode: 'insensitive' };
      }
      if (args.category) {
        where.categories = { some: { categoryId: args.category } };
      }
      if (args.min_price !== undefined || args.max_price !== undefined) {
        where.basePrice = {
          ...(args.min_price !== undefined ? { gte: args.min_price } : {}),
          ...(args.max_price !== undefined ? { lte: args.max_price } : {}),
        };
      }
      if (args.in_stock) {
        where.OR = [{ stock: { gt: 0 } }, { allowBackorder: true }];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
            variants: { where: { enabled: true } },
            categories: { include: { category: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.product.count({ where }),
      ]);

      const items = products.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description?.substring(0, 200) || undefined,
        price: p.basePrice,
        currency: 'USD',
        image_url: p.images[0]?.media?.url || undefined,
        in_stock: p.stock > 0 || p.allowBackorder,
        sku: p.sku || undefined,
        categories: p.categories.map((c) => c.category.name),
        variant_count: p.variants.length,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ products: items, total, limit, offset }, null, 2),
          },
        ],
      };
    }
  );

  // --- get_product ---
  server.tool(
    'get_product',
    'Get full details for a product including variants, images, and categories.',
    {
      id: z.string().describe('Product ID'),
    },
    async (args) => {
      const product = await prisma.product.findUnique({
        where: { id: args.id },
        include: {
          images: { include: { media: true }, orderBy: { position: 'asc' } },
          variants: { where: { enabled: true } },
          categories: { include: { category: { select: { id: true, name: true } } } },
        },
      });

      if (!product || product.status !== 'ACTIVE') {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Product not found' }) }],
          isError: true,
        };
      }

      const result = {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.basePrice,
        currency: 'USD',
        sku: product.sku,
        type: product.type,
        in_stock: product.stock > 0 || product.allowBackorder,
        stock: product.stock,
        images: product.images
          .map((img) => img.media?.url)
          .filter((url): url is string => !!url),
        variants: product.variants.map((v) => ({
          id: v.id,
          title: v.sku || undefined,
          price: v.price,
          sku: v.sku,
          in_stock: v.stock > 0 || v.allowBackorder,
          stock: v.stock,
        })),
        categories: product.categories.map((c) => ({
          id: c.category.id,
          name: c.category.name,
        })),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --- get_product_reviews ---
  server.tool(
    'get_product_reviews',
    'Get customer reviews and rating statistics for a product.',
    {
      product_id: z.string().describe('Product ID'),
      page: z.number().optional().describe('Page number (default 1)'),
      page_size: z.number().optional().describe('Reviews per page (default 10, max 50)'),
    },
    async (args) => {
      const page = args.page ?? 1;
      const pageSize = Math.min(args.page_size ?? 10, 50);

      const [reviews, stats] = await Promise.all([
        prisma.productReview.findMany({
          where: { productId: args.product_id, status: 'APPROVED' },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            reviewerName: true,
            isVerifiedPurchase: true,
            helpfulCount: true,
            createdAt: true,
          },
          orderBy: { helpfulCount: 'desc' },
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
        prisma.productReview.aggregate({
          where: { productId: args.product_id, status: 'APPROVED' },
          _avg: { rating: true },
          _count: { id: true },
        }),
      ]);

      const result = {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.content,
          author: r.reviewerName,
          verified_purchase: r.isVerifiedPurchase,
          helpful_count: r.helpfulCount,
          created_at: r.createdAt.toISOString(),
        })),
        stats: {
          average_rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
          total_reviews: stats._count.id,
        },
        page,
        page_size: pageSize,
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --- get_store_info ---
  server.tool(
    'get_store_info',
    'Get store information including name, description, and supported capabilities.',
    {},
    async () => {
      const settings = await prisma.setting.findMany({
        where: {
          key: { in: ['store_name', 'store_description', 'store_currency', 'store_email'] },
        },
        select: { key: true, value: true },
      });

      const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

      const [productCount, categoryCount] = await Promise.all([
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.category.count(),
      ]);

      const baseUrl = getBaseUrl();

      const result = {
        name: settingsMap.store_name || 'Store',
        description: settingsMap.store_description || undefined,
        currency: settingsMap.store_currency || 'USD',
        contact_email: settingsMap.store_email || undefined,
        catalog: {
          active_products: productCount,
          categories: categoryCount,
        },
        capabilities: {
          ucp: {
            version: '2026-01-11',
            discovery: `${baseUrl}/.well-known/ucp`,
          },
          checkout: true,
          reviews: true,
          shipping_rates: true,
        },
        endpoints: {
          ucp_checkout: `${baseUrl}/api/ucp/checkout`,
          ucp_catalog: `${baseUrl}/api/ucp/catalog/products`,
          storefront_mcp: `${baseUrl}/api/storefront/mcp`,
        },
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // --- create_checkout ---
  server.tool(
    'create_checkout',
    'Create a UCP checkout session for purchasing products. Returns a checkout session with payment URL.',
    {
      items: z
        .array(
          z.object({
            product_id: z.string().describe('Product ID'),
            quantity: z.number().describe('Quantity to purchase'),
          })
        )
        .describe('Items to purchase'),
      buyer_email: z.string().optional().describe('Buyer email address'),
      buyer_name: z.string().optional().describe('Buyer full name'),
      currency: z.string().optional().describe('Currency code (default USD)'),
    },
    async (args) => {
      if (!args.items || args.items.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify({ error: 'At least one item is required' }) },
          ],
          isError: true,
        };
      }

      const currency = args.currency || 'USD';
      const messages: UcpMessage[] = [];

      // Fetch products
      const productIds = args.items.map((i) => i.product_id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { include: { media: true }, take: 1 },
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      const lineItems: UcpLineItem[] = [];
      let subtotal = 0;

      for (const item of args.items) {
        const product = productMap.get(item.product_id);

        if (!product) {
          messages.push({
            type: 'error',
            code: 'product_not_found',
            severity: 'recoverable',
            content: `Product ${item.product_id} not found`,
          });
          continue;
        }

        if (product.status !== 'ACTIVE') {
          messages.push({
            type: 'error',
            code: 'product_unavailable',
            severity: 'recoverable',
            content: `Product "${product.title}" is not available`,
          });
          continue;
        }

        if (product.trackInventory && product.stock < item.quantity) {
          messages.push({
            type: 'error',
            code: 'insufficient_stock',
            severity: 'recoverable',
            content: `Only ${product.stock} units of "${product.title}" available`,
          });
          continue;
        }

        const itemTotal = product.basePrice * item.quantity;
        subtotal += itemTotal;

        const imageUrl = product.images?.[0]?.media?.url;

        lineItems.push({
          id: `li_${Math.random().toString(36).substring(2, 12)}`,
          item: {
            id: product.id,
            title: product.title,
            price: product.basePrice,
            image_url: imageUrl || undefined,
            description: product.description?.substring(0, 200) || undefined,
          },
          quantity: item.quantity,
          totals: [{ type: 'subtotal', amount: itemTotal }],
        });
      }

      if (lineItems.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: 'No valid items', messages }, null, 2),
            },
          ],
          isError: true,
        };
      }

      const totals: UcpTotal[] = [
        { type: 'subtotal', amount: subtotal },
        { type: 'tax', amount: 0, display_text: 'Calculated at checkout' },
        { type: 'total', amount: subtotal },
      ];

      const hasErrors = messages.some((m) => m.type === 'error');
      const buyer = args.buyer_email
        ? { email: args.buyer_email, full_name: args.buyer_name }
        : undefined;

      let status: UcpCheckoutSession['status'] = 'incomplete';
      if (!hasErrors && buyer?.email) {
        status = 'ready_for_complete';
      }

      const sessionId = `ucp_${Math.random().toString(36).substring(2, 18)}`;
      const baseUrl = getBaseUrl();

      const session: UcpCheckoutSession = {
        id: sessionId,
        status,
        currency,
        line_items: lineItems,
        buyer,
        totals,
        payment: {
          handlers: [stripePaymentHandler()],
        },
        messages,
        continue_url: `${baseUrl}/checkout?session=${sessionId}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ucp: ucpEnvelope(),
      };

      createUcpSession(session);

      // Strip internal fields
      const { _created_at, _stripe_session_id, ...response } = session;

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  return server;
}
