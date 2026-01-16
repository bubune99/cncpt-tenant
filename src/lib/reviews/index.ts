/**
 * Product Reviews Service
 *
 * Handles review submission, moderation, voting, and statistics
 */

import { prisma } from '../db';
import { sendEmail } from '../email';
import { getEmailSettings } from '../settings';
import type { ReviewStatus, Prisma } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface ReviewSubmission {
  productId: string;
  customerId?: string;
  orderId?: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  pros?: string;
  cons?: string;
  images?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface ReviewFilters {
  productId?: string;
  status?: ReviewStatus;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isVerifiedPurchase?: boolean;
  search?: string;
}

export interface ReviewSort {
  field: 'createdAt' | 'rating' | 'helpfulCount';
  direction: 'asc' | 'desc';
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchaseCount: number;
  withImagesCount: number;
}

export interface PaginatedReviews {
  reviews: Array<Awaited<ReturnType<typeof getReviewWithVotes>>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getReviewWithVotes(reviewId: string) {
  return prisma.productReview.findUnique({
    where: { id: reviewId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: {
            take: 1,
            include: {
              media: {
                select: { url: true },
              },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

// ============================================================================
// Review CRUD
// ============================================================================

/**
 * Get reviews with pagination and filtering
 */
export async function getReviews(
  filters: ReviewFilters = {},
  sort: ReviewSort = { field: 'createdAt', direction: 'desc' },
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedReviews> {
  const where: Prisma.ProductReviewWhereInput = {};

  if (filters.productId) {
    where.productId = filters.productId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.rating) {
    where.rating = filters.rating;
  }

  if (filters.minRating) {
    where.rating = { ...where.rating as object, gte: filters.minRating };
  }

  if (filters.maxRating) {
    where.rating = { ...where.rating as object, lte: filters.maxRating };
  }

  if (filters.isVerifiedPurchase !== undefined) {
    where.isVerifiedPurchase = filters.isVerifiedPurchase;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
      { reviewerName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      where,
      orderBy: { [sort.field]: sort.direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: {
              take: 1,
              include: {
                media: {
                  select: { url: true },
                },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.productReview.count({ where }),
  ]);

  return {
    reviews,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get reviews for a specific product (public-facing)
 */
export async function getProductReviews(
  productId: string,
  page: number = 1,
  pageSize: number = 10,
  sort: ReviewSort = { field: 'helpfulCount', direction: 'desc' }
): Promise<PaginatedReviews> {
  return getReviews(
    { productId, status: 'APPROVED' },
    sort,
    page,
    pageSize
  );
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string) {
  return getReviewWithVotes(reviewId);
}

/**
 * Submit a new review
 */
export async function submitReview(data: ReviewSubmission) {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check for verified purchase
  let isVerifiedPurchase = false;
  if (data.orderId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        order: {
          id: data.orderId,
          paymentStatus: 'PAID',
        },
        productId: data.productId,
      },
    });
    isVerifiedPurchase = !!orderItem;
  } else if (data.customerId) {
    // Check if user has purchased this product
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        order: {
          customerId: data.customerId,
          paymentStatus: 'PAID',
        },
        productId: data.productId,
      },
    });
    isVerifiedPurchase = !!orderItem;
  }

  // Check for duplicate review (same customer/email + product)
  const existingReview = await prisma.productReview.findFirst({
    where: {
      productId: data.productId,
      OR: [
        ...(data.customerId ? [{ customerId: data.customerId }] : []),
        { reviewerEmail: data.reviewerEmail },
      ],
    },
  });

  if (existingReview) {
    throw new Error('You have already reviewed this product');
  }

  // Create the review
  const review = await prisma.productReview.create({
    data: {
      productId: data.productId,
      customerId: data.customerId,
      orderId: data.orderId,
      reviewerName: data.reviewerName,
      reviewerEmail: data.reviewerEmail,
      rating: data.rating,
      title: data.title,
      content: data.content,
      pros: data.pros,
      cons: data.cons,
      images: data.images || [],
      isVerifiedPurchase,
      status: 'PENDING', // Requires moderation
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  return review;
}

/**
 * Update a review (admin moderation)
 */
export async function updateReview(
  reviewId: string,
  data: {
    status?: ReviewStatus;
    responseContent?: string;
    respondedById?: string;
  }
) {
  const updateData: Prisma.ProductReviewUpdateInput = {};

  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'APPROVED') {
      updateData.publishedAt = new Date();
    }
  }

  if (data.responseContent !== undefined) {
    updateData.responseContent = data.responseContent;
    updateData.responseAt = new Date();
    updateData.respondedById = data.respondedById;
  }

  return prisma.productReview.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
  return prisma.productReview.delete({
    where: { id: reviewId },
  });
}

/**
 * Approve a pending review
 */
export async function approveReview(reviewId: string) {
  return updateReview(reviewId, { status: 'APPROVED' });
}

/**
 * Reject a review
 */
export async function rejectReview(reviewId: string) {
  return updateReview(reviewId, { status: 'REJECTED' });
}

/**
 * Flag a review for further review
 */
export async function flagReview(reviewId: string) {
  return updateReview(reviewId, { status: 'FLAGGED' });
}

/**
 * Add store response to a review
 */
export async function respondToReview(
  reviewId: string,
  responseContent: string,
  respondedById: string
) {
  return updateReview(reviewId, {
    responseContent,
    respondedById,
  });
}

// ============================================================================
// Voting
// ============================================================================

/**
 * Vote on a review (helpful/unhelpful)
 */
export async function voteReview(
  reviewId: string,
  helpful: boolean,
  userId?: string,
  email?: string
) {
  if (!userId && !email) {
    throw new Error('User ID or email is required to vote');
  }

  // Check if already voted
  const existingVote = await prisma.reviewVote.findFirst({
    where: {
      reviewId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existingVote) {
    // Update existing vote if different
    if (existingVote.helpful !== helpful) {
      await prisma.$transaction([
        prisma.reviewVote.update({
          where: { id: existingVote.id },
          data: { helpful },
        }),
        prisma.productReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: helpful ? { increment: 1 } : { decrement: 1 },
            unhelpfulCount: helpful ? { decrement: 1 } : { increment: 1 },
          },
        }),
      ]);
    }
    return { updated: true };
  }

  // Create new vote
  await prisma.$transaction([
    prisma.reviewVote.create({
      data: {
        reviewId,
        userId,
        email,
        helpful,
      },
    }),
    prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: helpful ? { increment: 1 } : undefined,
        unhelpfulCount: helpful ? undefined : { increment: 1 },
      },
    }),
  ]);

  return { created: true };
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get review statistics for a product
 */
export async function getProductReviewStats(productId: string): Promise<ReviewStats> {
  const reviews = await prisma.productReview.findMany({
    where: {
      productId,
      status: 'APPROVED',
    },
    select: {
      rating: true,
      isVerifiedPurchase: true,
      images: true,
    },
  });

  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPurchaseCount: 0,
      withImagesCount: 0,
    };
  }

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let verifiedPurchaseCount = 0;
  let withImagesCount = 0;

  for (const review of reviews) {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    ratingSum += review.rating;
    if (review.isVerifiedPurchase) verifiedPurchaseCount++;
    if (review.images && Array.isArray(review.images) && review.images.length > 0) {
      withImagesCount++;
    }
  }

  return {
    averageRating: Math.round((ratingSum / totalReviews) * 10) / 10,
    totalReviews,
    ratingDistribution,
    verifiedPurchaseCount,
    withImagesCount,
  };
}

/**
 * Get overall review statistics (admin dashboard)
 */
export async function getReviewDashboardStats() {
  const [total, pending, approved, rejected, flagged, avgRating] = await Promise.all([
    prisma.productReview.count(),
    prisma.productReview.count({ where: { status: 'PENDING' } }),
    prisma.productReview.count({ where: { status: 'APPROVED' } }),
    prisma.productReview.count({ where: { status: 'REJECTED' } }),
    prisma.productReview.count({ where: { status: 'FLAGGED' } }),
    prisma.productReview.aggregate({
      where: { status: 'APPROVED' },
      _avg: { rating: true },
    }),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    flagged,
    averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
  };
}

// ============================================================================
// Eligibility
// ============================================================================

/**
 * Check if a customer can review a product
 */
export async function canCustomerReviewProduct(
  productId: string,
  customerId?: string,
  email?: string
): Promise<{
  canReview: boolean;
  reason?: string;
  isVerifiedPurchaser: boolean;
}> {
  if (!customerId && !email) {
    return {
      canReview: true,
      isVerifiedPurchaser: false,
    };
  }

  // Check for existing review
  const existingReview = await prisma.productReview.findFirst({
    where: {
      productId,
      OR: [
        ...(customerId ? [{ customerId }] : []),
        ...(email ? [{ reviewerEmail: email }] : []),
      ],
    },
  });

  if (existingReview) {
    return {
      canReview: false,
      reason: 'You have already reviewed this product',
      isVerifiedPurchaser: existingReview.isVerifiedPurchase,
    };
  }

  // Check if customer has purchased
  let isVerifiedPurchaser = false;
  if (customerId) {
    const purchase = await prisma.orderItem.findFirst({
      where: {
        order: {
          customerId,
          paymentStatus: 'PAID',
        },
        productId,
      },
    });
    isVerifiedPurchaser = !!purchase;
  }

  return {
    canReview: true,
    isVerifiedPurchaser,
  };
}

// ============================================================================
// Review Request Emails
// ============================================================================

/**
 * Get orders eligible for review requests
 * (delivered orders without review requests sent)
 */
export async function getOrdersForReviewRequest(
  daysAfterDelivery: number = 7,
  limit: number = 50
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAfterDelivery);

  // Find delivered orders within the timeframe
  // We'll filter out already-sent review requests by checking internalNotes
  const orders = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      // Filter out orders that already have review request sent (stored in internalNotes)
      NOT: {
        internalNotes: { contains: '[REVIEW_REQUEST_SENT]' },
      },
      // Find orders with shipments delivered around the cutoff
      shipments: {
        some: {
          deliveredAt: {
            lte: cutoffDate,
            gte: new Date(cutoffDate.getTime() - 24 * 60 * 60 * 1000), // Within 1 day window
          },
        },
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: {
                take: 1,
                include: {
                  media: {
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      shippingAddress: true,
    },
    take: limit,
  });

  return orders;
}

/**
 * Send review request email for an order
 */
export async function sendReviewRequestEmail(orderId: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: {
                  take: 1,
                  include: {
                    media: {
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order || !order.email) {
      return { success: false, error: 'Order not found or no email' };
    }

    const settings = await getEmailSettings();
    const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const storeName = settings.fromName || 'Our Store';

    // Filter products that haven't been reviewed yet by this customer
    const productsToReview = [];
    for (const item of order.items) {
      const existingReview = await prisma.productReview.findFirst({
        where: {
          productId: item.productId,
          reviewerEmail: order.email,
        },
      });
      if (!existingReview && item.product) {
        productsToReview.push(item);
      }
    }

    if (productsToReview.length === 0) {
      // All products already reviewed
      await markReviewRequestSent(orderId);
      return { success: true, messageId: 'skipped-already-reviewed' };
    }

    const customerName = order.shippingAddress
      ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
      : order.customer ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') || 'Valued Customer' : 'Valued Customer';

    // Generate email HTML
    const emailHtml = generateReviewRequestEmail({
      storeName,
      storeUrl,
      customerName,
      orderNumber: order.orderNumber,
      products: productsToReview.map((item) => ({
        id: item.product!.id,
        name: item.product!.title,
        slug: item.product!.slug,
        imageUrl: item.product!.images[0]?.media?.url,
      })),
    });

    // Send email
    const result = await sendEmail({
      to: { email: order.email, name: customerName },
      subject: `How was your purchase? Leave a review!`,
      html: emailHtml,
    });

    if (result.success) {
      await markReviewRequestSent(orderId);
    }

    return result;
  } catch (error) {
    console.error('Send review request email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Mark order as having review request sent
 * Uses internalNotes to track this since Order doesn't have metadata
 */
async function markReviewRequestSent(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { internalNotes: true },
  });

  const currentNotes = order?.internalNotes || '';
  const timestamp = new Date().toISOString();
  const marker = `[REVIEW_REQUEST_SENT:${timestamp}]`;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      internalNotes: currentNotes ? `${currentNotes}\n${marker}` : marker,
    },
  });
}

/**
 * Generate review request email HTML
 */
function generateReviewRequestEmail(data: {
  storeName: string;
  storeUrl: string;
  customerName: string;
  orderNumber: string;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  }>;
}): string {
  const productBlocks = data.products
    .map(
      (product) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${
              product.imageUrl
                ? `
            <td width="80" valign="middle" style="padding-right: 16px;">
              <img src="${product.imageUrl}" alt="${product.name}" width="80" height="80" style="border-radius: 8px; object-fit: cover;">
            </td>
            `
                : ''
            }
            <td valign="middle">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #18181b;">${product.name}</p>
              <a href="${data.storeUrl}/products/${product.slug}?review=true#reviews" style="display: inline-block; padding: 8px 16px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Write a Review</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Your Purchase</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #18181b; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${data.storeName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Star Rating Icon -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 48px;">
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                      <span style="color: #fbbf24;">&#9733;</span>
                    </div>
                  </td>
                </tr>
              </table>

              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">How was your purchase?</h2>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                Hi ${data.customerName},<br><br>
                We hope you're enjoying your recent purchase from order #${data.orderNumber}! Your feedback helps other shoppers make informed decisions and helps us improve.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; line-height: 1.6; text-align: center;">
                <strong>Would you take a moment to share your experience?</strong>
              </p>

              <!-- Products to Review -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                ${productBlocks}
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; line-height: 1.6; text-align: center;">
                Your honest review, whether positive or constructive, is valuable to us and our community.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f4f4f5; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                Thank you for shopping with ${data.storeName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                <a href="${data.storeUrl}" style="color: #71717a; text-decoration: underline;">Visit our store</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// Bulk Operations (Admin)
// ============================================================================

/**
 * Bulk approve reviews
 */
export async function bulkApproveReviews(reviewIds: string[]) {
  return prisma.productReview.updateMany({
    where: { id: { in: reviewIds } },
    data: {
      status: 'APPROVED',
      publishedAt: new Date(),
    },
  });
}

/**
 * Bulk reject reviews
 */
export async function bulkRejectReviews(reviewIds: string[]) {
  return prisma.productReview.updateMany({
    where: { id: { in: reviewIds } },
    data: { status: 'REJECTED' },
  });
}

/**
 * Bulk delete reviews
 */
export async function bulkDeleteReviews(reviewIds: string[]) {
  return prisma.productReview.deleteMany({
    where: { id: { in: reviewIds } },
  });
}
