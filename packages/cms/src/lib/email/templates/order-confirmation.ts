/**
 * Order Confirmation Email Template
 *
 * Sent immediately after a successful order is placed.
 * Includes order details, items, pricing, and shipping info.
 */

import { renderEmail, StoreConfig, emailComponents } from './renderer';

export interface OrderItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderConfirmationData {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date | string;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    discount?: number;
    total: number;
    currency?: string;
    paymentMethod?: string;
    shippingAddress: OrderAddress;
    billingAddress?: OrderAddress;
    shippingMethod?: string;
    estimatedDelivery?: string;
    notes?: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

/**
 * Generate order items table HTML
 */
function generateItemsTable(items: OrderItem[], currency = 'USD'): string {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${item.imageUrl ? `
            <td width="80" valign="top" style="padding-right: 16px;">
              <img src="${item.imageUrl}" alt="${item.name}" width="80" height="80" style="border-radius: 6px; object-fit: cover;">
            </td>
            ` : ''}
            <td valign="top">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b;">${item.name}</p>
              ${item.variant ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #71717a;">${item.variant}</p>` : ''}
              <p style="margin: 0; font-size: 14px; color: #71717a;">Qty: ${item.quantity}</p>
            </td>
            <td width="100" valign="top" align="right">
              <p style="margin: 0; font-weight: 600; color: #18181b;">${formatPrice(item.price * item.quantity)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      ${itemRows}
    </table>
  `;
}

/**
 * Generate order totals section
 */
function generateTotals(order: OrderConfirmationData['order']): string {
  const currency = order.currency || 'USD';
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #71717a;">Subtotal</td>
        <td align="right" style="padding: 8px 0; color: #3f3f46;">${formatPrice(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #71717a;">Shipping</td>
        <td align="right" style="padding: 8px 0; color: #3f3f46;">${order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #71717a;">Tax</td>
        <td align="right" style="padding: 8px 0; color: #3f3f46;">${formatPrice(order.tax)}</td>
      </tr>
      ${order.discount ? `
      <tr>
        <td style="padding: 8px 0; color: #22c55e;">Discount</td>
        <td align="right" style="padding: 8px 0; color: #22c55e;">-${formatPrice(order.discount)}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 16px 0 8px 0; border-top: 2px solid #e4e4e7; font-weight: 700; font-size: 18px; color: #18181b;">Total</td>
        <td align="right" style="padding: 16px 0 8px 0; border-top: 2px solid #e4e4e7; font-weight: 700; font-size: 18px; color: #18181b;">${formatPrice(order.total)}</td>
      </tr>
    </table>
  `;
}

/**
 * Generate address block
 */
function generateAddressBlock(title: string, address: OrderAddress): string {
  return `
    <div style="padding: 16px; background-color: #fafafa; border-radius: 6px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #18181b;">${title}</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
        ${address.name}<br>
        ${address.line1}<br>
        ${address.line2 ? address.line2 + '<br>' : ''}
        ${address.city}, ${address.state} ${address.postalCode}<br>
        ${address.country}
      </p>
    </div>
  `;
}

/**
 * Generate order confirmation email content
 */
export function generateOrderConfirmationContent(data: OrderConfirmationData): string {
  const { order, customer } = data;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    ${emailComponents.heading.h1('Thank you for your order!')}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(`We've received your order and it's being processed. You'll receive another email when your order ships.`)}

    ${emailComponents.successBox(`
      <p style="margin: 0; font-weight: 600;">Order #${order.orderNumber}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #71717a;">Placed on ${orderDate}</p>
    `)}

    ${emailComponents.button('View Order', `{{store.url}}/account/orders/${order.id}`)}

    ${emailComponents.heading.h2('Order Details')}

    ${generateItemsTable(order.items, order.currency)}

    ${generateTotals(order)}

    ${emailComponents.divider()}

    ${emailComponents.heading.h2('Shipping Information')}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td class="stack-column" width="50%" valign="top" style="padding-right: 10px; padding-bottom: 16px;">
          ${generateAddressBlock('Shipping Address', order.shippingAddress)}
        </td>
        ${order.billingAddress ? `
        <td class="stack-column" width="50%" valign="top" style="padding-left: 10px; padding-bottom: 16px;">
          ${generateAddressBlock('Billing Address', order.billingAddress)}
        </td>
        ` : ''}
      </tr>
    </table>

    ${order.shippingMethod ? `
    ${emailComponents.infoBox(`
      <p style="margin: 0;"><strong>Shipping Method:</strong> ${order.shippingMethod}</p>
      ${order.estimatedDelivery ? `<p style="margin: 4px 0 0 0;"><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>` : ''}
    `)}
    ` : ''}

    ${order.paymentMethod ? `
    ${emailComponents.mutedText(`<strong>Payment Method:</strong> ${order.paymentMethod}`)}
    ` : ''}

    ${order.notes ? `
    ${emailComponents.divider()}
    ${emailComponents.heading.h3('Order Notes')}
    ${emailComponents.paragraph(order.notes)}
    ` : ''}

    ${emailComponents.divider()}

    ${emailComponents.mutedText('If you have any questions about your order, please don\'t hesitate to contact our support team.')}
  `;
}

/**
 * Render complete order confirmation email
 */
export function renderOrderConfirmationEmail(
  data: OrderConfirmationData,
  store?: Partial<StoreConfig>
): { html: string; text: string; subject: string } {
  const content = generateOrderConfirmationContent(data);

  const mergeData: Record<string, unknown> = {
    order: data.order,
    customer: data.customer,
  };

  const html = renderEmail(
    content,
    {
      title: `Order Confirmation #${data.order.orderNumber}`,
      preheader: `Thank you for your order! Your order #${data.order.orderNumber} has been confirmed.`,
    },
    mergeData,
    { store }
  );

  // Generate plain text version
  const text = `
Thank you for your order!

Hi ${data.customer.name},

We've received your order and it's being processed. You'll receive another email when your order ships.

Order #${data.order.orderNumber}
Placed on ${new Date(data.order.createdAt).toLocaleDateString()}

ORDER DETAILS:
${data.order.items.map(item => `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity}`).join('\n')}

Subtotal: ${(data.order.subtotal / 100).toFixed(2)}
Shipping: ${data.order.shipping === 0 ? 'Free' : (data.order.shipping / 100).toFixed(2)}
Tax: ${(data.order.tax / 100).toFixed(2)}
${data.order.discount ? `Discount: -${(data.order.discount / 100).toFixed(2)}` : ''}
Total: ${(data.order.total / 100).toFixed(2)}

SHIPPING ADDRESS:
${data.order.shippingAddress.name}
${data.order.shippingAddress.line1}
${data.order.shippingAddress.line2 ? data.order.shippingAddress.line2 + '\n' : ''}${data.order.shippingAddress.city}, ${data.order.shippingAddress.state} ${data.order.shippingAddress.postalCode}
${data.order.shippingAddress.country}

If you have any questions, please contact our support team.
  `.trim();

  return {
    html,
    text,
    subject: `Order Confirmation #${data.order.orderNumber}`,
  };
}
