/**
 * Help Key Registry
 *
 * Central registry of all help keys used in the application.
 * This enables:
 * - AI tools to discover available help keys
 * - Validation of help keys
 * - Categorization for organization
 * - Tracking coverage
 * - AI guidance for content generation
 */

export interface HelpKeyDefinition {
  key: string
  category: string
  location: string // Where in the UI this key is used
  description: string // Brief description for AI context

  // AI Guidance fields (optional, for enhanced AI content generation)
  aiGuidance?: string // Instructions for AI when writing help for this element
  commonQuestions?: string[] // Common questions users ask about this element
  relatedKeys?: string[] // Related help keys for cross-referencing
  difficulty?: 'basic' | 'intermediate' | 'advanced' // Complexity level
  entityAware?: boolean // Can have entity-specific content (e.g., help for specific product)
  suggestedFormat?: 'brief' | 'detailed' | 'tutorial' // Recommended content format
  includeMedia?: boolean // Suggests video/image would help
}

/**
 * AI Guidance definitions for categories
 * These provide default guidance when individual keys don't have specific guidance
 */
export const categoryGuidance: Record<string, {
  aiGuidance: string
  suggestedFormat: 'brief' | 'detailed' | 'tutorial'
  difficulty: 'basic' | 'intermediate' | 'advanced'
}> = {
  header: {
    aiGuidance: 'Keep explanations brief. Focus on what the action does and keyboard shortcuts if available.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  },
  sidebar: {
    aiGuidance: 'Explain what section this navigates to and what users can do there. Keep brief.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  },
  dashboard: {
    aiGuidance: 'Explain what the metric shows and how to interpret it. Include tips for improving numbers if relevant.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  },
  products: {
    aiGuidance: 'Product management is core to the store. Explain clearly with examples. Users often struggle with variants, pricing, and inventory.',
    suggestedFormat: 'detailed',
    difficulty: 'intermediate',
  },
  orders: {
    aiGuidance: 'Order management is time-sensitive. Focus on status meanings, next actions, and common workflows.',
    suggestedFormat: 'detailed',
    difficulty: 'intermediate',
  },
  customers: {
    aiGuidance: 'Customer data is sensitive. Emphasize what can be viewed vs edited. Explain relationship to orders.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  },
  pages: {
    aiGuidance: 'Page building uses Puck editor. Explain the visual editor concept and how to add/arrange components.',
    suggestedFormat: 'tutorial',
    difficulty: 'intermediate',
  },
  blog: {
    aiGuidance: 'Blog supports both simple and visual (Puck) editors. Explain SEO implications of titles, slugs, and categories.',
    suggestedFormat: 'detailed',
    difficulty: 'intermediate',
  },
  workflows: {
    aiGuidance: 'Workflows are advanced automation. Explain triggers, conditions, and actions clearly. This is power-user territory.',
    suggestedFormat: 'tutorial',
    difficulty: 'advanced',
  },
  forms: {
    aiGuidance: 'Form builder creates data collection forms. Explain field types and where submissions go.',
    suggestedFormat: 'detailed',
    difficulty: 'intermediate',
  },
  media: {
    aiGuidance: 'Media library stores images and files. Explain upload limits, formats supported, and how to use media in content.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  },
  settings: {
    aiGuidance: 'Settings affect the entire store. Be careful to explain implications of changes. Some settings require technical knowledge.',
    suggestedFormat: 'detailed',
    difficulty: 'advanced',
  },
  shipping: {
    aiGuidance: 'Shipping configuration affects checkout. Explain carrier integrations, zones, and rate calculations.',
    suggestedFormat: 'detailed',
    difficulty: 'advanced',
  },
  analytics: {
    aiGuidance: 'Analytics help understand store performance. Explain what metrics mean and how to use insights.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  },
  users: {
    aiGuidance: 'User management controls who can access admin. Explain roles, permissions, and security implications.',
    suggestedFormat: 'detailed',
    difficulty: 'intermediate',
  },
  roles: {
    aiGuidance: 'Role-based access control is advanced. Explain permission inheritance and the principle of least privilege.',
    suggestedFormat: 'tutorial',
    difficulty: 'advanced',
  },
  'email-marketing': {
    aiGuidance: 'Email marketing involves campaigns, templates, and lists. Explain deliverability and compliance (CAN-SPAM, GDPR).',
    suggestedFormat: 'detailed',
    difficulty: 'intermediate',
  },
  mcp: {
    aiGuidance: 'MCP (Model Context Protocol) enables AI agents to interact with the CMS. Keep explanations simple - focus on practical setup steps and security. Users may be new to AI integration concepts.',
    suggestedFormat: 'tutorial',
    difficulty: 'intermediate',
  },
}

/**
 * Get AI guidance for a help key
 * Returns specific guidance if available, otherwise category guidance
 */
export function getAIGuidance(key: string): {
  aiGuidance: string
  suggestedFormat: 'brief' | 'detailed' | 'tutorial'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  commonQuestions?: string[]
  relatedKeys?: string[]
} {
  const keyDef = helpKeyRegistry.find(k => k.key === key)

  if (keyDef?.aiGuidance) {
    return {
      aiGuidance: keyDef.aiGuidance,
      suggestedFormat: keyDef.suggestedFormat || 'brief',
      difficulty: keyDef.difficulty || 'basic',
      commonQuestions: keyDef.commonQuestions,
      relatedKeys: keyDef.relatedKeys,
    }
  }

  const category = keyDef?.category || key.split('.')[1] || 'general'
  const catGuidance = categoryGuidance[category]

  if (catGuidance) {
    return {
      ...catGuidance,
      commonQuestions: keyDef?.commonQuestions,
      relatedKeys: keyDef?.relatedKeys,
    }
  }

  return {
    aiGuidance: 'Provide clear, concise help for this UI element. Focus on what it does and how to use it.',
    suggestedFormat: 'brief',
    difficulty: 'basic',
  }
}

/**
 * All registered help keys organized by category
 */
export const helpKeyRegistry: HelpKeyDefinition[] = [
  // Admin Header
  {
    key: 'admin.header.search',
    category: 'header',
    location: 'Admin header - search bar',
    description: 'Global search input in the admin header',
  },
  {
    key: 'admin.header.notifications',
    category: 'header',
    location: 'Admin header - notifications button',
    description: 'Notifications bell icon button',
  },
  {
    key: 'admin.header.help',
    category: 'header',
    location: 'Admin header - help button',
    description: 'Help mode toggle button',
  },

  // Admin Sidebar
  {
    key: 'admin.sidebar.user-info',
    category: 'sidebar',
    location: 'Admin sidebar - user info section',
    description: 'Logged-in user info display',
  },
  {
    key: 'admin.sidebar.view-site',
    category: 'sidebar',
    location: 'Admin sidebar - view site link',
    description: 'Link to view the live storefront',
  },
  {
    key: 'admin.sidebar.sign-out',
    category: 'sidebar',
    location: 'Admin sidebar - sign out button',
    description: 'Sign out/logout button',
  },
  {
    key: 'admin.sidebar.collapse',
    category: 'sidebar',
    location: 'Admin sidebar - collapse toggle',
    description: 'Sidebar expand/collapse toggle',
  },
  {
    key: 'admin.sidebar.dashboard',
    category: 'sidebar',
    location: 'Admin sidebar - dashboard link',
    description: 'Navigation link to dashboard',
  },
  {
    key: 'admin.sidebar.products',
    category: 'sidebar',
    location: 'Admin sidebar - products link',
    description: 'Navigation link to products',
  },
  {
    key: 'admin.sidebar.orders',
    category: 'sidebar',
    location: 'Admin sidebar - orders link',
    description: 'Navigation link to orders',
  },
  {
    key: 'admin.sidebar.customers',
    category: 'sidebar',
    location: 'Admin sidebar - customers link',
    description: 'Navigation link to customers',
  },
  {
    key: 'admin.sidebar.pages',
    category: 'sidebar',
    location: 'Admin sidebar - pages link',
    description: 'Navigation link to pages',
  },
  {
    key: 'admin.sidebar.blog',
    category: 'sidebar',
    location: 'Admin sidebar - blog link',
    description: 'Navigation link to blog',
  },
  {
    key: 'admin.sidebar.media',
    category: 'sidebar',
    location: 'Admin sidebar - media link',
    description: 'Navigation link to media library',
  },
  {
    key: 'admin.sidebar.settings',
    category: 'sidebar',
    location: 'Admin sidebar - settings link',
    description: 'Navigation link to settings',
  },

  // Dashboard Page
  {
    key: 'admin.dashboard.metrics',
    category: 'dashboard',
    location: 'Dashboard page - metrics section',
    description: 'Performance metrics and charts',
  },
  {
    key: 'admin.dashboard.quick-actions',
    category: 'dashboard',
    location: 'Dashboard page - quick actions panel',
    description: 'Quick action buttons panel',
  },
  {
    key: 'admin.dashboard.stats',
    category: 'dashboard',
    location: 'Dashboard page - stats grid',
    description: 'Overview statistics cards grid',
  },
  {
    key: 'admin.dashboard.stat.users',
    category: 'dashboard',
    location: 'Dashboard page - users stat card',
    description: 'Total users statistic card',
  },
  {
    key: 'admin.dashboard.stat.products',
    category: 'dashboard',
    location: 'Dashboard page - products stat card',
    description: 'Total products statistic card',
  },
  {
    key: 'admin.dashboard.stat.orders',
    category: 'dashboard',
    location: 'Dashboard page - orders stat card',
    description: 'Total orders statistic card',
  },
  {
    key: 'admin.dashboard.stat.blog',
    category: 'dashboard',
    location: 'Dashboard page - blog stat card',
    description: 'Total blog posts statistic card',
  },
  {
    key: 'admin.dashboard.quick-links',
    category: 'dashboard',
    location: 'Dashboard page - quick links card',
    description: 'Quick navigation links card',
  },
  {
    key: 'admin.dashboard.content-management',
    category: 'dashboard',
    location: 'Dashboard page - content management card',
    description: 'Content management links card',
  },

  // Products Page
  {
    key: 'admin.products.actions',
    category: 'products',
    location: 'Products page - action buttons',
    description: 'Product action buttons (refresh, add)',
  },
  {
    key: 'admin.products.refresh',
    category: 'products',
    location: 'Products page - refresh button',
    description: 'Refresh product list button',
  },
  {
    key: 'admin.products.add',
    category: 'products',
    location: 'Products page - add button',
    description: 'Add new product button',
  },
  {
    key: 'admin.products.tabs',
    category: 'products',
    location: 'Products page - status tabs',
    description: 'Product status filter tabs',
  },
  {
    key: 'admin.products.filters',
    category: 'products',
    location: 'Products page - filter section',
    description: 'Product filter controls',
  },
  {
    key: 'admin.products.search',
    category: 'products',
    location: 'Products page - search input',
    description: 'Product search input',
  },
  {
    key: 'admin.products.table',
    category: 'products',
    location: 'Products page - products table',
    description: 'Products data table',
  },
  {
    key: 'admin.products.list',
    category: 'products',
    location: 'Products page - product list',
    description: 'Product listing view',
  },
  {
    key: 'admin.products.create',
    category: 'products',
    location: 'Products - create form',
    description: 'New product creation form',
  },
  {
    key: 'admin.products.variants',
    category: 'products',
    location: 'Product detail - variants section',
    description: 'Product variants management',
    aiGuidance: 'Variants are product variations like size, color, or material. Explain the relationship between options (attributes) and variants (combinations). Users often struggle with: setting different prices per variant, managing inventory per variant, and understanding that variants are generated from option combinations.',
    commonQuestions: [
      'How do I set different prices for each variant?',
      'Can variants have their own images?',
      'How do I track inventory per variant?',
      'What happens if I add a new option to an existing product?',
    ],
    relatedKeys: ['admin.products.inventory', 'admin.products.pricing', 'admin.products.create'],
    difficulty: 'intermediate',
    entityAware: true,
    suggestedFormat: 'detailed',
    includeMedia: true,
  },
  {
    key: 'admin.products.inventory',
    category: 'products',
    location: 'Product detail - inventory section',
    description: 'Product inventory management',
    aiGuidance: 'Inventory tracking helps prevent overselling. Explain the difference between tracked and untracked inventory, low stock alerts, and how inventory syncs with variants. Mention that inventory can be managed per-variant if variants exist.',
    commonQuestions: [
      'How do I set low stock alerts?',
      'What happens when inventory reaches zero?',
      'Can I allow backorders?',
      'How do I adjust inventory after a physical count?',
    ],
    relatedKeys: ['admin.products.variants', 'admin.orders.fulfillment'],
    difficulty: 'intermediate',
    entityAware: true,
    suggestedFormat: 'detailed',
  },
  {
    key: 'admin.products.pricing',
    category: 'products',
    location: 'Product detail - pricing section',
    description: 'Product pricing configuration',
    aiGuidance: 'Pricing affects checkout and can be complex with variants. Explain base price vs variant prices, compare-at prices (for sales), cost tracking for margin calculations, and tax settings. Currency is configured at store level.',
    commonQuestions: [
      'How do I put a product on sale?',
      'Can different variants have different prices?',
      'How do I track product costs for margin reporting?',
      'Are prices inclusive or exclusive of tax?',
    ],
    relatedKeys: ['admin.products.variants', 'admin.settings.taxes'],
    difficulty: 'intermediate',
    entityAware: true,
    suggestedFormat: 'detailed',
  },

  // Orders Page
  {
    key: 'admin.orders.actions',
    category: 'orders',
    location: 'Orders page - action buttons',
    description: 'Order action buttons',
  },
  {
    key: 'admin.orders.refresh',
    category: 'orders',
    location: 'Orders page - refresh button',
    description: 'Refresh orders button',
  },
  {
    key: 'admin.orders.export',
    category: 'orders',
    location: 'Orders page - export button',
    description: 'Export orders to CSV button',
  },
  {
    key: 'admin.orders.new',
    category: 'orders',
    location: 'Orders page - new order button',
    description: 'Create new order button',
  },
  {
    key: 'admin.orders.stats',
    category: 'orders',
    location: 'Orders page - stats cards',
    description: 'Order statistics cards',
  },
  {
    key: 'admin.orders.tabs',
    category: 'orders',
    location: 'Orders page - status tabs',
    description: 'Order status filter tabs',
  },
  {
    key: 'admin.orders.filters',
    category: 'orders',
    location: 'Orders page - filter section',
    description: 'Order filter controls',
  },
  {
    key: 'admin.orders.search',
    category: 'orders',
    location: 'Orders page - search input',
    description: 'Order search input',
  },
  {
    key: 'admin.orders.bulk-actions',
    category: 'orders',
    location: 'Orders page - bulk actions bar',
    description: 'Bulk order actions panel',
  },
  {
    key: 'admin.orders.table',
    category: 'orders',
    location: 'Orders page - orders table',
    description: 'Orders data table',
  },
  {
    key: 'admin.orders.list',
    category: 'orders',
    location: 'Orders page - order list',
    description: 'Order listing view',
  },
  {
    key: 'admin.orders.details',
    category: 'orders',
    location: 'Order detail page',
    description: 'Single order detail view',
  },
  {
    key: 'admin.orders.status',
    category: 'orders',
    location: 'Order - status section',
    description: 'Order status display/management',
  },
  {
    key: 'admin.orders.refund',
    category: 'orders',
    location: 'Order - refund dialog',
    description: 'Order refund processing',
  },

  // Customers
  {
    key: 'admin.customers.list',
    category: 'customers',
    location: 'Customers page - customer list',
    description: 'Customer listing view',
  },
  {
    key: 'admin.customers.profile',
    category: 'customers',
    location: 'Customer detail page',
    description: 'Individual customer profile',
  },

  // Pages
  {
    key: 'admin.pages.list',
    category: 'pages',
    location: 'Pages page - page list',
    description: 'CMS pages listing',
  },
  {
    key: 'admin.pages.editor',
    category: 'pages',
    location: 'Page editor (Puck)',
    description: 'Visual page editor',
  },

  // Blog
  {
    key: 'admin.blog.page',
    category: 'blog',
    location: 'Blog page - main container',
    description: 'Blog posts page container',
  },
  {
    key: 'admin.blog.actions',
    category: 'blog',
    location: 'Blog page - action buttons',
    description: 'Blog action buttons (categories, tags, refresh, new)',
  },
  {
    key: 'admin.blog.categories',
    category: 'blog',
    location: 'Blog page - categories button',
    description: 'Navigate to blog categories',
  },
  {
    key: 'admin.blog.tags',
    category: 'blog',
    location: 'Blog page - tags button',
    description: 'Navigate to blog tags',
  },
  {
    key: 'admin.blog.refresh',
    category: 'blog',
    location: 'Blog page - refresh button',
    description: 'Refresh blog posts list',
  },
  {
    key: 'admin.blog.new',
    category: 'blog',
    location: 'Blog page - new post button',
    description: 'Create new blog post',
  },
  {
    key: 'admin.blog.tabs',
    category: 'blog',
    location: 'Blog page - status tabs',
    description: 'Blog post status filter tabs',
  },
  {
    key: 'admin.blog.filters',
    category: 'blog',
    location: 'Blog page - filter section',
    description: 'Blog post filter controls',
  },
  {
    key: 'admin.blog.search',
    category: 'blog',
    location: 'Blog page - search input',
    description: 'Blog post search input',
  },
  {
    key: 'admin.blog.status-filter',
    category: 'blog',
    location: 'Blog page - status filter',
    description: 'Blog post status filter dropdown',
  },
  {
    key: 'admin.blog.table',
    category: 'blog',
    location: 'Blog page - posts table',
    description: 'Blog posts data table',
  },
  {
    key: 'admin.blog.list',
    category: 'blog',
    location: 'Blog page - post list',
    description: 'Blog posts listing',
  },
  {
    key: 'admin.blog.editor',
    category: 'blog',
    location: 'Blog post editor',
    description: 'Blog post editor',
  },

  // Media
  {
    key: 'admin.media.page',
    category: 'media',
    location: 'Media page - main container',
    description: 'Media manager page container',
  },
  {
    key: 'admin.media.header',
    category: 'media',
    location: 'Media page - header',
    description: 'Media manager header section',
  },
  {
    key: 'admin.media.manager',
    category: 'media',
    location: 'Media page - manager component',
    description: 'Media manager component',
  },
  {
    key: 'admin.media.library',
    category: 'media',
    location: 'Media library page',
    description: 'Media file management',
  },

  // Email Marketing
  {
    key: 'admin.email-marketing.page',
    category: 'email-marketing',
    location: 'Email Marketing page - main container',
    description: 'Email marketing page container',
  },
  {
    key: 'admin.email-marketing.header',
    category: 'email-marketing',
    location: 'Email Marketing page - header',
    description: 'Email marketing page header section',
  },
  {
    key: 'admin.email-marketing.actions',
    category: 'email-marketing',
    location: 'Email Marketing page - action buttons',
    description: 'Email marketing action buttons',
  },
  {
    key: 'admin.email-marketing.refresh',
    category: 'email-marketing',
    location: 'Email Marketing page - refresh button',
    description: 'Refresh campaigns list',
  },
  {
    key: 'admin.email-marketing.new',
    category: 'email-marketing',
    location: 'Email Marketing page - new campaign button',
    description: 'Create new email campaign',
  },
  {
    key: 'admin.email-marketing.stats',
    category: 'email-marketing',
    location: 'Email Marketing page - stats cards',
    description: 'Email marketing statistics cards',
  },
  {
    key: 'admin.email-marketing.tabs',
    category: 'email-marketing',
    location: 'Email Marketing page - tabs',
    description: 'Email marketing tabs (campaigns, automated, templates, subscribers)',
  },
  {
    key: 'admin.email-marketing.campaigns-tab',
    category: 'email-marketing',
    location: 'Email Marketing page - campaigns tab',
    description: 'All campaigns tab content',
  },
  {
    key: 'admin.email-marketing.filters',
    category: 'email-marketing',
    location: 'Email Marketing page - filter section',
    description: 'Campaign filter controls',
  },
  {
    key: 'admin.email-marketing.search',
    category: 'email-marketing',
    location: 'Email Marketing page - search input',
    description: 'Campaign search input',
  },
  {
    key: 'admin.email-marketing.status-filter',
    category: 'email-marketing',
    location: 'Email Marketing page - status filter',
    description: 'Campaign status filter dropdown',
  },
  {
    key: 'admin.email-marketing.type-filter',
    category: 'email-marketing',
    location: 'Email Marketing page - type filter',
    description: 'Campaign type filter dropdown',
  },
  {
    key: 'admin.email-marketing.table',
    category: 'email-marketing',
    location: 'Email Marketing page - campaigns table',
    description: 'Campaigns data table',
  },
  {
    key: 'admin.email-marketing.automated-tab',
    category: 'email-marketing',
    location: 'Email Marketing page - automated tab',
    description: 'Automated workflows tab',
  },
  {
    key: 'admin.email-marketing.automated-workflows',
    category: 'email-marketing',
    location: 'Email Marketing page - automated workflows',
    description: 'Automated email workflows configuration',
  },
  {
    key: 'admin.email-marketing.templates-tab',
    category: 'email-marketing',
    location: 'Email Marketing page - templates tab',
    description: 'Email templates tab',
  },
  {
    key: 'admin.email-marketing.templates',
    category: 'email-marketing',
    location: 'Email Marketing page - templates',
    description: 'Email templates management',
  },
  {
    key: 'admin.email-marketing.subscribers-tab',
    category: 'email-marketing',
    location: 'Email Marketing page - subscribers tab',
    description: 'Subscribers tab',
  },
  {
    key: 'admin.email-marketing.subscribers',
    category: 'email-marketing',
    location: 'Email Marketing page - subscribers',
    description: 'Email subscribers management',
  },
  {
    key: 'admin.email-marketing.features-info',
    category: 'email-marketing',
    location: 'Email Marketing page - features info',
    description: 'Email marketing features information',
  },

  // Shipping
  {
    key: 'admin.shipping.page',
    category: 'shipping',
    location: 'Shipping page - main container',
    description: 'Shipping page container',
  },
  {
    key: 'admin.shipping.tabs',
    category: 'shipping',
    location: 'Shipping page - tabs',
    description: 'Shipping tabs (create, settings, shipments)',
  },
  {
    key: 'admin.shipping.create',
    category: 'shipping',
    location: 'Shipping page - create tab',
    description: 'Create shipment tab',
  },
  {
    key: 'admin.shipping.settings',
    category: 'shipping',
    location: 'Shipping page - settings tab',
    description: 'Shipping settings tab',
  },
  {
    key: 'admin.shipping.shipments-list',
    category: 'shipping',
    location: 'Shipping page - shipments list tab',
    description: 'Shipments list tab',
  },
  {
    key: 'admin.shipping.api-config',
    category: 'shipping',
    location: 'Shipping page - API config',
    description: 'Shipping API configuration',
  },
  {
    key: 'admin.shipping.from-address',
    category: 'shipping',
    location: 'Shipping page - from address',
    description: 'Default from address configuration',
  },
  {
    key: 'admin.shipping.carriers',
    category: 'shipping',
    location: 'Shipping page - carriers',
    description: 'Shipping carriers configuration',
  },
  {
    key: 'admin.shipping.save',
    category: 'shipping',
    location: 'Shipping page - save button',
    description: 'Save shipping settings button',
  },

  // Customers
  {
    key: 'admin.customers.page',
    category: 'customers',
    location: 'Customers page - main container',
    description: 'Customers page container',
  },
  {
    key: 'admin.customers.actions',
    category: 'customers',
    location: 'Customers page - action buttons',
    description: 'Customer action buttons',
  },
  {
    key: 'admin.customers.create',
    category: 'customers',
    location: 'Customers page - create button',
    description: 'Create new customer button',
  },
  {
    key: 'admin.customers.export',
    category: 'customers',
    location: 'Customers page - export button',
    description: 'Export customers button',
  },
  {
    key: 'admin.customers.stats',
    category: 'customers',
    location: 'Customers page - stats cards',
    description: 'Customer statistics cards',
  },
  {
    key: 'admin.customers.filters',
    category: 'customers',
    location: 'Customers page - filter section',
    description: 'Customer filter controls',
  },
  {
    key: 'admin.customers.search',
    category: 'customers',
    location: 'Customers page - search input',
    description: 'Customer search input',
  },
  {
    key: 'admin.customers.table',
    category: 'customers',
    location: 'Customers page - customers table',
    description: 'Customers data table',
  },

  // Pages
  {
    key: 'admin.pages.page',
    category: 'pages',
    location: 'Pages page - main container',
    description: 'Pages management page container',
  },
  {
    key: 'admin.pages.actions',
    category: 'pages',
    location: 'Pages page - action buttons',
    description: 'Page action buttons',
  },
  {
    key: 'admin.pages.refresh',
    category: 'pages',
    location: 'Pages page - refresh button',
    description: 'Refresh pages list',
  },
  {
    key: 'admin.pages.new',
    category: 'pages',
    location: 'Pages page - new button',
    description: 'Create new page button',
  },
  {
    key: 'admin.pages.layout',
    category: 'pages',
    location: 'Pages page - layout section',
    description: 'Pages layout container',
  },
  {
    key: 'admin.pages.stats',
    category: 'pages',
    location: 'Pages page - stats cards',
    description: 'Page statistics cards',
  },
  {
    key: 'admin.pages.filters',
    category: 'pages',
    location: 'Pages page - filter section',
    description: 'Page filter controls',
  },
  {
    key: 'admin.pages.search',
    category: 'pages',
    location: 'Pages page - search input',
    description: 'Page search input',
  },
  {
    key: 'admin.pages.table',
    category: 'pages',
    location: 'Pages page - pages table',
    description: 'Pages data table',
  },

  // Settings
  {
    key: 'admin.settings.page',
    category: 'settings',
    location: 'Settings page - main container',
    description: 'Settings page container',
  },
  {
    key: 'admin.settings.header',
    category: 'settings',
    location: 'Settings page - header',
    description: 'Settings page header section',
  },
  {
    key: 'admin.settings.tabs',
    category: 'settings',
    location: 'Settings page - tab navigation',
    description: 'Settings category tabs',
  },
  {
    key: 'admin.settings.branding-tab',
    category: 'settings',
    location: 'Settings - branding tab',
    description: 'Branding and logo settings',
  },
  {
    key: 'admin.settings.email-tab',
    category: 'settings',
    location: 'Settings - email tab',
    description: 'Email provider settings',
  },
  {
    key: 'admin.settings.ai-tab',
    category: 'settings',
    location: 'Settings - AI tab',
    description: 'AI assistant settings',
  },
  {
    key: 'admin.settings.store-tab',
    category: 'settings',
    location: 'Settings - store tab',
    description: 'Store information settings',
  },
  {
    key: 'admin.settings.store-info',
    category: 'settings',
    location: 'Settings - store info card',
    description: 'Store information configuration',
  },
  {
    key: 'admin.settings.notifications-tab',
    category: 'settings',
    location: 'Settings - notifications tab',
    description: 'Notification settings',
  },
  {
    key: 'admin.settings.email-notifications',
    category: 'settings',
    location: 'Settings - email notifications card',
    description: 'Email notification preferences',
  },
  {
    key: 'admin.settings.push-notifications',
    category: 'settings',
    location: 'Settings - push notifications card',
    description: 'Push notification settings',
  },
  {
    key: 'admin.settings.shipping-tab',
    category: 'settings',
    location: 'Settings - shipping tab',
    description: 'Shipping settings tab',
  },
  {
    key: 'admin.settings.shipping-config',
    category: 'settings',
    location: 'Settings - shipping config card',
    description: 'Shipping configuration',
  },
  {
    key: 'admin.settings.taxes-tab',
    category: 'settings',
    location: 'Settings - taxes tab',
    description: 'Tax settings tab',
  },
  {
    key: 'admin.settings.tax-config',
    category: 'settings',
    location: 'Settings - tax config card',
    description: 'Tax configuration',
  },
  {
    key: 'admin.settings.environment-tab',
    category: 'settings',
    location: 'Settings - environment tab',
    description: 'Environment variables settings',
  },
  {
    key: 'admin.settings.appearance-tab',
    category: 'settings',
    location: 'Settings - appearance tab',
    description: 'Theme and appearance settings',
  },
  {
    key: 'admin.settings.theme-config',
    category: 'settings',
    location: 'Settings - theme config card',
    description: 'Theme configuration',
  },
  {
    key: 'admin.settings.security-tab',
    category: 'settings',
    location: 'Settings - security tab',
    description: 'Security settings tab',
  },
  {
    key: 'admin.settings.security-config',
    category: 'settings',
    location: 'Settings - security config card',
    description: 'Security configuration',
  },
  {
    key: 'admin.settings.danger-zone',
    category: 'settings',
    location: 'Settings - danger zone card',
    description: 'Dangerous actions like data export and store deletion',
  },
  {
    key: 'admin.settings.actions',
    category: 'settings',
    location: 'Settings - action buttons',
    description: 'Settings save/cancel buttons',
  },
  {
    key: 'admin.settings.save',
    category: 'settings',
    location: 'Settings - save button',
    description: 'Save settings button',
  },
  {
    key: 'admin.settings.cancel',
    category: 'settings',
    location: 'Settings - cancel button',
    description: 'Cancel settings changes button',
  },
  {
    key: 'admin.settings.general',
    category: 'settings',
    location: 'Settings - general tab',
    description: 'General store settings',
  },
  {
    key: 'admin.settings.payments',
    category: 'settings',
    location: 'Settings - payments tab',
    description: 'Payment configuration',
  },
  {
    key: 'admin.settings.shipping',
    category: 'settings',
    location: 'Settings - shipping tab',
    description: 'Shipping configuration',
  },
  {
    key: 'admin.settings.email',
    category: 'settings',
    location: 'Settings - email tab',
    description: 'Email settings',
  },

  // Analytics
  {
    key: 'admin.analytics.dashboard',
    category: 'analytics',
    location: 'Analytics page',
    description: 'Analytics dashboard',
  },
  {
    key: 'admin.analytics.actions',
    category: 'analytics',
    location: 'Analytics page - action buttons',
    description: 'Analytics action buttons (date range, refresh, export)',
  },
  {
    key: 'admin.analytics.date-range',
    category: 'analytics',
    location: 'Analytics page - date range picker',
    description: 'Date range selection for analytics data',
  },
  {
    key: 'admin.analytics.refresh',
    category: 'analytics',
    location: 'Analytics page - refresh button',
    description: 'Refresh analytics data',
  },
  {
    key: 'admin.analytics.export',
    category: 'analytics',
    location: 'Analytics page - export button',
    description: 'Export analytics data',
  },
  {
    key: 'admin.analytics.stats',
    category: 'analytics',
    location: 'Analytics page - stats cards',
    description: 'Analytics statistics cards grid',
  },
  {
    key: 'admin.analytics.tabs',
    category: 'analytics',
    location: 'Analytics page - tabs',
    description: 'Analytics view tabs (overview, products, traffic, customers)',
  },
  {
    key: 'admin.analytics.integrations',
    category: 'analytics',
    location: 'Analytics page - integrations section',
    description: 'Analytics integrations configuration',
  },

  // Users & Roles
  {
    key: 'admin.users',
    category: 'system',
    location: 'Users management page',
    description: 'User account management',
  },
  {
    key: 'admin.users.page',
    category: 'users',
    location: 'Users page - main container',
    description: 'Users management page container',
  },
  {
    key: 'admin.users.header',
    category: 'users',
    location: 'Users page - header',
    description: 'Users page header section',
  },
  {
    key: 'admin.users.actions',
    category: 'users',
    location: 'Users page - action buttons',
    description: 'User management action buttons',
  },
  {
    key: 'admin.users.refresh',
    category: 'users',
    location: 'Users page - refresh button',
    description: 'Refresh users list',
  },
  {
    key: 'admin.users.stats',
    category: 'users',
    location: 'Users page - stats cards',
    description: 'User statistics cards',
  },
  {
    key: 'admin.users.filters',
    category: 'users',
    location: 'Users page - filter section',
    description: 'User filter controls',
  },
  {
    key: 'admin.users.search',
    category: 'users',
    location: 'Users page - search input',
    description: 'User search input',
  },
  {
    key: 'admin.users.table',
    category: 'users',
    location: 'Users page - users table',
    description: 'Users data table',
  },
  {
    key: 'admin.users.quick-actions',
    category: 'users',
    location: 'Users page - quick actions',
    description: 'Quick action buttons for user management',
  },
  {
    key: 'admin.roles',
    category: 'system',
    location: 'Roles & permissions page',
    description: 'Role and permission management',
  },
  {
    key: 'admin.roles.page',
    category: 'roles',
    location: 'Roles page - main container',
    description: 'Roles management page container',
  },
  {
    key: 'admin.roles.header',
    category: 'roles',
    location: 'Roles page - header',
    description: 'Roles page header section',
  },
  {
    key: 'admin.roles.actions',
    category: 'roles',
    location: 'Roles page - action buttons',
    description: 'Role management action buttons',
  },
  {
    key: 'admin.roles.seed',
    category: 'roles',
    location: 'Roles page - seed button',
    description: 'Seed built-in roles button',
  },
  {
    key: 'admin.roles.refresh',
    category: 'roles',
    location: 'Roles page - refresh button',
    description: 'Refresh roles list',
  },
  {
    key: 'admin.roles.create',
    category: 'roles',
    location: 'Roles page - create button',
    description: 'Create new role button',
  },
  {
    key: 'admin.roles.stats',
    category: 'roles',
    location: 'Roles page - stats cards',
    description: 'Role statistics cards',
  },
  {
    key: 'admin.roles.filters',
    category: 'roles',
    location: 'Roles page - filter section',
    description: 'Role filter controls',
  },
  {
    key: 'admin.roles.search',
    category: 'roles',
    location: 'Roles page - search input',
    description: 'Role search input',
  },
  {
    key: 'admin.roles.list',
    category: 'roles',
    location: 'Roles page - roles list',
    description: 'Roles listing view',
  },
  {
    key: 'admin.roles.help-section',
    category: 'roles',
    location: 'Roles page - help section',
    description: 'About Roles & Permissions info card',
  },
  {
    key: 'admin.workflows',
    category: 'system',
    location: 'Workflows page',
    description: 'Workflow automation',
  },
  {
    key: 'admin.workflows.page',
    category: 'workflows',
    location: 'Workflows page - main container',
    description: 'Workflows page container',
  },
  {
    key: 'admin.workflows.header',
    category: 'workflows',
    location: 'Workflows page - header',
    description: 'Workflows page header section',
  },
  {
    key: 'admin.workflows.new',
    category: 'workflows',
    location: 'Workflows page - new button',
    description: 'Create new workflow button',
  },
  {
    key: 'admin.workflows.table',
    category: 'workflows',
    location: 'Workflows page - workflows table',
    description: 'Workflows data table',
  },
  {
    key: 'admin.workflows.empty',
    category: 'workflows',
    location: 'Workflows page - empty state',
    description: 'Empty state when no workflows exist',
  },
  {
    key: 'admin.forms',
    category: 'content',
    location: 'Forms page',
    description: 'Form builder and submissions',
  },
  {
    key: 'admin.forms.page',
    category: 'forms',
    location: 'Forms page - main container',
    description: 'Forms page container',
  },
  {
    key: 'admin.forms.header',
    category: 'forms',
    location: 'Forms page - header',
    description: 'Forms page header section',
  },
  {
    key: 'admin.forms.actions',
    category: 'forms',
    location: 'Forms page - action buttons',
    description: 'Form management action buttons',
  },
  {
    key: 'admin.forms.refresh',
    category: 'forms',
    location: 'Forms page - refresh button',
    description: 'Refresh forms list',
  },
  {
    key: 'admin.forms.new',
    category: 'forms',
    location: 'Forms page - new button',
    description: 'Create new form button',
  },
  {
    key: 'admin.forms.stats',
    category: 'forms',
    location: 'Forms page - stats cards',
    description: 'Form statistics cards',
  },
  {
    key: 'admin.forms.filters',
    category: 'forms',
    location: 'Forms page - filter section',
    description: 'Form filter controls',
  },
  {
    key: 'admin.forms.search',
    category: 'forms',
    location: 'Forms page - search input',
    description: 'Form search input',
  },
  {
    key: 'admin.forms.table',
    category: 'forms',
    location: 'Forms page - forms table',
    description: 'Forms data table',
  },
  {
    key: 'admin.forms.types-info',
    category: 'forms',
    location: 'Forms page - types info section',
    description: 'Form types information card',
  },

  // Puck Editor
  {
    key: 'puck.editor',
    category: 'puck',
    location: 'Puck visual editor',
    description: 'Main Puck editor interface',
  },
  {
    key: 'puck.components',
    category: 'puck',
    location: 'Puck - component library',
    description: 'Component library panel',
  },

  // Common Actions
  {
    key: 'action.save',
    category: 'actions',
    location: 'Various - save buttons',
    description: 'Save action button',
  },
  {
    key: 'action.publish',
    category: 'actions',
    location: 'Various - publish buttons',
    description: 'Publish action button',
  },
  {
    key: 'action.delete',
    category: 'actions',
    location: 'Various - delete buttons',
    description: 'Delete action button',
  },

  // Form Elements
  {
    key: 'form.required',
    category: 'forms',
    location: 'Various forms - required fields',
    description: 'Required field indicator',
  },

  // Common UI
  {
    key: 'ui.search',
    category: 'ui',
    location: 'Various - search inputs',
    description: 'Generic search input',
  },
  {
    key: 'ui.filter',
    category: 'ui',
    location: 'Various - filter controls',
    description: 'Generic filter controls',
  },
  {
    key: 'ui.pagination',
    category: 'ui',
    location: 'Various - pagination',
    description: 'Pagination controls',
  },
  {
    key: 'ui.bulk.actions',
    category: 'ui',
    location: 'Various - bulk action bars',
    description: 'Bulk actions panel',
  },

  // Help System
  {
    key: 'admin.help.mode',
    category: 'help',
    location: 'Help mode overlay',
    description: 'Help mode interface',
  },
  {
    key: 'admin.chat.assistant',
    category: 'help',
    location: 'AI chat assistant',
    description: 'AI chat assistant panel',
  },

  // Dashboard Sidebar
  {
    key: 'dashboard.sidebar.sites',
    category: 'sidebar',
    location: 'Dashboard sidebar - site selector',
    description: 'Dropdown to select and switch between your sites',
  },
  {
    key: 'dashboard.sidebar.overview',
    category: 'sidebar',
    location: 'Dashboard sidebar - overview link',
    description: 'Navigation to dashboard overview',
  },
  {
    key: 'dashboard.sidebar.analytics',
    category: 'sidebar',
    location: 'Dashboard sidebar - analytics link',
    description: 'Navigation to site analytics',
  },
  {
    key: 'dashboard.sidebar.visibility',
    category: 'sidebar',
    location: 'Dashboard sidebar - site visibility link',
    description: 'Navigation to site visibility settings',
  },
  {
    key: 'dashboard.sidebar.domains',
    category: 'sidebar',
    location: 'Dashboard sidebar - custom domains link',
    description: 'Navigation to custom domain management',
  },
  {
    key: 'dashboard.sidebar.settings',
    category: 'sidebar',
    location: 'Dashboard sidebar - site settings link',
    description: 'Navigation to site settings',
  },
  {
    key: 'dashboard.sidebar.appearance',
    category: 'sidebar',
    location: 'Dashboard sidebar - appearance link',
    description: 'Navigation to theme and appearance settings',
  },
  {
    key: 'dashboard.sidebar.frontend',
    category: 'sidebar',
    location: 'Dashboard sidebar - hosting link',
    description: 'Navigation to frontend hosting settings',
  },
  {
    key: 'dashboard.sidebar.security',
    category: 'sidebar',
    location: 'Dashboard sidebar - security link',
    description: 'Navigation to security settings',
  },
  {
    key: 'dashboard.sidebar.teams',
    category: 'sidebar',
    location: 'Dashboard sidebar - teams link',
    description: 'Navigation to team collaboration settings',
  },
  {
    key: 'dashboard.sidebar.billing',
    category: 'sidebar',
    location: 'Dashboard sidebar - billing link',
    description: 'Navigation to billing and subscription',
  },
  {
    key: 'dashboard.header.help',
    category: 'header',
    location: 'Dashboard sidebar - help button',
    description: 'Toggle help mode on/off',
  },
  {
    key: 'dashboard.header.user',
    category: 'header',
    location: 'Dashboard sidebar - user info',
    description: 'Current user information and sign out',
  },
  {
    key: 'dashboard.sites.list',
    category: 'dashboard',
    location: 'Dashboard - sites list',
    description: 'List of all user sites/subdomains',
  },
  {
    key: 'dashboard.sites.create',
    category: 'dashboard',
    location: 'Dashboard - create site button',
    description: 'Button to create a new site',
  },

  // MCP Integration (Dashboard)
  {
    key: 'dashboard.mcp.page',
    category: 'mcp',
    location: 'Dashboard - MCP Integration page',
    description: 'MCP integration main page for connecting AI agents',
    aiGuidance: 'MCP (Model Context Protocol) enables AI agents to interact with the CMS. Explain the concept simply - it\'s like giving AI assistants API access to manage content.',
    commonQuestions: [
      'What is MCP?',
      'How do I connect my AI assistant?',
      'What can AI agents do with my CMS?',
      'Is MCP secure?',
    ],
    relatedKeys: ['dashboard.mcp.quickstart', 'dashboard.mcp.config', 'admin.settings.mcp-api-keys'],
    difficulty: 'intermediate',
    suggestedFormat: 'detailed',
  },
  {
    key: 'dashboard.mcp.quickstart',
    category: 'mcp',
    location: 'Dashboard - MCP Quick Start guide',
    description: 'Step-by-step guide to connect AI agents via MCP',
    aiGuidance: 'Walk users through the 3 simple steps: get an API key, copy configuration, add to their AI client.',
    difficulty: 'basic',
    suggestedFormat: 'tutorial',
  },
  {
    key: 'dashboard.mcp.config',
    category: 'mcp',
    location: 'Dashboard - MCP Configuration examples',
    description: 'Copy-paste configurations for Claude Desktop, Claude Code, Cursor, etc.',
    aiGuidance: 'Configuration examples are ready to copy. Users just need to replace the API key placeholder with their actual key.',
    difficulty: 'basic',
    suggestedFormat: 'brief',
  },
  {
    key: 'dashboard.mcp.tools',
    category: 'mcp',
    location: 'Dashboard - MCP Available tools',
    description: 'List of MCP tools AI agents can use',
    aiGuidance: 'Explain what each tool does and whether it requires read or write permissions. Tools include product management, order viewing, blog posting, and page editing.',
    difficulty: 'intermediate',
    suggestedFormat: 'detailed',
  },
  {
    key: 'dashboard.sidebar.mcp',
    category: 'sidebar',
    location: 'Dashboard sidebar - MCP navigation',
    description: 'Navigation to MCP/AI Agents integration page',
    aiGuidance: 'MCP allows AI assistants to manage CMS content. This takes you to the integration setup page.',
    difficulty: 'basic',
    suggestedFormat: 'brief',
  },

  // MCP API Keys (Admin Settings)
  {
    key: 'admin.settings.mcp-api-keys',
    category: 'settings',
    location: 'Settings - Security tab - MCP API Keys section',
    description: 'API key management for MCP authentication',
    aiGuidance: 'API keys authenticate AI agents. Explain key management: creating with specific scopes, viewing usage, revoking compromised keys. Emphasize security - keys are shown only once at creation.',
    commonQuestions: [
      'How do I create an API key?',
      'What scopes should I give my key?',
      'How do I revoke a key?',
      'Can I see my API key again after creating it?',
    ],
    relatedKeys: ['dashboard.mcp.page', 'admin.settings.security-tab'],
    difficulty: 'intermediate',
    suggestedFormat: 'detailed',
    includeMedia: true,
  },
]

/**
 * Get all help keys as a simple array
 */
export function getAllHelpKeys(): string[] {
  return helpKeyRegistry.map(def => def.key)
}

/**
 * Get help keys by category
 */
export function getHelpKeysByCategory(category: string): HelpKeyDefinition[] {
  return helpKeyRegistry.filter(def => def.category === category)
}

/**
 * Get all categories
 */
export function getHelpCategories(): string[] {
  return [...new Set(helpKeyRegistry.map(def => def.category))]
}

/**
 * Check if a help key is registered
 */
export function isValidHelpKey(key: string): boolean {
  return helpKeyRegistry.some(def => def.key === key)
}

/**
 * Get help key definition
 */
export function getHelpKeyDefinition(key: string): HelpKeyDefinition | undefined {
  return helpKeyRegistry.find(def => def.key === key)
}

/**
 * Get help keys summary for AI context
 */
export function getHelpKeysSummary(): {
  total: number
  categories: { name: string; count: number }[]
  keys: { key: string; category: string; description: string }[]
} {
  const categories = getHelpCategories().map(cat => ({
    name: cat,
    count: helpKeyRegistry.filter(def => def.category === cat).length,
  }))

  return {
    total: helpKeyRegistry.length,
    categories,
    keys: helpKeyRegistry.map(def => ({
      key: def.key,
      category: def.category,
      description: def.description,
    })),
  }
}
