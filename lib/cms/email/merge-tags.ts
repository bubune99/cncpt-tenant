/**
 * Merge Tag Parser
 *
 * Handles Mailchimp-style merge tags for email personalization
 *
 * Supported formats:
 * - {{FNAME}} - Simple variable
 * - {{subscriber.firstName}} - Nested path
 * - {{product.name|default:"Product"}} - With default value
 * - {{order.total|currency}} - With formatter
 * - {{#if hasOrders}}...{{/if}} - Conditional blocks
 * - {{#each products}}...{{/each}} - Loops
 */

export interface MergeTagData {
  [key: string]: string | number | boolean | null | undefined | MergeTagData | MergeTagData[]
}

// Built-in formatters
const formatters: Record<string, (value: unknown, ...args: string[]) => string> = {
  // Default value if empty/undefined
  default: (value, defaultValue = '') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }
    return String(value)
  },

  // Currency formatting
  currency: (value, currency = 'USD', locale = 'en-US') => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return String(value)
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(num / 100) // Assuming cents
  },

  // Date formatting
  date: (value, format = 'short', locale = 'en-US') => {
    const date = value instanceof Date ? value : new Date(String(value))
    if (isNaN(date.getTime())) return String(value)

    const options: Intl.DateTimeFormatOptions = {}
    switch (format) {
      case 'short':
        options.dateStyle = 'short'
        break
      case 'medium':
        options.dateStyle = 'medium'
        break
      case 'long':
        options.dateStyle = 'long'
        break
      case 'full':
        options.dateStyle = 'full'
        break
      default:
        options.dateStyle = 'short'
    }
    return new Intl.DateTimeFormat(locale, options).format(date)
  },

  // Time formatting
  time: (value, format = 'short', locale = 'en-US') => {
    const date = value instanceof Date ? value : new Date(String(value))
    if (isNaN(date.getTime())) return String(value)

    const options: Intl.DateTimeFormatOptions = {}
    switch (format) {
      case 'short':
        options.timeStyle = 'short'
        break
      case 'medium':
        options.timeStyle = 'medium'
        break
      case 'long':
        options.timeStyle = 'long'
        break
      default:
        options.timeStyle = 'short'
    }
    return new Intl.DateTimeFormat(locale, options).format(date)
  },

  // Number formatting
  number: (value, locale = 'en-US') => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return String(value)
    return new Intl.NumberFormat(locale).format(num)
  },

  // Percent formatting
  percent: (value, decimals = '0') => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return String(value)
    return `${(num * 100).toFixed(parseInt(decimals))}%`
  },

  // Uppercase
  upper: (value) => String(value).toUpperCase(),

  // Lowercase
  lower: (value) => String(value).toLowerCase(),

  // Capitalize first letter
  capitalize: (value) => {
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // Title case
  title: (value) => {
    return String(value)
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  },

  // Truncate
  truncate: (value, length = '50', suffix = '...') => {
    const str = String(value)
    const maxLength = parseInt(length)
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength) + suffix
  },

  // URL encode
  urlencode: (value) => encodeURIComponent(String(value)),

  // HTML escape
  escape: (value) => {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  },
}

/**
 * Get value from nested path
 */
