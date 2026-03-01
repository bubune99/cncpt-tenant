/**
 * Feature Definitions
 *
 * Central registry of all modules and their sub-features.
 * Data-driven: add new features here without code changes elsewhere.
 *
 * Key format: "module" for top-level, "module.feature" for sub-features.
 * Example: "commerce", "commerce.reviews", "commerce.wishlists"
 */

export interface FeatureDefinition {
  /** Unique key: "module" or "module.subfeature" */
  key: string
  /** Human-readable name */
  name: string
  /** Short description */
  description: string
  /** Parent module key (null for top-level modules) */
  module: string | null
  /** Whether this is a top-level module (true) or sub-feature (false) */
  isModule: boolean
  /** Default enabled state for new tenants */
  defaultEnabled: boolean
  /** If true, cannot be disabled (e.g., core) */
  locked: boolean
  /** CMS module slug this maps to (for module-level features) */
  moduleSlug?: string
  /** Icon name (Lucide) for display */
  icon: string
  /** Sort order within its group */
  sortOrder: number
  /** Minimum subscription tier required (null = available on all tiers) */
  minTier?: string | null
  /** API route prefixes gated by this feature */
  apiPrefixes?: string[]
  /** Admin nav items gated by this feature */
  gatedNavItems?: string[]
  /** Tags for grouping in UI */
  tags?: string[]
}

// ---------------------------------------------------------------------------
// Module definitions (top-level toggles)
// ---------------------------------------------------------------------------

const CORE_MODULE: FeatureDefinition = {
  key: "core",
  name: "Core",
  description: "Dashboard, analytics, users, roles, and settings. Always enabled.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: true,
  moduleSlug: "core",
  icon: "LayoutDashboard",
  sortOrder: 0,
  apiPrefixes: ["settings", "users", "roles", "audit-log", "dashboard"],
}

const PAGES_MODULE: FeatureDefinition = {
  key: "pages",
  name: "Pages",
  description: "CMS pages with the visual block editor, templates, and partials.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: false,
  moduleSlug: "pages",
  icon: "Layers",
  sortOrder: 1,
  apiPrefixes: ["pages", "templates", "partials"],
  gatedNavItems: ["Pages"],
}

const COMMERCE_MODULE: FeatureDefinition = {
  key: "commerce",
  name: "Commerce",
  description: "Products, orders, shipping, customers, checkout, and payments.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: false,
  moduleSlug: "commerce",
  icon: "ShoppingCart",
  sortOrder: 2,
  apiPrefixes: ["products", "orders", "checkout", "cart", "shipping", "customers"],
  gatedNavItems: ["Products", "Orders", "Order Workflows", "Shipping", "Customers"],
}

const BLOG_MODULE: FeatureDefinition = {
  key: "blog",
  name: "Blog",
  description: "Blog posts, categories, tags, and comments.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: false,
  moduleSlug: "blog",
  icon: "FileText",
  sortOrder: 3,
  apiPrefixes: ["blog"],
  gatedNavItems: ["Blog"],
}

const FORMS_MODULE: FeatureDefinition = {
  key: "forms",
  name: "Forms",
  description: "Form builder with submissions, notifications, and integrations.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: false,
  moduleSlug: "forms",
  icon: "ClipboardList",
  sortOrder: 4,
  apiPrefixes: ["forms"],
  gatedNavItems: ["Forms"],
}

const MEDIA_MODULE: FeatureDefinition = {
  key: "media",
  name: "Media",
  description: "Media library for images, files, and asset management.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: false,
  moduleSlug: "media",
  icon: "Image",
  sortOrder: 5,
  apiPrefixes: ["media", "images"],
  gatedNavItems: ["Media"],
}

const EVENTS_MODULE: FeatureDefinition = {
  key: "events",
  name: "Events",
  description: "Event management with ticketing, schedules, and registrations.",
  module: null,
  isModule: true,
  defaultEnabled: false,
  locked: false,
  moduleSlug: "events",
  icon: "CalendarDays",
  sortOrder: 6,
  apiPrefixes: ["events"],
  gatedNavItems: ["Events"],
}

const EMAIL_MARKETING_MODULE: FeatureDefinition = {
  key: "email-marketing",
  name: "Email Marketing",
  description: "Email campaigns, subscribers, automations, and templates.",
  module: null,
  isModule: true,
  defaultEnabled: false,
  locked: false,
  moduleSlug: "email-marketing",
  icon: "Mail",
  sortOrder: 7,
  apiPrefixes: ["email-marketing", "emails"],
  gatedNavItems: ["Email Marketing"],
}

