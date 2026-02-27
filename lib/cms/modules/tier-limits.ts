/**
 * Subscription Tier Module Limits
 *
 * The SubscriptionTier.limits JSON field can include an `allowed_modules`
 * key to restrict which CMS modules are available on that tier.
 *
 * Schema: SubscriptionTier.limits is Json @default("{}")
 *
 * Convention:
 *   {
 *     "allowed_modules": ["core", "pages", "blog", "media"],
 *     "max_pages": 50,
 *     "max_products": 100,
 *     "max_media_mb": 500,
 *     ...
 *   }
 *
 * When allowed_modules is not set or null, all globally enabled modules
 * are available (no restriction). When set to an array, only those module
 * slugs are available for that tier. "core" is always included regardless.
 *
 * Example tier configurations:
 */

export interface TierLimits {
  /** Which CMS module slugs are allowed. null = all modules */
  allowed_modules?: string[] | null
  /** Maximum number of CMS pages */
  max_pages?: number
  /** Maximum number of products */
  max_products?: number
  /** Maximum media storage in MB */
  max_media_mb?: number
  /** Maximum number of blog posts */
  max_blog_posts?: number
  /** Maximum number of forms */
  max_forms?: number
  /** Maximum number of team members */
  max_team_members?: number
}

/** Example tier limit presets for reference */
export const TIER_LIMIT_PRESETS: Record<string, TierLimits> = {
  free: {
    allowed_modules: ["core", "pages", "blog", "media"],
    max_pages: 10,
    max_products: 0,
    max_media_mb: 100,
    max_blog_posts: 20,
    max_forms: 2,
    max_team_members: 1,
  },
  starter: {
    allowed_modules: ["core", "pages", "blog", "media", "forms"],
    max_pages: 50,
    max_products: 0,
    max_media_mb: 500,
    max_blog_posts: 100,
    max_forms: 10,
    max_team_members: 3,
  },
  pro: {
    allowed_modules: ["core", "pages", "commerce", "blog", "media", "forms", "email-marketing"],
    max_pages: 200,
    max_products: 500,
    max_media_mb: 2000,
    max_blog_posts: 500,
    max_forms: 50,
    max_team_members: 10,
  },
  enterprise: {
    // null = no restriction, all modules available
    allowed_modules: null,
    max_pages: -1, // unlimited
    max_products: -1,
    max_media_mb: -1,
    max_blog_posts: -1,
    max_forms: -1,
    max_team_members: -1,
  },
}
