/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM encryption for storing sensitive data in the database
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const KEY_LENGTH = 32

// Get encryption key from environment or generate a warning
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    console.warn(
      'WARNING: ENCRYPTION_KEY not set. Using fallback key. Set ENCRYPTION_KEY in production!'
    )
    // Fallback key for development only - DO NOT use in production
    return scryptSync('development-fallback-key', 'salt', KEY_LENGTH)
  }

  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  // Otherwise derive key from provided string
  return scryptSync(key, 'nextjs-cms-salt', KEY_LENGTH)
}

/**
 * Encrypt a string value
 * Returns format: salt:iv:tag:encrypted (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const salt = randomBytes(SALT_LENGTH)

  // Derive a unique key for this encryption using salt
  const derivedKey = scryptSync(key, salt, KEY_LENGTH)

  const cipher = createCipheriv(ALGORITHM, derivedKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  // Combine salt, iv, tag, and encrypted data
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt an encrypted string
 * Expects format: salt:iv:tag:encrypted (all hex encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()

  const parts = encryptedData.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }

  const [saltHex, ivHex, tagHex, encrypted] = parts

  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')

  // Derive the same key using the stored salt
  const derivedKey = scryptSync(key, salt, KEY_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a value is encrypted (matches our format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  if (parts.length !== 4) return false

  // Check if all parts are valid hex
  return parts.every((part) => /^[0-9a-f]+$/i.test(part))
}

/**
 * Safely encrypt - returns original if encryption fails
 */
export function safeEncrypt(value: string): string {
  try {
    return encrypt(value)
  } catch (error) {
    console.error('Encryption failed:', error)
    return value
  }
}

/**
 * Safely decrypt - returns original if decryption fails
 */
export function safeDecrypt(value: string): string {
  try {
    if (!isEncrypted(value)) {
      return value
    }
    return decrypt(value)
  } catch (error) {
    console.error('Decryption failed:', error)
    return value
  }
}

/**
 * Hash a value (one-way, for comparison only)
 */
export function hash(value: string): string {
  const salt = randomBytes(16).toString('hex')
  const hashed = scryptSync(value, salt, 64).toString('hex')
  return `${salt}:${hashed}`
}

/**
 * Verify a value against a hash
 */
export function verifyHash(value: string, hashedValue: string): boolean {
  const [salt, originalHash] = hashedValue.split(':')
  const hashed = scryptSync(value, salt, 64).toString('hex')
  return hashed === originalHash
}
