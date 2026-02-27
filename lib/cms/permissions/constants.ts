/**
 * Permission Constants
 * Defines all available permissions in the system
 */

// Permission string format: "resource.action"
// Wildcard support: "resource.*" or "*" (super admin)

export const PERMISSIONS = {
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_PUBLISH: 'products.publish',
  PRODUCTS_ALL: 'products.*',

  // Product Variants
  VARIANTS_VIEW: 'variants.view',
  VARIANTS_CREATE: 'variants.create',
  VARIANTS_EDIT: 'variants.edit',
  VARIANTS_DELETE: 'variants.delete',
  VARIANTS_ALL: 'variants.*',

  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_FULFILL: 'orders.fulfill',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_ALL: 'orders.*',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_ALL: 'inventory.*',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_EXPORT: 'customers.export',
  CUSTOMERS_ALL: 'customers.*',

  // Content - Pages
  PAGES_VIEW: 'pages.view',
  PAGES_CREATE: 'pages.create',
  PAGES_EDIT: 'pages.edit',
  PAGES_DELETE: 'pages.delete',
  PAGES_PUBLISH: 'pages.publish',
  PAGES_ALL: 'pages.*',

  // Routes Configuration
  ROUTES_VIEW: 'routes.view',
  ROUTES_CREATE: 'routes.create',
  ROUTES_EDIT: 'routes.edit',
  ROUTES_DELETE: 'routes.delete',
  ROUTES_ALL: 'routes.*',

  // Content - Blog
  BLOG_VIEW: 'blog.view',
  BLOG_CREATE: 'blog.create',
  BLOG_EDIT: 'blog.edit',
  BLOG_DELETE: 'blog.delete',
  BLOG_PUBLISH: 'blog.publish',
  BLOG_ALL: 'blog.*',

  // Media
  MEDIA_VIEW: 'media.view',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_EDIT: 'media.edit',
  MEDIA_DELETE: 'media.delete',
  MEDIA_ALL: 'media.*',

  // Categories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',
  CATEGORIES_ALL: 'categories.*',

  // Custom Fields
  CUSTOM_FIELDS_VIEW: 'custom_fields.view',
  CUSTOM_FIELDS_CREATE: 'custom_fields.create',
  CUSTOM_FIELDS_EDIT: 'custom_fields.edit',
  CUSTOM_FIELDS_DELETE: 'custom_fields.delete',
  CUSTOM_FIELDS_ALL: 'custom_fields.*',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_GENERAL: 'settings.general',
  SETTINGS_PAYMENTS: 'settings.payments',
  SETTINGS_SHIPPING: 'settings.shipping',
  SETTINGS_TAXES: 'settings.taxes',
  SETTINGS_EMAIL: 'settings.email',
  SETTINGS_STORAGE: 'settings.storage',
  SETTINGS_AI: 'settings.ai',
  SETTINGS_ALL: 'settings.*',

  // Users & Roles
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_ROLES: 'users.roles', // Manage role assignments
  USERS_PERMISSIONS: 'users.permissions', // Manage permission overrides
  USERS_ALL: 'users.*',

  // Roles Management
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  ROLES_ALL: 'roles.*',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_ALL: 'analytics.*',

  // Plugins & Workflows
  PLUGINS_VIEW: 'plugins.view',
  PLUGINS_INSTALL: 'plugins.install',
  PLUGINS_CONFIGURE: 'plugins.configure',
  PLUGINS_DELETE: 'plugins.delete',
  PLUGINS_ALL: 'plugins.*',

  WORKFLOWS_VIEW: 'workflows.view',
  WORKFLOWS_CREATE: 'workflows.create',
  WORKFLOWS_EDIT: 'workflows.edit',
  WORKFLOWS_DELETE: 'workflows.delete',
  WORKFLOWS_EXECUTE: 'workflows.execute',
  WORKFLOWS_ALL: 'workflows.*',

  // Forms
  FORMS_VIEW: 'forms.view',
  FORMS_CREATE: 'forms.create',
  FORMS_EDIT: 'forms.edit',
  FORMS_DELETE: 'forms.delete',
  FORMS_SUBMISSIONS: 'forms.submissions',
  FORMS_ALL: 'forms.*',

  // Email Campaigns
  EMAIL_VIEW: 'email.view',
  EMAIL_CREATE: 'email.create',
  EMAIL_EDIT: 'email.edit',
  EMAIL_DELETE: 'email.delete',
  EMAIL_SEND: 'email.send',
  EMAIL_ALL: 'email.*',

  // Audit Log
  AUDIT_VIEW: 'audit.view',

  // Super Admin (all permissions)
  SUPER_ADMIN: '*',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Permission groups for UI display
export const PERMISSION_GROUPS = {
  products: {
    label: 'Products',
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: 'View products' },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: 'Create products' },
      { key: PERMISSIONS.PRODUCTS_EDIT, label: 'Edit products' },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete products' },
      { key: PERMISSIONS.PRODUCTS_PUBLISH, label: 'Publish/unpublish products' },
    ],
  },
  variants: {
    label: 'Product Variants',
    permissions: [
      { key: PERMISSIONS.VARIANTS_VIEW, label: 'View variants' },
      { key: PERMISSIONS.VARIANTS_CREATE, label: 'Create variants' },
      { key: PERMISSIONS.VARIANTS_EDIT, label: 'Edit variants' },
      { key: PERMISSIONS.VARIANTS_DELETE, label: 'Delete variants' },
    ],
  },
  orders: {
    label: 'Orders',
    permissions: [
      { key: PERMISSIONS.ORDERS_VIEW, label: 'View orders' },
      { key: PERMISSIONS.ORDERS_CREATE, label: 'Create orders' },
      { key: PERMISSIONS.ORDERS_EDIT, label: 'Edit orders' },
      { key: PERMISSIONS.ORDERS_DELETE, label: 'Delete orders' },
      { key: PERMISSIONS.ORDERS_FULFILL, label: 'Fulfill orders' },
      { key: PERMISSIONS.ORDERS_REFUND, label: 'Process refunds' },
      { key: PERMISSIONS.ORDERS_CANCEL, label: 'Cancel orders' },
    ],
  },
  inventory: {
    label: 'Inventory',
    permissions: [
      { key: PERMISSIONS.INVENTORY_VIEW, label: 'View inventory' },
      { key: PERMISSIONS.INVENTORY_EDIT, label: 'Edit inventory' },
    ],
  },
  customers: {
    label: 'Customers',
    permissions: [
      { key: PERMISSIONS.CUSTOMERS_VIEW, label: 'View customers' },
      { key: PERMISSIONS.CUSTOMERS_CREATE, label: 'Create customers' },
      { key: PERMISSIONS.CUSTOMERS_EDIT, label: 'Edit customers' },
      { key: PERMISSIONS.CUSTOMERS_DELETE, label: 'Delete customers' },
      { key: PERMISSIONS.CUSTOMERS_EXPORT, label: 'Export customer data' },
    ],
  },
  pages: {
    label: 'Pages',
    permissions: [
      { key: PERMISSIONS.PAGES_VIEW, label: 'View pages' },
      { key: PERMISSIONS.PAGES_CREATE, label: 'Create pages' },
      { key: PERMISSIONS.PAGES_EDIT, label: 'Edit pages' },
      { key: PERMISSIONS.PAGES_DELETE, label: 'Delete pages' },
      { key: PERMISSIONS.PAGES_PUBLISH, label: 'Publish pages' },
    ],
  },
  routes: {
    label: 'Route Configuration',
    permissions: [
      { key: PERMISSIONS.ROUTES_VIEW, label: 'View routes' },
      { key: PERMISSIONS.ROUTES_CREATE, label: 'Create routes' },
      { key: PERMISSIONS.ROUTES_EDIT, label: 'Edit routes' },
      { key: PERMISSIONS.ROUTES_DELETE, label: 'Delete routes' },
    ],
  },
  blog: {
    label: 'Blog',
    permissions: [
      { key: PERMISSIONS.BLOG_VIEW, label: 'View blog posts' },
      { key: PERMISSIONS.BLOG_CREATE, label: 'Create blog posts' },
      { key: PERMISSIONS.BLOG_EDIT, label: 'Edit blog posts' },
      { key: PERMISSIONS.BLOG_DELETE, label: 'Delete blog posts' },
      { key: PERMISSIONS.BLOG_PUBLISH, label: 'Publish blog posts' },
    ],
  },
  media: {
    label: 'Media',
    permissions: [
      { key: PERMISSIONS.MEDIA_VIEW, label: 'View media' },
      { key: PERMISSIONS.MEDIA_UPLOAD, label: 'Upload media' },
      { key: PERMISSIONS.MEDIA_EDIT, label: 'Edit media' },
      { key: PERMISSIONS.MEDIA_DELETE, label: 'Delete media' },
    ],
  },
  categories: {
    label: 'Categories',
    permissions: [
      { key: PERMISSIONS.CATEGORIES_VIEW, label: 'View categories' },
      { key: PERMISSIONS.CATEGORIES_CREATE, label: 'Create categories' },
      { key: PERMISSIONS.CATEGORIES_EDIT, label: 'Edit categories' },
      { key: PERMISSIONS.CATEGORIES_DELETE, label: 'Delete categories' },
    ],
  },
  settings: {
    label: 'Settings',
    permissions: [
      { key: PERMISSIONS.SETTINGS_VIEW, label: 'View settings' },
      { key: PERMISSIONS.SETTINGS_GENERAL, label: 'General settings' },
      { key: PERMISSIONS.SETTINGS_PAYMENTS, label: 'Payment settings' },
      { key: PERMISSIONS.SETTINGS_SHIPPING, label: 'Shipping settings' },
      { key: PERMISSIONS.SETTINGS_TAXES, label: 'Tax settings' },
      { key: PERMISSIONS.SETTINGS_EMAIL, label: 'Email settings' },
      { key: PERMISSIONS.SETTINGS_STORAGE, label: 'Storage settings' },
      { key: PERMISSIONS.SETTINGS_AI, label: 'AI settings' },
    ],
  },
  users: {
    label: 'User Management',
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: 'View users' },
      { key: PERMISSIONS.USERS_CREATE, label: 'Create users' },
      { key: PERMISSIONS.USERS_EDIT, label: 'Edit users' },
      { key: PERMISSIONS.USERS_DELETE, label: 'Delete users' },
      { key: PERMISSIONS.USERS_ROLES, label: 'Manage user roles' },
      { key: PERMISSIONS.USERS_PERMISSIONS, label: 'Manage user permissions' },
    ],
  },
  roles: {
    label: 'Role Management',
    permissions: [
      { key: PERMISSIONS.ROLES_VIEW, label: 'View roles' },
      { key: PERMISSIONS.ROLES_CREATE, label: 'Create roles' },
      { key: PERMISSIONS.ROLES_EDIT, label: 'Edit roles' },
      { key: PERMISSIONS.ROLES_DELETE, label: 'Delete roles' },
    ],
  },
  analytics: {
    label: 'Analytics',
    permissions: [
      { key: PERMISSIONS.ANALYTICS_VIEW, label: 'View analytics' },
      { key: PERMISSIONS.ANALYTICS_EXPORT, label: 'Export analytics' },
    ],
  },
  plugins: {
    label: 'Plugins',
    permissions: [
      { key: PERMISSIONS.PLUGINS_VIEW, label: 'View plugins' },
      { key: PERMISSIONS.PLUGINS_INSTALL, label: 'Install plugins' },
      { key: PERMISSIONS.PLUGINS_CONFIGURE, label: 'Configure plugins' },
      { key: PERMISSIONS.PLUGINS_DELETE, label: 'Delete plugins' },
    ],
  },
  workflows: {
    label: 'Workflows',
    permissions: [
      { key: PERMISSIONS.WORKFLOWS_VIEW, label: 'View workflows' },
      { key: PERMISSIONS.WORKFLOWS_CREATE, label: 'Create workflows' },
      { key: PERMISSIONS.WORKFLOWS_EDIT, label: 'Edit workflows' },
      { key: PERMISSIONS.WORKFLOWS_DELETE, label: 'Delete workflows' },
      { key: PERMISSIONS.WORKFLOWS_EXECUTE, label: 'Execute workflows' },
    ],
  },
  forms: {
    label: 'Forms',
    permissions: [
      { key: PERMISSIONS.FORMS_VIEW, label: 'View forms' },
      { key: PERMISSIONS.FORMS_CREATE, label: 'Create forms' },
      { key: PERMISSIONS.FORMS_EDIT, label: 'Edit forms' },
      { key: PERMISSIONS.FORMS_DELETE, label: 'Delete forms' },
      { key: PERMISSIONS.FORMS_SUBMISSIONS, label: 'View submissions' },
    ],
  },
  email: {
    label: 'Email Campaigns',
    permissions: [
      { key: PERMISSIONS.EMAIL_VIEW, label: 'View campaigns' },
      { key: PERMISSIONS.EMAIL_CREATE, label: 'Create campaigns' },
      { key: PERMISSIONS.EMAIL_EDIT, label: 'Edit campaigns' },
      { key: PERMISSIONS.EMAIL_DELETE, label: 'Delete campaigns' },
      { key: PERMISSIONS.EMAIL_SEND, label: 'Send campaigns' },
    ],
  },
  audit: {
    label: 'Audit Log',
    permissions: [
      { key: PERMISSIONS.AUDIT_VIEW, label: 'View audit log' },
    ],
  },
} as const

