/**
 * SMTP Email Provider
 *
 * Uses nodemailer for SMTP email delivery
 */

import type {
  IEmailProvider,
  EmailMessage,
  EmailSendResult,
  BulkEmailMessage,
  BulkEmailResult,
  SmtpConfig,
  EmailAddress,
} from '../types'

// We'll use dynamic import for nodemailer to avoid issues if not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null

async function getNodemailer() {
  if (!nodemailer) {
    try {
      nodemailer = await import('nodemailer')
    } catch {
      throw new Error('nodemailer is not installed. Run: npm install nodemailer')
    }
  }
  return nodemailer
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email
}

function formatAddresses(addrs: EmailAddress | EmailAddress[]): string {
  const arr = Array.isArray(addrs) ? addrs : [addrs]
  return arr.map(formatAddress).join(', ')
}

export class SmtpProvider implements IEmailProvider {
  readonly name = 'smtp' as const
  private config: SmtpConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transporter: any = null

  constructor(config: SmtpConfig) {
    this.config = config
  }

  private async getTransporter() {
    if (this.transporter) return this.transporter

    const nm = await getNodemailer()
    this.transporter = nm.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure ?? this.config.port === 465,
      auth: this.config.user
        ? {
            user: this.config.user,
            pass: this.config.pass,
          }
        : undefined,
      pool: this.config.pool ?? true,
      maxConnections: this.config.maxConnections ?? 5,
    })

    return this.transporter
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const transporter = await this.getTransporter()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mailOptions: any = {
        from: message.from ? formatAddress(message.from) : undefined,
        to: formatAddresses(message.to),
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo ? formatAddress(message.replyTo) : undefined,
        cc: message.cc ? formatAddresses(message.cc) : undefined,
        bcc: message.bcc ? formatAddresses(message.bcc) : undefined,
        headers: message.headers,
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: att.encoding as BufferEncoding | undefined,
          cid: att.cid,
        })),
      }

      const result = await transporter.sendMail(mailOptions)

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
        timestamp: new Date(),
        raw: result,
      }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        provider: 'smtp',
        error: err.message,
        timestamp: new Date(),
        raw: error,
      }
    }
  }

  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    const results: BulkEmailResult['results'] = []
    let totalSent = 0
    let totalFailed = 0

    // SMTP doesn't support true bulk sending, so we send individually
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
    }

    return {
      success: totalFailed === 0,
      provider: 'smtp',
      totalSent,
      totalFailed,
      results,
      timestamp: new Date(),
    }
  }

  async verify(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter()
      await transporter.verify()
      return true
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close()
      this.transporter = null
    }
  }
}
