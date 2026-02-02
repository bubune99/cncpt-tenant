/**
 * Email Service using Nodemailer
 * Supports: Traditional SMTP, Microsoft 365 OAuth2, and other providers
 */

import nodemailer from 'nodemailer'
import type { BookingEmailData, BookingEmailType } from '@/types/booking'

// ============================================
// CONFIGURATION
// ============================================

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp' // 'smtp', 'outlook', 'gmail'

/**
 * Create transporter based on provider
 */
function createTransporter() {
  // Microsoft 365 / Outlook with OAuth2
  if (EMAIL_PROVIDER === 'outlook' || EMAIL_PROVIDER === 'microsoft') {
    return nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: process.env.OUTLOOK_USER_EMAIL,
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        refreshToken: process.env.OUTLOOK_REFRESH_TOKEN,
        accessToken: process.env.OUTLOOK_ACCESS_TOKEN,
      },
    })
  }

  // Gmail with OAuth2
  if (EMAIL_PROVIDER === 'gmail') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER_EMAIL,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN,
      },
    })
  }

  // Traditional SMTP (default)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const transporter = createTransporter()

const DEFAULT_FROM = process.env.EMAIL_FROM || 'CNCPT Web <noreply@cncpt.io>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const COMPANY_NAME = process.env.COMPANY_NAME || 'CNCPT Web'