// Built-in role definitions
export const BUILT_IN_ROLES = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full access to all features and settings',
    permissions: [PERMISSIONS.SUPER_ADMIN],
    isSystem: true,
    position: 0,
  },
  store_manager: {
    name: 'store_manager',
    displayName: 'Store Manager',
    description: 'Manage products, orders, inventory, and customers',
    permissions: [
      PERMISSIONS.PRODUCTS_ALL,
      PERMISSIONS.VARIANTS_ALL,
      PERMISSIONS.ORDERS_ALL,
      PERMISSIONS.INVENTORY_ALL,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.CATEGORIES_ALL,
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
    isSystem: true,
    position: 1,
  },
  content_editor: {
    name: 'content_editor',
    displayName: 'Content Editor',
    description: 'Manage pages, blog posts, and media',
    permissions: [
      PERMISSIONS.PAGES_ALL,
      PERMISSIONS.BLOG_ALL,
      PERMISSIONS.MEDIA_ALL,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_EDIT,
    ],
    isSystem: true,
    position: 2,
  },
  order_fulfiller: {
    name: 'order_fulfiller',
    displayName: 'Order Fulfiller',
    description: 'View and fulfill orders',
    permissions: [
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_FULFILL,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
    ],
    isSystem: true,
    position: 3,
  },
  support_staff: {
    name: 'support_staff',
    displayName: 'Support Staff',
    description: 'View orders and manage customer inquiries',
    permissions: [
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_EDIT,
    ],
    isSystem: true,
    position: 4,
  },
} as const

export type BuiltInRoleName = keyof typeof BUILT_IN_ROLES
