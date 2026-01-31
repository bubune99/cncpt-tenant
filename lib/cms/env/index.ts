/**
 * Environment Variable Management
 *
 * Manages environment variables stored encrypted in the database
 * Falls back to process.env for variables not in database
 */

import { prisma } from '../db'
import { encrypt, decrypt, isEncrypted, safeDecrypt } from '../encryption'
import type {
  EnvCategory,
  EnvVarDefinition,
  DisplayEnvVar,
} from './types'
import { ENV_VAR_DEFINITIONS, ENV_CATEGORIES } from './types'

// Cache for environment variables
const envCache: Map<string, { value: string; timestamp: number }> = new Map()
const ENV_CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Get an environment variable value
 * Checks database first, then falls back to process.env
 */
export async function getEnvVar(key: string): Promise<string | undefined> {
  // Check cache first
  const cached = envCache.get(key)
  if (cached && Date.now() - cached.timestamp < ENV_CACHE_TTL) {
    return cached.value
  }

  // Check database
  const dbVar = await prisma.setting.findFirst({
    where: { key: `env.${key}`, tenantId: null },
  })

  if (dbVar) {
    let value = dbVar.value

    // Decrypt if encrypted
    if (dbVar.encrypted && isEncrypted(value)) {
      value = decrypt(value)
    }

    // Update cache
    envCache.set(key, { value, timestamp: Date.now() })

    return value
  }

  // Fall back to process.env
  const envValue = process.env[key]
  if (envValue) {
    envCache.set(key, { value: envValue, timestamp: Date.now() })
  }

  return envValue
}

/**
 * Set an environment variable in the database
 */
export async function setEnvVar(
  key: string,
  value: string,
  options?: {
    sensitive?: boolean
    category?: EnvCategory
  }
): Promise<void> {
  // Find definition for this key
  const definition = ENV_VAR_DEFINITIONS.find((d) => d.key === key)
  const isSensitive = options?.sensitive ?? definition?.sensitive ?? false
  const category = options?.category ?? definition?.category ?? 'general'

  // Encrypt if sensitive
  const storedValue = isSensitive ? encrypt(value) : value

  const existingEnvSetting = await prisma.setting.findFirst({
    where: { key: `env.${key}`, tenantId: null },
  })
  if (existingEnvSetting) {
    await prisma.setting.update({
      where: { id: existingEnvSetting.id },
      data: {
        value: storedValue,
        encrypted: isSensitive,
      },
    })
  } else {
    await prisma.setting.create({
      data: {
        key: `env.${key}`,
        value: storedValue,
        group: 'env',
        encrypted: isSensitive,
        tenantId: null,
      },
    })
  }

  // Update cache with decrypted value
  envCache.set(key, { value, timestamp: Date.now() })
}

/**
 * Delete an environment variable from the database
 */
export async function deleteEnvVar(key: string): Promise<void> {
  const existingEnvVar = await prisma.setting.findFirst({
    where: { key: `env.${key}`, tenantId: null },
  })
  if (existingEnvVar) {
    await prisma.setting.delete({
      where: { id: existingEnvVar.id },
    }).catch(() => {
      // Ignore if not found
    })
  }

  // Clear from cache
  envCache.delete(key)
}

/**
 * Clear environment variable cache
 */
export function clearEnvCache(): void {
  envCache.clear()
}

/**
 * Get all environment variables for display
 * Returns all defined vars with their status and masked values
 */
export async function getAllEnvVars(): Promise<DisplayEnvVar[]> {
  // Get all stored env vars from database
  const dbVars = await prisma.setting.findMany({
    where: { key: { startsWith: 'env.' } },
  })

  const dbVarMap = new Map(
    dbVars.map((v: (typeof dbVars)[number]) => [v.key.replace('env.', ''), v])
  )

  // Build display list
  const displayVars: DisplayEnvVar[] = ENV_VAR_DEFINITIONS.map((def) => {
    const dbVar = dbVarMap.get(def.key)
    const envVar = process.env[def.key]

    let source: DisplayEnvVar['source'] = 'none'
    let configured = false
    let maskedValue: string | undefined

    if (dbVar) {
      source = 'database'
      configured = true

      // Get value for masking
      let value = dbVar.value
      if (dbVar.encrypted && isEncrypted(value)) {
        try {
          value = decrypt(value)
        } catch {
          value = ''
        }
      }

      maskedValue = maskValue(value, def.sensitive)
    } else if (envVar) {
      source = 'env_file'
      configured = true
      maskedValue = maskValue(envVar, def.sensitive)
    }

    return {
      key: def.key,
      category: def.category,
      label: def.label,
      description: def.description,
      required: def.required,
      sensitive: def.sensitive,
      public: def.public,
      configured,
      source,
      maskedValue,
      placeholder: def.placeholder,
    }
  })

  return displayVars
}

