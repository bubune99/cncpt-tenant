/**
 * Email Service
 *
 * Multi-provider email sending abstraction with tracking support
 */

import type {
  EmailProvider,
  IEmailProvider,
  EmailMessage,
  EmailSendResult,
  BulkEmailMessage,
  BulkEmailResult,
  EmailServiceConfig,
  SmtpConfig,
  SendGridConfig,
  ResendConfig,
  MailgunConfig,
  SesConfig,
  EmailAddress,
} from './types'
import { SmtpProvider, SendGridProvider, ResendProvider, MailgunProvider, SesProvider } from './providers'
import { parseMergeTags, type MergeTagData } from './merge-tags'
import { getEmailSettings, type EmailSettings } from '@/lib/settings'

export * from './types'
export * from './merge-tags'
export * from './tracking'
export * from './webhooks'
export * from './subscriptions'
export * from './queue'

// Singleton provider instance
let providerInstance: IEmailProvider | null = null
let currentProviderName: EmailProvider | null = null

/**
 * Create a provider instance based on configuration
 */
function createProvider(settings: EmailSettings): IEmailProvider {
  switch (settings.provider) {
    case 'smtp':
      return new SmtpProvider({
        host: settings.smtpHost!,
        port: settings.smtpPort!,
        secure: settings.smtpSecure,
        user: settings.smtpUser,
        pass: settings.smtpPass,
      })

    case 'sendgrid':
      return new SendGridProvider({
        apiKey: settings.sendgridApiKey!,
      })

    case 'resend':
      return new ResendProvider({
        apiKey: settings.resendApiKey!,
      })

    case 'mailgun':
      return new MailgunProvider({
        apiKey: settings.mailgunApiKey!,
        domain: settings.mailgunDomain!,
      })

    case 'ses':
      return new SesProvider({
        region: settings.sesRegion!,
        accessKeyId: settings.sesAccessKeyId!,
        secretAccessKey: settings.sesSecretAccessKey!,
      })

    default:
      throw new Error(`Unknown email provider: ${settings.provider}`)
  }
}

/**
 * Get the email provider instance
 */
async function getProvider(): Promise<IEmailProvider> {
  const settings = await getEmailSettings()

  // If provider changed, recreate instance
  if (currentProviderName !== settings.provider) {
    if (providerInstance?.close) {
      await providerInstance.close()
    }
    providerInstance = null
    currentProviderName = null
  }

  if (!providerInstance) {
    providerInstance = createProvider(settings)
    currentProviderName = settings.provider
  }

  return providerInstance
}

/**
 * Get default from address from settings
 */
async function getDefaultFrom(): Promise<EmailAddress> {
  const settings = await getEmailSettings()
  return {
    email: settings.fromEmail || 'noreply@example.com',
    name: settings.fromName,
  }
}

/**
 * Get default reply-to from settings
 */
async function getDefaultReplyTo(): Promise<EmailAddress | undefined> {
  const settings = await getEmailSettings()
  return settings.replyTo ? { email: settings.replyTo } : undefined
}

/**
 * Email Service Class
 */
export class EmailService {
  private provider: IEmailProvider | null = null
  private config: EmailServiceConfig | null = null

  /**
   * Initialize with explicit configuration (for testing)
   */
  initWithConfig(
    providerType: EmailProvider,
    providerConfig: SmtpConfig | SendGridConfig | ResendConfig | MailgunConfig | SesConfig,
    serviceConfig: Partial<EmailServiceConfig>
  ): void {
    switch (providerType) {
      case 'smtp':
        this.provider = new SmtpProvider(providerConfig as SmtpConfig)
        break
      case 'sendgrid':
        this.provider = new SendGridProvider(providerConfig as SendGridConfig)
        break
      case 'resend':
        this.provider = new ResendProvider(providerConfig as ResendConfig)
        break
      case 'mailgun':
        this.provider = new MailgunProvider(providerConfig as MailgunConfig)
        break
      case 'ses':
        this.provider = new SesProvider(providerConfig as SesConfig)
        break
    }

    this.config = {
      provider: providerType,
      defaultFrom: serviceConfig.defaultFrom || { email: 'noreply@example.com' },
      ...serviceConfig,
    }
  }

  /**
   * Get provider (lazy load from settings if not initialized)
   */
  private async getProvider(): Promise<IEmailProvider> {
    if (this.provider) {
      return this.provider
    }
    return getProvider()
  }