const ANALYTICS_MODULE: FeatureDefinition = {
  key: "analytics",
  name: "Analytics",
  description: "Site analytics, traffic reports, and conversion tracking.",
  module: null,
  isModule: true,
  defaultEnabled: true,
  locked: false,
  icon: "BarChart3",
  sortOrder: 8,
  apiPrefixes: ["analytics"],
  gatedNavItems: ["Analytics"],
}

const LMS_MODULE: FeatureDefinition = {
  key: "lms",
  name: "Learning (LMS)",
  description: "Courses, lessons, quizzes, student progress, and certificates.",
  module: null,
  isModule: true,
  defaultEnabled: false,
  locked: false,
  icon: "GraduationCap",
  sortOrder: 9,
  minTier: "pro",
  apiPrefixes: ["courses", "lessons", "enrollments"],
  gatedNavItems: ["Courses"],
}

const WORKFLOWS_MODULE: FeatureDefinition = {
  key: "workflows",
  name: "Workflows",
  description: "Automated workflows, triggers, and actions (n8n integration).",
  module: null,
  isModule: true,
  defaultEnabled: false,
  locked: false,
  icon: "Workflow",
  sortOrder: 10,
  minTier: "pro",
  apiPrefixes: ["workflows"],
  gatedNavItems: ["Workflows"],
}

// ---------------------------------------------------------------------------
// Sub-features: Commerce
// ---------------------------------------------------------------------------

const COMMERCE_REVIEWS: FeatureDefinition = {
  key: "commerce.reviews",
  name: "Product Reviews",
  description: "Allow customers to leave ratings and reviews on products.",
  module: "commerce",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "Star",
  sortOrder: 0,
  apiPrefixes: ["reviews"],
  tags: ["social"],
}

const COMMERCE_WISHLISTS: FeatureDefinition = {
  key: "commerce.wishlists",
  name: "Wishlists",
  description: "Let customers save products to wishlists for later.",
  module: "commerce",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "Heart",
  sortOrder: 1,
  apiPrefixes: ["wishlists"],
  tags: ["social"],
}

const COMMERCE_DIGITAL_PRODUCTS: FeatureDefinition = {
  key: "commerce.digital_products",
  name: "Digital Products",
  description: "Sell downloadable files and digital assets.",
  module: "commerce",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "Download",
  sortOrder: 2,
  tags: ["products"],
}

const COMMERCE_SUBSCRIPTIONS: FeatureDefinition = {
  key: "commerce.subscriptions",
  name: "Subscriptions",
  description: "Recurring billing and subscription products via Stripe.",
  module: "commerce",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "RefreshCcw",
  sortOrder: 3,
  minTier: "pro",
  tags: ["billing"],
}

const COMMERCE_DISCOUNT_CODES: FeatureDefinition = {
  key: "commerce.discount_codes",
  name: "Discount Codes",
  description: "Create percentage and fixed-amount discount codes.",
  module: "commerce",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "Tag",
  sortOrder: 4,
  apiPrefixes: ["discounts"],
  tags: ["marketing"],
}

const COMMERCE_INVENTORY: FeatureDefinition = {
  key: "commerce.inventory",
  name: "Inventory Tracking",
  description: "Track stock levels, low-stock alerts, and variants.",
  module: "commerce",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "Package",
  sortOrder: 5,
  tags: ["operations"],
}

// ---------------------------------------------------------------------------
// Sub-features: Blog
// ---------------------------------------------------------------------------

const BLOG_COMMENTS: FeatureDefinition = {
  key: "blog.comments",
  name: "Blog Comments",
  description: "Allow readers to leave comments on blog posts.",
  module: "blog",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "MessageSquare",
  sortOrder: 0,
  apiPrefixes: ["comments"],
  tags: ["social"],
}

const BLOG_NEWSLETTER: FeatureDefinition = {
  key: "blog.newsletter",
  name: "Newsletter Signup",
  description: "Collect email subscribers from blog pages.",
  module: "blog",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "Mail",
  sortOrder: 1,
  tags: ["marketing"],
}

const BLOG_SEO: FeatureDefinition = {
  key: "blog.seo",
  name: "Advanced SEO",
  description: "Custom meta tags, Open Graph, structured data per post.",
  module: "blog",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "Search",
  sortOrder: 2,
  tags: ["seo"],
}

// ---------------------------------------------------------------------------
// Sub-features: Forms
// ---------------------------------------------------------------------------

