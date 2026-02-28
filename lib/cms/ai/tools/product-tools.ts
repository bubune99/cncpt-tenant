/**
 * Product CRUD Tools
 *
 * AI tools for creating, updating, deleting products and variants,
 * and syncing products to Stripe.
 */

import { tool } from 'ai';
import { z } from 'zod';

async function getDb() {
  try {
    const { prisma } = await import('../../db');
    return prisma;
  } catch (error) {
    console.error('[ProductTools] Failed to import database:', error);
    throw new Error('Database connection unavailable');
  }
}

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniqueProductSlug(prisma: any, slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let suffix = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
}

export const createProduct = tool({
  description: 'Create a new product. Price should be in dollars (e.g. 29.99). Auto-generates slug from title.',
  inputSchema: z.object({
    title: z.string().describe('Product title'),
    description: z.string().optional().describe('Product description'),
    basePrice: z.number().describe('Price in dollars (e.g. 29.99)'),
    sku: z.string().optional().describe('Product SKU'),
    status: z.enum(['DRAFT', 'ACTIVE']).optional().default('DRAFT'),
    type: z.enum(['SIMPLE', 'VARIABLE', 'DIGITAL', 'SERVICE', 'SUBSCRIPTION', 'BUNDLE']).optional().default('SIMPLE'),
    categoryIds: z.array(z.string()).optional().describe('Category IDs to assign'),
  }),
  execute: async ({ title, description, basePrice, sku, status, type, categoryIds }) => {
    try {
      const prisma = await getDb();

      const slug = await ensureUniqueProductSlug(prisma, generateSlug(title));
      const priceInCents = Math.round(basePrice * 100);

      const product = await withTimeout(
        prisma.product.create({
          data: {
            title,
            slug,
            description,
            basePrice: priceInCents,
            sku,
            status: status as any,
            type: type as any,
            categories: categoryIds?.length
              ? { create: categoryIds.map((categoryId, i) => ({ categoryId, position: i })) }
              : undefined,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            basePrice: true,
            status: true,
            type: true,
            sku: true,
          },
        }),
        8000,
        'Create product timed out'
      );

      return {
        success: true,
        product: {
          ...product,
          price: product.basePrice / 100,
          adminUrl: `/admin/products/${product.id}`,
        },
        message: `Product "${product.title}" created at $${(product.basePrice / 100).toFixed(2)}`,
      };
    } catch (error) {
      console.error('[ProductTools] createProduct error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create product' };
    }
  },
});

export const updateProduct = tool({
  description: 'Update an existing product. Price should be in dollars (e.g. 29.99). Only provided fields are changed.',
  inputSchema: z.object({
    id: z.string().describe('Product ID'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    basePrice: z.number().optional().describe('New price in dollars'),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    stock: z.number().optional().describe('Stock quantity (for SIMPLE products)'),
    sku: z.string().optional().describe('New SKU'),
  }),
  execute: async ({ id, title, description, basePrice, status, stock, sku }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return { success: false, error: 'Product not found' };

      const data: Record<string, any> = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (basePrice !== undefined) data.basePrice = Math.round(basePrice * 100);
      if (status !== undefined) data.status = status;
      if (stock !== undefined) data.stock = stock;
      if (sku !== undefined) data.sku = sku;

      const product = await withTimeout(
        prisma.product.update({
          where: { id },
          data,
          select: {
            id: true,
            title: true,
            slug: true,
            basePrice: true,
            status: true,
            stock: true,
            sku: true,
          },
        }),
        8000,
        'Update product timed out'
      );

      return {
        success: true,
        product: {
          ...product,
          price: product.basePrice / 100,
          adminUrl: `/admin/products/${product.id}`,
        },
        message: `Product "${product.title}" updated successfully`,
      };
    } catch (error) {
      console.error('[ProductTools] updateProduct error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update product' };
    }
  },
});

export const deleteProduct = tool({
  description: 'Delete or archive a product. Products with existing orders are archived instead of deleted.',
  inputSchema: z.object({
    id: z.string().describe('Product ID'),
    archive: z.boolean().optional().default(false).describe('Force archive instead of delete'),
  }),
  execute: async ({ id, archive }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          stripeProductId: true,
          _count: { select: { orderItems: true } },
        },
      });
      if (!existing) return { success: false, error: 'Product not found' };

      const hasOrders = existing._count.orderItems > 0;

      if (hasOrders || archive) {
        await withTimeout(
          prisma.product.update({
            where: { id },
            data: { status: 'ARCHIVED' },
          }),
          5000,
          'Archive product timed out'
        );

        return {
          success: true,
          action: 'archived',
          message: `Product "${existing.title}" archived${hasOrders ? ' (has existing orders)' : ''}`,
        };
      }

      await withTimeout(
        prisma.product.delete({ where: { id } }),
        8000,
        'Delete product timed out'
      );

      return { success: true, action: 'deleted', message: `Product "${existing.title}" deleted successfully` };
    } catch (error) {
      console.error('[ProductTools] deleteProduct error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete product' };
    }
  },
});