  /**
   * Send a single email
   */
  async send(message: EmailMessage): Promise<EmailSendResult> {
    const provider = await this.getProvider()

    // Apply defaults
    if (!message.from) {
      message.from = this.config?.defaultFrom || (await getDefaultFrom())
    }
    if (!message.replyTo) {
      message.replyTo = this.config?.defaultReplyTo || (await getDefaultReplyTo())
    }

    return provider.send(message)
  }

  /**
   * Send email with merge tags
   */
  async sendWithMergeTags(
    message: Omit<EmailMessage, 'subject' | 'html' | 'text'> & {
      subjectTemplate: string
      htmlTemplate?: string
      textTemplate?: string
    },
    data: MergeTagData
  ): Promise<EmailSendResult> {
    const subject = parseMergeTags(message.subjectTemplate, data)
    const html = message.htmlTemplate ? parseMergeTags(message.htmlTemplate, data) : undefined
    const text = message.textTemplate ? parseMergeTags(message.textTemplate, data) : undefined

    return this.send({
      ...message,
      subject,
      html,
      text,
    })
  }

  /**
   * Send bulk emails
   */
  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    const provider = await this.getProvider()

    // Apply defaults
    if (!message.from) {
      message.from = this.config?.defaultFrom || (await getDefaultFrom())
    }
    if (!message.replyTo) {
      message.replyTo = this.config?.defaultReplyTo || (await getDefaultReplyTo())
    }

    // Use bulk if available, otherwise send individually
    if (provider.sendBulk) {
      return provider.sendBulk(message)
    }

    // Fallback to individual sends
    const results: BulkEmailResult['results'] = []
    let totalSent = 0
    let totalFailed = 0

    for (const recipient of message.recipients) {
      const result = await provider.send({
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
      provider: provider.name,
      totalSent,
      totalFailed,
      results,
      timestamp: new Date(),
    }
  }

  /**
   * Send bulk emails with per-recipient merge tags
   */
  async sendBulkWithMergeTags(
    message: Omit<BulkEmailMessage, 'subject' | 'html' | 'text'> & {
      subjectTemplate: string
      htmlTemplate?: string
      textTemplate?: string
    },
    recipientData: Map<string, MergeTagData>
  ): Promise<BulkEmailResult> {
    const provider = await this.getProvider()

    // Apply defaults
    if (!message.from) {
      message.from = this.config?.defaultFrom || (await getDefaultFrom())
    }

    // For bulk with merge tags, we need to send individually to process templates
    const results: BulkEmailResult['results'] = []
    let totalSent = 0
    let totalFailed = 0

    for (const recipient of message.recipients) {
      const data = recipientData.get(recipient.to.email) || {}

      const subject = parseMergeTags(message.subjectTemplate, data)
      const html = message.htmlTemplate ? parseMergeTags(message.htmlTemplate, data) : undefined
      const text = message.textTemplate ? parseMergeTags(message.textTemplate, data) : undefined

      const result = await provider.send({
        ...message,
        to: recipient.to,
        subject,
        html,
        text,
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
      provider: provider.name,
      totalSent,
      totalFailed,
      results,
      timestamp: new Date(),
    }
  }

  /**
   * Verify provider configuration
   */
  async verify(): Promise<boolean> {
    const provider = await this.getProvider()
    return provider.verify()
  }

  /**
   * Get current provider name
   */
  async getProviderName(): Promise<EmailProvider> {
    const provider = await this.getProvider()
    return provider.name
  }

  /**
   * Close provider connections
   */
  async close(): Promise<void> {
    if (this.provider?.close) {
      await this.provider.close()
    }
    this.provider = null

    // Also close singleton
    if (providerInstance?.close) {
      await providerInstance.close()
    }
    providerInstance = null
    currentProviderName = null
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Convenience functions
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  return emailService.send(message)
}

export async function sendBulkEmail(message: BulkEmailMessage): Promise<BulkEmailResult> {
  return emailService.sendBulk(message)
}

export async function sendEmailWithMergeTags(
  message: Omit<EmailMessage, 'subject' | 'html' | 'text'> & {
    subjectTemplate: string
    htmlTemplate?: string
    textTemplate?: string
  },
  data: MergeTagData
): Promise<EmailSendResult> {
  return emailService.sendWithMergeTags(message, data)
}
