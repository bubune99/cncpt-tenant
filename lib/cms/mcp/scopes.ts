/**
 * MCP API Key Scopes
 *
 * Granular permission scopes for API key access control.
 * Scopes follow the pattern: resource:action
 */

/**
 * All available MCP scopes
 */
export const MCP_SCOPES = {
  // Product scopes
  PRODUCTS_READ: "products:read",
  PRODUCTS_WRITE: "products:write",

  // Order scopes
  ORDERS_READ: "orders:read",
  ORDERS_WRITE: "orders:write",

  // Blog scopes
  BLOG_READ: "blog:read",
  BLOG_WRITE: "blog:write",

  // Page scopes
  PAGES_READ: "pages:read",
  PAGES_WRITE: "pages:write",

  // Content delivery scopes (public content API)
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",

  // Media scopes
  MEDIA_READ: "media:read",
  MEDIA_WRITE: "media:write",

  // Customer scopes
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_WRITE: "customers:write",

  // Settings scopes
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",

  // Analytics scopes
  ANALYTICS_READ: "analytics:read",

  // Atlas redesign — new scopes
  ANALYTICS_WRITE: "analytics:write",
  ANALYTICS_DASHBOARDS_READ: "analytics:dashboards:read",
  ANALYTICS_DASHBOARDS_WRITE: "analytics:dashboards:write",
  ORDERS_FULFILLMENT_READ: "orders:fulfillment:read",
  ORDERS_FULFILLMENT_WRITE: "orders:fulfillment:write",
  JOURNAL_READ: "journal:read",
  JOURNAL_WRITE: "journal:write",
  CUSTOM_FIELDS_READ: "custom_fields:read",
  CUSTOM_FIELDS_WRITE: "custom_fields:write",
  DIGITAL_ASSETS_READ: "digital_assets:read",
  DIGITAL_ASSETS_WRITE: "digital_assets:write",
  NOTIFICATIONS_READ: "notifications:read",
  NOTIFICATIONS_WRITE: "notifications:write",
  PRICING_READ: "pricing:read",
  PRICING_WRITE: "pricing:write",
  // Coordinator scope — account summary + loyalty
  ACCOUNT_SUMMARY_READ: "account:summary:read",
  ACCOUNT_LOYALTY_READ: "account:loyalty:read",
  ACCOUNT_LOYALTY_WRITE: "account:loyalty:write",

  // User scopes (admin only)
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",

  // Wildcard scopes (legacy compatibility)
  READ: "read",
  WRITE: "write",
  ALL: "*",
} as const

export type McpScope = (typeof MCP_SCOPES)[keyof typeof MCP_SCOPES]

/**
 * Scope groups for easy selection in UI
 */
export const SCOPE_GROUPS = {
  "Content Management": [
    MCP_SCOPES.PAGES_READ,
    MCP_SCOPES.PAGES_WRITE,
    MCP_SCOPES.CONTENT_READ,
    MCP_SCOPES.CONTENT_WRITE,
    MCP_SCOPES.BLOG_READ,
    MCP_SCOPES.BLOG_WRITE,
    MCP_SCOPES.MEDIA_READ,
    MCP_SCOPES.MEDIA_WRITE,
  ],
  "E-Commerce": [
    MCP_SCOPES.PRODUCTS_READ,
    MCP_SCOPES.PRODUCTS_WRITE,
    MCP_SCOPES.ORDERS_READ,
    MCP_SCOPES.ORDERS_WRITE,
    MCP_SCOPES.CUSTOMERS_READ,
    MCP_SCOPES.CUSTOMERS_WRITE,
  ],
  "Settings & Analytics": [
    MCP_SCOPES.SETTINGS_READ,
    MCP_SCOPES.SETTINGS_WRITE,
    MCP_SCOPES.ANALYTICS_READ,
  ],
  Administration: [
    MCP_SCOPES.USERS_READ,
    MCP_SCOPES.USERS_WRITE,
  ],
  // Atlas redesign scope groups
  "Content Distribution": [
    MCP_SCOPES.JOURNAL_READ,
    MCP_SCOPES.JOURNAL_WRITE,
  ],
  "Product Advanced": [
    MCP_SCOPES.CUSTOM_FIELDS_READ,
    MCP_SCOPES.CUSTOM_FIELDS_WRITE,
    MCP_SCOPES.DIGITAL_ASSETS_READ,
    MCP_SCOPES.DIGITAL_ASSETS_WRITE,
    MCP_SCOPES.PRICING_READ,
    MCP_SCOPES.PRICING_WRITE,
  ],
  "Operations": [
    MCP_SCOPES.ORDERS_FULFILLMENT_READ,
    MCP_SCOPES.ORDERS_FULFILLMENT_WRITE,
    MCP_SCOPES.NOTIFICATIONS_READ,
    MCP_SCOPES.NOTIFICATIONS_WRITE,
  ],
  "Analytics Advanced": [
    MCP_SCOPES.ANALYTICS_READ,
    MCP_SCOPES.ANALYTICS_WRITE,
    MCP_SCOPES.ANALYTICS_DASHBOARDS_READ,
    MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  ],
  "Customer Account": [
    MCP_SCOPES.ACCOUNT_SUMMARY_READ,
    MCP_SCOPES.ACCOUNT_LOYALTY_READ,
    MCP_SCOPES.ACCOUNT_LOYALTY_WRITE,
  ],
} as const

