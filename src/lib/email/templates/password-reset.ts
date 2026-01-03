/**
 * Password Reset Email Template
 *
 * Sent when a user requests to reset their password.
 * Includes a secure reset link with expiration info.
 */

import { renderEmail, StoreConfig, emailComponents, createEmailBuilder } from './renderer';

export interface PasswordResetData {
  user: {
    name: string;
    email: string;
  };
  resetUrl: string;
  expiresIn?: string; // e.g., "1 hour", "24 hours"
  requestedAt?: Date | string;
  requestIp?: string;
  requestDevice?: string;
}

/**
 * Render password reset email HTML
 */
export function renderPasswordResetEmail(
  data: PasswordResetData,
  store?: Partial<StoreConfig>
): string {
  const userName = data.user.name.split(' ')[0] || 'there';
  const brandColor = store?.brandColor || '#2563eb';
  const expiresIn = data.expiresIn || '1 hour';

  const builder = createEmailBuilder(store);

  // Main heading
  builder.heading('Reset Your Password');

  // Introduction
  builder.paragraph(
    `Hi ${userName}, we received a request to reset the password for your ${store?.name || ''} account associated with ${data.user.email}.`
  );

  // Reset button
  builder.button('Reset Password', data.resetUrl, brandColor);

  // Expiration warning
  builder.warning(
    `This link will expire in <strong>${expiresIn}</strong>. If you don't reset your password within this time, you'll need to request a new link.`
  );

  builder.divider();

  // Security info
  builder.heading('Didn\'t Request This?', 2);

  builder.paragraph(
    'If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.'
  );

  builder.paragraph(
    'However, if you\'re concerned about your account security, we recommend:'
  );

  const securityTips = `
    <ul style="margin: 16px 0; padding-left: 24px; color: #52525b;">
      <li style="margin-bottom: 8px;">Checking your account for any unauthorized activity</li>
      <li style="margin-bottom: 8px;">Enabling two-factor authentication if available</li>
      <li style="margin-bottom: 8px;">Using a unique, strong password for this account</li>
      <li style="margin-bottom: 0;">Contacting our support team if you notice anything suspicious</li>
    </ul>
  `;
  builder.raw(securityTips);

  // Request details if available
  if (data.requestedAt || data.requestIp || data.requestDevice) {
    builder.divider();
    builder.heading('Request Details', 3);

    const details: string[] = [];

    if (data.requestedAt) {
      const date = data.requestedAt instanceof Date
        ? data.requestedAt
        : new Date(data.requestedAt);
      details.push(`<strong>Time:</strong> ${date.toLocaleString()}`);
    }

    if (data.requestDevice) {
      details.push(`<strong>Device:</strong> ${data.requestDevice}`);
    }

    if (data.requestIp) {
      details.push(`<strong>IP Address:</strong> ${data.requestIp}`);
    }

    const detailsHtml = `
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #52525b; line-height: 1.8;">
          ${details.join('<br>')}
        </p>
      </div>
    `;
    builder.raw(detailsHtml);
  }

  builder.divider();

  // Alternative link
  builder.muted(
    'If the button above doesn\'t work, copy and paste this link into your browser:'
  );

  const linkHtml = `
    <div style="background: #f4f4f5; padding: 12px 16px; border-radius: 8px; margin: 12px 0; word-break: break-all;">
      <a href="${data.resetUrl}" style="font-size: 13px; color: ${brandColor}; text-decoration: none;">
        ${data.resetUrl}
      </a>
    </div>
  `;
  builder.raw(linkHtml);

  // Support contact
  builder.muted(
    `Need help? Contact us at ${store?.supportEmail || 'support@example.com'}`
  );

  return builder.render(
    {
      title: 'Reset Your Password',
      preheader: `Reset your ${store?.name || ''} account password. This link expires in ${expiresIn}.`,
    },
    { user: data.user, store },
    { store }
  );
}

/**
 * Get password reset email subject line
 */
export function getPasswordResetSubject(store?: Partial<StoreConfig>): string {
  const storeName = store?.name || 'Your Account';
  return `Reset your ${storeName} password`;
}

/**
 * Password Changed Confirmation Email
 *
 * Sent after a password has been successfully changed.
 */

export interface PasswordChangedData {
  user: {
    name: string;
    email: string;
  };
  changedAt?: Date | string;
  changedIp?: string;
  changedDevice?: string;
  loginUrl?: string;
}

/**
 * Render password changed confirmation email
 */
export function renderPasswordChangedEmail(
  data: PasswordChangedData,
  store?: Partial<StoreConfig>
): string {
  const userName = data.user.name.split(' ')[0] || 'there';
  const brandColor = store?.brandColor || '#2563eb';

  const builder = createEmailBuilder(store);

  // Success heading
  builder.heading('Password Changed Successfully');

  // Confirmation message
  builder.success(
    `Hi ${userName}, your password has been successfully updated.`
  );

  builder.paragraph(
    'You can now use your new password to sign in to your account.'
  );

  // Login button
  if (data.loginUrl) {
    builder.button('Sign In Now', data.loginUrl, brandColor);
  }

  builder.divider();

  // Change details
  if (data.changedAt || data.changedIp || data.changedDevice) {
    builder.heading('Change Details', 3);

    const details: string[] = [];

    if (data.changedAt) {
      const date = data.changedAt instanceof Date
        ? data.changedAt
        : new Date(data.changedAt);
      details.push(`<strong>Time:</strong> ${date.toLocaleString()}`);
    }

    if (data.changedDevice) {
      details.push(`<strong>Device:</strong> ${data.changedDevice}`);
    }

    if (data.changedIp) {
      details.push(`<strong>IP Address:</strong> ${data.changedIp}`);
    }

    const detailsHtml = `
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #52525b; line-height: 1.8;">
          ${details.join('<br>')}
        </p>
      </div>
    `;
    builder.raw(detailsHtml);
  }

  // Security warning
  builder.warning(
    'If you did not make this change, please contact our support team immediately and secure your account.'
  );

  // Support contact
  builder.muted(
    `Questions? Contact us at ${store?.supportEmail || 'support@example.com'}`
  );

  return builder.render(
    {
      title: 'Password Changed',
      preheader: `Your ${store?.name || 'account'} password has been successfully updated.`,
    },
    { user: data.user, store },
    { store }
  );
}

/**
 * Get password changed email subject line
 */
export function getPasswordChangedSubject(store?: Partial<StoreConfig>): string {
  const storeName = store?.name || 'Your Account';
  return `Your ${storeName} password has been changed`;
}