// ============================================
// GENERIC EMAIL FUNCTION
// ============================================

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || ADMIN_EMAIL,
    })
    console.log(`[email] Sent to ${options.to}: ${options.subject}`)
    return true
  } catch (error) {
    console.error('[email] Failed to send:', error)
    return false
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function getEmailWrapper(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${COMPANY_NAME}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px;background:#18181b;">
              <h1 style="margin:0;font-size:24px;font-weight:600;color:#ffffff;">${COMPANY_NAME}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
                ${COMPANY_NAME} · <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;">Visit Website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// ============================================
// BOOKING EMAIL TEMPLATES
// ============================================

export function getBookingConfirmationEmail(data: BookingEmailData): { subject: string; html: string } {
  const subject = `Booking Confirmed: ${data.service.name} on ${data.formattedDate}`

  const content = `
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;">Your Booking is Confirmed!</h2>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${data.booking.clientName},
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Your ${data.service.name.toLowerCase()} has been scheduled. We're looking forward to speaking with you!
    </p>

    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Time</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.formattedTime}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Duration</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.service.durationMinutes} minutes</td>
        </tr>
        ${data.meetingLink ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Meeting Link</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;">
            <a href="${data.meetingLink}" style="color:#3b82f6;text-decoration:none;">Join Meeting</a>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Need to make changes? You can reschedule or cancel using the links below:
    </p>

    <div style="text-align:center;margin:0 0 24px;">
      ${data.rescheduleLink ? `<a href="${data.rescheduleLink}" style="display:inline-block;margin:0 8px;padding:12px 24px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Reschedule</a>` : ''}
      ${data.cancellationLink ? `<a href="${data.cancellationLink}" style="display:inline-block;margin:0 8px;padding:12px 24px;background:#ffffff;color:#374151;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;border:1px solid #d1d5db;">Cancel Booking</a>` : ''}
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      Please cancel at least 24 hours in advance if you can't make it.
    </p>
  `

  return {
    subject,
    html: getEmailWrapper(content, `Your ${data.service.name.toLowerCase()} is confirmed for ${data.formattedDate}`),
  }
}

export function getBookingReminderEmail(data: BookingEmailData, hoursUntil: number): { subject: string; html: string } {
  const timeLabel = hoursUntil === 24 ? 'tomorrow' : 'in 1 hour'
  const subject = `Reminder: Your ${data.service.name} is ${timeLabel}`

  const content = `
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;">Reminder: Upcoming Appointment</h2>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${data.booking.clientName},
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      This is a friendly reminder that your ${data.service.name.toLowerCase()} is ${timeLabel}.
    </p>

    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin:0 0 24px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Time</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.formattedTime}</td>
        </tr>
        ${data.meetingLink ? `
        <tr>
          <td colspan="2" style="padding:16px 0 0;">
            <a href="${data.meetingLink}" style="display:block;text-align:center;padding:12px 24px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Join Meeting</a>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      Can't make it? <a href="${data.cancellationLink}" style="color:#3b82f6;text-decoration:none;">Cancel or reschedule</a>
    </p>
  `

  return {
    subject,
    html: getEmailWrapper(content, `Your appointment is ${timeLabel}`),
  }
}

export function getBookingCancelledEmail(data: BookingEmailData, cancelledBy: 'client' | 'admin'): { subject: string; html: string } {
  const subject = `Booking Cancelled: ${data.formattedDate}`

  const content = `
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;">Booking Cancelled</h2>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Hi ${data.booking.clientName},
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      ${cancelledBy === 'client'
        ? 'Your booking has been cancelled as requested.'
        : 'Unfortunately, we need to cancel your booking. We apologize for any inconvenience.'}
    </p>

    <div style="background:#fef2f2;border-radius:8px;padding:24px;margin:0 0 24px;border:1px solid #fecaca;">
      <p style="margin:0;font-size:14px;color:#991b1b;">
        <strong>Cancelled:</strong> ${data.service.name}<br>
        Originally scheduled for ${data.formattedDate} at ${data.formattedTime}
      </p>
    </div>

    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Would you like to schedule a new appointment?
    </p>

    <div style="text-align:center;">
      <a href="${APP_URL}/book" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Book New Appointment</a>
    </div>
  `

  return {
    subject,
    html: getEmailWrapper(content, 'Your booking has been cancelled'),
  }
}

export function getAdminBookingNotificationEmail(data: BookingEmailData): { subject: string; html: string } {
  const subject = `New Booking: ${data.booking.clientName} - ${data.formattedDate}`

  const content = `
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#18181b;">New Booking Received</h2>

    <div style="background:#f0fdf4;border-radius:8px;padding:24px;margin:0 0 24px;border:1px solid #bbf7d0;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Client</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.booking.clientName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Email</td>
          <td style="padding:8px 0;font-size:14px;text-align:right;">
            <a href="mailto:${data.booking.clientEmail}" style="color:#3b82f6;text-decoration:none;">${data.booking.clientEmail}</a>
          </td>
        </tr>
        ${data.booking.clientPhone ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Phone</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;text-align:right;">${data.booking.clientPhone}</td>
        </tr>
        ` : ''}
        ${data.booking.companyName ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Company</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;text-align:right;">${data.booking.companyName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Service</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.service.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Date & Time</td>
          <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:500;text-align:right;">${data.formattedDate} at ${data.formattedTime}</td>
        </tr>
      </table>
    </div>

    ${data.booking.projectType || data.booking.projectDescription ? `
    <div style="background:#f9fafb;border-radius:8px;padding:24px;margin:0 0 24px;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#18181b;">Project Details</h3>
      ${data.booking.projectType ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Type:</strong> ${data.booking.projectType}</p>` : ''}
      ${data.booking.budgetRange ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Budget:</strong> ${data.booking.budgetRange}</p>` : ''}
      ${data.booking.projectDescription ? `<p style="margin:0;font-size:14px;color:#374151;"><strong>Description:</strong> ${data.booking.projectDescription}</p>` : ''}
    </div>
    ` : ''}

    <div style="text-align:center;">
      <a href="${APP_URL}/super-admin/bookings" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View in Dashboard</a>
    </div>
  `

  return {
    subject,
    html: getEmailWrapper(content, `New booking from ${data.booking.clientName}`),
  }
}

// ============================================
// BOOKING EMAIL SENDER
// ============================================

export async function sendBookingEmail(
  type: BookingEmailType,
  data: BookingEmailData
): Promise<boolean> {
  let emailContent: { subject: string; html: string }
  let recipient: string = data.booking.clientEmail

  switch (type) {
    case 'confirmation':
      emailContent = getBookingConfirmationEmail(data)
      break
    case 'reminder_24h':
      emailContent = getBookingReminderEmail(data, 24)
      break
    case 'reminder_1h':
      emailContent = getBookingReminderEmail(data, 1)
      break
    case 'cancelled':
      emailContent = getBookingCancelledEmail(data, data.booking.cancelledBy || 'admin')
      break
    case 'admin_notification':
      emailContent = getAdminBookingNotificationEmail(data)
      recipient = ADMIN_EMAIL
      if (!recipient) {
        console.warn('[email] No admin email configured, skipping admin notification')
        return false
      }
      break
    default:
      console.error(`[email] Unknown email type: ${type}`)
      return false
  }

  return sendEmail({
    to: recipient,
    subject: emailContent.subject,
    html: emailContent.html,
  })
}

// ============================================
// VERIFY SMTP CONNECTION
// ============================================

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log('[email] SMTP connection verified')
    return true
  } catch (error) {
    console.error('[email] SMTP connection failed:', error)
    return false
  }
}
