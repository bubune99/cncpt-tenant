/**
 * Payment Primitives
 *
 * Primitives for payment processing: intents, checkout sessions, refunds, and customer management.
 * Uses Stripe integration from src/lib/stripe/
 */

import type { CreatePrimitiveRequest } from '../types';

export const PAYMENT_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // PAYMENT PRIMITIVES
  // ============================================================================
  {
    name: 'payment.createIntent',
    description: 'Create a Stripe Payment Intent for custom payment flows. Returns client secret for frontend integration.',
    category: 'payment',
    tags: ['payment', 'stripe', 'intent', 'checkout'],
    icon: 'CreditCard',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount in cents (e.g., 1000 = $10.00)',
        },
        currency: {
          type: 'string',
          description: 'Currency code (default: USD)',
          default: 'USD',
        },
        orderId: {
          type: 'string',
          description: 'Order ID to associate with payment',
        },
        customerId: {
          type: 'string',
          description: 'Stripe customer ID (optional)',
        },
        captureMethod: {
          type: 'string',
          description: 'Capture method',
          enum: ['automatic', 'manual'],
          default: 'automatic',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata to store with payment',
        },
      },
      required: ['amount'],
    },
    handler: `
      const { createPaymentIntent } = await import('@/lib/stripe');

      const result = await createPaymentIntent({
        amount: args.amount,
        currency: args.currency || 'USD',
        orderId: args.orderId,
        customerId: args.customerId,
        captureMethod: args.captureMethod,
        metadata: args.metadata,
      });

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        status: result.status,
      };
    `,
  },
  {
    name: 'payment.createCheckout',
    description: 'Create a Stripe Checkout Session for hosted payment page. Returns URL to redirect customer.',
    category: 'payment',
    tags: ['payment', 'stripe', 'checkout', 'session'],
    icon: 'ShoppingCart',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Line items for checkout',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number', description: 'Price in cents' },
              quantity: { type: 'number' },
              images: { type: 'array', items: { type: 'string' } },
              productId: { type: 'string' },
              stripePriceId: { type: 'string' },
            },
            required: ['name', 'price', 'quantity'],
          },
        },
        successUrl: {
          type: 'string',
          description: 'URL to redirect on success',
        },
        cancelUrl: {
          type: 'string',
          description: 'URL to redirect on cancel',
        },
        customerEmail: {
          type: 'string',
          description: 'Pre-fill customer email',
        },
        customerId: {
          type: 'string',
          description: 'Existing Stripe customer ID',
        },
        orderId: {
          type: 'string',
          description: 'Order ID to associate',
        },
        mode: {
          type: 'string',
          description: 'Checkout mode',
          enum: ['payment', 'subscription', 'setup'],
          default: 'payment',
        },
        allowPromotionCodes: {
          type: 'boolean',
          description: 'Allow promotion codes',
          default: false,
        },
        shippingAddressCollection: {
          type: 'boolean',
          description: 'Collect shipping address',
        },
        shippingOptions: {
          type: 'array',
          description: 'Shipping rate options',
          items: {
            type: 'object',
            properties: {
              displayName: { type: 'string' },
              amount: { type: 'number' },
              deliveryEstimate: { type: 'object' },
            },
          },
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
        },
      },
      required: ['items', 'successUrl', 'cancelUrl'],
    },
    handler: `
      const { createCheckoutSession } = await import('@/lib/stripe');

      const result = await createCheckoutSession({
        items: args.items,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl,
        customerEmail: args.customerEmail,
        customerId: args.customerId,
        orderId: args.orderId,
        mode: args.mode,
        allowPromotionCodes: args.allowPromotionCodes,
        shippingAddressCollection: args.shippingAddressCollection,
        shippingOptions: args.shippingOptions,
        metadata: args.metadata,
      });

      return {
        success: true,
        sessionId: result.sessionId,
        url: result.url,
      };
    `,
  },
  {
    name: 'payment.confirm',
    description: 'Confirm and capture a payment intent (for manual capture mode).',
    category: 'payment',
    tags: ['payment', 'stripe', 'capture', 'confirm'],
    icon: 'CheckCircle',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        paymentIntentId: {
          type: 'string',
          description: 'Payment Intent ID to capture',
        },
        amount: {
          type: 'number',
          description: 'Amount to capture in cents (optional, captures full amount if not provided)',
        },
      },
      required: ['paymentIntentId'],
    },
    handler: `
      const { capturePaymentIntent } = await import('@/lib/stripe');

      const result = await capturePaymentIntent(args.paymentIntentId, args.amount);

      return {
        success: true,
        paymentIntentId: result.paymentIntentId,
        status: result.status,
      };
    `,
  },
  {
    name: 'payment.refund',
    description: 'Create a refund for a payment. Supports full or partial refunds.',
    category: 'payment',
    tags: ['payment', 'stripe', 'refund'],
    icon: 'RotateCcw',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        paymentIntentId: {
          type: 'string',
          description: 'Payment Intent ID to refund',
        },
        amount: {
          type: 'number',
          description: 'Refund amount in cents (optional, full refund if not provided)',
        },
        reason: {
          type: 'string',
          description: 'Reason for refund',
          enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
        },
      },
      required: ['paymentIntentId'],
    },
    handler: `
      const { createRefund } = await import('@/lib/stripe');

      const result = await createRefund({
        paymentIntentId: args.paymentIntentId,
        amount: args.amount,
        reason: args.reason,
        metadata: args.metadata,
      });

      return {
        success: true,
        refundId: result.refundId,
        status: result.status,
        amount: result.amount,
        isFullRefund: !args.amount,
      };
    `,
  },
  {
    name: 'payment.getPaymentMethods',
    description: 'List saved payment methods for a Stripe customer.',
    category: 'payment',
    tags: ['payment', 'stripe', 'methods', 'customer'],
    icon: 'Wallet',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Stripe customer ID',
        },
        type: {
          type: 'string',
          description: 'Payment method type',
          enum: ['card', 'us_bank_account'],
          default: 'card',
        },
      },
      required: ['customerId'],
    },
    handler: `
      const { listPaymentMethods } = await import('@/lib/stripe');

      const methods = await listPaymentMethods(args.customerId, args.type || 'card');

      return {
        success: true,
        paymentMethods: methods.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : null,
          billingDetails: {
            name: pm.billing_details?.name,
            email: pm.billing_details?.email,
          },
        })),
        count: methods.length,
      };
    `,
  },
  {
    name: 'payment.createCustomer',
    description: 'Create or get a Stripe customer. Returns customer ID for future payments.',
    category: 'payment',
    tags: ['payment', 'stripe', 'customer', 'create'],
    icon: 'UserPlus',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Customer email address',
        },
        name: {
          type: 'string',
          description: 'Customer name',
        },
        phone: {
          type: 'string',
          description: 'Customer phone number',
        },
        address: {
          type: 'object',
          description: 'Customer address',
          properties: {
            line1: { type: 'string' },
            line2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
          },
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
        },
        getExisting: {
          type: 'boolean',
          description: 'Return existing customer if email matches (default: true)',
          default: true,
        },
      },
      required: ['email'],
    },
    handler: `
      const { createCustomer, getOrCreateCustomer } = await import('@/lib/stripe');

      let customerId;

      if (args.getExisting !== false) {
        customerId = await getOrCreateCustomer(args.email, args.name);
      } else {
        customerId = await createCustomer({
          email: args.email,
          name: args.name,
          phone: args.phone,
          address: args.address,
          metadata: args.metadata,
        });
      }

      return {
        success: true,
        customerId,
      };
    `,
  },
  {
    name: 'payment.getInvoices',
    description: 'List invoices for a Stripe customer.',
    category: 'payment',
    tags: ['payment', 'stripe', 'invoices', 'billing'],
    icon: 'FileText',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Stripe customer ID',
        },
        limit: {
          type: 'number',
          description: 'Max invoices to return (default: 10)',
          default: 10,
        },
      },
      required: ['customerId'],
    },
    handler: `
      const { listInvoices } = await import('@/lib/stripe');

      const invoices = await listInvoices(args.customerId, args.limit || 10);

      return {
        success: true,
        invoices: invoices.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amountDue: inv.amount_due,
          amountPaid: inv.amount_paid,
          currency: inv.currency,
          created: new Date(inv.created * 1000).toISOString(),
          dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        })),
        count: invoices.length,
      };
    `,
  },
  {
    name: 'payment.createBillingPortal',
    description: 'Create a Stripe Billing Portal session for customer self-service.',
    category: 'payment',
    tags: ['payment', 'stripe', 'portal', 'subscription'],
    icon: 'Settings',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Stripe customer ID',
        },
        returnUrl: {
          type: 'string',
          description: 'URL to return to after portal session',
        },
      },
      required: ['customerId', 'returnUrl'],
    },
    handler: `
      const { createBillingPortalSession } = await import('@/lib/stripe');

      const url = await createBillingPortalSession(args.customerId, args.returnUrl);

      return {
        success: true,
        url,
      };
    `,
  },
];
