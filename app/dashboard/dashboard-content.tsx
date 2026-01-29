"use client"

import { SubdomainList } from "./subdomain-list"
import { DomainManagement } from "./domain-management"
import { SiteSettings } from "./site-settings"
import { SiteVisibility } from "./site-visibility"
import { Analytics } from "./analytics"
import { Billing } from "./billing"
import { FrontendDeployment } from "./frontend-deployment"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardContentProps {
  user: any
  subdomains: any[]
  activeSection: string
  selectedSubdomain: string | null
}

export function DashboardContent({
  user,
  subdomains,
  activeSection,
  selectedSubdomain,
}: DashboardContentProps) {
  const router = useRouter()

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-balance mb-2">Welcome back, {user.name}</h1>
              <p className="text-muted-foreground">Manage your subdomains and create new ones</p>
            </div>
            {subdomains.length > 0 ? (
              <div data-help-key="dashboard.sites.list">
                <SubdomainList subdomains={subdomains} />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subdomains yet</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first subdomain</p>
                <Button
                  onClick={() => router.push("/dashboard/create-subdomain")}
                  className="flex items-center gap-2"
                  data-help-key="dashboard.sites.create"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Subdomain
                </Button>
              </div>
            )}
          </div>
        )
      case "visibility":
        return <SiteVisibility selectedSubdomain={selectedSubdomain} />
      case "domains":
        return <DomainManagement subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
      case "settings":
        return <SiteSettings selectedSubdomain={selectedSubdomain} />
      case "appearance":
        return <SiteSettings selectedSubdomain={selectedSubdomain} activeTab="appearance" />
      case "security":
        return <SiteSettings selectedSubdomain={selectedSubdomain} activeTab="security" />
      case "frontend":
        return <FrontendDeployment selectedSubdomain={selectedSubdomain} />
      case "analytics":
        return <Analytics subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
      case "billing":
        return <Billing />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">Content for {activeSection} is being developed</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-6 py-8">{renderContent()}</main>
    </div>
  )
}
