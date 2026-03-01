/**
 * Feature Presets (Vertical Bundles)
 *
 * Pre-configured feature bundles for different business verticals.
 * Applying a preset sets the entire featureConfig in one action.
 */

export interface FeaturePreset {
  id: string
  name: string
  description: string
  icon: string
  /** Feature keys to enable. Everything not listed is disabled (except locked features). */
  enabledFeatures: string[]
  /** Tags for display grouping */
  tags: string[]
}

export const FEATURE_PRESETS: FeaturePreset[] = [
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    description:
      "Full online store with products, orders, shipping, blog, and reviews.",
    icon: "ShoppingCart",
    tags: ["popular"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "commerce",
      "commerce.reviews",
      "commerce.wishlists",
      "commerce.discount_codes",
      "commerce.inventory",
      "blog",
      "blog.comments",
      "blog.seo",
      "media",
      "forms",
      "analytics",
    ],
  },
  {
    id: "headless-shopify",
    name: "Headless Shopify",
    description:
      "Shopify-powered storefront with CMS pages, blog, and content marketing.",
    icon: "ShoppingBag",
    tags: ["popular"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "commerce",
      "commerce.reviews",
      "commerce.wishlists",
      "commerce.discount_codes",
      "blog",
      "blog.comments",
      "blog.seo",
      "blog.newsletter",
      "media",
      "analytics",
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio / Agency",
    description:
      "Showcase work with pages, gallery, blog, and contact forms.",
    icon: "Palette",
    tags: ["creative"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "pages.code_editor",
      "blog",
      "blog.seo",
      "media",
      "forms",
      "forms.file_uploads",
      "analytics",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant / Food",
    description:
      "Menu display, ordering, reservations, and events management.",
    icon: "UtensilsCrossed",
    tags: ["vertical"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "commerce",
      "commerce.discount_codes",
      "commerce.inventory",
      "media",
      "forms",
      "events",
      "analytics",
    ],
  },
  {
    id: "courses",
    name: "Online Courses",
    description:
      "Sell courses with LMS, payments, blog content marketing, and email.",
    icon: "GraduationCap",
    tags: ["education"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "commerce",
      "commerce.subscriptions",
      "commerce.digital_products",
      "commerce.discount_codes",
      "lms",
      "blog",
      "blog.comments",
      "blog.seo",
      "blog.newsletter",
      "media",
      "email-marketing",
      "analytics",
    ],
  },
  {
    id: "blog-publication",
    name: "Blog / Publication",
    description:
      "Content-focused with blog, SEO, newsletter, pages, and email marketing.",
    icon: "FileText",
    tags: ["content"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "blog",
      "blog.comments",
      "blog.seo",
      "blog.newsletter",
      "media",
      "forms",
      "email-marketing",
      "analytics",
    ],
  },
  {
    id: "saas-landing",
    name: "SaaS / Landing Pages",
    description:
      "Landing pages, forms, analytics, and lead capture for SaaS products.",
    icon: "Rocket",
    tags: ["tech"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "pages.code_editor",
      "pages.custom_components",
      "blog",
      "blog.seo",
      "media",
      "forms",
      "forms.webhooks",
      "analytics",
    ],
  },
  {
    id: "full-cms",
    name: "Full CMS (Everything)",
    description: "All modules and features enabled for maximum flexibility.",
    icon: "Layers",
    tags: ["advanced"],
    enabledFeatures: [
      "core",
      "pages",
      "pages.ai_editor",
      "pages.code_editor",
      "pages.custom_components",
      "commerce",
      "commerce.reviews",
      "commerce.wishlists",
      "commerce.digital_products",
      "commerce.subscriptions",
      "commerce.discount_codes",
      "commerce.inventory",
      "blog",
      "blog.comments",
      "blog.newsletter",
      "blog.seo",
      "forms",
      "forms.file_uploads",
      "forms.conditional_logic",
      "forms.webhooks",
      "media",
      "events",
      "email-marketing",
      "analytics",
      "lms",
      "workflows",
    ],
  },
]

/**
 * Get a preset by ID.
 */
export function getFeaturePreset(id: string): FeaturePreset | undefined {
  return FEATURE_PRESETS.find((p) => p.id === id)
}

/**
 * Convert a preset into a feature config record.
 * Locked features (core) are always true.
 */
export function presetToFeatureConfig(
  preset: FeaturePreset
): Record<string, boolean> {
  // Dynamic import to avoid circular deps at module init time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ALL_FEATURES } = require("./definitions") as {
    ALL_FEATURES: Array<{ key: string; locked: boolean }>
  }

  const config: Record<string, boolean> = {}
  for (const feature of ALL_FEATURES) {
    if (feature.locked) {
      config[feature.key] = true
    } else {
      config[feature.key] = preset.enabledFeatures.includes(feature.key)
    }
  }
  return config
}
