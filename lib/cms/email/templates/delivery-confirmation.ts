/**
 * Delivery Confirmation Email Template
 *
 * Sent when an order has been delivered.
 * Includes delivery details and prompts for feedback/review.
 */

import { renderEmail, StoreConfig, emailComponents } from './renderer';
import { OrderItem, OrderAddress } from './order-confirmation';

export interface DeliveryData {
  order: {
    id: string;
    orderNumber: string;
    items: OrderItem[];
  };
  delivery: {
    deliveredAt: Date | string;
    deliveredTo?: string;
    signedBy?: string;
    proofImageUrl?: string;
    shippingAddress: OrderAddress;
  };
  customer: {
    name: string;
    email: string;
  };
}

/**
 * Generate delivery confirmation box
 */
function generateDeliveryBox(delivery: DeliveryData['delivery']): string {
  const deliveredDate = new Date(delivery.deliveredAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliveredTime = new Date(delivery.deliveredAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f0fdf4; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <div style="width: 64px; height: 64px; background-color: #22c55e; border-radius: 50%; display: inline-block; text-align: center; line-height: 64px;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #166534;">Delivered!</p>
                <p style="margin: 0 0 4px 0; font-size: 16px; color: #3f3f46;">${deliveredDate}</p>
                <p style="margin: 0; font-size: 14px; color: #71717a;">at ${deliveredTime}</p>
              </td>
            </tr>
            ${delivery.signedBy ? `
            <tr>
              <td align="center" style="padding-top: 16px; border-top: 1px solid #bbf7d0; margin-top: 16px;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">Signed by: <strong style="color: #3f3f46;">${delivery.signedBy}</strong></p>
              </td>
            </tr>
            ` : ''}
            ${delivery.deliveredTo ? `
            <tr>
              <td align="center" style="padding-top: 8px;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">Delivered to: <strong style="color: #3f3f46;">${delivery.deliveredTo}</strong></p>
              </td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate delivered items list (compact)
 */
function generateDeliveredItems(items: OrderItem[]): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      ${items.map(item => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                ${item.imageUrl ? `
                <td width="50" valign="middle" style="padding-right: 12px;">
                  <img src="${item.imageUrl}" alt="${item.name}" width="50" height="50" style="border-radius: 4px; object-fit: cover;">
                </td>
                ` : ''}
                <td valign="middle">
                  <p style="margin: 0; font-size: 15px; color: #18181b;">${item.name}</p>
                  ${item.variant ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #71717a;">${item.variant}</p>` : ''}
                </td>
                <td width="40" valign="middle" align="right">
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
 * Generate review prompt section
 */
function generateReviewPrompt(orderId: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center">
                <p style="margin: 0 0 8px 0; font-size: 24px;">⭐</p>
                <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #854d0e;">How was your experience?</p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #713f12;">We'd love to hear your feedback! Your review helps other shoppers and helps us improve.</p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius: 6px; background-color: #eab308;">
                      <a href="{{store.url}}/account/orders/${orderId}/review" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                        Write a Review
                      </a>
                    </td>
                  </tr>
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
 * Generate delivery confirmation email content
 */
export function generateDeliveryConfirmationContent(data: DeliveryData): string {
  const { order, delivery, customer } = data;

  return `
    ${emailComponents.heading.h1('Your order has been delivered!')}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(`Great news! Your order #${order.orderNumber} has been delivered. We hope you love your purchase!`)}

    ${generateDeliveryBox(delivery)}

    ${delivery.proofImageUrl ? `
    ${emailComponents.heading.h3('Delivery Photo')}
    ${emailComponents.image(delivery.proofImageUrl, 'Delivery proof photo', 400)}
    ` : ''}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2('Items Delivered')}

    ${generateDeliveredItems(order.items)}

    ${emailComponents.heading.h3('Delivered To')}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px; background-color: #fafafa; border-radius: 6px;">
          <p style="margin: 0; line-height: 1.6; color: #3f3f46;">
            ${delivery.shippingAddress.name}<br>
            ${delivery.shippingAddress.line1}<br>
            ${delivery.shippingAddress.line2 ? delivery.shippingAddress.line2 + '<br>' : ''}
            ${delivery.shippingAddress.city}, ${delivery.shippingAddress.state} ${delivery.shippingAddress.postalCode}<br>
            ${delivery.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    ${generateReviewPrompt(order.id)}

    ${emailComponents.infoBox(`
      <p style="margin: 0; font-size: 14px;">
        <strong>Didn't receive your package?</strong> If something doesn't look right,
        please <a href="{{store.url}}/support" style="color: #3b82f6; text-decoration: none;">contact our support team</a>
        and we'll help resolve the issue.
      </p>
    `)}

    ${emailComponents.mutedText('Thank you for shopping with us! We appreciate your business.')}
  `;
}

/**
 * Render complete delivery confirmation email
 */
export function renderDeliveryConfirmationEmail(
  data: DeliveryData,
  store?: Partial<StoreConfig>
): { html: string; text: string; subject: string } {
  const content = generateDeliveryConfirmationContent(data);

  const mergeData: Record<string, unknown> = {
    order: data.order,
    delivery: data.delivery,
    customer: data.customer,
  };

  const html = renderEmail(
    content,
    {
      title: `Your Order #${data.order.orderNumber} Has Been Delivered`,
      preheader: `Your order has been delivered! We hope you love your purchase.`,
    },
    mergeData,
    { store }
  );

  const deliveredDate = new Date(data.delivery.deliveredAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const text = `
Your order has been delivered!

Hi ${data.customer.name},

Great news! Your order #${data.order.orderNumber} has been delivered. We hope you love your purchase!

DELIVERY DETAILS:
Delivered on: ${deliveredDate}
${data.delivery.signedBy ? `Signed by: ${data.delivery.signedBy}` : ''}
${data.delivery.deliveredTo ? `Delivered to: ${data.delivery.deliveredTo}` : ''}

ITEMS DELIVERED:
${data.order.items.map(item => `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity}`).join('\n')}

DELIVERED TO:
${data.delivery.shippingAddress.name}
${data.delivery.shippingAddress.line1}
${data.delivery.shippingAddress.line2 ? data.delivery.shippingAddress.line2 + '\n' : ''}${data.delivery.shippingAddress.city}, ${data.delivery.shippingAddress.state} ${data.delivery.shippingAddress.postalCode}
${data.delivery.shippingAddress.country}

HOW WAS YOUR EXPERIENCE?
We'd love to hear your feedback! Write a review at:
{{store.url}}/account/orders/${data.order.id}/review

If something doesn't look right, please contact our support team.

Thank you for shopping with us!
  `.trim();

  return {
    html,
    text,
    subject: `Your Order #${data.order.orderNumber} Has Been Delivered`,
  };
}