/**
 * Preset scope bundles for common use cases
 */
export const SCOPE_PRESETS = {
  "Read Only": {
    description: "View all data without making changes",
    scopes: [
      MCP_SCOPES.PRODUCTS_READ,
      MCP_SCOPES.ORDERS_READ,
      MCP_SCOPES.BLOG_READ,
      MCP_SCOPES.PAGES_READ,
      MCP_SCOPES.MEDIA_READ,
      MCP_SCOPES.CUSTOMERS_READ,
      MCP_SCOPES.SETTINGS_READ,
      MCP_SCOPES.ANALYTICS_READ,
    ],
  },
  "Content Editor": {
    description: "Manage blog posts, pages, and media",
    scopes: [
      MCP_SCOPES.BLOG_READ,
      MCP_SCOPES.BLOG_WRITE,
      MCP_SCOPES.PAGES_READ,
      MCP_SCOPES.PAGES_WRITE,
      MCP_SCOPES.MEDIA_READ,
      MCP_SCOPES.MEDIA_WRITE,
    ],
  },
  "Store Manager": {
    description: "Manage products, orders, and customers",
    scopes: [
      MCP_SCOPES.PRODUCTS_READ,
      MCP_SCOPES.PRODUCTS_WRITE,
      MCP_SCOPES.ORDERS_READ,
      MCP_SCOPES.ORDERS_WRITE,
      MCP_SCOPES.CUSTOMERS_READ,
      MCP_SCOPES.CUSTOMERS_WRITE,
      MCP_SCOPES.ANALYTICS_READ,
    ],
  },
  "Content Delivery (Read)": {
    description: "Read-only access to pages and partials via content API",
    scopes: [
      MCP_SCOPES.CONTENT_READ,
      MCP_SCOPES.PAGES_READ,
    ],
  },
  "Content Delivery (Read/Write)": {
    description: "Full content management via content delivery API",
    scopes: [
      MCP_SCOPES.CONTENT_READ,
      MCP_SCOPES.CONTENT_WRITE,
      MCP_SCOPES.PAGES_READ,
      MCP_SCOPES.PAGES_WRITE,
    ],
  },
  "Full Access": {
    description: "Complete access to all resources",
    scopes: [MCP_SCOPES.ALL],
  },
} as const

/**
 * Human-readable scope descriptions
 */