function getNestedValue(data: MergeTagData, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * Parse formatter string like "currency:USD:en-US"
 */
function parseFormatter(formatterStr: string): { name: string; args: string[] } {
  const parts = formatterStr.split(':')
  return {
    name: parts[0],
    args: parts.slice(1),
  }
}

/**
 * Process a single merge tag
 */
function processMergeTag(tag: string, data: MergeTagData): string {
  // Remove {{ and }}
  let content = tag.slice(2, -2).trim()

  // Check for pipe (formatter)
  let formatterStr: string | null = null
  const pipeIndex = content.indexOf('|')
  if (pipeIndex !== -1) {
    formatterStr = content.slice(pipeIndex + 1).trim()
    content = content.slice(0, pipeIndex).trim()
  }

  // Get the value
  let value = getNestedValue(data, content)

  // Handle legacy Mailchimp-style tags (all caps)
  if (value === undefined) {
    const mailchimpMappings: Record<string, string> = {
      FNAME: 'subscriber.firstName',
      LNAME: 'subscriber.lastName',
      EMAIL: 'subscriber.email',
      MERGE0: 'subscriber.email',
      MERGE1: 'subscriber.firstName',
      MERGE2: 'subscriber.lastName',
    }
    if (content in mailchimpMappings) {
      value = getNestedValue(data, mailchimpMappings[content])
    }
  }

  // Apply formatter if present
  if (formatterStr) {
    // Handle default with quotes: default:"value"
    const defaultMatch = formatterStr.match(/^default:"([^"]*)"$/)
    if (defaultMatch) {
      return formatters.default(value, defaultMatch[1])
    }

    const { name, args } = parseFormatter(formatterStr)
    const formatter = formatters[name]
    if (formatter) {
      return formatter(value, ...args)
    }
  }

  // Return value or empty string
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

/**
 * Process conditional blocks: {{#if condition}}...{{/if}}
 */
function processConditionals(template: string, data: MergeTagData): string {
  // Simple if blocks
  const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  return template.replace(ifRegex, (_, condition, content) => {
    const value = getNestedValue(data, condition.trim())
    const isTruthy = Boolean(value) && value !== '' && value !== 0 && value !== '0'

    // Check for else block
    const parts = content.split(/\{\{else\}\}/)
    if (isTruthy) {
      return parts[0] || ''
    } else {
      return parts[1] || ''
    }
  })
}

/**
 * Process loop blocks: {{#each items}}...{{/each}}
 */
function processLoops(template: string, data: MergeTagData): string {
  const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g

  return template.replace(eachRegex, (_, arrayPath, content) => {
    const items = getNestedValue(data, arrayPath.trim())
    if (!Array.isArray(items)) {
      return ''
    }

    return items
      .map((item, index) => {
        // Create context with item, index, and @first/@last
        const itemData: MergeTagData = {
          ...data,
          '@index': index,
          '@first': index === 0,
          '@last': index === items.length - 1,
          this: item as MergeTagData,
        }

        // Replace {{this.property}} with item values
        let itemContent = content.replace(/\{\{this\.([^}|]+)([^}]*)?\}\}/g, (_: string, path: string, rest: string) => {
          const fullTag = `{{${path}${rest || ''}}}`
          return processMergeTag(fullTag, item as MergeTagData)
        })

        // Also support {{property}} directly (without this.)
        itemContent = itemContent.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)([^}]*)?\}\}/g, (match: string, path: string, rest: string) => {
          // Skip special tags
          if (path.startsWith('#') || path.startsWith('/') || path === 'else') {
            return match
          }
          // Check if it's an item property
          if (typeof item === 'object' && item !== null && path in (item as Record<string, unknown>)) {
            const fullTag = `{{${path}${rest || ''}}}`
            return processMergeTag(fullTag, item as MergeTagData)
          }
          return match
        })

        return processMergeTagsInternal(itemContent, itemData)
      })
      .join('')
  })
}

/**
 * Internal merge tag processing (after conditionals and loops)
 */
function processMergeTagsInternal(template: string, data: MergeTagData): string {
  // Match {{...}} tags
  const tagRegex = /\{\{([^#/}][^}]*)\}\}/g

  return template.replace(tagRegex, (match) => processMergeTag(match, data))
}

/**
 * Parse and replace all merge tags in a template
 */
export function parseMergeTags(template: string, data: MergeTagData): string {
  let result = template

  // Process loops first (they may contain conditionals and simple tags)
  result = processLoops(result, data)

  // Process conditionals
  result = processConditionals(result, data)

  // Process remaining simple tags
  result = processMergeTagsInternal(result, data)

  return result
}

/**
 * Extract all merge tags from a template
 */
export function extractMergeTags(template: string): string[] {
  const tags = new Set<string>()

  // Simple tags
  const simpleRegex = /\{\{([^#/}][^}|]*)/g
  let match
  while ((match = simpleRegex.exec(template)) !== null) {
    tags.add(match[1].trim())
  }

  // Conditional tags
  const ifRegex = /\{\{#if\s+([^}]+)\}\}/g
  while ((match = ifRegex.exec(template)) !== null) {
    tags.add(match[1].trim())
  }

  // Loop tags
  const eachRegex = /\{\{#each\s+([^}]+)\}\}/g
  while ((match = eachRegex.exec(template)) !== null) {
    tags.add(match[1].trim())
  }

  return Array.from(tags)
}

/**
 * Validate that all required merge tags have data
 */
export function validateMergeTagData(template: string, data: MergeTagData): { valid: boolean; missing: string[] } {
  const tags = extractMergeTags(template)
  const missing: string[] = []

  for (const tag of tags) {
    const value = getNestedValue(data, tag)
    if (value === undefined) {
      missing.push(tag)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Register a custom formatter
 */
export function registerFormatter(name: string, formatter: (value: unknown, ...args: string[]) => string): void {
  formatters[name] = formatter
}

/**
 * Get all available formatters
 */
export function getFormatters(): string[] {
  return Object.keys(formatters)
}
