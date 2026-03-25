/**
 * Unified Checkout API
 *
 * Converts cart items to Order and creates Stripe checkout session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { createCheckoutSession, getStripeSettings } from '@/lib/cms/stripe';
import type { CreateCheckoutSessionRequest, CheckoutItem } from '@/lib/cms/stripe/types';
import { rateLimitCheck, RATE_LIMIT_PRESETS } from '@/lib/cms/rate-limit';
import { validateCsrf } from '@/lib/cms/csrf';
import { withTenant } from '@/lib/cms/api/tenant';

// =============================================================================
// TYPES
// =============================================================================

interface CartItem {
  // Local product
  productId?: string;
  variantId?: string;
  // Or direct info
  name?: string;
  price?: number; // in cents
  // Common
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  customerEmail?: string;
  customerId?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  customerNotes?: string;
  mode?: 'payment' | 'subscription';
  allowPromotionCodes?: boolean;
  collectShippingAddress?: boolean;
  metadata?: Record<string, string>;
}

// =============================================================================
// HELPER: Generate Order Number
// =============================================================================

async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

  // Get count of orders today
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const todayCount = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  return `${prefix}-${String(todayCount + 1).padStart(4, '0')}`;
}

// =============================================================================
// POST - Create Order and Checkout Session
// =============================================================================

export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
  const limited = await rateLimitCheck(request, RATE_LIMIT_PRESETS.checkout);
  if (limited) return limited;

  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    // Check Stripe configuration
    const stripeSettings = await getStripeSettings();
    if (!stripeSettings.enabled && !stripeSettings.secretKey) {
      return NextResponse.json(
        { error: 'Stripe payments are not configured' },
        { status: 503 }
      );
    }

    const body: CheckoutRequest = await request.json();
    const { items, customerEmail, customerId, shippingAddress, customerNotes, mode = 'payment' } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart items required' }, { status: 400 });
    }

    // Resolve cart items to checkout items
    const checkoutItems: CheckoutItem[] = [];
    const orderItems: Array<{
      productId: string;
      variantId?: string;
      title: string;
      variantTitle?: string;
      sku?: string;
      quantity: number;
      price: number;
      total: number;
    }> = [];

    let subtotal = 0;

    for (const item of items) {
      if (item.productId) {
        // Fetch from local database
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: item.variantId ? {
              where: { id: item.variantId },
            } : undefined,
            images: {
              include: { media: true },
              take: 1,
              orderBy: { position: 'asc' },
            },
          },
        });

        if (!product) {
          return NextResponse.json(
            { error: `Product not found: ${item.productId}` },
            { status: 400 }
          );
        }

        const variant = item.variantId ? product.variants?.[0] : null;
        const price = variant?.price ?? product.basePrice;
        const stripePriceId = variant?.stripePriceId ?? product.stripePriceId ?? undefined;
        const sku = variant?.sku ?? product.sku ?? undefined;

        // Build variant title from options
        let variantTitle: string | undefined;
        if (variant) {
          const variantWithOptions = await prisma.productVariant.findUnique({
            where: { id: variant.id },
            include: {
              optionValues: {
                include: { optionValue: true },
              },
            },
          });
          variantTitle = variantWithOptions?.optionValues
            .map(ov => ov.optionValue.value)
            .join(' / ');
        }

        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        checkoutItems.push({
          name: product.title,
          description: variantTitle || product.description?.substring(0, 500) || undefined,
          price, // Already in cents
          quantity: item.quantity,
          productId: product.id,
          variantId: variant?.id,
          stripePriceId,
          images: product.images?.[0]?.media?.url ? [product.images[0].media.url] : undefined,
        });

        orderItems.push({
          productId: product.id,
          variantId: variant?.id,
          title: product.title,
          variantTitle,
          sku,
          quantity: item.quantity,
          price, // cents
          total: itemTotal,
        });
      } else if (item.name && item.price !== undefined) {
        // Direct item (no database product)
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        checkoutItems.push({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });

        // Can't create order item without product reference
        // These would be one-time items
      } else {
        return NextResponse.json(
          { error: 'Each item requires either productId or name+price' },
          { status: 400 }
        );
      }
    }

    // Create shipping address if provided
    let shippingAddressId: string | undefined;
    if (shippingAddress) {
      const address = await prisma.address.create({
        data: {
          userId: customerId ?? 'guest',
          firstName: '',
          lastName: '',
          street1: shippingAddress.line1,
          street2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state ?? '',
          zip: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      });
      shippingAddressId = address.id;
    }

    // Create order
    const orderNumber = await generateOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customerId || undefined,
        email: customerEmail || 'guest@checkout.local',
        status: 'PENDING',
        subtotal,
        shippingTotal: 0, // Can be calculated later
        taxTotal: 0, // Can be calculated later
        discountTotal: 0,
        total: subtotal, // Subtotal for now
        shippingAddressId,
        customerNotes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Create Stripe checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

    const sessionRequest: CreateCheckoutSessionRequest = {
      orderId: order.id,
      items: checkoutItems,
      customerEmail,
      customerId,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancelUrl: `${origin}/checkout/cancel?order_id=${order.id}`,
      mode,
      allowPromotionCodes: body.allowPromotionCodes ?? true,
      shippingAddressCollection: body.collectShippingAddress,
      metadata: {
        ...body.metadata,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    };

    const session = await createCheckoutSession(sessionRequest);

    // Update order with checkout session ID — keep status as PENDING until
    // Stripe webhook confirms payment (checkout.session.completed)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.sessionId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: session.url,
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error('[Checkout API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
  })
}
