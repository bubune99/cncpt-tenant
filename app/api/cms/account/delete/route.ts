/**
 * Account Deletion API
 *
 * POST /api/account/delete - Anonymize user data (GDPR right to erasure)
 *
 * Requires authentication via Stack Auth.
 * Anonymizes personal data while keeping order records for legal/accounting.
 * Cancels Stripe subscriptions, unsubscribes from email lists,
 * and deletes the Stack Auth account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { unsubscribeEmail } from '@/lib/cms/email/subscriptions';
import crypto from 'crypto';
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit';
import { validateCsrf } from '@/lib/cms/csrf';

/**
 * Generate an anonymized identifier from a user ID.
 * Deterministic so we can trace records if legally required,
 * but not reversible to personal data.
 */
function anonymize(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.auth);
  if (limited) return limited;

  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Require explicit confirmation in request body
    const body = await request.json().catch(() => ({}));

    if (body.confirm !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        {
          error: 'Confirmation required',
          message: 'Send { "confirm": "DELETE_MY_ACCOUNT" } to proceed.',
        },
        { status: 400 }
      );
    }

    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      include: {
        customer: {
          include: {
            orders: { select: { id: true } },
            wishlists: { select: { id: true } },
            reviews: { select: { id: true } },
            addresses: { select: { id: true } },
          },
        },
        addresses: { select: { id: true } },
        apiKeys: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const anonId = anonymize(user.id);
    const anonEmail = `deleted-${anonId}@anonymized.invalid`;
    const anonName = `Deleted User ${anonId.slice(0, 8)}`;

    // --- 1. Cancel Stripe subscriptions ---
    if (user.customer?.stripeCustomerId) {
      try {
        const { cancelSubscription } = await import('@/lib/cms/stripe');

        // Find active subscriptions for this Stripe customer
        const subscriptions = await prisma.subscription.findMany({
          where: {
            stripeCustomerId: user.customer.stripeCustomerId,
            status: { in: ['active', 'trialing', 'past_due'] },
          },
        });

        for (const sub of subscriptions) {
          try {
            await cancelSubscription(sub.stripeSubscriptionId, true);
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: 'canceled', canceledAt: new Date() },
            });
          } catch (err) {
            console.error(`Failed to cancel subscription ${sub.id}:`, err);
          }
        }
      } catch (err) {
        // Stripe may not be configured -- continue with deletion
        console.error('Stripe subscription cancellation error:', err);
      }
    }

    // --- 2. Unsubscribe from email lists ---
    try {
      await unsubscribeEmail(user.email, {
        reason: 'Account deletion - GDPR erasure request',
      });
    } catch (err) {
      console.error('Email unsubscribe error:', err);
    }

    // --- 3. Anonymize user data in a transaction ---
    await prisma.$transaction(async (tx) => {
      // Anonymize the User record
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: anonEmail,
          name: anonName,
          avatar: null,
          phone: null,
          stackAuthId: null,
          emailVerified: null,
        },
      });

      // Delete user's personal addresses (not linked to orders)
      if (user.addresses.length > 0) {
        await tx.address.deleteMany({
          where: { userId: user.id },
        });
      }

      // Delete API keys
      if (user.apiKeys.length > 0) {
        await tx.apiKey.deleteMany({
          where: { userId: user.id },
        });
      }

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: user.id },
      });

      // Delete AI conversations and related data (cascades handle messages)
      await tx.aiConversation.deleteMany({
        where: { userId: user.id },
      });

      // Delete AI documents
      await tx.aiDocument.deleteMany({
        where: { userId: user.id },
      });

      // Anonymize blog comments (keep content for discussion integrity)
      await tx.blogComment.updateMany({
        where: { userId: user.id },
        data: {
          userId: null,
          guestName: anonName,
          guestEmail: null,
          ipAddress: null,
          userAgent: null,
        },
      });

      // Anonymize analytics events
      await tx.analyticsEvent.updateMany({
        where: { userId: user.id },
        data: {
          userId: null,
          ipAddress: null,
          userAgent: null,
        },
      });

      // Anonymize Customer record if exists (keep for order records)
      if (user.customer) {
        await tx.customer.update({
          where: { id: user.customer.id },
          data: {
            email: anonEmail,
            firstName: 'Deleted',
            lastName: 'User',
            phone: null,
            company: null,
            taxId: null,
            notes: null,
            tags: [],
            userId: null,
            acceptsMarketing: false,
            marketingOptOutAt: new Date(),
          },
        });

        // Anonymize customer addresses
        if (user.customer.addresses.length > 0) {
          await tx.customerAddress.updateMany({
            where: { customerId: user.customer.id },
            data: {
              firstName: 'Deleted',
              lastName: 'User',
              company: null,
              phone: null,
            },
          });
        }

        // Anonymize wishlists
        if (user.customer.wishlists.length > 0) {
          await tx.wishlist.deleteMany({
            where: { customerId: user.customer.id },
          });
        }

        // Anonymize product reviews
        if (user.customer.reviews.length > 0) {
          await tx.productReview.updateMany({
            where: { customerId: user.customer.id },
            data: {
              reviewerName: anonName,
              reviewerEmail: anonEmail,
            },
          });
        }

        // Anonymize order email (keep order records for accounting)
        if (user.customer.orders.length > 0) {
          await tx.order.updateMany({
            where: { customerId: user.customer.id },
            data: {
              email: anonEmail,
              customerNotes: null,
            },
          });
        }
      }

      // Remove role assignments and permissions
      await tx.roleAssignment.deleteMany({
        where: { userId: user.id },
      });

      await tx.userPermission.deleteMany({
        where: { userId: user.id },
      });

      // Delete page templates
      await tx.pageTemplate.deleteMany({
        where: { createdById: user.id },
      });

      // Delete Canva connection
      await tx.canvaConnection.deleteMany({
        where: { userId: user.id },
      });

      // Blog posts and media keep their FK to the now-anonymized User record.
      // No update needed -- the user's name/email is already anonymized above.
    });

    // --- 4. Delete Stack Auth account ---
    try {
      // Stack Auth server SDK - delete the user from auth provider
      const stackUserObj = await stackServerApp.getUser();
      if (stackUserObj) {
        await stackUserObj.delete();
      }
    } catch (err) {
      console.error('Stack Auth deletion error:', err);
      // Continue even if this fails - the user data is already anonymized
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been deleted and personal data has been anonymized. Order records are retained in anonymized form for legal requirements.',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
