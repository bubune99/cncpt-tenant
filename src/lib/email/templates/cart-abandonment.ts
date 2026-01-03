/**
 * Cart Abandonment Email Template
 *
 * Sent to customers who added items to cart but didn't complete checkout.
 * Includes cart items, optional discount, and urgency messaging.
 */

import { renderEmail, StoreConfig, emailComponents, createEmailBuilder } from './renderer';

export interface CartItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  originalPrice?: number; // For showing discounts
  imageUrl?: string;
  url: string;
  inStock?: boolean;
  lowStock?: boolean;
}

export interface CartAbandonmentData {
  customer: {
    name: string;
    firstName?: string;
    email: string;
  };
  cart: {
    id: string;
    items: CartItem[];
    subtotal: number;
    currency?: string;
    recoveryUrl: string;
  };
  // Recovery incentives
  discountCode?: string;
  discountPercent?: number;
  discountAmount?: number; // In cents
  freeShipping?: boolean;
  // Urgency
  expiresIn?: string; // e.g., "24 hours"
  lowStockItems?: number;
  // Email sequence info
  emailNumber?: 1 | 2 | 3; // Which email in the sequence
}

/**
 * Format price for display
 */
function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

/**
 * Generate cart items HTML
 */
function generateCartItems(items: CartItem[], currency = 'USD'): string {
  const itemRows = items.map(item => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const stockWarning = item.lowStock
      ? '<span style="color: #f59e0b; font-size: 12px; font-weight: 600;">Low Stock</span>'
      : item.inStock === false
        ? '<span style="color: #ef4444; font-size: 12px; font-weight: 600;">Sold Out</span>'
        : '';

    return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              ${item.imageUrl ? `
              <td width="80" valign="top" style="padding-right: 16px;">
                <a href="${item.url}">
                  <img src="${item.imageUrl}" alt="${item.name}" width="80" height="80" style="border-radius: 6px; object-fit: cover;">
                </a>
              </td>
              ` : ''}
              <td valign="top">
                <a href="${item.url}" style="text-decoration: none;">
                  <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b;">${item.name}</p>
                </a>
                ${item.variant ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #71717a;">${item.variant}</p>` : ''}
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #71717a;">Qty: ${item.quantity}</p>
                ${stockWarning}
              </td>
              <td width="100" valign="top" align="right">
                ${hasDiscount ? `
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-decoration: line-through;">${formatPrice(item.originalPrice! * item.quantity, currency)}</p>
                <p style="margin: 0; font-weight: 600; color: #ef4444;">${formatPrice(item.price * item.quantity, currency)}</p>
                ` : `
                <p style="margin: 0; font-weight: 600; color: #18181b;">${formatPrice(item.price * item.quantity, currency)}</p>
                `}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      ${itemRows}
    </table>
  `;
}

/**
 * Generate discount banner HTML
 */
function generateDiscountBanner(
  data: CartAbandonmentData,
  brandColor = '#2563eb'
): string {
  const parts: string[] = [];

  if (data.discountPercent) {
    parts.push(`<strong>${data.discountPercent}% OFF</strong>`);
  } else if (data.discountAmount) {
    parts.push(`<strong>${formatPrice(data.discountAmount, data.cart.currency)}</strong> off`);
  }

  if (data.freeShipping) {
    if (parts.length > 0) {
      parts.push(' + ');
    }
    parts.push('<strong>FREE SHIPPING</strong>');
  }

  if (parts.length === 0) return '';

  const codeSection = data.discountCode ? `
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #ffffff90;">
      Use code: <span style="font-weight: 700; letter-spacing: 2px;">${data.discountCode}</span>
    </p>
  ` : '';

  return `
    <div style="background: ${brandColor}; padding: 20px 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; font-size: 24px; color: #ffffff;">
        ${parts.join('')}
      </p>
      ${codeSection}
    </div>
  `;
}

/**
 * Get subject line based on email sequence number
 */
function getSubjectForSequence(
  data: CartAbandonmentData,
  store?: Partial<StoreConfig>
): string {
  const itemCount = data.cart.items.length;
  const itemWord = itemCount === 1 ? 'item' : 'items';

  switch (data.emailNumber) {
    case 1:
      return `Did you forget something? Your cart is waiting`;
    case 2:
      if (data.discountCode) {
        return `Still thinking? Here's ${data.discountPercent || ''}% off to help you decide`;
      }
      return `Your cart misses you! Complete your order today`;
    case 3:
      if (data.lowStockItems) {
        return `Last chance! Your ${itemWord} may sell out soon`;
      }
      return `Final reminder: Your cart will expire soon`;
    default:
      return `You left ${itemCount} ${itemWord} in your cart`;
  }
}

