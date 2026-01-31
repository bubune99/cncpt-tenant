/**
 * Review Primitives
 *
 * AI-callable primitives for product reviews and ratings.
 * Enables customers to leave reviews and store owners to manage them.
 */

import { CreatePrimitiveRequest } from '../types';

export const REVIEW_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // CREATE REVIEW
  // ============================================================================
  {
    name: 'review.create',
    description: 'Create a new product review',
    category: 'review',
    tags: ['review', 'rating', 'feedback', 'storefront'],
    icon: 'Star',
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
        orderId: {
          type: 'string',
          description: 'Order ID (for verified purchases)',
        },
        rating: {
          type: 'number',
          description: 'Rating (1-5)',
          minimum: 1,
          maximum: 5,
        },
        title: {
          type: 'string',
          description: 'Review title',
          maxLength: 200,
        },
        content: {
          type: 'string',
          description: 'Review content',
          maxLength: 5000,
        },
        pros: {
          type: 'array',
          description: 'List of pros',
          items: { type: 'string' },
        },
        cons: {
          type: 'array',
          description: 'List of cons',
          items: { type: 'string' },
        },
        images: {
          type: 'array',
          description: 'Image URLs',
          items: { type: 'string' },
        },
      },
      required: ['userId', 'productId', 'rating'],
    },
    handler: `
      const { userId, productId, orderId, rating, title, content, pros, cons, images } = input;

      // Verify product exists
      const product = await prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if user already reviewed this product
      const existing = await prisma.productReview.findFirst({
        where: { userId, productId },
      });

      if (existing) {
        throw new Error('You have already reviewed this product');
      }

      // Check if verified purchase
      let verifiedPurchase = false;
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            userId,
            items: { some: { productId } },
            status: { in: ['DELIVERED', 'COMPLETED'] },
          },
        });
        verifiedPurchase = !!order;
      }

      const review = await prisma.productReview.create({
        data: {
          userId,
          productId,
          orderId: orderId || null,
          rating,
          title: title || null,
          content: content || null,
          pros: pros || [],
          cons: cons || [],
          images: images || [],
          verifiedPurchase,
          status: 'PENDING', // Requires moderation
        },
      });

      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        verifiedPurchase: review.verifiedPurchase,
        status: review.status,
        message: 'Review submitted for moderation',
      };
    `,
  },

  // ============================================================================
  // GET PRODUCT REVIEWS
  // ============================================================================
  {
    name: 'review.list',
    description: 'Get reviews for a product',
    category: 'review',
    tags: ['review', 'rating', 'list', 'storefront'],
    icon: 'MessageSquare',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 10,
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['createdAt', 'rating', 'helpful'],
          default: 'createdAt',
        },
        sortOrder: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        rating: {
          type: 'number',
          description: 'Filter by specific rating',
        },
        verifiedOnly: {
          type: 'boolean',
          description: 'Only verified purchases',
          default: false,
        },
      },
      required: ['productId'],
    },
    handler: `
      const { productId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', rating, verifiedOnly = false } = input;

      const where = {
        productId,
        status: 'APPROVED',
      };

      if (rating) where.rating = rating;
      if (verifiedOnly) where.verifiedPurchase = true;

      const orderBy = sortBy === 'helpful'
        ? { helpfulCount: sortOrder }
        : { [sortBy]: sortOrder };

      const [reviews, total, stats] = await Promise.all([
        prisma.productReview.findMany({
          where,
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { votes: true } },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.productReview.count({ where }),
        prisma.productReview.aggregate({
          where: { productId, status: 'APPROVED' },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      // Get rating distribution
      const distribution = await prisma.productReview.groupBy({
        by: ['rating'],
        where: { productId, status: 'APPROVED' },
        _count: { rating: true },
      });

      const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(d => { ratingDist[d.rating] = d._count.rating; });

      return {
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          pros: r.pros,
          cons: r.cons,
          images: r.images,
          author: r.user?.name || 'Anonymous',
          verifiedPurchase: r.verifiedPurchase,
          helpfulCount: r.helpfulCount,
          response: r.response,
          createdAt: r.createdAt,
        })),
        summary: {
          averageRating: stats._avg.rating || 0,
          totalReviews: stats._count.rating || 0,
          distribution: ratingDist,
        },
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
  // GET SINGLE REVIEW
  // ============================================================================
  {
    name: 'review.get',
    description: 'Get a single review by ID',
    category: 'review',
    tags: ['review', 'rating', 'detail'],
    icon: 'FileText',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        reviewId: {
          type: 'string',
          description: 'Review ID',
        },
      },
      required: ['reviewId'],
    },
    handler: `
      const { reviewId } = input;

      const review = await prisma.productReview.findFirst({
        where: { id: reviewId },
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        pros: review.pros,
        cons: review.cons,
        images: review.images,
        author: review.user?.name || 'Anonymous',
        authorId: review.userId,
        product: review.product,
        verifiedPurchase: review.verifiedPurchase,
        helpfulCount: review.helpfulCount,
        response: review.response,
        respondedAt: review.respondedAt,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      };
    `,
  },

  // ============================================================================
  // VOTE REVIEW
  // ============================================================================
  {
    name: 'review.vote',
    description: 'Mark a review as helpful or not helpful',
    category: 'review',
    tags: ['review', 'vote', 'helpful', 'feedback'],
    icon: 'ThumbsUp',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        reviewId: {
          type: 'string',
          description: 'Review ID',
        },
        userId: {
          type: 'string',
          description: 'Voter user ID',
        },
        helpful: {
          type: 'boolean',
          description: 'Is this review helpful?',
        },
      },
      required: ['reviewId', 'userId', 'helpful'],
    },
    handler: `
      const { reviewId, userId, helpful } = input;

      const review = await prisma.productReview.findFirst({
        where: { id: reviewId, status: 'APPROVED' },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Upsert vote
      const existingVote = await prisma.reviewVote.findUnique({
        where: { reviewId_oderId: { reviewId, oderId: oderId } },
      });

      if (existingVote) {
        if (existingVote.helpful === helpful) {
          // Remove vote if same
          await prisma.reviewVote.delete({
            where: { id: existingVote.id },
          });

          // Update helpful count
          await prisma.productReview.update({
            where: { id: reviewId },
            data: { helpfulCount: { decrement: helpful ? 1 : 0 } },
          });

          return { voted: false, removed: true, reviewId };
        } else {
          // Change vote
          await prisma.reviewVote.update({
            where: { id: existingVote.id },
            data: { helpful },
          });

          await prisma.productReview.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: helpful ? 1 : -1 } },
          });

          return { voted: true, helpful, changed: true, reviewId };
        }
      } else {
        await prisma.reviewVote.create({
          data: { reviewId, oderId: oderId, helpful },
        });

        if (helpful) {
          await prisma.productReview.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: 1 } },
          });
        }

        return { voted: true, helpful, reviewId };
      }
    `,
  },

  // ============================================================================
  // RESPOND TO REVIEW
  // ============================================================================
  {
    name: 'review.respond',
    description: 'Store owner response to a review',
    category: 'review',
    tags: ['review', 'response', 'admin'],
    icon: 'Reply',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        reviewId: {
          type: 'string',
          description: 'Review ID',
        },
        response: {
          type: 'string',
          description: 'Response text',
          maxLength: 2000,
        },
      },
      required: ['reviewId', 'response'],
    },
    handler: `
      const { reviewId, response } = input;

      const review = await prisma.productReview.findFirst({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      const updated = await prisma.productReview.update({
        where: { id: reviewId },
        data: {
          response,
          respondedAt: new Date(),
        },
      });

      return {
        id: updated.id,
        response: updated.response,
        respondedAt: updated.respondedAt,
      };
    `,
  },

  // ============================================================================
  // GET PRODUCT RATING
  // ============================================================================
  {
    name: 'review.getProductRating',
    description: 'Get aggregate rating for a product',
    category: 'review',
    tags: ['review', 'rating', 'aggregate', 'storefront'],
    icon: 'BarChart',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID',
        },
      },
      required: ['productId'],
    },
    handler: `
      const { productId } = input;

      const stats = await prisma.productReview.aggregate({
        where: { productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const distribution = await prisma.productReview.groupBy({
        by: ['rating'],
        where: { productId, status: 'APPROVED' },
        _count: { rating: true },
      });

      const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution.forEach(d => { ratingDist[d.rating] = d._count.rating; });

      return {
        productId,
        averageRating: Math.round((stats._avg.rating || 0) * 10) / 10,
        totalReviews: stats._count.rating || 0,
        distribution: ratingDist,
        hasReviews: stats._count.rating > 0,
      };
    `,
  },

  // ============================================================================
  // GET USER REVIEWS
  // ============================================================================
  {
    name: 'review.getUserReviews',
    description: 'Get all reviews by a user',
    category: 'review',
    tags: ['review', 'user', 'history'],
    icon: 'User',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        page: {
          type: 'number',
          description: 'Page number',
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
      const { userId, page = 1, limit = 10 } = input;

      const [reviews, total] = await Promise.all([
        prisma.productReview.findMany({
          where: { userId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.productReview.count({ where: { userId } }),
      ]);

      return {
        reviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          status: r.status,
          helpfulCount: r.helpfulCount,
          product: {
            id: r.product.id,
            name: r.product.name,
            slug: r.product.slug,
            image: r.product.images[0] || null,
          },
          createdAt: r.createdAt,
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
];
