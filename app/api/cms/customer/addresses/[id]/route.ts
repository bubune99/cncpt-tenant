/**
 * Customer Address API
 *
 * GET    /api/customer/addresses/:id - Get address details
 * PATCH  /api/customer/addresses/:id - Update address
 * DELETE /api/customer/addresses/:id - Delete address
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the customer
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { customer: { select: { id: true } } },
    });

    if (!user?.customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch address and verify ownership
    const address = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!address || address.customerId !== user.customer.id) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: address.id,
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Find the customer
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { customer: { select: { id: true } } },
    });

    if (!user?.customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify address ownership
    const existingAddress = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.customerId !== user.customer.id) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, clear other defaults first
    if (body.isDefaultShipping === true) {
      await prisma.customerAddress.updateMany({
        where: { customerId: user.customer.id, isDefaultShipping: true, id: { not: id } },
        data: { isDefaultShipping: false },
      });
    }
    if (body.isDefaultBilling === true) {
      await prisma.customerAddress.updateMany({
        where: { customerId: user.customer.id, isDefaultBilling: true, id: { not: id } },
        data: { isDefaultBilling: false },
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.label !== undefined) updateData.label = body.label || null;
    if (body.firstName !== undefined) updateData.firstName = body.firstName || null;
    if (body.lastName !== undefined) updateData.lastName = body.lastName || null;
    if (body.company !== undefined) updateData.company = body.company || null;
    if (body.street1 !== undefined) updateData.street1 = body.street1;
    if (body.street2 !== undefined) updateData.street2 = body.street2 || null;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state || null;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.country !== undefined) updateData.country = body.country || 'US';
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.isDefaultShipping !== undefined) updateData.isDefaultShipping = body.isDefaultShipping;
    if (body.isDefaultBilling !== undefined) updateData.isDefaultBilling = body.isDefaultBilling;

    const address = await prisma.customerAddress.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      address: {
        id: address.id,
        label: address.label,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company,
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
        isDefaultShipping: address.isDefaultShipping,
        isDefaultBilling: address.isDefaultBilling,
      },
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the customer
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { customer: { select: { id: true } } },
    });

    if (!user?.customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify address ownership
    const existingAddress = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.customerId !== user.customer.id) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.customerAddress.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
