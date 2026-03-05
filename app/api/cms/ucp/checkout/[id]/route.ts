/**
 * UCP Checkout — Get & Update Session
 *
 * GET  /api/ucp/checkout/:id — Retrieve checkout session state
 * PATCH /api/ucp/checkout/:id — Update checkout (line items, buyer, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/cms/db';
import { getUcpSession, updateUcpSession } from '@/lib/cms/ucp/sessions';
import { withTenant } from '@/lib/cms/api/tenant';
import {
  ucpEnvelope,
  stripePaymentHandler,
  type UcpBuyer,
  type UcpLineItem,
  type UcpTotal,
  type UcpMessage,
} from '@/lib/cms/ucp/types';

export const dynamic = 'force-dynamic';

function stripInternalFields(session: Record<string, any>) {
  const { _created_at, _stripe_session_id, ...clean } = session;
  return clean;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(_request, async () => {
  try {
    const { id } = await params;
    const session = getUcpSession(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return NextResponse.json(stripInternalFields(session), {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('[UCP Checkout] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to get checkout session' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
  })
}

interface UpdateCheckoutBody {
  line_items?: Array<{ item: { id: string }; quantity: number }>;
  buyer?: UcpBuyer;
  currency?: string;
}

export async function PATCH(
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

    // Can't update completed or canceled sessions
    if (session.status === 'completed' || session.status === 'canceled') {
      return NextResponse.json(
        { error: `Cannot update a ${session.status} checkout session` },
        { status: 409, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const body: UpdateCheckoutBody = await request.json();
    const messages: UcpMessage[] = [];

    // Update buyer if provided
    if (body.buyer) {
      session.buyer = { ...session.buyer, ...body.buyer };
    }

    // Update currency if provided
    if (body.currency) {
      session.currency = body.currency;
    }

    // Rebuild line items if provided
    if (body.line_items) {
      const productIds = body.line_items.map((li) => li.item.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { include: { media: true }, take: 1 },
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
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

      session.line_items = lineItems;
      session.totals = [
        { type: 'subtotal', amount: subtotal },
        { type: 'tax', amount: 0, display_text: 'Calculated at checkout' },
        { type: 'total', amount: subtotal },
      ];
    }

    session.messages = messages;

    // Determine status
    const hasErrors = messages.some((m) => m.type === 'error');
    if (hasErrors) {
      session.status = 'incomplete';
    } else if (session.buyer?.email && session.line_items.length > 0) {
      session.status = 'ready_for_complete';
    } else {
      session.status = 'incomplete';
    }

    const updated = updateUcpSession(id, session);

    return NextResponse.json(stripInternalFields(updated || session), {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('[UCP Checkout] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update checkout session' },
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, UCP-Agent',
    },
  });
}
