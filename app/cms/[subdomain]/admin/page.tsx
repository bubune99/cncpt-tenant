"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Package,
  Users,
  Settings,
  BarChart3,
  Palette,
  Mail,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { rootDomain, protocol } from "@/lib/utils"

export default function CMSAdminPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string

  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`

  const menuItems = [
    {
      title: "Pages",
      description: "Manage your website pages and content",
      icon: FileText,
      href: `/cms/${subdomain}/admin/pages`,
    },
    {
      title: "Products",
      description: "Manage your product catalog",
      icon: Package,
      href: `/cms/${subdomain}/admin/products`,
    },
    {
      title: "Customers",
      description: "View and manage customers",
      icon: Users,
      href: `/cms/${subdomain}/admin/customers`,
    },
    {
      title: "Analytics",
      description: "View site performance and analytics",
      icon: BarChart3,
      href: `/cms/${subdomain}/admin/analytics`,
    },
    {
      title: "Appearance",
      description: "Customize your site's look and feel",
      icon: Palette,
      href: `/cms/${subdomain}/admin/appearance`,
    },
    {
      title: "Email Marketing",
      description: "Create and manage email campaigns",
      icon: Mail,
      href: `/cms/${subdomain}/admin/email-marketing`,
    },
    {
      title: "Settings",
      description: "Configure site settings",
      icon: Settings,
      href: `/cms/${subdomain}/admin/settings`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">{subdomain}</h1>
                <p className="text-sm text-muted-foreground">Content Management</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={siteUrl} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Site
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome to your CMS</h2>
          <p className="text-muted-foreground">
            Manage your website content, products, and settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
