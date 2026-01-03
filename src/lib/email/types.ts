/**
 * Email Service Types
 *
 * Multi-provider email sending abstraction supporting:
 * - SMTP (nodemailer)
 * - SendGrid
 * - Resend
 * - Mailgun
 * - AWS SES
 */

export type EmailProvider = 'smtp' | 'sendgrid' | 'resend' | 'mailgun' | 'ses'

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
  encoding?: 'base64' | 'utf8'
  cid?: string // Content-ID for inline images
}

export interface EmailMessage {
  to: EmailAddress | EmailAddress[]
  from?: EmailAddress
  replyTo?: EmailAddress
  subject: string
  text?: string
  html?: string
  cc?: EmailAddress | EmailAddress[]
  bcc?: EmailAddress | EmailAddress[]
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  tags?: string[]
  metadata?: Record<string, string>
  // Tracking options
  trackOpens?: boolean
  trackClicks?: boolean
  // Campaign attribution
  campaignId?: string
  recipientId?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  provider: EmailProvider
  error?: string
  errorCode?: string
  timestamp: Date
  // Provider-specific response
  raw?: unknown
}

export interface BulkEmailMessage extends Omit<EmailMessage, 'to'> {
  recipients: Array<{
    to: EmailAddress
    substitutions?: Record<string, string>
    metadata?: Record<string, string>
  }>
}

export interface BulkEmailResult {
  success: boolean
  provider: EmailProvider
  totalSent: number
  totalFailed: number
  results: Array<{
    email: string
    success: boolean
    messageId?: string
    error?: string
  }>
  timestamp: Date
}

// Provider configuration interfaces
export interface SmtpConfig {
  host: string
  port: number
  secure?: boolean
  user?: string
  pass?: string
  pool?: boolean
  maxConnections?: number
}

export interface SendGridConfig {
  apiKey: string
  sandboxMode?: boolean
}

export interface ResendConfig {
  apiKey: string
}

export interface MailgunConfig {
  apiKey: string
  domain: string
  region?: 'us' | 'eu'
}

export interface SesConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export type ProviderConfig =
  | { provider: 'smtp'; config: SmtpConfig }
  | { provider: 'sendgrid'; config: SendGridConfig }
  | { provider: 'resend'; config: ResendConfig }
  | { provider: 'mailgun'; config: MailgunConfig }
  | { provider: 'ses'; config: SesConfig }

// Email provider interface that all providers must implement
export interface IEmailProvider {
  readonly name: EmailProvider

  /**
   * Send a single email
   */
  send(message: EmailMessage): Promise<EmailSendResult>

  /**
   * Send bulk emails (if supported by provider)
   */
  sendBulk?(message: BulkEmailMessage): Promise<BulkEmailResult>

  /**
   * Verify provider configuration
   */
  verify(): Promise<boolean>

  /**
   * Close/cleanup connections
   */
  close?(): Promise<void>
}

// Email service configuration
export interface EmailServiceConfig {
  provider: EmailProvider
  defaultFrom: EmailAddress
  defaultReplyTo?: EmailAddress
  // Global tracking settings
  trackOpens?: boolean
  trackClicks?: boolean
  // Webhook URLs for tracking
  trackingDomain?: string
  openTrackingPath?: string
  clickTrackingPath?: string
  // Rate limiting
  rateLimit?: {
    maxPerSecond?: number
    maxPerMinute?: number
    maxPerHour?: number
  }
}

// Webhook event types from providers
export type EmailEventType =
  | 'delivered'
  | 'bounced'
  | 'soft_bounced'
  | 'complained'
  | 'opened'
  | 'clicked'
  | 'unsubscribed'
  | 'dropped'
  | 'deferred'

export interface EmailWebhookEvent {
  type: EmailEventType
  email: string
  messageId?: string
  timestamp: Date
  provider: EmailProvider
  campaignId?: string
  recipientId?: string
  // Event-specific data
  bounceType?: 'hard' | 'soft' | 'blocked'
  bounceReason?: string
  complaintType?: string
  linkUrl?: string
  userAgent?: string
  ipAddress?: string
  raw?: unknown
}

// Template types for email rendering
export interface EmailTemplateData {
  [key: string]: string | number | boolean | null | undefined | EmailTemplateData | EmailTemplateData[]
}

export interface RenderedEmail {
  subject: string
  html: string
  text?: string
}
