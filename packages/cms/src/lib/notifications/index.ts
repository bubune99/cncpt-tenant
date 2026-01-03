/**
 * Transactional Notifications Service
 *
 * Sends order lifecycle emails by fetching order data and using email templates.
 * Integrates with Stripe/Shippo webhooks for automatic notifications.
 *
 * Supports Puck-editable templates - falls back to hardcoded templates if not found.
 */

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { getEmailSettings } from '@/lib/settings';
import {
  renderOrderConfirmationEmail,
  renderShippingNotificationEmail,
  renderDeliveryConfirmationEmail,
  renderRefundNotificationEmail,
  type OrderConfirmationData,
  type ShipmentData,
  type DeliveryData,
  type RefundData,
} from '@/lib/email/templates';
import { renderEmailTemplateBySlug } from '@/lib/email/templates/render';

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get store configuration for email templates
 */
async function getStoreConfig() {
  const settings = await getEmailSettings();
  return {
    name: settings.fromName || 'Our Store',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supportEmail: settings.replyTo || settings.fromEmail,
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
  };
}

/**
 * Format address from Prisma Address model
 */
function formatAddress(address: {
  firstName: string;
  lastName: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
} | null) {
  if (!address) {
    return {
      name: '',
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    };
  }
  return {
    name: `${address.firstName} ${address.lastName}`.trim(),
    line1: address.street1,
    line2: address.street2 || undefined,
    city: address.city,
    state: address.state,
    postalCode: address.zip,
    country: address.country,
  };
}

/**
 * Get customer name from address or customer
 */
function getCustomerName(
  address: { firstName: string; lastName: string } | null | undefined,
  customer: { firstName: string | null; lastName: string | null } | null | undefined
): string {
  if (address) {
    return `${address.firstName} ${address.lastName}`.trim() || 'Customer';
  }
  if (customer) {
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
    return name || 'Customer';
  }
  return 'Customer';
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(orderId: string): Promise<NotificationResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true,
                  },
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        customer: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const customerEmail = order.email || order.customer?.email;
    if (!customerEmail) {
      return { success: false, error: 'No customer email' };
    }

    const data: OrderConfirmationData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.product?.title || item.title || 'Product',
          variant: item.variantTitle || undefined,
          quantity: item.quantity,
          price: item.price, // Already in cents
          imageUrl: item.product?.images?.[0]?.media?.url || undefined,
        })),
        subtotal: order.subtotal,
        shipping: order.shippingTotal,
        tax: order.taxTotal,
        discount: order.discountTotal > 0 ? order.discountTotal : undefined,
        total: order.total,
        currency: 'USD', // Default currency
        paymentMethod: 'Credit Card',
        shippingAddress: formatAddress(order.shippingAddress),
        billingAddress: order.billingAddress
          ? formatAddress(order.billingAddress)
          : undefined,
        shippingMethod: undefined,
        notes: order.customerNotes || undefined,
      },
      customer: {
        name: getCustomerName(order.shippingAddress, order.customer),
        email: customerEmail,
      },
    };

    const store = await getStoreConfig();

    // Try Puck template first, fall back to hardcoded
    let html: string;
    let text: string;
    let subject: string;

    const puckResult = await renderEmailTemplateBySlug('order-confirmation', {
      order: data.order,
      customer: data.customer,
    });

    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Order Confirmation #${data.order.orderNumber}`;
    } else {
      const fallback = renderOrderConfirmationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }

    const result = await sendEmail({
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: 'order_confirmation',
      },
    });

    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(
  orderId: string,
  shipmentId: string
): Promise<NotificationResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true,
                  },
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        customer: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return { success: false, error: 'Shipment not found' };
    }

    const customerEmail = order.email || order.customer?.email;
    if (!customerEmail) {
      return { success: false, error: 'No customer email' };
    }

    const data: ShipmentData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.product?.title || item.title || 'Product',
          variant: item.variantTitle || undefined,
          quantity: item.quantity,
          price: item.price, // Already in cents
          imageUrl: item.product?.images?.[0]?.media?.url || undefined,
        })),
      },
      shipment: {
        id: shipment.id,
        carrier: shipment.carrier || 'Unknown',
        carrierName: getCarrierName(shipment.carrier || ''),
        trackingNumber: shipment.trackingNumber || '',
        trackingUrl: shipment.trackingUrl || undefined,
        shippedAt: shipment.shippedAt || new Date(),
        estimatedDelivery: undefined, // Not available in schema
        shippingAddress: formatAddress(order.shippingAddress),
      },
      customer: {
        name: getCustomerName(order.shippingAddress, order.customer),
        email: customerEmail,
      },
    };

    const store = await getStoreConfig();

    // Try Puck template first, fall back to hardcoded
    let html: string;
    let text: string;
    let subject: string;

    const puckResult = await renderEmailTemplateBySlug('shipping-notification', {
      order: data.order,
      shipment: data.shipment,
      customer: data.customer,
    });

    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Your order #${data.order.orderNumber} has shipped!`;
    } else {
      const fallback = renderShippingNotificationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }

    const result = await sendEmail({
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        shipmentId: shipment.id,
        type: 'shipping_notification',
      },
    });

    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Error sending shipping notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send delivery confirmation email
 */
