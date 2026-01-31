/**
 * Wishlist Primitives
 *
 * AI-callable primitives for wishlist/favorites functionality.
 * Enables customers to save products for later.
 */

import { CreatePrimitiveRequest } from '../types';

export const WISHLIST_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // GET WISHLIST
  // ============================================================================
  {
    name: 'wishlist.get',
    description: 'Get user wishlist with products',
    category: 'wishlist',
    tags: ['wishlist', 'favorites', 'customer', 'storefront'],
    icon: 'Heart',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        wishlistId: {
          type: 'string',
          description: 'Specific wishlist ID (users can have multiple)',
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
      const { userId, wishlistId, page = 1, limit = 20 } = input;

      // Get or create default wishlist
      let wishlist;
      if (wishlistId) {
        wishlist = await prisma.wishlist.findFirst({
          where: { id: wishlistId, userId },
        });
      } else {
        wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });

        if (!wishlist) {
          wishlist = await prisma.wishlist.create({
            data: {
              userId,
              name: 'My Wishlist',
              isDefault: true,
            },
          });
        }
      }

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      const [items, total] = await Promise.all([
        prisma.wishlistItem.findMany({
          where: { wishlistId: wishlist.id },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
                variants: {
                  where: { deletedAt: null },
                  select: { id: true, price: true, stock: true },
                  take: 1,
                },
              },
            },
            variant: {
              select: { id: true, name: true, price: true, stock: true, options: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } }),
      ]);

      return {
        id: wishlist.id,
        name: wishlist.name,
        isDefault: wishlist.isDefault,
        isPublic: wishlist.isPublic,
        shareToken: wishlist.isPublic ? wishlist.shareToken : null,
        items: items.map(i => ({
          id: i.id,
          addedAt: i.createdAt,
          note: i.note,
          product: {
            id: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            price: i.variant?.price || i.product.basePrice,
            compareAtPrice: i.product.compareAtPrice,
            image: i.product.images[0] || null,
            inStock: i.variant ? i.variant.stock > 0 : i.product.variants[0]?.stock > 0,
            status: i.product.status,
          },
          variant: i.variant,
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
  // ADD TO WISHLIST
  // ============================================================================
  {
    name: 'wishlist.add',
    description: 'Add a product to wishlist',
    category: 'wishlist',
    tags: ['wishlist', 'favorites', 'add', 'storefront'],
    icon: 'HeartPlus',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        variantId: {
          type: 'string',
          description: 'Specific variant ID (optional)',
        },
        wishlistId: {
          type: 'string',
          description: 'Target wishlist ID (uses default if not specified)',
        },
        note: {
          type: 'string',
          description: 'Optional note',
        },
      },
      required: ['userId', 'productId'],
    },
    handler: `
      const { userId, productId, variantId, wishlistId, note } = input;

      // Verify product exists
      const product = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Get or create wishlist
      let wishlist;
      if (wishlistId) {
        wishlist = await prisma.wishlist.findFirst({
          where: { id: wishlistId, userId },
        });
      } else {
        wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });

        if (!wishlist) {
          wishlist = await prisma.wishlist.create({
            data: { userId, name: 'My Wishlist', isDefault: true },
          });
        }
      }

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Check if already in wishlist
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existing) {
        return {
          added: false,
          alreadyExists: true,
          itemId: existing.id,
          wishlistId: wishlist.id,
        };
      }

      const item = await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId || null,
          note: note || null,
        },
      });

      return {
        added: true,
        itemId: item.id,
        wishlistId: wishlist.id,
        productId,
        variantId,
      };
    `,
  },

  // ============================================================================
  // REMOVE FROM WISHLIST
  // ============================================================================
  {
    name: 'wishlist.remove',
    description: 'Remove a product from wishlist',
    category: 'wishlist',
    tags: ['wishlist', 'favorites', 'remove', 'storefront'],
    icon: 'HeartOff',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        itemId: {
          type: 'string',
          description: 'Wishlist item ID',
        },
        productId: {
          type: 'string',
          description: 'Product ID (alternative to itemId)',
        },
        variantId: {
          type: 'string',
          description: 'Variant ID (when using productId)',
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId, itemId, productId, variantId } = input;

      if (!itemId && !productId) {
        throw new Error('Either itemId or productId is required');
      }

      let item;

      if (itemId) {
        item = await prisma.wishlistItem.findFirst({
          where: { id: itemId },
          include: { wishlist: true },
        });

        if (!item || item.wishlist.userId !== userId) {
          throw new Error('Item not found');
        }
      } else {
        // Find by product in user's default wishlist
        const wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });

        if (wishlist) {
          item = await prisma.wishlistItem.findFirst({
            where: {
              wishlistId: wishlist.id,
              productId,
              variantId: variantId || null,
            },
          });
        }

        if (!item) {
          return { removed: false, notFound: true };
        }
      }

      await prisma.wishlistItem.delete({ where: { id: item.id } });

      return {
        removed: true,
        itemId: item.id,
        productId: item.productId,
      };
    `,
  },

  // ============================================================================
  // TOGGLE WISHLIST
  // ============================================================================
  {
    name: 'wishlist.toggle',
    description: 'Toggle product in wishlist (add if not present, remove if present)',
    category: 'wishlist',
    tags: ['wishlist', 'favorites', 'toggle', 'storefront'],
    icon: 'Heart',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        variantId: {
          type: 'string',
          description: 'Variant ID (optional)',
        },
      },
      required: ['userId', 'productId'],
    },
    handler: `
      const { userId, productId, variantId } = input;

      // Get or create default wishlist
      let wishlist = await prisma.wishlist.findFirst({
        where: { userId, isDefault: true },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: { userId, name: 'My Wishlist', isDefault: true },
        });
      }

      // Check if exists
      const existing = await prisma.wishlistItem.findFirst({
        where: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existing) {
        await prisma.wishlistItem.delete({ where: { id: existing.id } });
        return {
          action: 'removed',
          inWishlist: false,
          productId,
          variantId,
        };
      } else {
        const item = await prisma.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            productId,
            variantId: variantId || null,
          },
        });
        return {
          action: 'added',
          inWishlist: true,
          itemId: item.id,
          productId,
          variantId,
        };
      }
    `,
  },

  // ============================================================================
  // CHECK WISHLIST STATUS
  // ============================================================================
  {
    name: 'wishlist.check',
    description: 'Check if product(s) are in wishlist',
    category: 'wishlist',
    tags: ['wishlist', 'favorites', 'check', 'storefront'],
    icon: 'HeartPulse',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        productIds: {
          type: 'array',
          description: 'Product IDs to check',
          items: { type: 'string' },
        },
      },
      required: ['userId', 'productIds'],
    },
    handler: `
      const { userId, productIds } = input;

      const wishlist = await prisma.wishlist.findFirst({
        where: { userId, isDefault: true },
      });

      if (!wishlist) {
        return {
          items: productIds.map(id => ({ productId: id, inWishlist: false })),
        };
      }

      const items = await prisma.wishlistItem.findMany({
        where: {
          wishlistId: wishlist.id,
          productId: { in: productIds },
        },
        select: { productId: true, variantId: true, id: true },
      });

      const itemMap = new Map(items.map(i => [i.productId, i]));

      return {
        items: productIds.map(id => ({
          productId: id,
          inWishlist: itemMap.has(id),
          itemId: itemMap.get(id)?.id,
          variantId: itemMap.get(id)?.variantId,
        })),
      };
    `,
  },

  // ============================================================================
  // SHARE WISHLIST
  // ============================================================================
  {
    name: 'wishlist.share',
    description: 'Generate a shareable link for wishlist',
    category: 'wishlist',
    tags: ['wishlist', 'share', 'social'],
    icon: 'Share2',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        wishlistId: {
          type: 'string',
          description: 'Wishlist ID',
        },
        makePublic: {
          type: 'boolean',
          description: 'Make wishlist public',
          default: true,
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId, wishlistId, makePublic = true } = input;

      let wishlist;
      if (wishlistId) {
        wishlist = await prisma.wishlist.findFirst({
          where: { id: wishlistId, userId },
        });
      } else {
        wishlist = await prisma.wishlist.findFirst({
          where: { userId, isDefault: true },
        });
      }

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Generate share token if needed
      let shareToken = wishlist.shareToken;
      if (!shareToken && makePublic) {
        shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      }

      const updated = await prisma.wishlist.update({
        where: { id: wishlist.id },
        data: {
          isPublic: makePublic,
          shareToken: makePublic ? shareToken : null,
        },
      });

      return {
        wishlistId: updated.id,
        isPublic: updated.isPublic,
        shareToken: updated.shareToken,
        shareUrl: updated.isPublic ? '/wishlist/shared/' + updated.shareToken : null,
      };
    `,
  },

  // ============================================================================
  // GET SHARED WISHLIST
  // ============================================================================
  {
    name: 'wishlist.getShared',
    description: 'Get a publicly shared wishlist',
    category: 'wishlist',
    tags: ['wishlist', 'share', 'public'],
    icon: 'ExternalLink',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        shareToken: {
          type: 'string',
          description: 'Share token from URL',
        },
      },
      required: ['shareToken'],
    },
    handler: `
      const { shareToken } = input;

      const wishlist = await prisma.wishlist.findFirst({
        where: { shareToken, isPublic: true },
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { order: 'asc' } },
                },
              },
              variant: { select: { name: true, price: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wishlist) {
        throw new Error('Wishlist not found or not public');
      }

      return {
        id: wishlist.id,
        name: wishlist.name,
        ownerName: wishlist.user?.name || 'Anonymous',
        items: wishlist.items.map(i => ({
          product: {
            id: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            price: i.variant?.price || i.product.basePrice,
            image: i.product.images[0] || null,
          },
          variant: i.variant,
          note: i.note,
        })),
        itemCount: wishlist.items.length,
      };
    `,
  },
];
