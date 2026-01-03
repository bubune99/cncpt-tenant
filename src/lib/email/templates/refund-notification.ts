/**
 * Refund Notification Email Template
 *
 * Sent when a refund has been processed for an order.
 * Includes refund details and timeline.
 */

import { renderEmail, StoreConfig, emailComponents } from './renderer';
import { OrderItem } from './order-confirmation';

export interface RefundData {
  order: {
    id: string;
    orderNumber: string;
    items: OrderItem[];
    total: number;
    currency?: string;
  };
  refund: {
    id: string;
    amount: number;
    reason?: string;
    type: 'full' | 'partial';
    refundedItems?: OrderItem[];
    processedAt: Date | string;
    estimatedArrival?: string;
    paymentMethod?: string;
    lastFourDigits?: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

/**
 * Generate refund summary box
 */
function generateRefundBox(refund: RefundData['refund'], currency = 'USD'): string {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const processedDate = new Date(refund.processedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  ✓ Refund Processed
                </p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #166534;">${formatPrice(refund.amount)}</p>
                <p style="margin: 0; font-size: 14px; color: #71717a;">${refund.type === 'full' ? 'Full Refund' : 'Partial Refund'}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" style="padding: 8px 0;">
                      <p style="margin: 0 0 2px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Processed</p>
                      <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3f3f46;">${processedDate}</p>
                    </td>
                    <td width="50%" style="padding: 8px 0;">
                      <p style="margin: 0 0 2px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Refund To</p>
                      <p style="margin: 0; font-size: 14px; font-weight: 500; color: #3f3f46;">
                        ${refund.paymentMethod || 'Original payment method'}
                        ${refund.lastFourDigits ? ` •••• ${refund.lastFourDigits}` : ''}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${refund.estimatedArrival ? `
            <tr>
              <td style="padding-top: 16px; border-top: 1px solid #bbf7d0; margin-top: 16px;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">
                  <strong>Estimated arrival:</strong> ${refund.estimatedArrival}
                </p>
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
 * Generate refunded items list
 */
function generateRefundedItems(items: OrderItem[], currency = 'USD'): string {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      ${items.map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
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
                <td width="40" valign="middle" align="center">
                  <p style="margin: 0; font-size: 14px; color: #71717a;">x${item.quantity}</p>
                </td>
                <td width="80" valign="middle" align="right">
                  <p style="margin: 0; font-size: 14px; font-weight: 500; color: #166534;">${formatPrice(item.price * item.quantity)}</p>
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
 * Generate refund timeline
 */
function generateRefundTimeline(): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 20px; background-color: #fafafa; border-radius: 8px;">
          <p style="margin: 0 0 16px 0; font-weight: 600; color: #18181b;">When will I receive my refund?</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="24" valign="top">
                      <div style="width: 20px; height: 20px; background-color: #22c55e; border-radius: 50%; text-align: center; line-height: 20px; color: white; font-size: 12px;">✓</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; font-size: 14px; color: #3f3f46;"><strong>Refund initiated</strong> - We've started processing your refund</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="24" valign="top">
                      <div style="width: 20px; height: 20px; background-color: #d4d4d8; border-radius: 50%; text-align: center; line-height: 20px; color: white; font-size: 12px;">2</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; font-size: 14px; color: #71717a;"><strong>Bank processing</strong> - Your bank will process the refund (1-3 business days)</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="24" valign="top">
                      <div style="width: 20px; height: 20px; background-color: #d4d4d8; border-radius: 50%; text-align: center; line-height: 20px; color: white; font-size: 12px;">3</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; font-size: 14px; color: #71717a;"><strong>Funds returned</strong> - The refund will appear on your statement (3-10 business days)</p>
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
 * Generate refund notification email content
 */
export function generateRefundNotificationContent(data: RefundData): string {
  const { order, refund, customer } = data;
  const currency = order.currency || 'USD';
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  return `
    ${emailComponents.heading.h1('Your refund has been processed')}

    ${emailComponents.paragraph(`Hi ${customer.name},`)}

    ${emailComponents.paragraph(
      refund.type === 'full'
        ? `We've processed a full refund of ${formatPrice(refund.amount)} for your order #${order.orderNumber}.`
        : `We've processed a partial refund of ${formatPrice(refund.amount)} for your order #${order.orderNumber}.`
    )}

    ${generateRefundBox(refund, currency)}

    ${refund.reason ? `
    ${emailComponents.infoBox(`
      <p style="margin: 0;"><strong>Refund reason:</strong> ${refund.reason}</p>
    `)}
    ` : ''}

    ${refund.refundedItems && refund.refundedItems.length > 0 ? `
    ${emailComponents.divider()}

    ${emailComponents.heading.h2('Refunded Items')}

    ${generateRefundedItems(refund.refundedItems, currency)}
    ` : ''}

    ${generateRefundTimeline()}

    ${emailComponents.button('View Order Details', `{{store.url}}/account/orders/${order.id}`)}

    ${emailComponents.divider()}

    ${emailComponents.warningBox(`
      <p style="margin: 0; font-size: 14px;">
        <strong>Note:</strong> Refund processing times vary by payment method and bank.
        If you don't see the refund after 10 business days, please
        <a href="{{store.url}}/support" style="color: #d97706; text-decoration: none;">contact our support team</a>.
      </p>
    `)}

    ${emailComponents.mutedText('We\'re sorry to see this order returned. If there\'s anything we could have done better, please let us know.')}
  `;
}

/**
 * Render complete refund notification email
 */
export function renderRefundNotificationEmail(
  data: RefundData,
  store?: Partial<StoreConfig>
): { html: string; text: string; subject: string } {
  const content = generateRefundNotificationContent(data);
  const currency = data.order.currency || 'USD';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const mergeData: Record<string, unknown> = {
    order: data.order,
    refund: data.refund,
    customer: data.customer,
  };

  const html = renderEmail(
    content,
    {
      title: `Refund Processed for Order #${data.order.orderNumber}`,
      preheader: `Your ${formatPrice(data.refund.amount)} refund has been processed and is on its way back to you.`,
    },
    mergeData,
    { store }
  );

  const processedDate = new Date(data.refund.processedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const text = `
Your refund has been processed

Hi ${data.customer.name},

${data.refund.type === 'full'
  ? `We've processed a full refund of ${formatPrice(data.refund.amount)} for your order #${data.order.orderNumber}.`
  : `We've processed a partial refund of ${formatPrice(data.refund.amount)} for your order #${data.order.orderNumber}.`
}

REFUND DETAILS:
Amount: ${formatPrice(data.refund.amount)}
Type: ${data.refund.type === 'full' ? 'Full Refund' : 'Partial Refund'}
Processed: ${processedDate}
Refund to: ${data.refund.paymentMethod || 'Original payment method'}${data.refund.lastFourDigits ? ` •••• ${data.refund.lastFourDigits}` : ''}
${data.refund.estimatedArrival ? `Estimated arrival: ${data.refund.estimatedArrival}` : ''}

${data.refund.reason ? `Reason: ${data.refund.reason}` : ''}

${data.refund.refundedItems && data.refund.refundedItems.length > 0 ? `
REFUNDED ITEMS:
${data.refund.refundedItems.map(item => `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`).join('\n')}
` : ''}

WHEN WILL I RECEIVE MY REFUND?
1. Refund initiated - We've started processing your refund
2. Bank processing - Your bank will process the refund (1-3 business days)
3. Funds returned - The refund will appear on your statement (3-10 business days)

If you don't see the refund after 10 business days, please contact our support team.

View your order: {{store.url}}/account/orders/${data.order.id}
  `.trim();

  return {
    html,
    text,
    subject: `Refund Processed for Order #${data.order.orderNumber}`,
  };
}
