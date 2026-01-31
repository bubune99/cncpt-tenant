/**
 * Environment Variable Management Types
 */

// Environment variable categories
export type EnvCategory =
  | 'database'
  | 'auth'
  | 'payments'
  | 'shipping'
  | 'storage'
  | 'email'
  | 'analytics'
  | 'ai'
  | 'general'

// Environment variable definition
export interface EnvVarDefinition {
  key: string
  category: EnvCategory
  label: string
  description: string
  required: boolean
  sensitive: boolean // Should be encrypted
  public: boolean // NEXT_PUBLIC_ prefix - exposed to client
  placeholder?: string
  validationPattern?: string
  validationMessage?: string
}

// Stored environment variable
export interface StoredEnvVar {
  id: string
  key: string
  value: string // Encrypted if sensitive
  category: EnvCategory
  encrypted: boolean
  source: 'database' | 'env_file' | 'system'
  createdAt: Date
  updatedAt: Date
}

// Environment variable for display (value masked if sensitive)
export interface DisplayEnvVar {
  key: string
  category: EnvCategory
  label: string
  description: string
  required: boolean
  sensitive: boolean
  public: boolean
  configured: boolean
  source: 'database' | 'env_file' | 'system' | 'none'
  maskedValue?: string // e.g., "sk_live_****XXXX"
  placeholder?: string
}