export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  [MCP_SCOPES.PRODUCTS_READ]: "View products and inventory",
  [MCP_SCOPES.PRODUCTS_WRITE]: "Create, update, delete products",
  [MCP_SCOPES.ORDERS_READ]: "View orders and transactions",
  [MCP_SCOPES.ORDERS_WRITE]: "Update order status, create refunds",
  [MCP_SCOPES.BLOG_READ]: "View blog posts and categories",
  [MCP_SCOPES.BLOG_WRITE]: "Create, update, delete blog posts",
  [MCP_SCOPES.PAGES_READ]: "View CMS pages",
  [MCP_SCOPES.PAGES_WRITE]: "Create, update, delete pages",
  [MCP_SCOPES.CONTENT_READ]: "Read pages and partials via content delivery API",
  [MCP_SCOPES.CONTENT_WRITE]: "Create, update, delete pages and partials via content delivery API",
  [MCP_SCOPES.MEDIA_READ]: "View media library",
  [MCP_SCOPES.MEDIA_WRITE]: "Upload, update, delete media",
  [MCP_SCOPES.CUSTOMERS_READ]: "View customer profiles",
  [MCP_SCOPES.CUSTOMERS_WRITE]: "Update customer data",
  [MCP_SCOPES.SETTINGS_READ]: "View site settings",
  [MCP_SCOPES.SETTINGS_WRITE]: "Update site settings",
  [MCP_SCOPES.ANALYTICS_READ]: "View analytics and reports",
  [MCP_SCOPES.USERS_READ]: "View CMS users",
  [MCP_SCOPES.USERS_WRITE]: "Manage CMS users",
  [MCP_SCOPES.READ]: "Read access to all resources (legacy)",
  [MCP_SCOPES.WRITE]: "Write access to all resources (legacy)",
  [MCP_SCOPES.ALL]: "Full access to all resources",
  // Atlas redesign
  [MCP_SCOPES.ANALYTICS_WRITE]: "Create and update analytics dashboards",
  [MCP_SCOPES.ANALYTICS_DASHBOARDS_READ]: "View analytics dashboards and widgets",
  [MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE]: "Create, update, delete analytics dashboards",
  [MCP_SCOPES.ORDERS_FULFILLMENT_READ]: "View per-line fulfillment steps",
  [MCP_SCOPES.ORDERS_FULFILLMENT_WRITE]: "Update per-line fulfillment steps",
  [MCP_SCOPES.JOURNAL_READ]: "View journal series and distribution channels",
  [MCP_SCOPES.JOURNAL_WRITE]: "Manage journal series and distribution channels",
  [MCP_SCOPES.CUSTOM_FIELDS_READ]: "View custom field definitions and values",
  [MCP_SCOPES.CUSTOM_FIELDS_WRITE]: "Create and update custom fields",
  [MCP_SCOPES.DIGITAL_ASSETS_READ]: "View digital assets and license keys",
  [MCP_SCOPES.DIGITAL_ASSETS_WRITE]: "Manage digital assets and license keys",
  [MCP_SCOPES.NOTIFICATIONS_READ]: "View notifications",
  [MCP_SCOPES.NOTIFICATIONS_WRITE]: "Mark notifications read",
  [MCP_SCOPES.PRICING_READ]: "View pricing tiers and sale schedules",
  [MCP_SCOPES.PRICING_WRITE]: "Create and update pricing tiers and schedules",
  // Coordinator scope — account summary + loyalty
  [MCP_SCOPES.ACCOUNT_SUMMARY_READ]: "View account summary (credits, loyalty, open orders)",
  [MCP_SCOPES.ACCOUNT_LOYALTY_READ]: "View loyalty tier and activity log",
  [MCP_SCOPES.ACCOUNT_LOYALTY_WRITE]: "Add loyalty point credits and debits",
}

/**
 * Check if a scope grants access to a specific permission
 *
 * Supports:
 * - Exact match: "products:read" matches "products:read"
 * - Wildcard resource: "read" matches "products:read", "orders:read"
 * - Wildcard action: "products:*" matches "products:read", "products:write"
 * - Full wildcard: "*" matches everything
 */
export function scopeGrantsPermission(
  grantedScopes: string[],
  requiredScope: string
): boolean {
  // Full wildcard grants everything
  if (grantedScopes.includes(MCP_SCOPES.ALL)) {
    return true
  }

  // Exact match
  if (grantedScopes.includes(requiredScope)) {
    return true
  }

  // Parse the required scope
  const [resource, action] = requiredScope.split(":")
  if (!resource || !action) {
    return false
  }

  // Check legacy wildcards (read/write)
  if (action === "read" && grantedScopes.includes(MCP_SCOPES.READ)) {
    return true
  }
  if (action === "write" && grantedScopes.includes(MCP_SCOPES.WRITE)) {
    return true
  }

  // Check resource-level wildcards (e.g., "products:*")
  if (grantedScopes.includes(`${resource}:*`)) {
    return true
  }

  return false
}

/**
 * Validate a list of scopes
 * Returns an array of invalid scopes, or empty array if all valid
 */
export function validateScopes(scopes: string[]): string[] {
  const allValidScopes = new Set(Object.values(MCP_SCOPES))
  // Also allow resource:* patterns
  const resourceWildcardPattern = /^[a-z]+:\*$/

  return scopes.filter((scope) => {
    if (allValidScopes.has(scope as McpScope)) return false
    if (resourceWildcardPattern.test(scope)) return false
    return true // Invalid
  })
}

/**
 * Normalize legacy scopes to granular scopes
 * Converts "read"/"write" to the full list of granular scopes
 */
