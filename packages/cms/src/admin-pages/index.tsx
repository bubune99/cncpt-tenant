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

// Dynamic imports for admin pages
const AdminDashboard = dynamic(() => import("../app/admin/page"), {
  loading: () => <PageLoading />,
})

const BlogPage = dynamic(() => import("../app/admin/blog/page"), {
  loading: () => <PageLoading />,
})

const BlogNewPage = dynamic(() => import("../app/admin/blog/new/page"), {
  loading: () => <PageLoading />,
})

const BlogEditPage = dynamic(() => import("../app/admin/blog/[id]/page"), {
  loading: () => <PageLoading />,
})

const BlogCategoriesPage = dynamic(() => import("../app/admin/blog/categories/page"), {
  loading: () => <PageLoading />,
})

const BlogTagsPage = dynamic(() => import("../app/admin/blog/tags/page"), {
  loading: () => <PageLoading />,
})

const ProductsPage = dynamic(() => import("../app/admin/products/page"), {
  loading: () => <PageLoading />,
})

const ProductNewPage = dynamic(() => import("../app/admin/products/new/page"), {
  loading: () => <PageLoading />,
})

const ProductEditPage = dynamic(() => import("../app/admin/products/[id]/page"), {
  loading: () => <PageLoading />,
})

const OrdersPage = dynamic(() => import("../app/admin/orders/page"), {
  loading: () => <PageLoading />,
})

const OrderDetailPage = dynamic(() => import("../app/admin/orders/[id]/page"), {
  loading: () => <PageLoading />,
})

const CustomersPage = dynamic(() => import("../app/admin/customers/page"), {
  loading: () => <PageLoading />,
})

const CustomerDetailPage = dynamic(() => import("../app/admin/customers/[id]/page"), {
  loading: () => <PageLoading />,
})

const PagesPage = dynamic(() => import("../app/admin/pages/page"), {
  loading: () => <PageLoading />,
})

const MediaPage = dynamic(() => import("../app/admin/media/page"), {
  loading: () => <PageLoading />,
})

const AnalyticsPage = dynamic(() => import("../app/admin/analytics/page"), {
  loading: () => <PageLoading />,
})

const SettingsPage = dynamic(() => import("../app/admin/settings/page"), {
  loading: () => <PageLoading />,
})

const DiscountsPage = dynamic(() => import("../app/admin/discounts/page"), {
  loading: () => <PageLoading />,
})

const DiscountCreatePage = dynamic(() => import("../app/admin/discounts/create/page"), {
  loading: () => <PageLoading />,
})

const DiscountEditPage = dynamic(() => import("../app/admin/discounts/[id]/page"), {
  loading: () => <PageLoading />,
})

const ShippingPage = dynamic(() => import("../app/admin/shipping/page"), {
  loading: () => <PageLoading />,
})

const UsersPage = dynamic(() => import("../app/admin/users/page"), {
  loading: () => <PageLoading />,
})

const FormsPage = dynamic(() => import("../app/admin/forms/page"), {
  loading: () => <PageLoading />,
})

const FormNewPage = dynamic(() => import("../app/admin/forms/new/page"), {
  loading: () => <PageLoading />,
})

const FormEditPage = dynamic(() => import("../app/admin/forms/[id]/page"), {
  loading: () => <PageLoading />,
})

const ReviewsPage = dynamic(() => import("../app/admin/reviews/page"), {
  loading: () => <PageLoading />,
})

const PluginsPage = dynamic(() => import("../app/admin/plugins/page"), {
  loading: () => <PageLoading />,
})

const WorkflowsPage = dynamic(() => import("../app/admin/workflows/page"), {
  loading: () => <PageLoading />,
})

const EmailMarketingPage = dynamic(() => import("../app/admin/email-marketing/page"), {
  loading: () => <PageLoading />,
})

const SiteSettingsPage = dynamic(() => import("../app/admin/site-settings/page"), {
  loading: () => <PageLoading />,
})

const RolesPage = dynamic(() => import("../app/admin/roles/page"), {
  loading: () => <PageLoading />,
})

const AdminUsersPage = dynamic(() => import("../app/admin/admin-users/page"), {
  loading: () => <PageLoading />,
})

const OrderWorkflowsPage = dynamic(() => import("../app/admin/order-workflows/page"), {
  loading: () => <PageLoading />,
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
    pattern: /^products\/([^/]+)$/,
    component: ProductEditPage,
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
  ProductEditPage,
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
