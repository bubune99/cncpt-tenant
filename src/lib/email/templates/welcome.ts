/**
 * Welcome Email Template
 *
 * Sent to new customers after account creation or first purchase.
 * Introduces the brand and provides helpful onboarding information.
 */

import { renderEmail, StoreConfig, emailComponents, createEmailBuilder } from './renderer';

export interface WelcomeEmailData {
  customer: {
    name: string;
    firstName?: string;
    email: string;
  };
  isNewAccount?: boolean;
  verificationUrl?: string;
  shopUrl?: string;
  featuredProducts?: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    url: string;
  }>;
  discountCode?: string;
  discountPercent?: number;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

/**
 * Generate featured products section
 */
function generateFeaturedProducts(
  products: WelcomeEmailData['featuredProducts'],
  currency = 'USD'
): string {
  if (!products || products.length === 0) return '';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const productCards = products.slice(0, 3).map(product => `
    <td width="33%" valign="top" style="padding: 0 8px;">
      <a href="${product.url}" style="text-decoration: none; color: inherit; display: block;">
        ${product.imageUrl ? `
        <img src="${product.imageUrl}" alt="${product.name}" width="100%" height="150" style="border-radius: 8px; object-fit: cover; margin-bottom: 12px;">
        ` : `
        <div style="width: 100%; height: 150px; background: #f4f4f5; border-radius: 8px; margin-bottom: 12px;"></div>
        `}
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b; font-size: 14px;">${product.name}</p>
        <p style="margin: 0; color: #71717a; font-size: 14px;">${formatPrice(product.price)}</p>
      </a>
    </td>
  `).join('');

  return `
    <div style="margin: 32px 0;">
      ${emailComponents.heading.h2('Shop Our Favorites')}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          ${productCards}
        </tr>
      </table>
    </div>
  `;
}

/**
 * Generate discount section
 */
function generateDiscountSection(
  code: string,
  percent: number,
  brandColor = '#2563eb'
): string {
  return `
    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}08 100%); border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Welcome Gift</p>
      <p style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: ${brandColor};">${percent}% OFF</p>
      <p style="margin: 0 0 8px 0; color: #52525b;">Your first order</p>
      <div style="display: inline-block; padding: 12px 24px; background: #ffffff; border: 2px dashed ${brandColor}; border-radius: 8px; margin-top: 16px;">
        <code style="font-size: 18px; font-weight: 700; color: #18181b; letter-spacing: 2px;">${code}</code>
      </div>
    </div>
  `;
}

/**
 * Render welcome email HTML
 */
export function renderWelcomeEmail(
  data: WelcomeEmailData,
  store?: Partial<StoreConfig>
): string {
  const customerName = data.customer.firstName || data.customer.name.split(' ')[0] || 'there';
  const brandColor = store?.brandColor || '#2563eb';

  const builder = createEmailBuilder(store);

  // Welcome heading
  builder.heading(`Welcome, ${customerName}!`);

  // Welcome message
  if (data.isNewAccount) {
    builder.paragraph(
      `Thank you for creating an account with ${store?.name || 'us'}! We're thrilled to have you as part of our community.`
    );
  } else {
    builder.paragraph(
      `Thank you for your first purchase! We're so excited to have you as a customer and can't wait for you to enjoy your order.`
    );
  }

  // Account verification if needed
  if (data.verificationUrl) {
    builder.paragraph(
      'Please verify your email address to complete your account setup and unlock all features:'
    );
    builder.button('Verify Email Address', data.verificationUrl, brandColor);
  }

  builder.divider();

  // What's next section
  builder.heading('What\'s Next?', 2);

  const nextSteps = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: ${brandColor}15; border-radius: 50%; text-align: center; line-height: 40px;">
                  <span style="font-size: 20px;">1</span>
                </div>
              </td>
              <td valign="middle" style="padding-left: 16px;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b;">Explore Our Collection</p>
                <p style="margin: 0; color: #71717a; font-size: 14px;">Discover products curated just for you</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: ${brandColor}15; border-radius: 50%; text-align: center; line-height: 40px;">
                  <span style="font-size: 20px;">2</span>
                </div>
              </td>
              <td valign="middle" style="padding-left: 16px;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b;">Join Our Community</p>
                <p style="margin: 0; color: #71717a; font-size: 14px;">Follow us on social media for exclusive updates</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: ${brandColor}15; border-radius: 50%; text-align: center; line-height: 40px;">
                  <span style="font-size: 20px;">3</span>
                </div>
              </td>
              <td valign="middle" style="padding-left: 16px;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #18181b;">Earn Rewards</p>
                <p style="margin: 0; color: #71717a; font-size: 14px;">Get points on every purchase and unlock exclusive perks</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  builder.raw(nextSteps);

  // Discount code section
  if (data.discountCode && data.discountPercent) {
    builder.raw(generateDiscountSection(data.discountCode, data.discountPercent, brandColor));
  }

  // Featured products
  if (data.featuredProducts && data.featuredProducts.length > 0) {
    builder.raw(generateFeaturedProducts(data.featuredProducts));
  }

  builder.divider();

  // Shop button
  if (data.shopUrl) {
    builder.button('Start Shopping', data.shopUrl, brandColor);
  }

  // Support info
  builder.muted(
    `Questions? We're here to help! Reply to this email or reach us at ${store?.supportEmail || 'support@example.com'}.`
  );

  return builder.render(
    {
      title: `Welcome to ${store?.name || 'Our Store'}`,
      preheader: `Welcome to ${store?.name || 'Our Store'}! ${data.discountCode ? `Use code ${data.discountCode} for ${data.discountPercent}% off.` : 'Your journey starts here.'}`,
    },
    { customer: data.customer, store },
    { store }
  );
}

/**
 * Get welcome email subject line
 */
export function getWelcomeSubject(
  data: WelcomeEmailData,
  store?: Partial<StoreConfig>
): string {
  const storeName = store?.name || 'Our Store';

  if (data.discountCode && data.discountPercent) {
    return `Welcome to ${storeName}! Here's ${data.discountPercent}% off your first order`;
  }

  if (data.isNewAccount) {
    return `Welcome to ${storeName} - Let's get started!`;
  }

  return `Welcome to the ${storeName} family!`;
}
