/**
 * Single Discount API Routes
 *
 * GET    /api/discounts/:id - Get discount details
 * PATCH  /api/discounts/:id - Update discount
 * DELETE /api/discounts/:id - Delete discount
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { DiscountType, DiscountApplyTo } from '@prisma/client';

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get discount details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const discount = await prisma.discountCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
            orders: true,
          },
        },
        usages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderId: true,
            email: true,
            discountAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Add status
    const now = new Date();
    const status = getDiscountStatus(discount, now);

    return NextResponse.json({
      ...discount,
      status,
    });
  } catch (error) {
    console.error('Get discount error:', error);
    return NextResponse.json(
      { error: 'Failed to get discount code' },
      { status: 500 }
    );
  }
}

// PATCH - Update discount
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check exists
    const existing = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // If changing code, check for duplicates
    if (body.code && body.code !== existing.code) {
      const codeNormalized = body.code.toUpperCase().trim();
      const duplicate = await prisma.discountCode.findFirst({
        where: { code: codeNormalized, tenantId: null },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A discount code with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) {
      updateData.code = body.code.toUpperCase().trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }
    if (body.type !== undefined) {
      updateData.type = body.type as DiscountType;
    }
    if (body.value !== undefined) {
      updateData.value = body.value;
    }
    if (body.minOrderValue !== undefined) {
      updateData.minOrderValue = body.minOrderValue || null;
    }
    if (body.maxDiscount !== undefined) {
      updateData.maxDiscount = body.maxDiscount || null;
    }
    if (body.applyTo !== undefined) {
      updateData.applyTo = body.applyTo as DiscountApplyTo;
    }
    if (body.productIds !== undefined) {
      updateData.productIds = body.productIds;
    }
    if (body.categoryIds !== undefined) {
      updateData.categoryIds = body.categoryIds;
    }
    if (body.excludeProductIds !== undefined) {
      updateData.excludeProductIds = body.excludeProductIds;
    }
    if (body.excludeSaleItems !== undefined) {
      updateData.excludeSaleItems = body.excludeSaleItems;
    }
    if (body.usageLimit !== undefined) {
      updateData.usageLimit = body.usageLimit || null;
    }
    if (body.perCustomer !== undefined) {
      updateData.perCustomer = body.perCustomer || null;
    }
    if (body.firstOrderOnly !== undefined) {
      updateData.firstOrderOnly = body.firstOrderOnly;
    }
    if (body.startsAt !== undefined) {
      updateData.startsAt = new Date(body.startsAt);
    }
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }
    if (body.enabled !== undefined) {
      updateData.enabled = body.enabled;
    }

    const updated = await prisma.discountCode.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            usages: true,
            orders: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update discount error:', error);
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

// DELETE - Delete discount
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check exists
    const existing = await prisma.discountCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
            orders: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    // Warn if discount has been used
    if (existing._count.usages > 0 || existing._count.orders > 0) {
      // Soft delete by disabling instead of hard delete
      await prisma.discountCode.update({
        where: { id },
        data: { enabled: false },
      });

      return NextResponse.json({
        message: 'Discount has been disabled (has usage history)',
        softDeleted: true,
      });
    }

    // Hard delete if never used
    await prisma.discountCode.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Discount code deleted successfully',
      softDeleted: false,
    });
  } catch (error) {
    console.error('Delete discount error:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
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
