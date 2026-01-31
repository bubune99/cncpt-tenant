/**
 * Customer Addresses API
 *
 * GET    /api/customer/addresses - Get all addresses
 * POST   /api/customer/addresses - Add new address
 */

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '../../../../lib/stack';
import { prisma } from '../../../../lib/db';

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

    // Find the customer
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { customer: { select: { id: true } } },
    });

    if (!user?.customer) {
      return NextResponse.json({ addresses: [] });
    }

    // Fetch addresses
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: user.customer.id },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = addresses.map((addr) => ({
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
    }));

    return NextResponse.json({ addresses: transformed });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!body.street1 || !body.city || !body.postalCode) {
      return NextResponse.json(
        { error: 'Missing required fields: street1, city, postalCode' },
        { status: 400 }
      );
    }

    // Find or create customer
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { id: true, email: true, customer: { select: { id: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let customerId = user.customer?.id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await prisma.customer.create({
        data: {
          email: user.email,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // If setting as default, clear other defaults first
    if (body.isDefaultShipping) {
      await prisma.customerAddress.updateMany({
        where: { customerId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (body.isDefaultBilling) {
      await prisma.customerAddress.updateMany({
        where: { customerId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    // Create address
    const address = await prisma.customerAddress.create({
      data: {
        customerId,
        label: body.label || null,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        company: body.company || null,
        street1: body.street1,
        street2: body.street2 || null,
        city: body.city,
        state: body.state || null,
        postalCode: body.postalCode,
        country: body.country || 'US',
        phone: body.phone || null,
        isDefaultShipping: body.isDefaultShipping || false,
        isDefaultBilling: body.isDefaultBilling || false,
      },
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
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}