export const manageProductVariant = tool({
  description: 'Create, update, or delete a product variant. Price in dollars.',
  inputSchema: z.object({
    productId: z.string().describe('Parent product ID'),
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    variantId: z.string().optional().describe('Variant ID (required for update/delete)'),
    title: z.string().optional().describe('Variant display title (for reference)'),
    price: z.number().optional().describe('Variant price in dollars'),
    sku: z.string().optional().describe('Variant SKU'),
    stock: z.number().optional().describe('Variant stock quantity'),
  }),
  execute: async ({ productId, action, variantId, title, price, sku, stock }) => {
    try {
      const prisma = await getDb();

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return { success: false, error: 'Product not found' };

      if (action === 'create') {
        if (price === undefined) return { success: false, error: 'Price is required to create a variant' };

        const variant = await withTimeout(
          prisma.productVariant.create({
            data: {
              productId,
              price: Math.round(price * 100),
              sku,
              stock: stock ?? 0,
            },
            select: { id: true, price: true, sku: true, stock: true },
          }),
          5000,
          'Create variant timed out'
        );

        return {
          success: true,
          variant: { ...variant, price: variant.price / 100 },
          message: `Variant created for "${product.title}" at $${(variant.price / 100).toFixed(2)}`,
        };
      }

      if (action === 'update') {
        if (!variantId) return { success: false, error: 'Variant ID is required for update' };

        const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!existing) return { success: false, error: 'Variant not found' };

        const data: Record<string, any> = {};
        if (price !== undefined) data.price = Math.round(price * 100);
        if (sku !== undefined) data.sku = sku;
        if (stock !== undefined) data.stock = stock;

        const variant = await withTimeout(
          prisma.productVariant.update({
            where: { id: variantId },
            data,
            select: { id: true, price: true, sku: true, stock: true },
          }),
          5000,
          'Update variant timed out'
        );

        return {
          success: true,
          variant: { ...variant, price: variant.price / 100 },
          message: `Variant updated for "${product.title}"`,
        };
      }

      if (action === 'delete') {
        if (!variantId) return { success: false, error: 'Variant ID is required for delete' };

        const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!existing) return { success: false, error: 'Variant not found' };

        await withTimeout(
          prisma.productVariant.delete({ where: { id: variantId } }),
          5000,
          'Delete variant timed out'
        );

        return { success: true, message: `Variant deleted from "${product.title}"` };
      }

      return { success: false, error: 'Invalid action' };
    } catch (error) {
      console.error('[ProductTools] manageProductVariant error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to manage variant' };
    }
  },
});

export const syncProductToStripe = tool({
  description: 'Sync a product (and its variants) to Stripe for payment processing.',
  inputSchema: z.object({
    id: z.string().describe('Product ID to sync'),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb();

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: { include: { media: true } },
          variants: { where: { enabled: true } },
        },
      });
      if (!product) return { success: false, error: 'Product not found' };

      if (product.status !== 'ACTIVE') {
        return { success: false, error: 'Product must be ACTIVE to sync to Stripe. Update its status first.' };
      }

      // Use the existing Stripe sync function
      const { syncProductToStripe: syncFn, syncVariantsToStripe } = await import('../../stripe/product-sync');

      const result = await withTimeout(
        syncFn(product, false),
        15000,
        'Stripe sync timed out'
      );

      // Sync variants if any
      let variantResults: Array<{ variantId: string; stripePriceId: string }> = [];
      if (product.variants.length > 0) {
        variantResults = await withTimeout(
          syncVariantsToStripe(product.id, result.stripeProductId, false),
          15000,
          'Variant Stripe sync timed out'
        );
      }

      return {
        success: true,
        stripeProductId: result.stripeProductId,
        stripePriceId: result.stripePriceId,
        syncedAt: result.syncedAt,
        variantsSynced: variantResults.length,
        message: `Product "${product.title}" synced to Stripe${variantResults.length > 0 ? ` (${variantResults.length} variants)` : ''}`,
      };
    } catch (error) {
      console.error('[ProductTools] syncProductToStripe error:', error);

      // Save sync error to product
      try {
        const prisma = await getDb();
        await prisma.product.update({
          where: { id },
          data: { stripeSyncError: error instanceof Error ? error.message : 'Sync failed' },
        });
      } catch { /* ignore */ }

      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync to Stripe' };
    }
  },
});

export const productTools = {
  createProduct,
  updateProduct,
  deleteProduct,
  manageProductVariant,
  syncProductToStripe,
};
