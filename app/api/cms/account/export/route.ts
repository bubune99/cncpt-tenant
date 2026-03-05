/**
 * Data Export API
 *
 * GET /api/account/export - Export all user data as JSON (GDPR right to portability)
 *
 * Requires authentication via Stack Auth.
 * Rate limited to 1 export per 24 hours per user.
 * Returns a JSON file with all personal data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit';

export async function GET(request: NextRequest) {
  const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.dataExport);
  if (limited) return limited;

  try {
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Rate limit check
    const lastExport = exportTimestamps.get(user.id);
    if (lastExport && Date.now() - lastExport < EXPORT_COOLDOWN_MS) {
      const retryAfterMs = EXPORT_COOLDOWN_MS - (Date.now() - lastExport);
      const retryAfterHours = Math.ceil(retryAfterMs / (60 * 60 * 1000));
      return NextResponse.json(
        {
          error: 'Export rate limited',
          message: `You can request another export in approximately ${retryAfterHours} hour(s).`,
        },
        { status: 429 }
      );
    }

    // Gather all user data
    const [
      addresses,
      customer,
      notifications,
      blogComments,
      aiConversations,
      aiDocuments,
      analyticsEvents,
      apiKeys,
      roleAssignments,
      pageTemplates,
      emailSubscriber,
    ] = await Promise.all([
      // Personal addresses
      prisma.address.findMany({
        where: { userId: user.id },
        select: {
          type: true,
          firstName: true,
          lastName: true,
          company: true,
          street1: true,
          street2: true,
          city: true,
          state: true,
          zip: true,
          country: true,
          phone: true,
          isDefault: true,
          createdAt: true,
        },
      }),

      // Customer record with orders, addresses, wishlists, reviews
      prisma.customer.findUnique({
        where: { userId: user.id },
        include: {
          orders: {
            include: {
              items: {
                select: {
                  title: true,
                  variantTitle: true,
                  sku: true,
                  quantity: true,
                  price: true,
                  total: true,
                },
              },
              shippingAddress: {
                select: {
                  firstName: true,
                  lastName: true,
                  street1: true,
                  street2: true,
                  city: true,
                  state: true,
                  zip: true,
                  country: true,
                },
              },
              shipments: {
                select: {
                  carrier: true,
                  trackingNumber: true,
                  status: true,
                  shippedAt: true,
                  deliveredAt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          addresses: {
            select: {
              label: true,
              firstName: true,
              lastName: true,
              company: true,
              street1: true,
              street2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
              phone: true,
              isDefaultShipping: true,
              isDefaultBilling: true,
              createdAt: true,
            },
          },
          wishlists: {
            include: {
              items: {
                select: {
                  product: {
                    select: { title: true, slug: true },
                  },
                  variant: {
                    select: { sku: true },
                  },
                  addedAt: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
              title: true,
              content: true,
              status: true,
              createdAt: true,
              product: {
                select: { title: true, slug: true },
              },
            },
          },
        },
      }),

      // Notifications
      prisma.notification.findMany({
        where: { userId: user.id },
        select: {
          type: true,
          title: true,
          message: true,
          read: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Blog comments
      prisma.blogComment.findMany({
        where: { userId: user.id },
        select: {
          content: true,
          status: true,
          createdAt: true,
          post: {
            select: { title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // AI conversations with messages
      prisma.aiConversation.findMany({
        where: { userId: user.id },
        include: {
          messages: {
            select: {
              role: true,
              content: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // AI documents
      prisma.aiDocument.findMany({
        where: { userId: user.id },
        select: {
          title: true,
          kind: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Analytics events tied to user
      prisma.analyticsEvent.findMany({
        where: { userId: user.id },
        select: {
          eventName: true,
          eventData: true,
          pageUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Cap to avoid enormous exports
      }),

      // API keys (metadata only, not the secret)
      prisma.apiKey.findMany({
        where: { userId: user.id },
        select: {
          name: true,
          keyPrefix: true,
          scopes: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      }),

      // Role assignments
      prisma.roleAssignment.findMany({
        where: { userId: user.id },
        select: {
          role: {
            select: { name: true },
          },
          createdAt: true,
        },
      }),

      // Page templates
      prisma.pageTemplate.findMany({
        where: { createdById: user.id },
        select: {
          name: true,
          description: true,
          category: true,
          createdAt: true,
        },
      }),

      // Email subscription
      prisma.emailSubscriber.findUnique({
        where: { email: user.email },
        select: {
          status: true,
          tags: true,
          preferences: true,
          consentTimestamp: true,
          source: true,
          createdAt: true,
        },
      }),
    ]);

    // Build export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      profile: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      addresses,
      emailSubscription: emailSubscriber,
      customer: customer
        ? {
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            company: customer.company,
            acceptsMarketing: customer.acceptsMarketing,
            totalOrders: customer.totalOrders,
            totalSpent: customer.totalSpent,
            createdAt: customer.createdAt,
            addresses: customer.addresses,
            orders: customer.orders.map((order) => ({
              orderNumber: order.orderNumber,
              status: order.status,
              subtotal: order.subtotal,
              shippingTotal: order.shippingTotal,
              taxTotal: order.taxTotal,
              discountTotal: order.discountTotal,
              total: order.total,
              paymentStatus: order.paymentStatus,
              customerNotes: order.customerNotes,
              createdAt: order.createdAt,
              items: order.items,
              shippingAddress: order.shippingAddress,
              shipments: order.shipments,
            })),
            wishlists: customer.wishlists.map((w) => ({
              name: w.name,
              items: w.items,
            })),
            reviews: customer.reviews,
          }
        : null,
      notifications,
      blogComments,
      aiConversations: aiConversations.map((conv) => ({
        title: conv.title,
        status: conv.status,
        createdAt: conv.createdAt,
        messages: conv.messages,
      })),
      aiDocuments,
      analyticsEvents,
      apiKeys,
      roles: roleAssignments.map((ra) => ({
        role: ra.role.name,
        assignedAt: ra.createdAt,
      })),
      pageTemplates,
    };

    // Record timestamp for rate limiting
    exportTimestamps.set(user.id, Date.now());

    // Return as downloadable JSON
    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