/**
 * Get environment variables by category
 */
export async function getEnvVarsByCategory(
  category: EnvCategory
): Promise<DisplayEnvVar[]> {
  const allVars = await getAllEnvVars()
  return allVars.filter((v) => v.category === category)
}

/**
 * Mask a sensitive value for display
 * Shows first 4 and last 4 characters
 */
function maskValue(value: string, sensitive: boolean): string {
  if (!sensitive || !value) {
    return value
  }

  if (value.length <= 8) {
    return '••••••••'
  }

  const first = value.slice(0, 4)
  const last = value.slice(-4)
  return `${first}••••${last}`
}

/**
 * Validate an environment variable value
 */
export function validateEnvVar(
  key: string,
  value: string
): { valid: boolean; message?: string } {
  const definition = ENV_VAR_DEFINITIONS.find((d) => d.key === key)

  if (!definition) {
    return { valid: true }
  }

  // Check required
  if (definition.required && !value) {
    return { valid: false, message: `${definition.label} is required` }
  }

  // Check pattern
  if (definition.validationPattern && value) {
    const regex = new RegExp(definition.validationPattern)
    if (!regex.test(value)) {
      return {
        valid: false,
        message: definition.validationMessage || `Invalid format for ${definition.label}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Get environment health status
 */
export async function getEnvHealth(): Promise<{
  total: number
  configured: number
  required: number
  requiredConfigured: number
  missingRequired: string[]
  categories: Record<EnvCategory, { total: number; configured: number }>
}> {
  const allVars = await getAllEnvVars()

  const missingRequired = allVars
    .filter((v) => v.required && !v.configured)
    .map((v) => v.key)

  const categories = {} as Record<EnvCategory, { total: number; configured: number }>

  for (const category of Object.keys(ENV_CATEGORIES) as EnvCategory[]) {
    const categoryVars = allVars.filter((v) => v.category === category)
    categories[category] = {
      total: categoryVars.length,
      configured: categoryVars.filter((v) => v.configured).length,
    }
  }

  return {
    total: allVars.length,
    configured: allVars.filter((v) => v.configured).length,
    required: allVars.filter((v) => v.required).length,
    requiredConfigured: allVars.filter((v) => v.required && v.configured).length,
    missingRequired,
    categories,
  }
}

/**
 * Import environment variables from .env format string
 */
export async function importEnvVars(
  envString: string,
  overwrite = false
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const lines = envString.split('\n')
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!match) {
      continue
    }

    const [, key, rawValue] = match

    // Remove quotes from value
    let value = rawValue
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // Find definition
    const definition = ENV_VAR_DEFINITIONS.find((d) => d.key === key)
    if (!definition) {
      // Skip unknown variables
      skipped++
      continue
    }

    // Check if already exists
    const existing = await getEnvVar(key)
    if (existing && !overwrite) {
      skipped++
      continue
    }

    // Validate
    const validation = validateEnvVar(key, value)
    if (!validation.valid) {
      errors.push(`${key}: ${validation.message}`)
      continue
    }

    // Store
    try {
      await setEnvVar(key, value, {
        sensitive: definition.sensitive,
        category: definition.category,
      })
      imported++
    } catch (error) {
      errors.push(`${key}: Failed to save`)
    }
  }

  return { imported, skipped, errors }
}

/**
 * Export environment variables as .env format
 * Only exports non-sensitive values by default
 */
export async function exportEnvVars(
  includeSensitive = false
): Promise<string> {
  const allVars = await getAllEnvVars()
  const lines: string[] = []

  // Group by category
  for (const category of Object.keys(ENV_CATEGORIES) as EnvCategory[]) {
    const categoryVars = allVars.filter(
      (v) => v.category === category && v.configured
    )

    if (categoryVars.length === 0) continue

    lines.push(`# ${ENV_CATEGORIES[category].label}`)

    for (const v of categoryVars) {
      if (v.sensitive && !includeSensitive) {
        lines.push(`# ${v.key}=<configured>`)
      } else if (v.maskedValue) {
        // Get actual value from database or env
        const actualValue = await getEnvVar(v.key)
        if (actualValue) {
          lines.push(`${v.key}="${actualValue}"`)
        }
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}

export * from './types'
