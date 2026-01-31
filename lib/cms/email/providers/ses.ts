/**
 * AWS SES Email Provider
 *
 * Uses AWS SES API for email delivery
 */

import type {
  IEmailProvider,
  EmailMessage,
  EmailSendResult,
  BulkEmailMessage,
  BulkEmailResult,
  SesConfig,
  EmailAddress,
} from '../types'

// Simple AWS4 signature for SES
// In production, you'd use @aws-sdk/client-ses
async function signRequest(
  config: SesConfig,
  method: string,
  url: string,
  body: string,
  headers: Record<string, string>
): Promise<Record<string, string>> {
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const host = new URL(url).host
  const service = 'ses'

  // Create canonical request
  const signedHeaders = 'content-type;host;x-amz-date'
  const canonicalHeaders = `content-type:${headers['Content-Type']}\nhost:${host}\nx-amz-date:${amzDate}\n`

  const encoder = new TextEncoder()
  const payloadHash = await crypto.subtle.digest('SHA-256', encoder.encode(body))
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const canonicalRequest = `${method}\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`

  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`

  // Calculate signature
  async function hmac(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
    const keyData = typeof key === 'string' ? encoder.encode(key) : key
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }

  const kDate = await hmac(`AWS4${config.secretAccessKey}`, dateStamp)
  const kRegion = await hmac(kDate, config.region)
  const kService = await hmac(kRegion, service)
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = await hmac(kSigning, stringToSign)
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`

  return {
    ...headers,
    'X-Amz-Date': amzDate,
    Authorization: authorizationHeader,
  }
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string[] {
  const arr = Array.isArray(addrs) ? addrs : [addrs]
  return arr.map(formatAddress)
}

export class SesProvider implements IEmailProvider {
  readonly name = 'ses' as const
  private config: SesConfig
  private endpoint: string

  constructor(config: SesConfig) {
    this.config = config
    this.endpoint = `https://email.${config.region}.amazonaws.com`
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.from) {
      return {
        success: false,
        provider: 'ses',
        error: 'From address is required',
        timestamp: new Date(),
      }
    }

    try {
      // Build the SES SendEmail parameters
      const params = new URLSearchParams()
      params.append('Action', 'SendEmail')
      params.append('Version', '2010-12-01')
      params.append('Source', formatAddress(message.from))

      // To addresses
      const toAddrs = Array.isArray(message.to) ? message.to : [message.to]
      toAddrs.forEach((addr, i) => {
        params.append(`Destination.ToAddresses.member.${i + 1}`, formatAddress(addr))
      })

      // CC addresses
      if (message.cc) {
        const ccAddrs = Array.isArray(message.cc) ? message.cc : [message.cc]
        ccAddrs.forEach((addr, i) => {
          params.append(`Destination.CcAddresses.member.${i + 1}`, formatAddress(addr))
        })
      }

      // BCC addresses
      if (message.bcc) {
        const bccAddrs = Array.isArray(message.bcc) ? message.bcc : [message.bcc]
        bccAddrs.forEach((addr, i) => {
          params.append(`Destination.BccAddresses.member.${i + 1}`, formatAddress(addr))
        })
      }

      // Subject
      params.append('Message.Subject.Data', message.subject)
      params.append('Message.Subject.Charset', 'UTF-8')

      // Body
      if (message.text) {
        params.append('Message.Body.Text.Data', message.text)
        params.append('Message.Body.Text.Charset', 'UTF-8')
      }
      if (message.html) {
        params.append('Message.Body.Html.Data', message.html)
        params.append('Message.Body.Html.Charset', 'UTF-8')
      }

      // Reply-To
      if (message.replyTo) {
        params.append('ReplyToAddresses.member.1', formatAddress(message.replyTo))
      }

      // Tags for tracking
      let tagIndex = 1
      if (message.campaignId) {
        params.append(`Tags.member.${tagIndex}.Name`, 'campaign_id')
        params.append(`Tags.member.${tagIndex}.Value`, message.campaignId)
        tagIndex++
      }
      if (message.recipientId) {
        params.append(`Tags.member.${tagIndex}.Name`, 'recipient_id')
        params.append(`Tags.member.${tagIndex}.Value`, message.recipientId)
        tagIndex++
      }
      if (message.tags) {
        for (const tag of message.tags) {
          params.append(`Tags.member.${tagIndex}.Name`, 'tag')
          params.append(`Tags.member.${tagIndex}.Value`, tag)
          tagIndex++
        }
      }

      const body = params.toString()
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      const signedHeaders = await signRequest(this.config, 'POST', this.endpoint, body, headers)

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: signedHeaders,
        body,
      })

      const responseText = await response.text()

      if (!response.ok) {
        // Parse XML error response
        const errorMatch = responseText.match(/<Message>([^<]+)<\/Message>/)
        const errorMessage = errorMatch ? errorMatch[1] : `SES API error: ${response.status}`
        return {
          success: false,
          provider: 'ses',
          error: errorMessage,
          errorCode: response.status.toString(),
          timestamp: new Date(),
          raw: responseText,
        }
      }

      // Parse message ID from response
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/)
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined

      return {
        success: true,
        messageId,
        provider: 'ses',
        timestamp: new Date(),
        raw: responseText,
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'ses',
        error: err.message,
        timestamp: new Date(),
        raw: error,
      }
    }
  }

  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    // SES doesn't have true bulk sending in the simple API
    // For bulk, you'd use SendBulkTemplatedEmail which requires SES templates
    // For now, we send individually
    const results: BulkEmailResult['results'] = []
    let totalSent = 0
    let totalFailed = 0

    for (const recipient of message.recipients) {
      const result = await this.send({
        ...message,
        to: recipient.to,
        metadata: { ...message.metadata, ...recipient.metadata },
      })

      results.push({
        email: recipient.to.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      })

      if (result.success) {
        totalSent++
      } else {
        totalFailed++
      }

      // Basic rate limiting for SES (14 emails/second for sandbox)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return {
      success: totalFailed === 0,
      provider: 'ses',
      totalSent,
      totalFailed,
      results,
      timestamp: new Date(),
    }
  }

  async verify(): Promise<boolean> {
    try {
      const params = new URLSearchParams()
      params.append('Action', 'GetSendQuota')
      params.append('Version', '2010-12-01')

      const body = params.toString()
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      const signedHeaders = await signRequest(this.config, 'POST', this.endpoint, body, headers)

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: signedHeaders,
        body,
      })

      return response.ok
    } catch {
      return false
    }
  }
}
