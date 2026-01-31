"use client"

import dynamic from "next/dynamic"
import { ComponentType, Suspense } from "react"

// Loading fallback component
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

// Dynamic imports for admin pages from subdomain routes
// Use ssr: false to avoid metadata export issues with client components
const AdminDashboard = dynamic(() => import("../app/s/[subdomain]/admin/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const BlogPage = dynamic(() => import("../app/s/[subdomain]/admin/blog/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const BlogNewPage = dynamic(() => import("../app/s/[subdomain]/admin/blog/new/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const BlogEditPage = dynamic(() => import("../app/s/[subdomain]/admin/blog/[id]/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const BlogCategoriesPage = dynamic(() => import("../app/s/[subdomain]/admin/blog/categories/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const BlogTagsPage = dynamic(() => import("../app/s/[subdomain]/admin/blog/tags/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const ProductsPage = dynamic(() => import("../app/s/[subdomain]/admin/products/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const ProductNewPage = dynamic(() => import("../app/s/[subdomain]/admin/products/new/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const ProductConfigurePage = dynamic(() => import("../app/s/[subdomain]/admin/products/[id]/configure/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const OrdersPage = dynamic(() => import("../app/s/[subdomain]/admin/orders/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const OrderDetailPage = dynamic(() => import("../app/s/[subdomain]/admin/orders/[id]/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const CustomersPage = dynamic(() => import("../app/s/[subdomain]/admin/customers/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const CustomerDetailPage = dynamic(() => import("../app/s/[subdomain]/admin/customers/[id]/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const PagesPage = dynamic(() => import("../app/s/[subdomain]/admin/pages/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const MediaPage = dynamic(() => import("../app/s/[subdomain]/admin/media/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const AnalyticsPage = dynamic(() => import("../app/s/[subdomain]/admin/analytics/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const SettingsPage = dynamic(() => import("../app/s/[subdomain]/admin/settings/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const DiscountsPage = dynamic(() => import("../app/s/[subdomain]/admin/discounts/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const DiscountCreatePage = dynamic(() => import("../app/s/[subdomain]/admin/discounts/create/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const DiscountEditPage = dynamic(() => import("../app/s/[subdomain]/admin/discounts/[id]/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const ShippingPage = dynamic(() => import("../app/s/[subdomain]/admin/shipping/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const UsersPage = dynamic(() => import("../app/s/[subdomain]/admin/users/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const FormsPage = dynamic(() => import("../app/s/[subdomain]/admin/forms/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const FormNewPage = dynamic(() => import("../app/s/[subdomain]/admin/forms/new/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const FormEditPage = dynamic(() => import("../app/s/[subdomain]/admin/forms/[id]/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const ReviewsPage = dynamic(() => import("../app/s/[subdomain]/admin/reviews/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const PluginsPage = dynamic(() => import("../app/s/[subdomain]/admin/plugins/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const WorkflowsPage = dynamic(() => import("../app/s/[subdomain]/admin/workflows/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const EmailMarketingPage = dynamic(() => import("../app/s/[subdomain]/admin/email-marketing/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const SiteSettingsPage = dynamic(() => import("../app/s/[subdomain]/admin/site-settings/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const RolesPage = dynamic(() => import("../app/s/[subdomain]/admin/roles/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const AdminUsersPage = dynamic(() => import("../app/s/[subdomain]/admin/admin-users/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

const OrderWorkflowsPage = dynamic(() => import("../app/s/[subdomain]/admin/order-workflows/page"), {
  loading: () => <PageLoading />,
  ssr: false,
})

// Page registry - maps URL paths to components
// Path patterns: exact matches first, then parameterized routes
interface PageRoute {
  pattern: RegExp
  component: ComponentType<{ params?: Record<string, string> }>
  extractParams?: (path: string[]) => Record<string, string>
}

const pageRoutes: PageRoute[] = [
  // Dashboard (root)
  { pattern: /^$/, component: AdminDashboard },

  // Blog routes
  { pattern: /^blog$/, component: BlogPage },
  { pattern: /^blog\/new$/, component: BlogNewPage },
  { pattern: /^blog\/categories$/, component: BlogCategoriesPage },
  { pattern: /^blog\/tags$/, component: BlogTagsPage },
  {
    pattern: /^blog\/([^/]+)$/,
    component: BlogEditPage,
    extractParams: (path) => ({ id: path[1] }),
  },

  // Products routes
  { pattern: /^products$/, component: ProductsPage },
  { pattern: /^products\/new$/, component: ProductNewPage },
  {
    pattern: /^products\/([^/]+)\/configure$/,
    component: ProductConfigurePage,
    extractParams: (path) => ({ id: path[1] }),
  },

  // Orders routes
  { pattern: /^orders$/, component: OrdersPage },
  {
    pattern: /^orders\/([^/]+)$/,
    component: OrderDetailPage,
    extractParams: (path) => ({ id: path[1] }),
  },

  // Customers routes
  { pattern: /^customers$/, component: CustomersPage },
  {
    pattern: /^customers\/([^/]+)$/,
    component: CustomerDetailPage,
    extractParams: (path) => ({ id: path[1] }),
  },

  // Other routes
  { pattern: /^pages$/, component: PagesPage },
  { pattern: /^media$/, component: MediaPage },
  { pattern: /^analytics$/, component: AnalyticsPage },
  { pattern: /^settings$/, component: SettingsPage },
  { pattern: /^site-settings$/, component: SiteSettingsPage },

  // Discounts routes
  { pattern: /^discounts$/, component: DiscountsPage },
  { pattern: /^discounts\/create$/, component: DiscountCreatePage },
  {
    pattern: /^discounts\/([^/]+)$/,
    component: DiscountEditPage,
    extractParams: (path) => ({ id: path[1] }),
  },

  // Shipping
  { pattern: /^shipping$/, component: ShippingPage },

  // Users & Admin
  { pattern: /^users$/, component: UsersPage },
  { pattern: /^admin-users$/, component: AdminUsersPage },
  { pattern: /^roles$/, component: RolesPage },

  // Forms routes
  { pattern: /^forms$/, component: FormsPage },
  { pattern: /^forms\/new$/, component: FormNewPage },
  {
    pattern: /^forms\/([^/]+)$/,
    component: FormEditPage,
    extractParams: (path) => ({ id: path[1] }),
  },

  // Reviews
  { pattern: /^reviews$/, component: ReviewsPage },

  // Plugins & Workflows
  { pattern: /^plugins$/, component: PluginsPage },
  { pattern: /^workflows$/, component: WorkflowsPage },
  { pattern: /^order-workflows$/, component: OrderWorkflowsPage },

  // Email Marketing
  { pattern: /^email-marketing$/, component: EmailMarketingPage },
]

export interface AdminPageProps {
  path: string[]
}

export function AdminPageRouter({ path }: AdminPageProps) {
  const pathString = path.join("/")

  for (const route of pageRoutes) {
    const match = pathString.match(route.pattern)
    if (match) {
      const PageComponent = route.component
      const params = route.extractParams ? route.extractParams(path) : {}
      return (
        <Suspense fallback={<PageLoading />}>
          <PageComponent params={params} />
        </Suspense>
      )
    }
  }

  // No matching route found
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground">
          The admin page &quot;/{pathString}&quot; does not exist.
        </p>
      </div>
    </div>
  )
}

// Export individual page components for direct use
export {
  AdminDashboard,
  BlogPage,
  BlogNewPage,
  BlogEditPage,
  BlogCategoriesPage,
  BlogTagsPage,
  ProductsPage,
  ProductNewPage,
  ProductConfigurePage,
  OrdersPage,
  OrderDetailPage,
  CustomersPage,
  CustomerDetailPage,
  PagesPage,
  MediaPage,
  AnalyticsPage,
  SettingsPage,
  DiscountsPage,
  DiscountCreatePage,
  DiscountEditPage,
  ShippingPage,
  UsersPage,
  FormsPage,
  FormNewPage,
  FormEditPage,
  ReviewsPage,
  PluginsPage,
  WorkflowsPage,
  EmailMarketingPage,
  SiteSettingsPage,
  RolesPage,
  AdminUsersPage,
  OrderWorkflowsPage,
}
