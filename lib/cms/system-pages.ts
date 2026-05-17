/**
 * System Pages Catalog
 *
 * Reserved built-in pages a tenant can customize through the block editor:
 * 404 (not-found), 500 (server-error), maintenance, and coming-soon.
 *
 * The catalog is the single source of truth for:
 *   - Reserved slugs (`__system/<thing>`) used as the user-visible identifier
 *     in the admin UI and as the `slug` value on the Page row.
 *   - The `SystemPageKey` enum value persisted on the Page row (the
 *     authoritative selector — slugs can be displayed but the key is what
 *     the storefront looks up).
 *   - Default copy that backs the platform fallback when a tenant hasn't
 *     customised a given system page.
 *
 * The MVP only ships customisation for `NOT_FOUND`. The others are listed
 * here so the admin UI can render them as "coming soon" affordances and so
 * the storefront/wiring is ready to drop them in once we ship the next
 * iteration.
 */

import type { SystemPageKey } from '@prisma/client'

/** The user-visible slug prefix that identifies system pages. */
export const SYSTEM_SLUG_PREFIX = '__system/'

/** Reserved slug values per system key. */
export const SYSTEM_PAGE_SLUGS = {
  NOT_FOUND: '__system/not-found',
  SERVER_ERROR: '__system/server-error',
  MAINTENANCE: '__system/maintenance',
  COMING_SOON: '__system/coming-soon',
} as const satisfies Record<SystemPageKey, string>

/** Reverse lookup: slug -> systemKey. */
export const SYSTEM_PAGE_KEY_BY_SLUG: Record<string, SystemPageKey> = Object.fromEntries(
  Object.entries(SYSTEM_PAGE_SLUGS).map(([key, slug]) => [slug, key as SystemPageKey])
)

export interface SystemPageDescriptor {
  key: SystemPageKey
  slug: string
  label: string
  description: string
  defaultTitle: string
  defaultMetaDescription: string
  /** Shipped in the MVP — admin UI exposes editing affordance. */
  available: boolean
}

/**
 * The full catalog. Order in this array drives the order rendered in the
 * admin "System pages" section.
 */
export const SYSTEM_PAGE_CATALOG: SystemPageDescriptor[] = [
  {
    key: 'NOT_FOUND',
    slug: SYSTEM_PAGE_SLUGS.NOT_FOUND,
    label: '404 — Page not found',
    description:
      'Shown when a visitor reaches a URL that does not match any page on your store.',
    defaultTitle: 'Page Not Found',
    defaultMetaDescription:
      'The page you are looking for does not exist or may have been moved.',
    available: true,
  },
  {
    key: 'SERVER_ERROR',
    slug: SYSTEM_PAGE_SLUGS.SERVER_ERROR,
    label: '500 — Server error',
    description:
      'Shown when something goes wrong on our end. Customisation coming soon.',
    defaultTitle: 'Something Went Wrong',
    defaultMetaDescription:
      'We hit an unexpected error. Please try again in a moment.',
    available: false,
  },
  {
    key: 'MAINTENANCE',
    slug: SYSTEM_PAGE_SLUGS.MAINTENANCE,
    label: 'Maintenance mode',
    description:
      'Shown to visitors when maintenance mode is enabled. Customisation coming soon.',
    defaultTitle: 'Down for Maintenance',
    defaultMetaDescription:
      'We are performing scheduled maintenance and will be back shortly.',
    available: false,
  },
  {
    key: 'COMING_SOON',
    slug: SYSTEM_PAGE_SLUGS.COMING_SOON,
    label: 'Coming soon',
    description:
      'Shown before launch when the storefront is hidden behind a coming-soon screen. Customisation coming soon.',
    defaultTitle: 'Coming Soon',
    defaultMetaDescription:
      'This site will be opening its doors soon.',
    available: false,
  },
]

const CATALOG_BY_KEY: Record<SystemPageKey, SystemPageDescriptor> = SYSTEM_PAGE_CATALOG.reduce(
  (acc, descriptor) => {
    acc[descriptor.key] = descriptor
    return acc
  },
  {} as Record<SystemPageKey, SystemPageDescriptor>
)

/** Get the descriptor for a specific system key, or null if unknown. */
export function getSystemPageDescriptor(key: string): SystemPageDescriptor | null {
  return CATALOG_BY_KEY[key as SystemPageKey] ?? null
}

/**
 * True when a slug is reserved for a system page. Use this to validate
 * user-submitted slugs in the admin API so they cannot collide with the
 * customisation system.
 */
export function isReservedSystemSlug(slug: string | null | undefined): boolean {
  if (!slug) return false
  const trimmed = slug.trim()
  return trimmed.startsWith(SYSTEM_SLUG_PREFIX) || trimmed.startsWith('/' + SYSTEM_SLUG_PREFIX)
}

/**
 * Get the systemKey from a slug, or null if not a system slug.
 * Accepts both `__system/not-found` and `/__system/not-found`.
 */
export function systemKeyFromSlug(slug: string): SystemPageKey | null {
  const normalized = slug.startsWith('/') ? slug.slice(1) : slug
  return SYSTEM_PAGE_KEY_BY_SLUG[normalized] ?? null
}