export async function sendDeliveryConfirmation(
  orderId: string,
  shipmentId: string
): Promise<NotificationResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true,
                  },
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        customer: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return { success: false, error: 'Shipment not found' };
    }

    const customerEmail = order.email || order.customer?.email;
    if (!customerEmail) {
      return { success: false, error: 'No customer email' };
    }

    const data: DeliveryData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.product?.title || item.title || 'Product',
          variant: item.variantTitle || undefined,
          quantity: item.quantity,
          price: item.price, // Already in cents
          imageUrl: item.product?.images?.[0]?.media?.url || undefined,
        })),
      },
      delivery: {
        deliveredAt: shipment.deliveredAt || new Date(),
        signedBy: undefined, // Not tracked in schema
        shippingAddress: formatAddress(order.shippingAddress),
      },
      customer: {
        name: getCustomerName(order.shippingAddress, order.customer),
        email: customerEmail,
      },
    };

    const store = await getStoreConfig();

    // Try Puck template first, fall back to hardcoded
    let html: string;
    let text: string;
    let subject: string;

    const puckResult = await renderEmailTemplateBySlug('delivery-confirmation', {
      order: data.order,
      delivery: data.delivery,
      customer: data.customer,
    });

    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Your order #${data.order.orderNumber} has been delivered!`;
    } else {
      const fallback = renderDeliveryConfirmationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }

    const result = await sendEmail({
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        shipmentId: shipment.id,
        type: 'delivery_confirmation',
      },
    });

    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Error sending delivery confirmation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send refund notification email
 */
export async function sendRefundNotification(
  orderId: string,
  refundAmount: number, // In cents
  refundReason?: string,
  isFullRefund = true
): Promise<NotificationResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  include: {
                    media: true,
                  },
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const customerEmail = order.email || order.customer?.email;
    if (!customerEmail) {
      return { success: false, error: 'No customer email' };
    }

    const data: RefundData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total, // Already in cents
        currency: 'USD',
        items: order.items.map((item) => ({
          id: item.id,
          name: item.product?.title || item.title || 'Product',
          variant: item.variantTitle || undefined,
          quantity: item.quantity,
          price: item.price, // Already in cents
          imageUrl: item.product?.images?.[0]?.media?.url || undefined,
        })),
      },
      refund: {
        id: `refund_${Date.now()}`,
        amount: refundAmount, // Already in cents
        reason: refundReason,
        type: isFullRefund ? 'full' : 'partial',
        processedAt: new Date(),
        paymentMethod: 'Original payment method',
        estimatedArrival: '5-10 business days',
      },
      customer: {
        name: order.customer ? [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') || 'Customer' : 'Customer',
        email: customerEmail,
      },
    };

    const store = await getStoreConfig();

    // Try Puck template first, fall back to hardcoded
    let html: string;
    let text: string;
    let subject: string;

    const puckResult = await renderEmailTemplateBySlug('refund-notification', {
      order: data.order,
      refund: data.refund,
      customer: data.customer,
    });

    if (puckResult) {
      html = puckResult.html;
      text = puckResult.text;
      subject = puckResult.subject || `Refund processed for order #${data.order.orderNumber}`;
    } else {
      const fallback = renderRefundNotificationEmail(data, store);
      html = fallback.html;
      text = fallback.text;
      subject = fallback.subject;
    }

    const result = await sendEmail({
      to: { email: customerEmail, name: data.customer.name },
      subject,
      html,
      text,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: 'refund_notification',
      },
    });

    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error('Error sending refund notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Helper to get friendly carrier name
 */
function getCarrierName(carrier: string): string {
  const names: Record<string, string> = {
    usps: 'USPS',
    ups: 'UPS',
    fedex: 'FedEx',
    dhl: 'DHL',
    fedex_ground: 'FedEx Ground',
    fedex_express: 'FedEx Express',
    ups_ground: 'UPS Ground',
    usps_priority: 'USPS Priority Mail',
    usps_express: 'USPS Express',
  };
  return names[carrier.toLowerCase()] || carrier;
}

export * from './types';
