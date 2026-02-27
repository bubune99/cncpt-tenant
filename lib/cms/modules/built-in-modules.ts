/**
 * Built-In Module Definitions
 *
 * Seed data for the 8 built-in CMS modules.
 * Used by the seed script to populate the CmsModule table.
 */

import type { ModuleManifest } from "./types"

export interface BuiltInModuleDefinition {
  slug: string
  name: string
  description: string
  icon: string
  version: string
  manifest: ModuleManifest
  enabled: boolean
  builtIn: boolean
  sortOrder: number
}

export const BUILT_IN_MODULES: BuiltInModuleDefinition[] = [
  // -- Core (always on) --
  {
    slug: "core",
    name: "Core",
    description: "Dashboard, analytics, users, roles, audit log, and settings. Always enabled.",
    icon: "LayoutDashboard",
    version: "1.0.0",
    enabled: true,
    builtIn: true,
    sortOrder: 0,
    manifest: {
      adminNav: [
        {
          group: "Main",
          items: [
            { name: "Dashboard", href: "/admin", icon: "LayoutDashboard", helpKey: "admin.sidebar.dashboard" },
            { name: "Analytics", href: "/admin/analytics", icon: "BarChart3", helpKey: "admin.analytics.dashboard" },
          ],
        },
        {
          group: "System",
          items: [
            { name: "Users", href: "/admin/users", icon: "Users", helpKey: "admin.users" },
            { name: "Roles & Permissions", href: "/admin/roles", icon: "Key", helpKey: "admin.roles" },
            { name: "Audit Log", href: "/admin/audit-log", icon: "ClipboardList" },
            { name: "Modules", href: "/admin/modules", icon: "Puzzle", helpKey: "admin.sidebar.modules" },
            { name: "Settings", href: "/admin/settings", icon: "Settings", badgeKey: "system", helpKey: "admin.sidebar.settings" },
          ],
        },
      ],
      apiPrefixes: ["settings", "users", "roles", "audit-log", "dashboard"],
      permissionNamespaces: ["users", "roles", "settings", "analytics"],
    },
  },

  // -- Pages --
  {
    slug: "pages",
    name: "Pages",
    description: "CMS pages with the visual block editor, templates, and partials.",
    icon: "Layers",
    version: "1.0.0",
    enabled: true,
    builtIn: true,
    sortOrder: 1,
    manifest: {
      adminNav: [
        {
          group: "Content",
          items: [
            { name: "Pages", href: "/admin/pages", icon: "Layers", helpKey: "admin.sidebar.pages" },
          ],
        },
      ],
      apiPrefixes: ["pages", "templates", "partials"],
      blockCategories: ["layout", "typography", "media", "interactive"],
      permissionNamespaces: ["pages"],
      storefrontPaths: ["/*"],
    },
  },

  // -- Commerce --
  {
    slug: "commerce",
    name: "Commerce",
    description: "Products, orders, shipping, customers, checkout, and payment processing.",
    icon: "ShoppingCart",
    version: "1.0.0",
    enabled: true,
    builtIn: true,
    sortOrder: 2,
    manifest: {
      adminNav: [
        {
          group: "E-Commerce",
          items: [
            { name: "Products", href: "/admin/products", icon: "Package", badgeKey: "product", helpKey: "admin.sidebar.products" },
            { name: "Orders", href: "/admin/orders", icon: "ShoppingCart", badgeKey: "order", helpKey: "admin.sidebar.orders" },
            { name: "Order Workflows", href: "/admin/order-workflows", icon: "Workflow", helpKey: "admin.workflows" },
            { name: "Shipping", href: "/admin/shipping", icon: "Truck", badgeKey: "shipping", helpKey: "admin.shipping.page" },
            { name: "Customers", href: "/admin/customers", icon: "Users", badgeKey: "customer", helpKey: "admin.sidebar.customers" },
          ],
        },
      ],
      apiPrefixes: ["products", "orders", "checkout", "cart", "shipping", "customers"],
      blockCategories: ["commerce"],
      permissionNamespaces: ["products", "orders", "shipping", "customers"],
      storefrontPaths: ["/p/*", "/cart", "/checkout"],
      dependencies: [],
    },
  },

  // -- Blog --
  {
    slug: "blog",
    name: "Blog",
    description: "Blog posts, categories, tags, and comments.",
    icon: "FileText",
    version: "1.0.0",
    enabled: true,
    builtIn: true,
    sortOrder: 3,
    manifest: {
      adminNav: [
        {
          group: "Content",
          items: [
            { name: "Blog", href: "/admin/blog", icon: "FileText", helpKey: "admin.sidebar.blog" },
          ],
        },
      ],
      apiPrefixes: ["blog"],
      permissionNamespaces: ["blog"],
      storefrontPaths: ["/posts/*", "/categories/*", "/tags/*"],
    },
  },

  // -- Forms --
  {
    slug: "forms",
    name: "Forms",
    description: "Form builder with submissions, notifications, and integrations.",
    icon: "ClipboardList",
    version: "1.0.0",
    enabled: true,
    builtIn: true,
    sortOrder: 4,
    manifest: {
      adminNav: [
        {
          group: "Content",
          items: [
            { name: "Forms", href: "/admin/forms", icon: "ClipboardList", badgeKey: "form", helpKey: "admin.forms" },
          ],
        },
      ],
      apiPrefixes: ["forms"],
      blockCategories: ["form"],
      permissionNamespaces: ["forms"],
    },
  },

  // -- Media --
  {
    slug: "media",
    name: "Media",
    description: "Media library for images, files, and asset management.",
    icon: "Image",
    version: "1.0.0",
    enabled: true,
    builtIn: true,
    sortOrder: 5,
    manifest: {
      adminNav: [
        {
          group: "Content",
          items: [
            { name: "Media", href: "/admin/media", icon: "Image", helpKey: "admin.sidebar.media" },
          ],
        },
      ],
      apiPrefixes: ["media", "images"],
      permissionNamespaces: ["media"],
    },
  },

  // -- Events --
  {
    slug: "events",
    name: "Events",
    description: "Event management with ticketing, schedules, and registrations.",
    icon: "CalendarDays",
    version: "1.0.0",
    enabled: false,
    builtIn: true,
    sortOrder: 6,
    manifest: {
      adminNav: [
        {
          group: "Content",
          items: [
            { name: "Events", href: "/admin/events", icon: "CalendarDays" },
          ],
        },
      ],
      apiPrefixes: ["events"],
      permissionNamespaces: ["events"],
      storefrontPaths: ["/events/*"],
    },
  },

  // -- Email Marketing --
  {
    slug: "email-marketing",
    name: "Email Marketing",
    description: "Email campaigns, subscribers, automations, and templates.",
    icon: "Mail",
    version: "1.0.0",
    enabled: false,
    builtIn: true,
    sortOrder: 7,
    manifest: {
      adminNav: [
        {
          group: "Content",
          items: [
            { name: "Email Marketing", href: "/admin/email-marketing", icon: "Mail", helpKey: "admin.email-marketing.page" },
          ],
        },
      ],
      apiPrefixes: ["email-marketing", "emails"],
      permissionNamespaces: ["email-marketing"],
    },
  },
]
