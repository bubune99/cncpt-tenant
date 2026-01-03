/**
 * Seed Encrypted Environment Settings
 *
 * This script inserts encrypted environment variable values into the settings table.
 * Run with: DATABASE_URL=... ENCRYPTION_KEY=... npx tsx prisma/seed-env-settings.ts
 *
 * Or after pulling Vercel env vars: vercel env pull .env.local && npx tsx prisma/seed-env-settings.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createCipheriv, randomBytes, scryptSync } from 'crypto'

// Encryption constants (matching src/lib/encryption/index.ts)
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const KEY_LENGTH = 32

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    console.warn('WARNING: ENCRYPTION_KEY not set. Using fallback key.')
    return scryptSync('development-fallback-key', 'salt', KEY_LENGTH)
  }

  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  return scryptSync(key, 'nextjs-cms-salt', KEY_LENGTH)
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const salt = randomBytes(SALT_LENGTH)

  const derivedKey = scryptSync(key, salt, KEY_LENGTH)
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface SettingToSeed {
  key: string
  value: string
  group: string
  encrypted: boolean
}

async function main() {
  console.log('🔐 Seeding encrypted environment settings...\n')

  // Check for required env vars
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY is required for encrypting sensitive values')
    console.log('   Set ENCRYPTION_KEY or pull from Vercel: vercel env pull .env.local')
    process.exit(1)
  }

  const settings: SettingToSeed[] = []

  // ============================================================================
  // STORAGE SETTINGS (R2)
  // ============================================================================
  console.log('📦 Processing storage settings...')

  if (process.env.R2_ACCESS_KEY_ID) {
    settings.push({
      key: 'storage.accessKeyId',
      value: encrypt(process.env.R2_ACCESS_KEY_ID),
      group: 'storage',
      encrypted: true,
    })
    console.log('   ✅ storage.accessKeyId')
  }

  if (process.env.R2_SECRET_ACCESS_KEY) {
    settings.push({
      key: 'storage.secretAccessKey',
      value: encrypt(process.env.R2_SECRET_ACCESS_KEY),
      group: 'storage',
      encrypted: true,
    })
    console.log('   ✅ storage.secretAccessKey')
  }

  if (process.env.R2_BUCKET) {
    settings.push({
      key: 'storage.bucket',
      value: process.env.R2_BUCKET,
      group: 'storage',
      encrypted: false,
    })
    console.log('   ✅ storage.bucket')
  }

  if (process.env.R2_ACCOUNT_ID) {
    settings.push({
      key: 'storage.accountId',
      value: process.env.R2_ACCOUNT_ID,
      group: 'storage',
      encrypted: false,
    })
    console.log('   ✅ storage.accountId')
  }

  if (process.env.R2_PUBLIC_URL) {
    settings.push({
      key: 'storage.publicUrl',
      value: process.env.R2_PUBLIC_URL,
      group: 'storage',
      encrypted: false,
    })
    console.log('   ✅ storage.publicUrl')
  }

  // Set provider to R2 if R2 env vars are present
  if (process.env.R2_BUCKET || process.env.R2_ACCOUNT_ID) {
    settings.push({
      key: 'storage.provider',
      value: 'r2',
      group: 'storage',
      encrypted: false,
    })
    console.log('   ✅ storage.provider = r2')
  }

  // ============================================================================
  // PAYMENT SETTINGS (Stripe)
  // ============================================================================
  console.log('\n💳 Processing payment settings...')

  if (process.env.STRIPE_SECRET_KEY) {
    settings.push({
      key: 'payments.stripeSecretKey',
      value: encrypt(process.env.STRIPE_SECRET_KEY),
      group: 'payments',
      encrypted: true,
    })
    console.log('   ✅ payments.stripeSecretKey')
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    settings.push({
      key: 'payments.stripePublishableKey',
      value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      group: 'payments',
      encrypted: false,
    })
    console.log('   ✅ payments.stripePublishableKey')
  }

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    settings.push({
      key: 'payments.stripeWebhookSecret',
      value: encrypt(process.env.STRIPE_WEBHOOK_SECRET),
      group: 'payments',
      encrypted: true,
    })
    console.log('   ✅ payments.stripeWebhookSecret')
  }

  // ============================================================================
  // SHIPPING SETTINGS (Shippo)
  // ============================================================================
  console.log('\n📬 Processing shipping settings...')

  if (process.env.SHIPPO_API_KEY) {
    settings.push({
      key: 'shipping.shippoApiKey',
      value: encrypt(process.env.SHIPPO_API_KEY),
      group: 'shipping',
      encrypted: true,
    })
    console.log('   ✅ shipping.shippoApiKey')
  }

  if (process.env.SHIPPO_WEBHOOK_SECRET) {
    settings.push({
      key: 'shipping.shippoWebhookSecret',
      value: encrypt(process.env.SHIPPO_WEBHOOK_SECRET),
      group: 'shipping',
      encrypted: true,
    })
    console.log('   ✅ shipping.shippoWebhookSecret')
  }

  // ============================================================================
  // AI SETTINGS
  // ============================================================================
  console.log('\n🤖 Processing AI settings...')

  if (process.env.OPENAI_API_KEY) {
    settings.push({
      key: 'ai.apiKey',
      value: encrypt(process.env.OPENAI_API_KEY),
      group: 'ai',
      encrypted: true,
    })
    settings.push({
      key: 'ai.provider',
      value: 'openai',
      group: 'ai',
      encrypted: false,
    })
    console.log('   ✅ ai.apiKey (openai)')
  } else if (process.env.ANTHROPIC_API_KEY) {
    settings.push({
      key: 'ai.apiKey',
      value: encrypt(process.env.ANTHROPIC_API_KEY),
      group: 'ai',
      encrypted: true,
    })
    settings.push({
      key: 'ai.provider',
      value: 'anthropic',
      group: 'ai',
      encrypted: false,
    })
    console.log('   ✅ ai.apiKey (anthropic)')
  } else if (process.env.GOOGLE_AI_API_KEY) {
    settings.push({
      key: 'ai.apiKey',
      value: encrypt(process.env.GOOGLE_AI_API_KEY),
      group: 'ai',
      encrypted: true,
    })
    settings.push({
      key: 'ai.provider',
      value: 'google',
      group: 'ai',
      encrypted: false,
    })
    console.log('   ✅ ai.apiKey (google)')
  }

  if (process.env.PUCK_API_KEY) {
    settings.push({
      key: 'ai.puckApiKey',
      value: encrypt(process.env.PUCK_API_KEY),
      group: 'ai',
      encrypted: true,
    })
    console.log('   ✅ ai.puckApiKey')
  }

  // ============================================================================
  // UPSERT ALL SETTINGS
  // ============================================================================
  console.log(`\n📝 Saving ${settings.length} settings to database...`)

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        group: setting.group,
        encrypted: setting.encrypted,
      },
      create: setting,
    })
  }

  console.log('\n✨ Environment settings seeded successfully!')
  console.log(`   Total settings: ${settings.length}`)
  console.log(`   Encrypted: ${settings.filter(s => s.encrypted).length}`)
  console.log(`   Plain: ${settings.filter(s => !s.encrypted).length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
