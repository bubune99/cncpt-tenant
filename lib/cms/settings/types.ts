/**
 * Settings Types
 */

// Setting groups
export type SettingGroup =
  | 'general'
  | 'branding'
  | 'store'
  | 'payments'
  | 'shipping'
  | 'analytics'
  | 'seo'
  | 'email'
  | 'storage'
  | 'ai'
  | 'security'

// Branding settings (white-label)
export interface BrandingSettings {
  siteName: string
  siteTagline?: string
  logoUrl?: string
  logoAlt?: string
  logoDarkUrl?: string // Logo for dark mode
  faviconUrl?: string
  appleTouchIconUrl?: string
  ogImageUrl?: string // Default Open Graph image
  primaryColor?: string
  accentColor?: string
}

// General/Store settings
export interface GeneralSettings {
  siteName: string
  siteUrl: string
  supportEmail: string
  supportPhone?: string
  timezone: string
  currency: string
  locale: string
  logoUrl?: string
  faviconUrl?: string
}

// Email settings
export interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun' | 'ses'
  fromName: string
  fromEmail: string
  replyTo?: string

  // SMTP settings
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  smtpSecure?: boolean

  // Provider API keys
  sendgridApiKey?: string
  resendApiKey?: string
  mailgunApiKey?: string
  mailgunDomain?: string

  // AWS SES
  sesRegion?: string
  sesAccessKeyId?: string
  sesSecretAccessKey?: string
}

// Storage settings
export interface StorageSettings {
  provider: 's3' | 'r2' | 'local'
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string // For R2 or S3-compatible
  publicUrl?: string
  maxFileSize: number // in MB
  allowedFileTypes: string[]
}

// AI settings (Vercel AI Gateway)
export interface AiSettings {
  enabled: boolean
  provider: 'gateway' // Uses Vercel AI Gateway
  enabledModels: string[] // Models available in chat UI (e.g., ['anthropic/claude-sonnet-4.5'])
  maxTokens: number
  temperature: number
}

// Security settings
export interface SecuritySettings {
  allowRegistration: boolean
  requireEmailVerification: boolean
  sessionTimeout: number // in minutes
  maxLoginAttempts: number
  lockoutDuration: number // in minutes
  twoFactorEnabled: boolean
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
}

// Environment variable status
export interface EnvVarStatus {
  name: string
  configured: boolean
  required: boolean
  group: SettingGroup
  description: string
}

// All settings combined
export interface AllSettings {
  general: GeneralSettings
  payments: import('../stripe/types').StripeSettings
  shipping: import('../shippo/types').ShippingSettings
  analytics: import('../analytics/types').AnalyticsSettings
  seo: import('../seo/types').SeoConfig
  email: EmailSettings
  storage: StorageSettings
  ai: AiSettings
  security: SecuritySettings
}

// Default settings
export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'My Site',
  siteTagline: 'Welcome to our platform',
  primaryColor: '#0066cc',
  accentColor: '#6366f1',
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: 'My Store',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: 'support@example.com',
  timezone: 'America/New_York',
  currency: 'USD',
  locale: 'en-US',
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  provider: 'smtp',
  fromName: 'My Store',
  fromEmail: 'noreply@example.com',
}

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  provider: 's3',
  maxFileSize: 10, // 10MB
  allowedFileTypes: ['image/*', 'application/pdf'],
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: true,
  provider: 'gateway',
  enabledModels: ['anthropic/claude-sonnet-4.5', 'anthropic/claude-haiku-4.5'],
  maxTokens: 4096,
  temperature: 0.7,
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  allowRegistration: true,
  requireEmailVerification: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  twoFactorEnabled: false,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
}

// Required environment variables
export const REQUIRED_ENV_VARS: EnvVarStatus[] = [
  // Database
  { name: 'DATABASE_URL', configured: false, required: true, group: 'general', description: 'PostgreSQL connection string' },

  // Auth
  { name: 'NEXTAUTH_SECRET', configured: false, required: true, group: 'security', description: 'NextAuth secret for session encryption' },
  { name: 'NEXTAUTH_URL', configured: false, required: true, group: 'security', description: 'Application URL for auth callbacks' },

  // Stripe
  { name: 'STRIPE_SECRET_KEY', configured: false, required: false, group: 'payments', description: 'Stripe API secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', configured: false, required: false, group: 'payments', description: 'Stripe webhook signing secret' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', configured: false, required: false, group: 'payments', description: 'Stripe publishable key (public)' },

  // Shippo
  { name: 'SHIPPO_API_KEY', configured: false, required: false, group: 'shipping', description: 'Shippo API token' },
  { name: 'SHIPPO_WEBHOOK_SECRET', configured: false, required: false, group: 'shipping', description: 'Shippo webhook secret' },

  // Analytics
  { name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID', configured: false, required: false, group: 'analytics', description: 'Google Analytics 4 Measurement ID' },
  { name: 'NEXT_PUBLIC_MATOMO_URL', configured: false, required: false, group: 'analytics', description: 'Matomo server URL' },
  { name: 'NEXT_PUBLIC_MATOMO_SITE_ID', configured: false, required: false, group: 'analytics', description: 'Matomo site ID' },

  // Storage (S3/R2)
  { name: 'S3_BUCKET', configured: false, required: false, group: 'storage', description: 'S3 bucket name' },
  { name: 'S3_REGION', configured: false, required: false, group: 'storage', description: 'S3 region' },
  { name: 'S3_ACCESS_KEY_ID', configured: false, required: false, group: 'storage', description: 'S3 access key ID' },
  { name: 'S3_SECRET_ACCESS_KEY', configured: false, required: false, group: 'storage', description: 'S3 secret access key' },
  { name: 'S3_ENDPOINT', configured: false, required: false, group: 'storage', description: 'S3-compatible endpoint (for R2)' },

  // AI (Anthropic/Claude)
  { name: 'ANTHROPIC_API_KEY', configured: false, required: true, group: 'ai', description: 'Anthropic API key for Claude Sonnet/Haiku' },

  // Email
  { name: 'SMTP_HOST', configured: false, required: false, group: 'email', description: 'SMTP server host' },
  { name: 'SMTP_PORT', configured: false, required: false, group: 'email', description: 'SMTP server port' },
  { name: 'SMTP_USER', configured: false, required: false, group: 'email', description: 'SMTP username' },
  { name: 'SMTP_PASS', configured: false, required: false, group: 'email', description: 'SMTP password' },
  { name: 'SENDGRID_API_KEY', configured: false, required: false, group: 'email', description: 'SendGrid API key' },
  { name: 'RESEND_API_KEY', configured: false, required: false, group: 'email', description: 'Resend API key' },
]
