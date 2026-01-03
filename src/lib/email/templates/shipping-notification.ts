/**
 * Shipping Notification Email Template
 *
 * Sent when an order has been shipped.
 * Includes tracking information and shipment details.
 */

import { renderEmail, StoreConfig, emailComponents } from './renderer';
import { OrderItem, OrderAddress } from './order-confirmation';

export interface ShipmentData {
  order: {
    id: string;
    orderNumber: string;
    items: OrderItem[];
  };
  shipment: {
    id: string;
    carrier: string;
    carrierName?: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt: Date | string;
    estimatedDelivery?: string;
    shippingAddress: OrderAddress;
    items?: OrderItem[]; // Items in this shipment (for partial shipments)
  };
  customer: {
    name: string;
    email: string;
  };
  isPartialShipment?: boolean;
}

/**
 * Generate tracking info box
 */
function generateTrackingBox(shipment: ShipmentData['shipment']): string {
  const carrierDisplay = shipment.carrierName || shipment.carrier;
  const shippedDate = new Date(shipment.shippedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #eff6ff; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  📦 Shipment Details
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" style="padding-bottom: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Carrier</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">${carrierDisplay}</p>
                    </td>
                    <td width="50%" style="padding-bottom: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Shipped On</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">${shippedDate}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 12px; border-top: 1px solid #bfdbfe;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Tracking Number</p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #18181b; font-family: monospace;">${shipment.trackingNumber}</p>
                    </td>
                  </tr>
                  ${shipment.estimatedDelivery ? `
                  <tr>
                    <td colspan="2" style="padding-top: 12px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Estimated Delivery</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #22c55e;">${shipment.estimatedDelivery}</p>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate shipped items list
 */
function generateShippedItems(items: OrderItem[]): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      ${items.map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                ${item.imageUrl ? `
                <td width="60" valign="top" style="padding-right: 12px;">
                  <img src="${item.imageUrl}" alt="${item.name}" width="60" height="60" style="border-radius: 4px; object-fit: cover;">
                </td>
                ` : ''}
                <td valign="middle">
                  <p style="margin: 0 0 2px 0; font-weight: 500; color: #18181b;">${item.name}</p>
                  ${item.variant ? `<p style="margin: 0; font-size: 13px; color: #71717a;">${item.variant}</p>` : ''}
                </td>
                <td width="50" valign="middle" align="right">
                  <p style="margin: 0; font-size: 14px; color: #71717a;">x${item.quantity}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

/**
 * Generate shipping notification email content
 */
export function generateShippingNotificationContent(data: ShipmentData): string {
  const { order, shipment, customer, isPartialShipment } = data;
  const itemsToShow = shipment.items || order.items;

  return `
    ${emailComponents.heading.h1('Your order is on its way! 🚚')}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(
      isPartialShipment
        ? `Part of your order #${order.orderNumber} has shipped! Here are the tracking details for this shipment.`
        : `Great news! Your order #${order.orderNumber} has shipped and is on its way to you.`
    )}

    ${generateTrackingBox(shipment)}

    ${shipment.trackingUrl ? emailComponents.button('Track Your Package', shipment.trackingUrl) : ''}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2(isPartialShipment ? 'Items in This Shipment' : 'Items Shipped')}

    ${generateShippedItems(itemsToShow)}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2('Shipping To')}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px; background-color: #fafafa; border-radius: 6px;">
          <p style="margin: 0; line-height: 1.6; color: #3f3f46;">
            <strong>${shipment.shippingAddress.name}</strong><br>
            ${shipment.shippingAddress.line1}<br>
            ${shipment.shippingAddress.line2 ? shipment.shippingAddress.line2 + '<br>' : ''}
            ${shipment.shippingAddress.city}, ${shipment.shippingAddress.state} ${shipment.shippingAddress.postalCode}<br>
            ${shipment.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    ${emailComponents.infoBox(`
      <p style="margin: 0; font-size: 14px;">
        <strong>Tip:</strong> You can also track your package by visiting your
        <a href="{{store.url}}/account/orders/${order.id}" style="color: #3b82f6; text-decoration: none;">order details page</a>.
      </p>
    `)}

    ${emailComponents.mutedText('If you have any questions about your shipment, please contact our support team.')}
  `;
}

/**
 * Render complete shipping notification email
 */
export function renderShippingNotificationEmail(
  data: ShipmentData,
  store?: Partial<StoreConfig>
): { html: string; text: string; subject: string } {
  const content = generateShippingNotificationContent(data);

  const mergeData: Record<string, unknown> = {
    order: data.order,
    shipment: data.shipment,
    customer: data.customer,
  };

  const html = renderEmail(
    content,
    {
      title: `Your Order #${data.order.orderNumber} Has Shipped`,
      preheader: `Your order is on its way! Track your package with ${data.shipment.carrierName || data.shipment.carrier}.`,
    },
    mergeData,
    { store }
  );

  const itemsToShow = data.shipment.items || data.order.items;

  const text = `
Your order is on its way!

Hi ${data.customer.name},

${data.isPartialShipment
  ? `Part of your order #${data.order.orderNumber} has shipped!`
  : `Great news! Your order #${data.order.orderNumber} has shipped and is on its way to you.`
}

SHIPMENT DETAILS:
Carrier: ${data.shipment.carrierName || data.shipment.carrier}
Tracking Number: ${data.shipment.trackingNumber}
${data.shipment.trackingUrl ? `Track your package: ${data.shipment.trackingUrl}` : ''}
${data.shipment.estimatedDelivery ? `Estimated Delivery: ${data.shipment.estimatedDelivery}` : ''}

ITEMS SHIPPED:
${itemsToShow.map(item => `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity}`).join('\n')}

SHIPPING TO:
${data.shipment.shippingAddress.name}
${data.shipment.shippingAddress.line1}
${data.shipment.shippingAddress.line2 ? data.shipment.shippingAddress.line2 + '\n' : ''}${data.shipment.shippingAddress.city}, ${data.shipment.shippingAddress.state} ${data.shipment.shippingAddress.postalCode}
${data.shipment.shippingAddress.country}

If you have any questions, please contact our support team.
  `.trim();

  return {
    html,
    text,
    subject: `Your Order #${data.order.orderNumber} Has Shipped`,
  };
}
