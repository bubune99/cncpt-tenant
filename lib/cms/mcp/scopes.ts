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
  get_page_puck_data: MCP_SCOPES.PAGES_READ,
  update_page_puck_content: MCP_SCOPES.PAGES_WRITE,
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
}
