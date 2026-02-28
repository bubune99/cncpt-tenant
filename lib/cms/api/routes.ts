/**
 * Typed Route Map
 *
 * Every admin, storefront, and API route in one place.
 * AI agents and components use this instead of hardcoded strings.
 *
 * Usage:
 *   import { routes } from '@/lib/cms/api/routes'
 *
 *   <Link href={routes.admin.pages.list}>Pages</Link>
 *   <Link href={routes.admin.pages.edit(page.id)}>Edit</Link>
 *   router.push(routes.admin.pages.editor(newPage.id))
 *   await fetch(routes.api.admin.pages.root)
 */

/* ------------------------------------------------------------------ */
/*  Admin Routes (UI pages)                                            */
/* ------------------------------------------------------------------ */

export const routes = {
  admin: {
    dashboard: "/admin/dashboard",
    pages: {
      list: "/admin/pages",
      new: "/admin/pages/new",
      view: (id: string) => `/admin/pages/${id}` as const,
      editor: (id: string) => `/admin/pages/${id}/editor` as const,
    },
    blog: {
      list: "/admin/blog",
      new: "/admin/blog/new",
      edit: (id: string) => `/admin/blog/${id}` as const,
      categories: "/admin/blog/categories",
      tags: "/admin/blog/tags",
    },
    products: {
      list: "/admin/products",
      new: "/admin/products/new",
      edit: (id: string) => `/admin/products/${id}` as const,
      configure: (id: string) => `/admin/products/${id}/configure` as const,
    },
    orders: {
      list: "/admin/orders",
      new: "/admin/orders/new",
      view: (id: string) => `/admin/orders/${id}` as const,
    },
    customers: {
      list: "/admin/customers",
      view: (id: string) => `/admin/customers/${id}` as const,
    },
    users: {
      list: "/admin/users",
      view: (id: string) => `/admin/users/${id}` as const,
    },
    roles: {
      list: "/admin/roles",
      new: "/admin/roles/new",
      edit: (id: string) => `/admin/roles/${id}` as const,
    },
    discounts: {
      list: "/admin/discounts",
      create: "/admin/discounts/create",
      edit: (id: string) => `/admin/discounts/${id}` as const,
    },
    media: "/admin/media",
    forms: {
      list: "/admin/forms",
      new: "/admin/forms/new",
      edit: (id: string) => `/admin/forms/${id}` as const,
    },
    reviews: {
      list: "/admin/reviews",
      view: (id: string) => `/admin/reviews/${id}` as const,
    },
    emailMarketing: {
      list: "/admin/email-marketing",
      new: "/admin/email-marketing/new",
      edit: (id: string) => `/admin/email-marketing/${id}` as const,
    },
    events: {
      list: "/admin/events",
      new: "/admin/events/new",
      edit: (id: string) => `/admin/events/${id}` as const,
    },
    modules: {
      list: "/admin/modules",
    },
    plugins: {
      list: "/admin/plugins",
      view: (id: string) => `/admin/plugins/${id}` as const,
      primitiveEdit: (id: string) => `/admin/plugins/primitives/${id}` as const,
      workflowNew: "/admin/plugins/workflows/new",
    },
    shipping: "/admin/shipping",
    analytics: "/admin/analytics",
    auditLog: "/admin/audit-log",
    settings: "/admin/settings",
    siteSettings: {
      root: "/admin/site-settings",
      header: "/admin/site-settings/header",
      headerEditor: "/admin/site-settings/header/editor",
      footer: "/admin/site-settings/footer",
      footerEditor: "/admin/site-settings/footer/editor",
      announcement: "/admin/site-settings/announcement",
    },
    partials: {
      list: "/admin/partials",
      new: (category?: string) => category ? `/admin/partials/new?category=${category}` as const : "/admin/partials/new" as const,
      edit: (id: string) => `/admin/partials/${id}` as const,
      editor: (id: string) => `/admin/partials/${id}/editor` as const,
    },
  },

  /* ---------------------------------------------------------------- */
  /*  Storefront Routes (public pages)                                 */
  /* ---------------------------------------------------------------- */

  storefront: {
    home: "/",
    page: (slug: string) => `/${slug.replace(/^\//, "")}` as const,
    product: (slug: string) => `/p/${slug}` as const,
    post: (slug: string) => `/posts/${slug}` as const,
    category: (slug: string) => `/categories/${slug}` as const,
    tag: (slug: string) => `/tags/${slug}` as const,
    trackOrder: (orderNumber: string) => `/track/${orderNumber}` as const,
    legal: {
      privacy: "/legal/privacy",
      refund: "/legal/refund",
      shipping: "/legal/shipping",
      terms: "/legal/terms",
    },
  },

  /* ---------------------------------------------------------------- */
  /*  API Routes (fetch targets)                                       */
  /* ---------------------------------------------------------------- */

  api: {
    admin: {
      pages: {
        root: "/api/admin/pages",
        byId: (id: string) => `/api/admin/pages/${id}` as const,
      },
      products: {
        root: "/api/admin/products",
        byId: (id: string) => `/api/admin/products/${id}` as const,
        syncStripe: (id: string) => `/api/admin/products/${id}/sync-stripe` as const,
      },
      roles: {
        root: "/api/admin/roles",
        byId: (id: string) => `/api/admin/roles/${id}` as const,
      },
      users: {
        root: "/api/admin/users",
        byId: (id: string) => `/api/admin/users/${id}` as const,
        permissions: (id: string) => `/api/admin/users/${id}/permissions` as const,
        roles: (id: string) => `/api/admin/users/${id}/roles` as const,
      },
      customers: {
        root: "/api/admin/customers",
        byId: (id: string) => `/api/admin/customers/${id}` as const,
        syncStripe: (id: string) => `/api/admin/customers/${id}/sync-stripe` as const,
      },
      siteSettings: {
        root: "/api/admin/site-settings",
        header: "/api/admin/site-settings/header",
        footer: "/api/admin/site-settings/footer",
        announcement: "/api/admin/site-settings/announcement",
      },
      partials: {
        root: "/api/admin/partials",
        byId: (id: string) => `/api/admin/partials/${id}` as const,
        setDefault: (id: string) => `/api/admin/partials/${id}/set-default` as const,
      },
      dashboard: {
        metrics: "/api/admin/dashboard/metrics",
        timeSeries: "/api/admin/dashboard/time-series",
        layout: "/api/admin/dashboard/layout",
      },
      modules: {
        root: "/api/admin/modules",
        presets: "/api/admin/modules/presets",
      },
      auditLog: "/api/admin/audit-log",
      settings: "/api/admin/settings",
    },
    blog: {
      root: "/api/blog",
      bySlug: (slug: string) => `/api/blog/${slug}` as const,
    },
    blogCategories: "/api/blog-categories",
    blogTags: "/api/blog-tags",
    products: {
      root: "/api/products",
      bySlug: (slug: string) => `/api/products/${slug}` as const,
    },
    cart: "/api/cart",
    checkout: "/api/checkout",
    orders: "/api/orders",
    media: "/api/media",
    blockEditorChat: "/api/block-editor-chat",
    analytics: "/api/analytics",
  },
} as const

/* ------------------------------------------------------------------ */
/*  Type Helpers                                                       */
/* ------------------------------------------------------------------ */

/** Extract the return type of a route function for type-safe hrefs */
export type AdminRoute = typeof routes.admin
export type StorefrontRoute = typeof routes.storefront
export type ApiRoute = typeof routes.api
