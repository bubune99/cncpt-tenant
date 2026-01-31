/**
 * Customer Payment Methods API
 *
 * GET /api/customer/payment-methods - List payment methods from Stripe
 */

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { listPaymentMethods } from '@/lib/cms/stripe';

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
      select: { customer: { select: { stripeCustomerId: true } } },
    });

    if (!user?.customer?.stripeCustomerId) {
      // No Stripe customer - return empty list
      return NextResponse.json({ methods: [] });
    }

    // Fetch payment methods from Stripe
    const paymentMethods = await listPaymentMethods(user.customer.stripeCustomerId, 'card');

    // Transform for response
    const methods = paymentMethods.map((pm) => ({
      id: pm.id,
      type: pm.card?.brand || 'card',
      last4: pm.card?.last4 || '****',
      expiry: pm.card ? `${String(pm.card.exp_month).padStart(2, '0')}/${String(pm.card.exp_year).slice(-2)}` : '',
      isDefault: false, // Would need to check customer's default payment method
    }));

    return NextResponse.json({ methods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