export function normalizeLegacyScopes(scopes: string[]): string[] {
  const normalized = new Set<string>()

  for (const scope of scopes) {
    if (scope === MCP_SCOPES.ALL) {
      return [MCP_SCOPES.ALL]
    }

    if (scope === MCP_SCOPES.READ) {
      // Add all read scopes
      normalized.add(MCP_SCOPES.PRODUCTS_READ)
      normalized.add(MCP_SCOPES.ORDERS_READ)
      normalized.add(MCP_SCOPES.BLOG_READ)
      normalized.add(MCP_SCOPES.PAGES_READ)
      normalized.add(MCP_SCOPES.MEDIA_READ)
      normalized.add(MCP_SCOPES.CUSTOMERS_READ)
      normalized.add(MCP_SCOPES.SETTINGS_READ)
      normalized.add(MCP_SCOPES.ANALYTICS_READ)
      normalized.add(MCP_SCOPES.USERS_READ)
    } else if (scope === MCP_SCOPES.WRITE) {
      // Add all write scopes
      normalized.add(MCP_SCOPES.PRODUCTS_WRITE)
      normalized.add(MCP_SCOPES.ORDERS_WRITE)
      normalized.add(MCP_SCOPES.BLOG_WRITE)
      normalized.add(MCP_SCOPES.PAGES_WRITE)
      normalized.add(MCP_SCOPES.MEDIA_WRITE)
      normalized.add(MCP_SCOPES.CUSTOMERS_WRITE)
      normalized.add(MCP_SCOPES.SETTINGS_WRITE)
      normalized.add(MCP_SCOPES.USERS_WRITE)
    } else {
      normalized.add(scope)
    }
  }

  return Array.from(normalized)
}

/**
 * Get the required scope for an MCP tool
 */
