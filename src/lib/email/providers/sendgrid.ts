/**
 * SendGrid Email Provider
 *
 * Uses SendGrid API for email delivery
 */

import type {
  IEmailProvider,
  EmailMessage,
  EmailSendResult,
  BulkEmailMessage,
  BulkEmailResult,
  SendGridConfig,
  EmailAddress,
} from '../types'

interface SendGridMailContent {
  type: string
  value: string
}

interface SendGridPersonalization {
  to: Array<{ email: string; name?: string }>
  cc?: Array<{ email: string; name?: string }>
  bcc?: Array<{ email: string; name?: string }>
  subject?: string
  substitutions?: Record<string, string>
  custom_args?: Record<string, string>
}

interface SendGridMailRequest {
  personalizations: SendGridPersonalization[]
  from: { email: string; name?: string }
  reply_to?: { email: string; name?: string }
  subject: string
  content: SendGridMailContent[]
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: string
    content_id?: string
  }>
  headers?: Record<string, string>
  categories?: string[]
  custom_args?: Record<string, string>
  mail_settings?: {
    sandbox_mode?: { enable: boolean }
  }
  tracking_settings?: {
    click_tracking?: { enable: boolean }
    open_tracking?: { enable: boolean }
  }
}

function toSendGridAddress(addr: EmailAddress): { email: string; name?: string } {
  return { email: addr.email, name: addr.name }
}

function toSendGridAddresses(addrs: EmailAddress | EmailAddress[]): Array<{ email: string; name?: string }> {
  const arr = Array.isArray(addrs) ? addrs : [addrs]
  return arr.map(toSendGridAddress)
}

export class SendGridProvider implements IEmailProvider {
  readonly name = 'sendgrid' as const
  private config: SendGridConfig

  constructor(config: SendGridConfig) {
    this.config = config
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.from) {
      return {
        success: false,
        provider: 'sendgrid',
        error: 'From address is required',
        timestamp: new Date(),
      }
    }

    try {
      const personalization: SendGridPersonalization = {
        to: toSendGridAddresses(message.to),
      }

      if (message.cc) {
        personalization.cc = toSendGridAddresses(message.cc)
      }
      if (message.bcc) {
        personalization.bcc = toSendGridAddresses(message.bcc)
      }
      if (message.metadata) {
        personalization.custom_args = message.metadata
      }

      const content: SendGridMailContent[] = []
      if (message.text) {
        content.push({ type: 'text/plain', value: message.text })
      }
      if (message.html) {
        content.push({ type: 'text/html', value: message.html })
      }

      const request: SendGridMailRequest = {
        personalizations: [personalization],
        from: toSendGridAddress(message.from),
        subject: message.subject,
        content,
      }

      if (message.replyTo) {
        request.reply_to = toSendGridAddress(message.replyTo)
      }

      if (message.headers) {
        request.headers = message.headers
      }

      if (message.tags) {
        request.categories = message.tags
      }

      if (message.attachments) {
        request.attachments = message.attachments.map((att) => ({
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType,
          content_id: att.cid,
        }))
      }

      // Tracking settings
      request.tracking_settings = {
        click_tracking: { enable: message.trackClicks ?? true },
        open_tracking: { enable: message.trackOpens ?? true },
      }

      if (this.config.sandboxMode) {
        request.mail_settings = { sandbox_mode: { enable: true } }
      }

      // Campaign attribution
      if (message.campaignId || message.recipientId) {
        request.custom_args = {
          ...request.custom_args,
          ...(message.campaignId && { campaign_id: message.campaignId }),
          ...(message.recipientId && { recipient_id: message.recipientId }),
        }
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        return {
          success: false,
          provider: 'sendgrid',
          error: `SendGrid API error: ${response.status} - ${errorBody}`,
          errorCode: response.status.toString(),
          timestamp: new Date(),
        }
      }

      const messageId = response.headers.get('x-message-id') || undefined

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
        timestamp: new Date(),
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'sendgrid',
        error: err.message,
        timestamp: new Date(),
        raw: error,
      }
    }
  }

  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    if (!message.from) {
      return {
        success: false,
        provider: 'sendgrid',
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: 'From address is required',
        })),
        timestamp: new Date(),
      }
    }

    try {
      // SendGrid supports up to 1000 personalizations per request
      const batchSize = 1000
      const allResults: BulkEmailResult['results'] = []
      let totalSent = 0
      let totalFailed = 0

      for (let i = 0; i < message.recipients.length; i += batchSize) {
        const batch = message.recipients.slice(i, i + batchSize)

        const personalizations: SendGridPersonalization[] = batch.map((recipient) => ({
          to: [toSendGridAddress(recipient.to)],
          substitutions: recipient.substitutions,
          custom_args: recipient.metadata,
        }))

        const content: SendGridMailContent[] = []
        if (message.text) {
          content.push({ type: 'text/plain', value: message.text })
        }
        if (message.html) {
          content.push({ type: 'text/html', value: message.html })
        }

        const request: SendGridMailRequest = {
          personalizations,
          from: toSendGridAddress(message.from),
          subject: message.subject,
          content,
          tracking_settings: {
            click_tracking: { enable: message.trackClicks ?? true },
            open_tracking: { enable: message.trackOpens ?? true },
          },
        }

        if (message.replyTo) {
          request.reply_to = toSendGridAddress(message.replyTo)
        }

        if (this.config.sandboxMode) {
          request.mail_settings = { sandbox_mode: { enable: true } }
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (response.ok) {
          const messageId = response.headers.get('x-message-id') || undefined
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: true,
              messageId,
            })
            totalSent++
          }
        } else {
          const errorBody = await response.text()
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: false,
              error: `SendGrid API error: ${response.status} - ${errorBody}`,
            })
            totalFailed++
          }
        }
      }

      return {
        success: totalFailed === 0,
        provider: 'sendgrid',
        totalSent,
        totalFailed,
        results: allResults,
        timestamp: new Date(),
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'sendgrid',
        totalSent: 0,
        totalFailed: message.recipients.length,
        results: message.recipients.map((r) => ({
          email: r.to.email,
          success: false,
          error: err.message,
        })),
        timestamp: new Date(),
      }
    }
  }

  async verify(): Promise<boolean> {
    try {
      // Verify by checking API key validity
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
