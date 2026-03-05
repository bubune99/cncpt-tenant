/**
 * UCP Checkout — Create Session
 *
 * POST /api/ucp/checkout — Create a new UCP checkout session
 *
 * Accepts line items with product IDs and quantities, validates
 * inventory, calculates totals, and returns a checkout session
 * in UCP format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/cms/db';
import { createUcpSession } from '@/lib/cms/ucp/sessions';
import { withTenant } from '@/lib/cms/api/tenant';
import {
  ucpEnvelope,
  stripePaymentHandler,
  getBaseUrl,
  type UcpCheckoutSession,
  type UcpLineItem,
  type UcpTotal,
  type UcpBuyer,
  type UcpMessage,
} from '@/lib/cms/ucp/types';

export const dynamic = 'force-dynamic';

interface CreateCheckoutBody {
  line_items: Array<{ item: { id: string }; quantity: number }>;
  currency?: string;
  buyer?: UcpBuyer;
  payment?: { handlers?: unknown[] };
}

export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
  try {
    const body: CreateCheckoutBody = await request.json();

    if (!body.line_items || body.line_items.length === 0) {
      return NextResponse.json(
        { error: 'line_items is required and must not be empty' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const currency = body.currency || 'USD';
    const messages: UcpMessage[] = [];

    // Fetch products for all line items
    const productIds = body.line_items.map((li) => li.item.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { include: { media: true }, take: 1 },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate and build line items
    const lineItems: UcpLineItem[] = [];
    let subtotal = 0;

    for (const li of body.line_items) {
      const product = productMap.get(li.item.id);

      if (!product) {
        messages.push({
          type: 'error',
          code: 'product_not_found',
          severity: 'recoverable',
          content: `Product ${li.item.id} not found`,
        });
        continue;
      }

      if (product.status !== 'ACTIVE') {
        messages.push({
          type: 'error',
          code: 'product_unavailable',
          severity: 'recoverable',
          content: `Product "${product.title}" is not available`,
        });
        continue;
      }

      if (product.trackInventory && product.stock < li.quantity) {
        messages.push({
          type: 'error',
          code: 'insufficient_stock',
          severity: 'recoverable',
          content: `Only ${product.stock} units of "${product.title}" available`,
        });
        continue;
      }

      const itemTotal = product.basePrice * li.quantity;
      subtotal += itemTotal;

      const imageUrl = product.images?.[0]?.media?.url;

      lineItems.push({
        id: `li_${nanoid(10)}`,
        item: {
          id: product.id,
          title: product.title,
          price: product.basePrice,
          image_url: imageUrl || undefined,
          description: product.description?.substring(0, 200) || undefined,
        },
        quantity: li.quantity,
        totals: [{ type: 'subtotal', amount: itemTotal }],
      });
    }

    // If no valid line items, return error
    if (lineItems.length === 0) {
      return NextResponse.json(
        {
          ucp: ucpEnvelope(),
          error: 'No valid line items',
          messages,
        },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Calculate totals
    const totals: UcpTotal[] = [
      { type: 'subtotal', amount: subtotal },
      { type: 'tax', amount: 0, display_text: 'Calculated at checkout' },
      { type: 'total', amount: subtotal },
    ];

    // Determine status
    const hasErrors = messages.some((m) => m.type === 'error');
    let status: UcpCheckoutSession['status'] = 'incomplete';
    if (!hasErrors && body.buyer?.email) {
      status = 'ready_for_complete';
    }

    const sessionId = `ucp_${nanoid(16)}`;
    const baseUrl = getBaseUrl();

    const session: UcpCheckoutSession = {
      id: sessionId,
      status,
      currency,
      line_items: lineItems,
      buyer: body.buyer,
      totals,
      payment: {
        handlers: [stripePaymentHandler()],
      },
      messages,
      continue_url: `${baseUrl}/checkout?session=${sessionId}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ucp: ucpEnvelope(),
    };

    createUcpSession(session);

    // Strip internal fields for response
    const { _created_at, _stripe_session_id, ...response } = session;

    return NextResponse.json(response, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('[UCP Checkout] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
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