const FORMS_FILE_UPLOADS: FeatureDefinition = {
  key: "forms.file_uploads",
  name: "File Uploads",
  description: "Allow file upload fields in forms.",
  module: "forms",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "Upload",
  sortOrder: 0,
}

const FORMS_CONDITIONAL_LOGIC: FeatureDefinition = {
  key: "forms.conditional_logic",
  name: "Conditional Logic",
  description: "Show/hide fields based on other field values.",
  module: "forms",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "GitBranch",
  sortOrder: 1,
  minTier: "pro",
}

const FORMS_WEBHOOKS: FeatureDefinition = {
  key: "forms.webhooks",
  name: "Form Webhooks",
  description: "Send form submissions to external URLs.",
  module: "forms",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "Webhook",
  sortOrder: 2,
  minTier: "pro",
}

// ---------------------------------------------------------------------------
// Sub-features: Pages
// ---------------------------------------------------------------------------

const PAGES_AI_EDITOR: FeatureDefinition = {
  key: "pages.ai_editor",
  name: "AI Editor Assistant",
  description: "AI-powered block editing, layout suggestions, and content generation.",
  module: "pages",
  isModule: false,
  defaultEnabled: true,
  locked: false,
  icon: "Sparkles",
  sortOrder: 0,
  minTier: "starter",
}

const PAGES_CODE_EDITOR: FeatureDefinition = {
  key: "pages.code_editor",
  name: "Code Editor",
  description: "Edit blocks as JSX/React code with Monaco editor.",
  module: "pages",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "Code",
  sortOrder: 1,
  minTier: "pro",
}

const PAGES_CUSTOM_COMPONENTS: FeatureDefinition = {
  key: "pages.custom_components",
  name: "Custom Components",
  description: "Import and use custom React components in pages.",
  module: "pages",
  isModule: false,
  defaultEnabled: false,
  locked: false,
  icon: "Puzzle",
  sortOrder: 2,
  minTier: "pro",
}

// ---------------------------------------------------------------------------
// Master list
// ---------------------------------------------------------------------------

export const ALL_FEATURES: FeatureDefinition[] = [
  // Modules
  CORE_MODULE,
  PAGES_MODULE,
  COMMERCE_MODULE,
  BLOG_MODULE,
  FORMS_MODULE,
  MEDIA_MODULE,
  EVENTS_MODULE,
  EMAIL_MARKETING_MODULE,
  ANALYTICS_MODULE,
  LMS_MODULE,
  WORKFLOWS_MODULE,

  // Commerce sub-features
  COMMERCE_REVIEWS,
  COMMERCE_WISHLISTS,
  COMMERCE_DIGITAL_PRODUCTS,
  COMMERCE_SUBSCRIPTIONS,
  COMMERCE_DISCOUNT_CODES,
  COMMERCE_INVENTORY,

  // Blog sub-features
  BLOG_COMMENTS,
  BLOG_NEWSLETTER,
  BLOG_SEO,

  // Forms sub-features
  FORMS_FILE_UPLOADS,
  FORMS_CONDITIONAL_LOGIC,
  FORMS_WEBHOOKS,

  // Pages sub-features
  PAGES_AI_EDITOR,
  PAGES_CODE_EDITOR,
  PAGES_CUSTOM_COMPONENTS,
]

/** All top-level module definitions */
export const MODULE_FEATURES = ALL_FEATURES.filter((f) => f.isModule)

/** Get sub-features for a given module key */
export function getSubFeatures(moduleKey: string): FeatureDefinition[] {
  return ALL_FEATURES.filter((f) => f.module === moduleKey).sort(
    (a, b) => a.sortOrder - b.sortOrder
  )
}

/** Look up a feature definition by key */
export function getFeatureDefinition(
  key: string
): FeatureDefinition | undefined {
  return ALL_FEATURES.find((f) => f.key === key)
}

/** Get all feature keys */
export function getAllFeatureKeys(): string[] {
  return ALL_FEATURES.map((f) => f.key)
}

/** Get the module key from a feature key (e.g., "commerce.reviews" -> "commerce") */
export function getModuleFromFeatureKey(key: string): string {
  return key.includes(".") ? key.split(".")[0] : key
}

/** Build default feature config (all defaults) */
export function buildDefaultFeatureConfig(): Record<string, boolean> {
  const config: Record<string, boolean> = {}
  for (const feature of ALL_FEATURES) {
    config[feature.key] = feature.defaultEnabled
  }
  return config
}
