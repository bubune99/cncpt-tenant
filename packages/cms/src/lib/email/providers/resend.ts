/**
 * Resend Email Provider
 *
 * Uses Resend API for email delivery
 */

import type {
  IEmailProvider,
  EmailMessage,
  EmailSendResult,
  BulkEmailMessage,
  BulkEmailResult,
  ResendConfig,
  EmailAddress,
} from '../types'

interface ResendEmailRequest {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  reply_to?: string | string[]
  headers?: Record<string, string>
  attachments?: Array<{
    filename: string
    content: string
  }>
  tags?: Array<{
    name: string
    value: string
  }>
}

interface ResendBatchRequest {
  from: string
  to: string[]
  subject: string
  html?: string
  text?: string
  reply_to?: string
  tags?: Array<{
    name: string
    value: string
  }>
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string[] {
  const arr = Array.isArray(addrs) ? addrs : [addrs]
  return arr.map(formatAddress)
}

export class ResendProvider implements IEmailProvider {
  readonly name = 'resend' as const
  private config: ResendConfig

  constructor(config: ResendConfig) {
    this.config = config
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.from) {
      return {
        success: false,
        provider: 'resend',
        error: 'From address is required',
        timestamp: new Date(),
      }
    }

    try {
      const request: ResendEmailRequest = {
        from: formatAddress(message.from),
        to: formatAddresses(message.to),
        subject: message.subject,
        html: message.html,
        text: message.text,
      }

      if (message.cc) {
        request.cc = formatAddresses(message.cc)
      }
      if (message.bcc) {
        request.bcc = formatAddresses(message.bcc)
      }
      if (message.replyTo) {
        request.reply_to = formatAddress(message.replyTo)
      }
      if (message.headers) {
        request.headers = message.headers
      }

      if (message.attachments) {
        request.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        }))
      }

      // Add tags for tracking
      const tags: Array<{ name: string; value: string }> = []
      if (message.campaignId) {
        tags.push({ name: 'campaign_id', value: message.campaignId })
      }
      if (message.recipientId) {
        tags.push({ name: 'recipient_id', value: message.recipientId })
      }
      if (message.tags) {
        message.tags.forEach((tag) => {
          tags.push({ name: 'tag', value: tag })
        })
      }
      if (tags.length > 0) {
        request.tags = tags
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          provider: 'resend',
          error: result.message || `Resend API error: ${response.status}`,
          errorCode: result.name,
          timestamp: new Date(),
          raw: result,
        }
      }

      return {
        success: true,
        messageId: result.id,
        provider: 'resend',
        timestamp: new Date(),
        raw: result,
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'resend',
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
        provider: 'resend',
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
      // Resend's batch API supports up to 100 emails per request
      const batchSize = 100
      const allResults: BulkEmailResult['results'] = []
      let totalSent = 0
      let totalFailed = 0

      for (let i = 0; i < message.recipients.length; i += batchSize) {
        const batch = message.recipients.slice(i, i + batchSize)

        const batchRequests: ResendBatchRequest[] = batch.map((recipient) => ({
          from: formatAddress(message.from!),
          to: [formatAddress(recipient.to)],
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo ? formatAddress(message.replyTo) : undefined,
          tags: [
            ...(message.campaignId ? [{ name: 'campaign_id', value: message.campaignId }] : []),
            ...(recipient.metadata?.recipientId
              ? [{ name: 'recipient_id', value: recipient.metadata.recipientId }]
              : []),
          ],
        }))

        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchRequests),
        })

        const result = await response.json()

        if (response.ok && Array.isArray(result.data)) {
          for (let j = 0; j < batch.length; j++) {
            const itemResult = result.data[j]
            if (itemResult?.id) {
              allResults.push({
                email: batch[j].to.email,
                success: true,
                messageId: itemResult.id,
              })
              totalSent++
            } else {
              allResults.push({
                email: batch[j].to.email,
                success: false,
                error: itemResult?.message || 'Unknown error',
              })
              totalFailed++
            }
          }
        } else {
          // Batch failed
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: false,
              error: result.message || `Resend API error: ${response.status}`,
            })
            totalFailed++
          }
        }
      }

      return {
        success: totalFailed === 0,
        provider: 'resend',
        totalSent,
        totalFailed,
        results: allResults,
        timestamp: new Date(),
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'resend',
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
      const response = await fetch('https://api.resend.com/domains', {
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
