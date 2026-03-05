/**
 * UCP Checkout — Complete
 *
 * POST /api/ucp/checkout/:id/complete — Finalize checkout and create order
 *
 * Creates a Stripe checkout session and an internal order record.
 * Returns the completed session with order_id and continue_url (Stripe checkout page).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { getUcpSession, updateUcpSession } from '@/lib/cms/ucp/sessions';
import { ucpEnvelope, getBaseUrl } from '@/lib/cms/ucp/types';
import { withTenant } from '@/lib/cms/api/tenant'

export const dynamic = 'force-dynamic';

interface CompleteCheckoutBody {
  payment_data?: {
    handler_id?: string;
    type?: string;
    credential?: Record<string, unknown>;
    billing_address?: Record<string, unknown>;
  };
  risk_signals?: Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(request, async () => {
  try {
    const { id } = await params;
    const session = getUcpSession(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Checkout session is already completed', order_id: session.order_id },
        { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (session.status === 'canceled') {
      return NextResponse.json(
        { error: 'Checkout session is canceled' },
        { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (session.status !== 'ready_for_complete') {
      return NextResponse.json(
        {
          error: `Checkout is not ready for completion (status: ${session.status})`,
          messages: session.messages,
        },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Mark as in progress
    updateUcpSession(id, { status: 'complete_in_progress' });

    const body: CompleteCheckoutBody = await request.json().catch(() => ({}));
    const baseUrl = getBaseUrl();

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Calculate totals from session
    const subtotal = session.totals.find((t) => t.type === 'subtotal')?.amount || 0;
    const tax = session.totals.find((t) => t.type === 'tax')?.amount || 0;
    const shipping = session.totals.find((t) => t.type === 'fulfillment')?.amount || 0;
    const discount = session.totals.find((t) => t.type === 'discount')?.amount || 0;
    const total = session.totals.find((t) => t.type === 'total')?.amount || subtotal + tax + shipping - Math.abs(discount);

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email: session.buyer?.email || 'ucp-agent@unknown',
        status: 'PENDING',
        subtotal,
        taxTotal: tax,
        shippingTotal: shipping,
        discountTotal: Math.abs(discount),
        total,
        customerNotes: `UCP checkout session: ${session.id}`,
        items: {
          create: session.line_items.map((li) => ({
            productId: li.item.id,
            title: li.item.title,
            price: li.item.price,
            quantity: li.quantity,
            total: li.item.price * li.quantity,
          })),
        },
      },
      select: { id: true, orderNumber: true },
    });

    // Create Stripe checkout session for payment
    let stripeUrl: string | undefined;
    try {
      const { createCheckoutSession } = await import('@/lib/cms/stripe');

      const stripeSession = await createCheckoutSession({
        orderId: order.id,
        items: session.line_items.map((li) => ({
          name: li.item.title,
          price: li.item.price,
          quantity: li.quantity,
          productId: li.item.id,
        })),
        customerEmail: session.buyer?.email,
        successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/checkout/cancel`,
        mode: 'payment',
        metadata: {
          ucp_session_id: session.id,
          order_id: order.id,
        },
      });

      stripeUrl = stripeSession.url;

      // Update order with Stripe session ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: stripeSession.sessionId,
          status: 'PROCESSING',
        },
      });
    } catch (stripeError) {
      console.warn('[UCP Checkout] Stripe session creation failed:', stripeError);
      // Order is created but payment needs manual handling
    }

    // Update session to completed
    const continueUrl = stripeUrl || `${baseUrl}/checkout?order=${order.id}`;
    const completedSession = updateUcpSession(id, {
      status: 'completed',
      order_id: order.id,
      continue_url: continueUrl,
      _stripe_session_id: stripeUrl ? undefined : undefined,
    });

    // Build response (strip internal fields)
    const response = completedSession || session;
    const { _created_at, _stripe_session_id, ...cleanResponse } = response;

    return NextResponse.json(
      {
        ...cleanResponse,
        status: 'completed',
        order_id: order.id,
        continue_url: continueUrl,
        ucp: ucpEnvelope(),
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    console.error('[UCP Checkout] Complete error:', error);

    // Revert status on failure
    updateUcpSession((await params).id, { status: 'ready_for_complete' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete checkout' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
  })
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, UCP-Agent',
    },
  });
}