/**
 * Render cart abandonment email HTML
 */
export function renderCartAbandonmentEmail(
  data: CartAbandonmentData,
  store?: Partial<StoreConfig>
): string {
  const customerName = data.customer.firstName || data.customer.name.split(' ')[0] || 'there';
  const brandColor = store?.brandColor || '#2563eb';
  const currency = data.cart.currency || 'USD';
  const itemCount = data.cart.items.length;
  const itemWord = itemCount === 1 ? 'item' : 'items';

  const builder = createEmailBuilder(store);

  // Personalized greeting
  builder.heading(`Hi ${customerName}, you left something behind!`);

  // Opening message varies by sequence
  switch (data.emailNumber) {
    case 1:
      builder.paragraph(
        `We noticed you were browsing our store and added some great ${itemWord} to your cart. Don't worry, we've saved them for you!`
      );
      break;
    case 2:
      builder.paragraph(
        `Your cart is still waiting! We wanted to remind you about the ${itemWord} you selected. They're popular choices, and we'd hate for you to miss out.`
      );
      break;
    case 3:
      builder.paragraph(
        `This is your final reminder about your cart. Some items may be running low on stock, so we wanted to give you one last chance to complete your order.`
      );
      break;
    default:
      builder.paragraph(
        `You have ${itemCount} ${itemWord} waiting in your cart. Complete your order and we'll get them shipped to you right away!`
      );
  }

  // Urgency messaging
  if (data.lowStockItems && data.lowStockItems > 0) {
    builder.warning(
      `<strong>Stock Alert:</strong> ${data.lowStockItems} ${data.lowStockItems === 1 ? 'item in your cart is' : 'items in your cart are'} running low on stock!`
    );
  }

  if (data.expiresIn) {
    builder.info(
      `Your cart will expire in <strong>${data.expiresIn}</strong>. Complete your purchase before it's too late!`
    );
  }

  // Discount banner
  if (data.discountCode || data.freeShipping) {
    builder.raw(generateDiscountBanner(data, brandColor));
  }

  // Cart items
  builder.heading('Your Cart', 2);
  builder.raw(generateCartItems(data.cart.items, currency));

  // Subtotal
  const totalHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px 0; border-top: 2px solid #18181b;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #18181b;">Subtotal</p>
              </td>
              <td align="right">
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #18181b;">${formatPrice(data.cart.subtotal, currency)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  builder.raw(totalHtml);

  // Complete purchase button
  builder.button('Complete Your Purchase', data.cart.recoveryUrl, brandColor);

  builder.divider();

  // Why shop with us
  builder.heading('Why Shop With Us?', 3);

  const benefits = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="24" valign="top" style="color: #22c55e; font-size: 16px;">&#10003;</td>
              <td style="padding-left: 8px; color: #52525b; font-size: 14px;">Free returns within 30 days</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="24" valign="top" style="color: #22c55e; font-size: 16px;">&#10003;</td>
              <td style="padding-left: 8px; color: #52525b; font-size: 14px;">Secure checkout with SSL encryption</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="24" valign="top" style="color: #22c55e; font-size: 16px;">&#10003;</td>
              <td style="padding-left: 8px; color: #52525b; font-size: 14px;">Fast shipping on all orders</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="24" valign="top" style="color: #22c55e; font-size: 16px;">&#10003;</td>
              <td style="padding-left: 8px; color: #52525b; font-size: 14px;">24/7 customer support</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  builder.raw(benefits);

  builder.divider();

  // Support
  builder.muted(
    `Questions about your order? Reply to this email or contact us at ${store?.supportEmail || 'support@example.com'}.`
  );

  const subject = getSubjectForSequence(data, store);

  return builder.render(
    {
      title: subject,
      preheader: `You have ${itemCount} ${itemWord} waiting in your cart.${data.discountCode ? ` Use code ${data.discountCode} for ${data.discountPercent}% off!` : ''}`,
    },
    { customer: data.customer, cart: data.cart, store },
    { store }
  );
}

/**
 * Get cart abandonment email subject line
 */
export function getCartAbandonmentSubject(
  data: CartAbandonmentData,
  store?: Partial<StoreConfig>
): string {
  return getSubjectForSequence(data, store);
}
