/**
 * Customer Primitives
 *
 * Primitives for customer portal functionality including profile management,
 * order history, addresses, subscriptions, and digital downloads.
 */

import type { CreatePrimitiveRequest } from '../types';

export const CUSTOMER_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // PROFILE PRIMITIVES
  // ============================================================================
  {
    name: 'customer.getProfile',
    description: 'Get the current authenticated customer\'s profile information including name, email, and account details.',
    category: 'customer',
    tags: ['customer', 'profile', 'account'],
    icon: 'User',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The user ID to fetch profile for',
        },
        include: {
          type: 'array',
          description: 'Related data to include: addresses, orders, subscriptions',
        },
      },
      required: ['userId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const includeOptions = {};
      if (args.include?.includes('addresses')) includeOptions.addresses = true;
      if (args.include?.includes('orders')) includeOptions.orders = { take: 5, orderBy: { createdAt: 'desc' } };
      if (args.include?.includes('subscriptions')) includeOptions.subscriptions = true;

      const user = await prisma.user.findUnique({
        where: { id: args.userId },
        include: includeOptions,
      });

      if (!user) {
        throw new Error('Customer not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        ...user,
      };
    `,
  },
  {
    name: 'customer.updateProfile',
    description: 'Update the customer\'s profile information such as name, email, or avatar.',
    category: 'customer',
    tags: ['customer', 'profile', 'update'],
    icon: 'UserCog',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The user ID to update',
        },
        name: {
          type: 'string',
          description: 'New display name',
        },
        avatar: {
          type: 'string',
          description: 'New avatar URL',
        },
      },
      required: ['userId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const updateData = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.avatar !== undefined) updateData.avatar = args.avatar;

      const user = await prisma.user.update({
        where: { id: args.userId },
        data: updateData,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      };
    `,
  },

  // ============================================================================
  // ORDER PRIMITIVES
  // ============================================================================
  {
    name: 'customer.getOrders',
    description: 'Get a paginated list of orders for the customer with filtering options.',
    category: 'customer',
    tags: ['customer', 'orders', 'history'],
    icon: 'ShoppingBag',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        status: {
          type: 'string',
          description: 'Filter by order status',
          enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
        },
        page: {
          type: 'number',
          description: 'Page number (1-indexed)',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 10,
        },
      },
      required: ['userId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const page = args.page || 1;
      const limit = Math.min(args.limit || 10, 50);
      const skip = (page - 1) * limit;

      const where = { customerId: args.userId };
      if (args.status) where.status = args.status;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: { select: { title: true, slug: true } },
              },
            },
            shipments: { select: { trackingNumber: true, carrier: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        orders: orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          total: o.total,
          itemCount: o.items.length,
          items: o.items,
          shipments: o.shipments,
          createdAt: o.createdAt,
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
  {
    name: 'customer.getOrder',
    description: 'Get detailed information about a specific order including items, shipping, and payment details.',
    category: 'customer',
    tags: ['customer', 'order', 'detail'],
    icon: 'Receipt',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID (for authorization)',
        },
        orderId: {
          type: 'string',
          description: 'The order ID or order number',
        },
      },
      required: ['userId', 'orderId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: args.orderId },
            { orderNumber: args.orderId },
          ],
          customerId: args.userId,
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, title: true, slug: true } },
              variant: { select: { id: true, sku: true } },
            },
          },
          shipments: true,
          payments: true,
          shippingAddress: true,
          billingAddress: true,
          progress: {
            include: { stage: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    `,
  },

  // ============================================================================
  // ADDRESS PRIMITIVES
  // ============================================================================
  {
    name: 'customer.getAddresses',
    description: 'Get all saved addresses for the customer.',
    category: 'customer',
    tags: ['customer', 'addresses', 'shipping'],
    icon: 'MapPin',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        type: {
          type: 'string',
          description: 'Filter by address type',
          enum: ['SHIPPING', 'BILLING'],
        },
      },
      required: ['userId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const where = { userId: args.userId };
      if (args.type) where.type = args.type;

      const addresses = await prisma.address.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return { addresses };
    `,
  },
  {
    name: 'customer.saveAddress',
    description: 'Create or update a customer address.',
    category: 'customer',
    tags: ['customer', 'address', 'save'],
    icon: 'MapPinPlus',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        addressId: {
          type: 'string',
          description: 'Address ID to update (omit to create new)',
        },
        type: {
          type: 'string',
          description: 'Address type',
          enum: ['SHIPPING', 'BILLING'],
        },
        firstName: {
          type: 'string',
          description: 'First name',
        },
        lastName: {
          type: 'string',
          description: 'Last name',
        },
        company: {
          type: 'string',
          description: 'Company name',
        },
        street1: {
          type: 'string',
          description: 'Street address line 1',
        },
        street2: {
          type: 'string',
          description: 'Street address line 2',
        },
        city: {
          type: 'string',
          description: 'City',
        },
        state: {
          type: 'string',
          description: 'State/Province',
        },
        zip: {
          type: 'string',
          description: 'ZIP/Postal code',
        },
        country: {
          type: 'string',
          description: 'Country code',
          default: 'US',
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        isDefault: {
          type: 'boolean',
          description: 'Set as default address',
        },
      },
      required: ['userId', 'firstName', 'lastName', 'street1', 'city', 'state', 'zip'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const addressData = {
        type: args.type || 'SHIPPING',
        firstName: args.firstName,
        lastName: args.lastName,
        company: args.company,
        street1: args.street1,
        street2: args.street2,
        city: args.city,
        state: args.state,
        zip: args.zip,
        country: args.country || 'US',
        phone: args.phone,
        isDefault: args.isDefault || false,
      };

      // If setting as default, unset other defaults first
      if (args.isDefault) {
        await prisma.address.updateMany({
          where: { userId: args.userId, type: addressData.type },
          data: { isDefault: false },
        });
      }

      let address;
      if (args.addressId) {
        // Update existing
        address = await prisma.address.update({
          where: { id: args.addressId, userId: args.userId },
          data: addressData,
        });
      } else {
        // Create new
        address = await prisma.address.create({
          data: {
            ...addressData,
            userId: args.userId,
          },
        });
      }

      return { success: true, address };
    `,
  },
  {
    name: 'customer.deleteAddress',
    description: 'Delete a saved address.',
    category: 'customer',
    tags: ['customer', 'address', 'delete'],
    icon: 'MapPinOff',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        addressId: {
          type: 'string',
          description: 'The address ID to delete',
        },
      },
      required: ['userId', 'addressId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      await prisma.address.delete({
        where: {
          id: args.addressId,
          userId: args.userId,
        },
      });

      return { success: true };
    `,
  },

  // ============================================================================
  // SUBSCRIPTION PRIMITIVES
  // ============================================================================
  {
    name: 'customer.getSubscriptions',
    description: 'Get all active and past subscriptions for the customer.',
    category: 'customer',
    tags: ['customer', 'subscriptions', 'recurring'],
    icon: 'RefreshCw',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
        },
      },
      required: ['userId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const where = { userId: args.userId };
      if (args.status) where.status = args.status;

      const subscriptions = await prisma.subscription.findMany({
        where,
        include: {
          product: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { subscriptions };
    `,
  },
  {
    name: 'customer.cancelSubscription',
    description: 'Cancel an active subscription.',
    category: 'customer',
    tags: ['customer', 'subscription', 'cancel'],
    icon: 'XCircle',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID to cancel',
        },
        reason: {
          type: 'string',
          description: 'Cancellation reason',
        },
        cancelImmediately: {
          type: 'boolean',
          description: 'Cancel immediately vs at period end',
          default: false,
        },
      },
      required: ['userId', 'subscriptionId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      // Verify ownership
      const subscription = await prisma.subscription.findFirst({
        where: {
          id: args.subscriptionId,
          userId: args.userId,
          status: 'ACTIVE',
        },
      });

      if (!subscription) {
        throw new Error('Active subscription not found');
      }

      // Cancel in Stripe if applicable
      if (subscription.stripeSubscriptionId) {
        const { stripe } = await import('../../stripe');
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: !args.cancelImmediately,
        });

        if (args.cancelImmediately) {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }
      }

      // Update local record
      const updated = await prisma.subscription.update({
        where: { id: args.subscriptionId },
        data: {
          status: args.cancelImmediately ? 'CANCELLED' : 'ACTIVE',
          cancelledAt: args.cancelImmediately ? new Date() : null,
          cancelReason: args.reason,
        },
      });

      return {
        success: true,
        subscription: updated,
        cancelledImmediately: args.cancelImmediately,
      };
    `,
  },

  // ============================================================================
  // DIGITAL DOWNLOADS PRIMITIVES
  // ============================================================================
  {
    name: 'customer.getDownloads',
    description: 'Get all digital products/downloads available to the customer.',
    category: 'customer',
    tags: ['customer', 'downloads', 'digital'],
    icon: 'Download',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
      },
      required: ['userId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      // Get all orders with digital products
      const downloads = await prisma.digitalDownload.findMany({
        where: { userId: args.userId },
        include: {
          asset: true,
          order: {
            select: { id: true, orderNumber: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        downloads: downloads.map(d => ({
          id: d.id,
          fileName: d.asset.fileName,
          fileSize: d.asset.fileSize,
          downloadCount: d.downloadCount,
          maxDownloads: d.maxDownloads,
          expiresAt: d.expiresAt,
          canDownload: d.downloadCount < (d.maxDownloads || Infinity) &&
                       (!d.expiresAt || new Date(d.expiresAt) > new Date()),
          order: d.order,
          createdAt: d.createdAt,
        })),
      };
    `,
  },
  {
    name: 'customer.downloadAsset',
    description: 'Generate a secure download link for a digital asset.',
    category: 'customer',
    tags: ['customer', 'download', 'asset'],
    icon: 'FileDown',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The customer user ID',
        },
        downloadId: {
          type: 'string',
          description: 'The digital download ID',
        },
      },
      required: ['userId', 'downloadId'],
    },
    handler: `
      const { prisma } = await import('../../db');

      const download = await prisma.digitalDownload.findFirst({
        where: {
          id: args.downloadId,
          userId: args.userId,
        },
        include: { asset: true },
      });

      if (!download) {
        throw new Error('Download not found');
      }

      // Check limits
      if (download.maxDownloads && download.downloadCount >= download.maxDownloads) {
        throw new Error('Download limit reached');
      }

      if (download.expiresAt && new Date(download.expiresAt) < new Date()) {
        throw new Error('Download has expired');
      }

      // Increment download count
      await prisma.digitalDownload.update({
        where: { id: args.downloadId },
        data: { downloadCount: { increment: 1 } },
      });

      // Generate signed URL (implementation depends on storage provider)
      // This is a placeholder - actual implementation would use S3/R2/etc.
      const downloadUrl = download.asset.url;

      return {
        success: true,
        downloadUrl,
        fileName: download.asset.fileName,
        remainingDownloads: download.maxDownloads
          ? download.maxDownloads - download.downloadCount - 1
          : null,
      };
    `,
  },
];
