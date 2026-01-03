/**
 * Settings Library
 *
 * Centralized settings management with database storage and encryption
 */

import { prisma } from '@/lib/db'
import { encrypt, safeDecrypt, isEncrypted } from '@/lib/encryption'
import type {
  SettingGroup,
  BrandingSettings,
  GeneralSettings,
  EmailSettings,
  StorageSettings,
  AiSettings,
  SecuritySettings,
  EnvVarStatus,
} from './types'
import {
  REQUIRED_ENV_VARS,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_STORAGE_SETTINGS,
  DEFAULT_AI_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from './types'

// Keys that should be encrypted in the database
const SENSITIVE_KEYS: Record<SettingGroup, string[]> = {
  email: ['smtpPass', 'sendgridApiKey', 'resendApiKey', 'mailgunApiKey', 'sesAccessKeyId', 'sesSecretAccessKey'],
  storage: ['accessKeyId', 'secretAccessKey'],
  ai: ['apiKey'],
  payments: ['stripeSecretKey', 'stripeWebhookSecret', 'paypalClientSecret'],
  branding: [],
  general: [],
  store: [],
  shipping: [],
  analytics: [],
  seo: [],
  security: [],
}

// Cache for settings
const settingsCache: Map<SettingGroup, { data: any; timestamp: number }> = new Map()
const CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Get settings for a specific group
 */
export async function getSettings<T>(
  group: SettingGroup,
  defaults: T
): Promise<T> {
  // Check cache
  const cached = settingsCache.get(group)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }

  const records = await prisma.setting.findMany({
    where: { group },
  })

  const settings = { ...defaults } as any
  const sensitiveKeys = SENSITIVE_KEYS[group] || []

  for (const record of records) {
    const key = record.key.replace(`${group}.`, '')
    let value = record.value

    // Decrypt if this is a sensitive key and the value is encrypted
    if (sensitiveKeys.includes(key) && record.encrypted && isEncrypted(value)) {
      value = safeDecrypt(value)
    }

    try {
      // Try to parse JSON values
      settings[key] = JSON.parse(value)
    } catch {
      // Use raw value if not JSON
      settings[key] = value
    }
  }

  // Update cache
  settingsCache.set(group, { data: settings, timestamp: Date.now() })

  return settings as T
}

/**
 * Update settings for a group
 */
export async function updateSettings(
  group: SettingGroup,
  settings: Record<string, any>
): Promise<void> {
  const sensitiveKeys = SENSITIVE_KEYS[group] || []

  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined) continue

    // Skip if value is masked (unchanged)
    if (value === '********') continue

    const fullKey = `${group}.${key}`
    const isSensitive = sensitiveKeys.includes(key)

    // Encrypt sensitive values before storing
    let stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    if (isSensitive && stringValue && stringValue !== '') {
      stringValue = encrypt(stringValue)
    }

    await prisma.setting.upsert({
      where: { key: fullKey },
      create: {
        key: fullKey,
        value: stringValue,
        group,
        encrypted: isSensitive,
      },
      update: {
        value: stringValue,
        encrypted: isSensitive,
      },
    })
  }

  // Clear cache for this group
  settingsCache.delete(group)
}

/**
 * Clear settings cache
 */
export function clearSettingsCache(group?: SettingGroup): void {
  if (group) {
    settingsCache.delete(group)
  } else {
    settingsCache.clear()
  }
}

// Convenience functions for each settings group
export async function getBrandingSettings(): Promise<BrandingSettings> {
  return getSettings('branding', DEFAULT_BRANDING_SETTINGS)
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  return getSettings('general', DEFAULT_GENERAL_SETTINGS)
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const settings = await getSettings('email', DEFAULT_EMAIL_SETTINGS)

  // Fallback to environment variables
  if (!settings.smtpHost) settings.smtpHost = process.env.SMTP_HOST
  if (!settings.smtpPort) settings.smtpPort = parseInt(process.env.SMTP_PORT || '587')
  if (!settings.smtpUser) settings.smtpUser = process.env.SMTP_USER
  if (!settings.smtpPass) settings.smtpPass = process.env.SMTP_PASS
  if (!settings.sendgridApiKey) settings.sendgridApiKey = process.env.SENDGRID_API_KEY
  if (!settings.resendApiKey) settings.resendApiKey = process.env.RESEND_API_KEY

  return settings
}

export async function getStorageSettings(): Promise<StorageSettings> {
  const settings = await getSettings('storage', DEFAULT_STORAGE_SETTINGS)

  // Fallback to environment variables (S3 or R2)
  if (!settings.bucket) settings.bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
  if (!settings.region) settings.region = process.env.S3_REGION || 'auto'
  if (!settings.accessKeyId) settings.accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
  if (!settings.secretAccessKey) settings.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY

  // Build R2 endpoint from account ID if not explicitly set
  if (!settings.endpoint) {
    if (process.env.S3_ENDPOINT) {
      settings.endpoint = process.env.S3_ENDPOINT
    } else if (process.env.R2_ACCOUNT_ID) {
      settings.endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    }
  }

  // Public URL for R2
  if (!settings.publicUrl) settings.publicUrl = process.env.R2_PUBLIC_URL

  // Auto-detect R2 provider when R2 env vars are used
  if (process.env.R2_BUCKET || process.env.R2_ACCOUNT_ID) {
    settings.provider = 'r2'
  }

  return settings
}

export async function getAiSettings(): Promise<AiSettings> {
  const settings = await getSettings('ai', DEFAULT_AI_SETTINGS)

  // Fallback to environment variables
  if (!settings.apiKey) {
    switch (settings.provider) {
      case 'openai':
        settings.apiKey = process.env.OPENAI_API_KEY
        break
      case 'anthropic':
        settings.apiKey = process.env.ANTHROPIC_API_KEY
        break
      case 'google':
        settings.apiKey = process.env.GOOGLE_AI_API_KEY
        break
    }
  }

  return settings
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  return getSettings('security', DEFAULT_SECURITY_SETTINGS)
}

/**
 * Check environment variable status
 */
export function getEnvVarStatus(): EnvVarStatus[] {
  return REQUIRED_ENV_VARS.map((envVar) => ({
    ...envVar,
    configured: !!process.env[envVar.name],
  }))
}

/**
 * Get all settings for admin dashboard
 */
export async function getAllSettings(): Promise<{
  branding: BrandingSettings
  general: GeneralSettings
  email: EmailSettings
  storage: StorageSettings
  ai: AiSettings
  security: SecuritySettings
  envVars: EnvVarStatus[]
}> {
  const [branding, general, email, storage, ai, security] = await Promise.all([
    getBrandingSettings(),
    getGeneralSettings(),
    getEmailSettings(),
    getStorageSettings(),
    getAiSettings(),
    getSecuritySettings(),
  ])

  return {
    branding,
    general,
    email: {
      ...email,
      // Mask sensitive values
      smtpPass: email.smtpPass ? '********' : undefined,
      sendgridApiKey: email.sendgridApiKey ? '********' : undefined,
      resendApiKey: email.resendApiKey ? '********' : undefined,
      mailgunApiKey: email.mailgunApiKey ? '********' : undefined,
      sesSecretAccessKey: email.sesSecretAccessKey ? '********' : undefined,
    },
    storage: {
      ...storage,
      secretAccessKey: storage.secretAccessKey ? '********' : undefined,
    },
    ai: {
      ...ai,
      apiKey: ai.apiKey ? '********' : undefined,
    },
    security,
    envVars: getEnvVarStatus(),
  }
}

export * from './types'
