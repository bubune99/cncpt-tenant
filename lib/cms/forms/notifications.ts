/**
 * Form Notification Service
 *
 * Sends email notifications for form submissions using the email service
 */

import { sendEmail } from '../email';
import { prisma } from '../db';
import { renderEmailTemplate } from '../email/templates/render';

interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}

interface FormNotificationParams {
  formId: string;
  formName: string;
  submissionId: string;
  submissionData: Record<string, unknown>;
  notifyEmails: string[];
  fields: FormField[];
}

/**
 * Send form submission notification emails
 */
export async function sendFormNotification(params: FormNotificationParams): Promise<void> {
  const { formId, formName, submissionId, submissionData, notifyEmails, fields } = params;

  // Try to find a custom template for form notifications
  const customTemplate = await prisma.emailTemplate.findFirst({
    where: {
      OR: [
        { slug: `form-notification-${formId}` },
        { slug: 'form-notification-default' },
      ],
      isActive: true,
    },
    orderBy: { slug: 'asc' }, // Prefer form-specific template
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const submissionUrl = `${appUrl}/admin/forms/${formId}?submission=${submissionId}`;

  // Build field data for display
  const fieldRows = fields
    .map((field) => {
      const value = submissionData[field.id];
      const displayValue = value !== undefined && value !== null ? String(value) : '-';
      return { label: field.label, value: displayValue };
    })
    .filter((row) => row.value !== '-');

  // Build HTML content
  const fieldTableHtml = fieldRows
    .map((row) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 500;">${escapeHtml(row.label)}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(row.value)}</td></tr>`)
    .join('');

  const defaultHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; margin-bottom: 24px;">New Form Submission: ${escapeHtml(formName)}</h2>

      <p style="color: #666; margin-bottom: 16px;">A new submission has been received.</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>
          ${fieldTableHtml}
        </tbody>
      </table>

      <p style="margin-top: 24px;">
        <a href="${submissionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          View Submission
        </a>
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        Submission ID: ${submissionId}<br>
        Received: ${new Date().toLocaleString()}
      </p>
    </div>
  `;

  // Build plain text content
  const fieldText = fieldRows
    .map((row) => `${row.label}: ${row.value}`)
    .join('\n');

  const defaultText = `New Form Submission: ${formName}

A new submission has been received.

${fieldText}

View submission: ${submissionUrl}

Submission ID: ${submissionId}
Received: ${new Date().toLocaleString()}`;

  // If we have a custom template with Puck content, render it
  let html = defaultHtml;
  let text = defaultText;
  let subject = `New Submission: ${formName}`;

  if (customTemplate) {
    if (customTemplate.subject) {
      subject = customTemplate.subject.replace(/\{\{form\.name\}\}/g, formName);
    }

    if (customTemplate.content) {
      // Render Puck template with merge data
      try {
        const rendered = await renderEmailTemplate(customTemplate.id, {
          form: { name: formName, id: formId },
          submission: { id: submissionId, data: submissionData, fields: fieldRows },
          viewUrl: submissionUrl,
        });
        if (rendered.html) html = rendered.html;
        if (rendered.text) text = rendered.text;
      } catch (err) {
        console.error('Error rendering custom form notification template:', err);
        // Fall back to default
      }
    } else if (customTemplate.html) {
      html = customTemplate.html;
    }
  }

  // Send to all notification emails
  const results = await Promise.allSettled(
    notifyEmails.map((email) =>
      sendEmail({
        to: { email },
        subject,
        html,
        text,
        metadata: {
          type: 'form_notification',
          formId,
          submissionId,
        },
      })
    )
  );

  // Log any failures
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(
      `Failed to send ${failures.length}/${notifyEmails.length} form notification emails:`,
      failures.map((f) => (f as PromiseRejectedResult).reason)
    );
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
