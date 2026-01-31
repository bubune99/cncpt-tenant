/**
 * Customer Profile API
 *
 * GET  /api/customer/profile - Get customer profile
 * PATCH /api/customer/profile - Update customer profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';

export async function GET() {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the user with their customer profile
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      include: {
        customer: {
          include: {
            addresses: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build profile response
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name || stackUser.displayName || '',
      avatar: user.avatar || stackUser.profileImageUrl,
      phone: user.phone,
      memberSince: user.createdAt.toISOString(),
      // Customer data if linked
      customer: user.customer
        ? {
            id: user.customer.id,
            firstName: user.customer.firstName,
            lastName: user.customer.lastName,
            phone: user.customer.phone,
            company: user.customer.company,
            taxId: user.customer.taxId,
            acceptsMarketing: user.customer.acceptsMarketing,
            totalOrders: user.customer.totalOrders,
            totalSpent: user.customer.totalSpent,
            averageOrder: user.customer.averageOrder,
            lastOrderAt: user.customer.lastOrderAt?.toISOString(),
            addresses: user.customer.addresses.map((addr) => ({
              id: addr.id,
              label: addr.label,
              firstName: addr.firstName,
              lastName: addr.lastName,
              company: addr.company,
              street1: addr.street1,
              street2: addr.street2,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode,
              country: addr.country,
              phone: addr.phone,
              isDefaultShipping: addr.isDefaultShipping,
              isDefaultBilling: addr.isDefaultBilling,
            })),
          }
        : null,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      include: { customer: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user data
    const userUpdateData: Record<string, string | null> = {};
    if (body.name !== undefined) userUpdateData.name = body.name || null;
    if (body.phone !== undefined) userUpdateData.phone = body.phone || null;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    // Update customer data if customer exists
    if (user.customer) {
      const customerUpdateData: Record<string, unknown> = {};

      if (body.firstName !== undefined)
        customerUpdateData.firstName = body.firstName || null;
      if (body.lastName !== undefined)
        customerUpdateData.lastName = body.lastName || null;
      if (body.company !== undefined)
        customerUpdateData.company = body.company || null;
      if (body.taxId !== undefined)
        customerUpdateData.taxId = body.taxId || null;
      if (body.phone !== undefined)
        customerUpdateData.phone = body.phone || null;

      // Handle marketing preferences
      if (
        body.acceptsMarketing !== undefined &&
        body.acceptsMarketing !== user.customer.acceptsMarketing
      ) {
        customerUpdateData.acceptsMarketing = body.acceptsMarketing;
        if (body.acceptsMarketing) {
          customerUpdateData.marketingOptInAt = new Date();
          customerUpdateData.marketingOptOutAt = null;
        } else {
          customerUpdateData.marketingOptOutAt = new Date();
        }
      }

      if (Object.keys(customerUpdateData).length > 0) {
        await prisma.customer.update({
          where: { id: user.customer.id },
          data: customerUpdateData,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
