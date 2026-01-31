/**
 * Discounts API Routes
 *
 * GET  /api/discounts - List discount codes (admin)
 * POST /api/discounts - Create discount code (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { DiscountType, DiscountApplyTo } from '@prisma/client';

// GET - List discount codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'expired', 'disabled', 'all'
    const type = searchParams.get('type') as DiscountType | null;

    const skip = (page - 1) * limit;
    const now = new Date();

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status === 'active') {
      where.enabled = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ];
      where.startsAt = { lte: now };
    } else if (status === 'expired') {
      where.expiresAt = { lt: now };
    } else if (status === 'disabled') {
      where.enabled = false;
    }

    // Fetch discounts with counts
    const [discounts, total] = await Promise.all([
      prisma.discountCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              usages: true,
              orders: true,
            },
          },
        },
      }),
      prisma.discountCode.count({ where }),
    ]);

    // Add status to each discount
    const discountsWithStatus = discounts.map((discount) => ({
      ...discount,
      status: getDiscountStatus(discount, now),
    }));

    return NextResponse.json({
      discounts: discountsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List discounts error:', error);
    return NextResponse.json(
      { error: 'Failed to list discount codes' },
      { status: 500 }
    );
  }
}

// POST - Create discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    if (body.value === undefined || body.value < 0) {
      return NextResponse.json(
        { error: 'Valid discount value is required' },
        { status: 400 }
      );
    }

    // Normalize code
    const code = body.code.toUpperCase().trim();

    // Check for duplicate code
    const existing = await prisma.discountCode.findFirst({
      where: { code, tenantId: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A discount code with this code already exists' },
        { status: 409 }
      );
    }

    // Create discount
    const discount = await prisma.discountCode.create({
      data: {
        code,
        description: body.description || null,
        type: (body.type as DiscountType) || 'PERCENTAGE',
        value: body.value,
        minOrderValue: body.minOrderValue || null,
        maxDiscount: body.maxDiscount || null,
        applyTo: (body.applyTo as DiscountApplyTo) || 'ORDER',
        productIds: body.productIds || [],
        categoryIds: body.categoryIds || [],
        excludeProductIds: body.excludeProductIds || [],
        excludeSaleItems: body.excludeSaleItems || false,
        usageLimit: body.usageLimit || null,
        perCustomer: body.perCustomer || null,
        firstOrderOnly: body.firstOrderOnly || false,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        enabled: body.enabled !== false,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Create discount error:', error);
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}

/**
 * Determine discount status
 */
function getDiscountStatus(
  discount: { enabled: boolean; startsAt: Date; expiresAt: Date | null; usageLimit: number | null; usageCount: number },
  now: Date
): 'active' | 'scheduled' | 'expired' | 'disabled' | 'depleted' {
  if (!discount.enabled) {
    return 'disabled';
  }

  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
    return 'depleted';
  }

  if (discount.startsAt > now) {
    return 'scheduled';
  }

  if (discount.expiresAt && discount.expiresAt < now) {
    return 'expired';
  }

  return 'active';
}
