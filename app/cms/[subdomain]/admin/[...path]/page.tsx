"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/cms/ui/card"
import { Construction } from "lucide-react"

// Section-specific placeholder content
const sectionContent: Record<string, { title: string; description: string }> = {
  products: {
    title: "Products",
    description: "Manage your product catalog, variants, pricing, and inventory.",
  },
  orders: {
    title: "Orders",
    description: "View and manage customer orders, process refunds, and track fulfillment.",
  },
  "order-workflows": {
    title: "Order Workflows",
    description: "Configure automated workflows for order processing and fulfillment.",
  },
  shipping: {
    title: "Shipping",
    description: "Set up shipping zones, rates, and carrier integrations.",
  },
  customers: {
    title: "Customers",
    description: "View customer profiles, order history, and manage customer segments.",
  },
  pages: {
    title: "Pages",
    description: "Create and edit website pages using the visual page builder.",
  },
  blog: {
    title: "Blog",
    description: "Write and publish blog posts, manage categories and tags.",
  },
  forms: {
    title: "Forms",
    description: "Create contact forms, surveys, and manage form submissions.",
  },
  media: {
    title: "Media Library",
    description: "Upload and manage images, videos, and other media files.",
  },
  "email-marketing": {
    title: "Email Marketing",
    description: "Create email campaigns, manage subscribers, and view analytics.",
  },
  analytics: {
    title: "Analytics",
    description: "View detailed analytics about traffic, sales, and customer behavior.",
  },
  users: {
    title: "Users",
    description: "Manage admin users and their access to this site.",
  },
  roles: {
    title: "Roles & Permissions",
    description: "Configure user roles and their permissions.",
  },
  plugins: {
    title: "Plugins",
    description: "Extend your site with plugins for additional functionality.",
  },
  workflows: {
    title: "Workflows",
    description: "Create automated workflows using visual flow builder.",
  },
  settings: {
    title: "Settings",
    description: "Configure site settings, integrations, and preferences.",
  },
}

export default function CMSAdminSubPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const path = (params.path as string[]) || []
  const section = path[0] || "unknown"

  // Get section content or use default
  const content = sectionContent[section] || {
    title: section
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: "This section is being developed.",
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-muted-foreground">{content.description}</p>
      </div>

      {/* Placeholder Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-yellow-500" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            This feature is being integrated from the CMS package.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The full {content.title.toLowerCase()} management interface will be available here.
            This includes all the features from the standalone CMS, adapted to work with your site&apos;s data.
          </p>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Path:</strong>{" "}
              <code className="bg-background px-2 py-1 rounded">
                /admin/{path.join("/")}
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
