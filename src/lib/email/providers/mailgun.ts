/**
 * Mailgun Email Provider
 *
 * Uses Mailgun API for email delivery
 */

import type {
  IEmailProvider,
  EmailMessage,
  EmailSendResult,
  BulkEmailMessage,
  BulkEmailResult,
  MailgunConfig,
  EmailAddress,
} from '../types'

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string {
  const arr = Array.isArray(addrs) ? addrs : [addrs]
  return arr.map(formatAddress).join(', ')
}

export class MailgunProvider implements IEmailProvider {
  readonly name = 'mailgun' as const
  private config: MailgunConfig
  private baseUrl: string

  constructor(config: MailgunConfig) {
    this.config = config
    this.baseUrl =
      config.region === 'eu'
        ? `https://api.eu.mailgun.net/v3/${config.domain}`
        : `https://api.mailgun.net/v3/${config.domain}`
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`api:${this.config.apiKey}`).toString('base64')
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.from) {
      return {
        success: false,
        provider: 'mailgun',
        error: 'From address is required',
        timestamp: new Date(),
      }
    }

    try {
      const formData = new FormData()
      formData.append('from', formatAddress(message.from))
      formData.append('to', formatAddresses(message.to))
      formData.append('subject', message.subject)

      if (message.text) {
        formData.append('text', message.text)
      }
      if (message.html) {
        formData.append('html', message.html)
      }
      if (message.cc) {
        formData.append('cc', formatAddresses(message.cc))
      }
      if (message.bcc) {
        formData.append('bcc', formatAddresses(message.bcc))
      }
      if (message.replyTo) {
        formData.append('h:Reply-To', formatAddress(message.replyTo))
      }

      // Add custom headers
      if (message.headers) {
        for (const [key, value] of Object.entries(message.headers)) {
          formData.append(`h:${key}`, value)
        }
      }

      // Add tags
      if (message.tags) {
        for (const tag of message.tags) {
          formData.append('o:tag', tag)
        }
      }

      // Tracking options
      formData.append('o:tracking', 'yes')
      formData.append('o:tracking-clicks', message.trackClicks !== false ? 'yes' : 'no')
      formData.append('o:tracking-opens', message.trackOpens !== false ? 'yes' : 'no')

      // Campaign attribution
      if (message.campaignId) {
        formData.append('v:campaign_id', message.campaignId)
      }
      if (message.recipientId) {
        formData.append('v:recipient_id', message.recipientId)
      }

      // Add metadata as custom variables
      if (message.metadata) {
        for (const [key, value] of Object.entries(message.metadata)) {
          formData.append(`v:${key}`, value)
        }
      }

      // Add attachments
      if (message.attachments) {
        for (const att of message.attachments) {
          let content: string
          if (typeof att.content === 'string') {
            content = att.content
          } else {
            content = att.content.toString('base64')
          }
          // Use base64 encoded content directly
          const blob = new Blob([Buffer.from(content, 'base64')], { type: att.contentType || 'application/octet-stream' })
          if (att.cid) {
            formData.append('inline', blob, att.filename)
          } else {
            formData.append('attachment', blob, att.filename)
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          provider: 'mailgun',
          error: result.message || `Mailgun API error: ${response.status}`,
          errorCode: response.status.toString(),
          timestamp: new Date(),
          raw: result,
        }
      }

      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun',
        timestamp: new Date(),
        raw: result,
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'mailgun',
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
        provider: 'mailgun',
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
      // Mailgun supports batch sending with recipient variables
      // Maximum 1000 recipients per batch
      const batchSize = 1000
      const allResults: BulkEmailResult['results'] = []
      let totalSent = 0
      let totalFailed = 0

      for (let i = 0; i < message.recipients.length; i += batchSize) {
        const batch = message.recipients.slice(i, i + batchSize)

        const formData = new FormData()
        formData.append('from', formatAddress(message.from))
        formData.append('to', batch.map((r) => formatAddress(r.to)).join(', '))
        formData.append('subject', message.subject)

        if (message.text) {
          formData.append('text', message.text)
        }
        if (message.html) {
          formData.append('html', message.html)
        }
        if (message.replyTo) {
          formData.append('h:Reply-To', formatAddress(message.replyTo))
        }

        // Tracking
        formData.append('o:tracking', 'yes')
        formData.append('o:tracking-clicks', message.trackClicks !== false ? 'yes' : 'no')
        formData.append('o:tracking-opens', message.trackOpens !== false ? 'yes' : 'no')

        // Add recipient variables for substitutions
        const recipientVariables: Record<string, Record<string, string>> = {}
        for (const recipient of batch) {
          recipientVariables[recipient.to.email] = {
            ...recipient.substitutions,
            ...recipient.metadata,
          }
        }
        formData.append('recipient-variables', JSON.stringify(recipientVariables))

        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            Authorization: this.getAuthHeader(),
          },
          body: formData,
        })

        const result = await response.json()

        if (response.ok) {
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: true,
              messageId: result.id,
            })
            totalSent++
          }
        } else {
          for (const recipient of batch) {
            allResults.push({
              email: recipient.to.email,
              success: false,
              error: result.message || `Mailgun API error: ${response.status}`,
            })
            totalFailed++
          }
        }
      }

      return {
        success: totalFailed === 0,
        provider: 'mailgun',
        totalSent,
        totalFailed,
        results: allResults,
        timestamp: new Date(),
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'mailgun',
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
      const response = await fetch(`${this.baseUrl}`, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