// All defined environment variables
export const ENV_VAR_DEFINITIONS: EnvVarDefinition[] = [
  // Database
  {
    key: 'DATABASE_URL',
    category: 'database',
    label: 'Database URL',
    description: 'PostgreSQL connection string',
    required: true,
    sensitive: true,
    public: false,
    placeholder: 'postgresql://user:pass@host:5432/db',
  },

  // Auth
  {
    key: 'NEXTAUTH_SECRET',
    category: 'auth',
    label: 'NextAuth Secret',
    description: 'Secret key for session encryption',
    required: true,
    sensitive: true,
    public: false,
    placeholder: 'Generate with: openssl rand -base64 32',
  },
  {
    key: 'NEXTAUTH_URL',
    category: 'auth',
    label: 'NextAuth URL',
    description: 'Application URL for auth callbacks',
    required: true,
    sensitive: false,
    public: false,
    placeholder: 'https://yourdomain.com',
  },

  // Payments - Stripe
  {
    key: 'STRIPE_SECRET_KEY',
    category: 'payments',
    label: 'Stripe Secret Key',
    description: 'Stripe API secret key (starts with sk_)',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'sk_live_...',
    validationPattern: '^sk_(live|test)_[a-zA-Z0-9]+$',
    validationMessage: 'Must be a valid Stripe secret key',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    category: 'payments',
    label: 'Stripe Webhook Secret',
    description: 'Stripe webhook signing secret',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'whsec_...',
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    category: 'payments',
    label: 'Stripe Publishable Key',
    description: 'Stripe publishable key (starts with pk_)',
    required: false,
    sensitive: false,
    public: true,
    placeholder: 'pk_live_...',
    validationPattern: '^pk_(live|test)_[a-zA-Z0-9]+$',
    validationMessage: 'Must be a valid Stripe publishable key',
  },

  // Shipping - Shippo
  {
    key: 'SHIPPO_API_KEY',
    category: 'shipping',
    label: 'Shippo API Key',
    description: 'Shippo API token for shipping labels',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'shippo_live_...',
  },
  {
    key: 'SHIPPO_WEBHOOK_SECRET',
    category: 'shipping',
    label: 'Shippo Webhook Secret',
    description: 'Secret for verifying Shippo webhooks',
    required: false,
    sensitive: true,
    public: false,
  },

  // Storage - S3
  {
    key: 'S3_BUCKET',
    category: 'storage',
    label: 'S3 Bucket Name',
    description: 'AWS S3 or R2 bucket name',
    required: false,
    sensitive: false,
    public: false,
    placeholder: 'my-bucket',
  },
  {
    key: 'S3_REGION',
    category: 'storage',
    label: 'S3 Region',
    description: 'AWS region for the bucket',
    required: false,
    sensitive: false,
    public: false,
    placeholder: 'us-east-1',
  },
  {
    key: 'S3_ACCESS_KEY_ID',
    category: 'storage',
    label: 'S3 Access Key ID',
    description: 'AWS access key ID',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'AKIA...',
  },
  {
    key: 'S3_SECRET_ACCESS_KEY',
    category: 'storage',
    label: 'S3 Secret Access Key',
    description: 'AWS secret access key',
    required: false,
    sensitive: true,
    public: false,
  },
  {
    key: 'S3_ENDPOINT',
    category: 'storage',
    label: 'S3 Endpoint',
    description: 'Custom endpoint for S3-compatible storage (Cloudflare R2, MinIO)',
    required: false,
    sensitive: false,
    public: false,
    placeholder: 'https://xxx.r2.cloudflarestorage.com',
  },

  // Email - SMTP
  {
    key: 'SMTP_HOST',
    category: 'email',
    label: 'SMTP Host',
    description: 'SMTP server hostname',
    required: false,
    sensitive: false,
    public: false,
    placeholder: 'smtp.example.com',
  },
  {
    key: 'SMTP_PORT',
    category: 'email',
    label: 'SMTP Port',
    description: 'SMTP server port (587 for TLS, 465 for SSL)',
    required: false,
    sensitive: false,
    public: false,
    placeholder: '587',
  },
  {
    key: 'SMTP_USER',
    category: 'email',
    label: 'SMTP Username',
    description: 'SMTP authentication username',
    required: false,
    sensitive: false,
    public: false,
  },
  {
    key: 'SMTP_PASS',
    category: 'email',
    label: 'SMTP Password',
    description: 'SMTP authentication password',
    required: false,
    sensitive: true,
    public: false,
  },
  {
    key: 'SENDGRID_API_KEY',
    category: 'email',
    label: 'SendGrid API Key',
    description: 'SendGrid API key for email delivery',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'SG...',
  },
  {
    key: 'RESEND_API_KEY',
    category: 'email',
    label: 'Resend API Key',
    description: 'Resend API key for email delivery',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 're_...',
  },

  // Analytics
  {
    key: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    category: 'analytics',
    label: 'Google Analytics ID',
    description: 'Google Analytics 4 Measurement ID',
    required: false,
    sensitive: false,
    public: true,
    placeholder: 'G-XXXXXXXXXX',
    validationPattern: '^G-[A-Z0-9]+$',
    validationMessage: 'Must be a valid GA4 Measurement ID (G-XXXXXXXXXX)',
  },
  {
    key: 'NEXT_PUBLIC_MATOMO_URL',
    category: 'analytics',
    label: 'Matomo URL',
    description: 'Self-hosted Matomo server URL',
    required: false,
    sensitive: false,
    public: true,
    placeholder: 'https://analytics.example.com',
  },
  {
    key: 'NEXT_PUBLIC_MATOMO_SITE_ID',
    category: 'analytics',
    label: 'Matomo Site ID',
    description: 'Matomo site/property ID',
    required: false,
    sensitive: false,
    public: true,
    placeholder: '1',
  },

  // AI
  {
    key: 'OPENAI_API_KEY',
    category: 'ai',
    label: 'OpenAI API Key',
    description: 'OpenAI API key for GPT models',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'sk-...',
    validationPattern: '^sk-[a-zA-Z0-9-_]+$',
    validationMessage: 'Must be a valid OpenAI API key',
  },
  {
    key: 'ANTHROPIC_API_KEY',
    category: 'ai',
    label: 'Anthropic API Key',
    description: 'Anthropic API key for Claude models',
    required: false,
    sensitive: true,
    public: false,
    placeholder: 'sk-ant-...',
  },
  {
    key: 'GOOGLE_AI_API_KEY',
    category: 'ai',
    label: 'Google AI API Key',
    description: 'Google AI API key for Gemini models',
    required: false,
    sensitive: true,
    public: false,
  },

  // General
  {
    key: 'NEXT_PUBLIC_APP_URL',
    category: 'general',
    label: 'Application URL',
    description: 'Public URL of your application',
    required: true,
    sensitive: false,
    public: true,
    placeholder: 'https://yourdomain.com',
  },
  {
    key: 'ENCRYPTION_KEY',
    category: 'general',
    label: 'Encryption Key',
    description: 'Master key for encrypting sensitive data (64 hex chars)',
    required: true,
    sensitive: true,
    public: false,
    placeholder: 'Generate with: openssl rand -hex 32',
  },
]

// Category labels and descriptions
export const ENV_CATEGORIES: Record<EnvCategory, { label: string; description: string; icon: string }> = {
  database: {
    label: 'Database',
    description: 'Database connection settings',
    icon: 'Database',
  },
  auth: {
    label: 'Authentication',
    description: 'Authentication and session settings',
    icon: 'Shield',
  },
  payments: {
    label: 'Payments',
    description: 'Payment processing (Stripe)',
    icon: 'CreditCard',
  },
  shipping: {
    label: 'Shipping',
    description: 'Shipping provider (Shippo)',
    icon: 'Truck',
  },
  storage: {
    label: 'Storage',
    description: 'File storage (S3, R2)',
    icon: 'HardDrive',
  },
  email: {
    label: 'Email',
    description: 'Email delivery settings',
    icon: 'Mail',
  },
  analytics: {
    label: 'Analytics',
    description: 'Analytics tracking (GA4, Matomo)',
    icon: 'BarChart',
  },
  ai: {
    label: 'AI',
    description: 'AI provider API keys',
    icon: 'Bot',
  },
  general: {
    label: 'General',
    description: 'General application settings',
    icon: 'Settings',
  },
}
