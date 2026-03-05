/**
 * Unified Slug Management
 *
 * Single source of truth for slug formatting, validation, and collision handling.
 */

const MAX_SLUG_LENGTH = 128

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'auth', 'login', 'signup', 'register',
  'account', 'dashboard', 'settings', 'checkout', 'cart',
  'shop', 'products', 'categories', 'tags', 'posts', 'blog',
  'search', 'sitemap', 'robots', 'favicon', 'health',
  'handler', 's', 'webhook', 'webhooks',
])

/**
 * Format a string into a URL-safe slug.
 * Lowercase, alphanumeric + hyphens only, no leading/trailing/double hyphens.
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, MAX_SLUG_LENGTH)
}

/**
 * Check whether a slug is reserved (would collide with app routes).
 */
export function isReservedSlug(slug: string): boolean {
  const bare = slug.replace(/^\/+/, '')
  const firstSegment = bare.split('/')[0]
  return RESERVED_SLUGS.has(firstSegment)
}

/**
 * Validate a slug and return an error message if invalid.
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const bare = slug.replace(/^\/+/, '')

  if (!bare) {
    return { valid: false, error: 'Slug cannot be empty' }
  }

  if (bare.length > MAX_SLUG_LENGTH) {
    return { valid: false, error: `Slug cannot exceed ${MAX_SLUG_LENGTH} characters` }
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(bare)) {
    return { valid: false, error: 'Slug may only contain lowercase letters, numbers, and single hyphens' }
  }

  if (isReservedSlug(bare)) {
    return { valid: false, error: `"${bare}" is a reserved path and cannot be used as a slug` }
  }

  return { valid: true }
}

/**
 * Generate a unique slug by appending -1, -2, etc. if the base slug is taken.
 */
export async function ensureUniqueSlug(
  slug: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let candidate = slug
  let counter = 1

  while (await checkExists(candidate)) {
    candidate = `${slug}-${counter}`
    counter++
  }

  return candidate
}