export const TOOL_SCOPES: Record<string, string> = {
  // Products
  list_products: MCP_SCOPES.PRODUCTS_READ,
  get_product: MCP_SCOPES.PRODUCTS_READ,
  create_product: MCP_SCOPES.PRODUCTS_WRITE,
  update_product: MCP_SCOPES.PRODUCTS_WRITE,
  delete_product: MCP_SCOPES.PRODUCTS_WRITE,

  // Orders
  list_orders: MCP_SCOPES.ORDERS_READ,
  get_order: MCP_SCOPES.ORDERS_READ,
  update_order: MCP_SCOPES.ORDERS_WRITE,

  // Blog
  list_blog_posts: MCP_SCOPES.BLOG_READ,
  get_blog_post: MCP_SCOPES.BLOG_READ,
  create_blog_post: MCP_SCOPES.BLOG_WRITE,
  update_blog_post: MCP_SCOPES.BLOG_WRITE,
  delete_blog_post: MCP_SCOPES.BLOG_WRITE,

  // Pages
  list_pages: MCP_SCOPES.PAGES_READ,
  get_page: MCP_SCOPES.PAGES_READ,
  get_page_content: MCP_SCOPES.PAGES_READ,
  update_page_content: MCP_SCOPES.PAGES_WRITE,
  create_page: MCP_SCOPES.PAGES_WRITE,
  delete_page: MCP_SCOPES.PAGES_WRITE,

  // Media
  list_media: MCP_SCOPES.MEDIA_READ,
  get_media: MCP_SCOPES.MEDIA_READ,
  upload_media: MCP_SCOPES.MEDIA_WRITE,
  delete_media: MCP_SCOPES.MEDIA_WRITE,

  // Customers
  list_customers: MCP_SCOPES.CUSTOMERS_READ,
  get_customer: MCP_SCOPES.CUSTOMERS_READ,
  update_customer: MCP_SCOPES.CUSTOMERS_WRITE,

  // Settings
  get_settings: MCP_SCOPES.SETTINGS_READ,
  update_setting: MCP_SCOPES.SETTINGS_WRITE,

  // Analytics
  get_analytics_summary: MCP_SCOPES.ANALYTICS_READ,

  // Users
  list_users: MCP_SCOPES.USERS_READ,
  get_user: MCP_SCOPES.USERS_READ,

  // Atlas redesign — fulfillment (G01)
  get_order_fulfillment: MCP_SCOPES.ORDERS_FULFILLMENT_READ,
  update_fulfillment_step: MCP_SCOPES.ORDERS_FULFILLMENT_WRITE,

  // Atlas redesign — analytics dashboards (G02)
  list_analytics_dashboards: MCP_SCOPES.ANALYTICS_DASHBOARDS_READ,
  get_analytics_dashboard: MCP_SCOPES.ANALYTICS_DASHBOARDS_READ,
  create_analytics_dashboard: MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  update_analytics_dashboard: MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  delete_analytics_dashboard: MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  create_analytics_widget: MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  update_analytics_widget: MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  delete_analytics_widget: MCP_SCOPES.ANALYTICS_DASHBOARDS_WRITE,
  list_widget_templates: MCP_SCOPES.ANALYTICS_DASHBOARDS_READ,
  run_analytics_query: MCP_SCOPES.ANALYTICS_READ,

  // Atlas redesign — journal series (G03)
  list_blog_series: MCP_SCOPES.JOURNAL_READ,
  get_blog_series: MCP_SCOPES.JOURNAL_READ,
  create_blog_series: MCP_SCOPES.JOURNAL_WRITE,

  // Atlas redesign — distribution channels (G04)
  get_post_distribution: MCP_SCOPES.JOURNAL_READ,
  schedule_post_channel: MCP_SCOPES.JOURNAL_WRITE,

  // Atlas redesign — customer lifecycle (G05)
  update_customer_lifecycle: MCP_SCOPES.CUSTOMERS_WRITE,

  // Atlas redesign — pricing (G06)
  get_product_pricing: MCP_SCOPES.PRICING_READ,
  create_pricing_tier: MCP_SCOPES.PRICING_WRITE,
  update_pricing_tier: MCP_SCOPES.PRICING_WRITE,
  delete_pricing_tier: MCP_SCOPES.PRICING_WRITE,
  create_sale_schedule: MCP_SCOPES.PRICING_WRITE,
  delete_sale_schedule: MCP_SCOPES.PRICING_WRITE,

  // Atlas redesign — custom fields (G07)
  list_custom_fields: MCP_SCOPES.CUSTOM_FIELDS_READ,
  get_product_custom_fields: MCP_SCOPES.CUSTOM_FIELDS_READ,
  set_variant_field_value: MCP_SCOPES.CUSTOM_FIELDS_WRITE,
  attach_custom_field_to_product: MCP_SCOPES.CUSTOM_FIELDS_WRITE,

  // Atlas redesign — digital assets (G08)
  list_digital_assets: MCP_SCOPES.DIGITAL_ASSETS_READ,
  get_digital_asset: MCP_SCOPES.DIGITAL_ASSETS_READ,
  list_license_keys: MCP_SCOPES.DIGITAL_ASSETS_READ,
  revoke_license_key: MCP_SCOPES.DIGITAL_ASSETS_WRITE,

  // Atlas redesign — order stage moves (G09)
  move_order_to_stage: MCP_SCOPES.ORDERS_WRITE,
  get_order_workflow: MCP_SCOPES.ORDERS_READ,

  // Atlas redesign — customer notes (G10)
  list_customer_notes: MCP_SCOPES.CUSTOMERS_READ,
  add_customer_note: MCP_SCOPES.CUSTOMERS_WRITE,
  delete_customer_note: MCP_SCOPES.CUSTOMERS_WRITE,

  // Atlas redesign — notifications (G11)
  list_notifications: MCP_SCOPES.NOTIFICATIONS_READ,
  mark_notification_read: MCP_SCOPES.NOTIFICATIONS_WRITE,
  mark_all_notifications_read: MCP_SCOPES.NOTIFICATIONS_WRITE,

  // Atlas redesign — bulk variants (G12)
  bulk_update_variants: MCP_SCOPES.PRODUCTS_WRITE,

  // Atlas redesign — P2
  get_brand_preset: MCP_SCOPES.SETTINGS_READ,
  update_brand_preset: MCP_SCOPES.SETTINGS_WRITE,
  get_page_tree: MCP_SCOPES.PAGES_READ,
  list_discount_codes: MCP_SCOPES.PRODUCTS_READ,
  get_discount_code: MCP_SCOPES.PRODUCTS_READ,
  create_discount_code: MCP_SCOPES.PRODUCTS_WRITE,
  get_bundle_composition: MCP_SCOPES.PRODUCTS_READ,
  update_bundle_items: MCP_SCOPES.PRODUCTS_WRITE,

  // Coordinator scope — account summary + loyalty
  get_account_summary: MCP_SCOPES.ACCOUNT_SUMMARY_READ,
  get_account_loyalty: MCP_SCOPES.ACCOUNT_LOYALTY_READ,
  add_loyalty_activity: MCP_SCOPES.ACCOUNT_LOYALTY_WRITE,
}
