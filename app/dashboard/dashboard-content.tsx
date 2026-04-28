"use client"

import { SubdomainList } from "./subdomain-list"
import { DomainManagement } from "./domain-management"
import { SiteSettings } from "./site-settings"
import { SiteVisibility } from "./site-visibility"
import { BrandingSettings } from "./branding-settings"
import { Analytics } from "./analytics"
import { Billing } from "./billing"
import { Credits } from "./credits"
import { FrontendDeployment } from "./frontend-deployment"
import { McpIntegration } from "./mcp-integration"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardContentProps {
  user: any
  subdomains: any[]
  activeSection: string
  selectedSubdomain: string | null
}

// Pick a display name with progressive fallbacks. Prevents the broken
// "Welcome back," (trailing comma) UI when the Stack user has no displayName.
function getDisplayName(user: any): string {
  if (!user) return "there"
  const name = user.displayName ?? user.name
  if (typeof name === "string" && name.trim().length > 0) return name.trim()
  const email = user.primaryEmail ?? user.email
  if (typeof email === "string" && email.includes("@")) {
    const local = email.split("@")[0]
    if (local && local.length > 0) return local
  }
  return "there"
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
          <div className="space-y-8" data-tour-id="dashboard-overview">
            <div className="flex items-center justify-between">
              <div>
                {user ? (
                  <h1 className="text-3xl font-bold text-balance mb-2" data-tour-id="dashboard-welcome-heading">
                    Welcome back, {getDisplayName(user)}
                  </h1>
                ) : (
                  <div className="h-9 w-72 mb-2 rounded-md bg-muted animate-pulse" aria-hidden />
                )}
                <p className="text-muted-foreground">Manage your subdomains and create new ones</p>
              </div>
              {subdomains.length > 0 && (
                <Button
                  onClick={() => router.push("/dashboard/create-subdomain")}
                  className="flex items-center gap-2"
                  data-help-key="dashboard.sites.create"
                  data-tour-id="dashboard-create-subdomain-button"
                >
                  <Plus className="h-4 w-4" />
                  Create New Subdomain
                </Button>
              )}
            </div>
            {subdomains.length > 0 && (
              <OnboardingChecklist
                subdomainId={selectedSubdomain ? subdomains.find(s => s.subdomain === selectedSubdomain)?.id : subdomains[0]?.id}
                subdomainName={selectedSubdomain || subdomains[0]?.subdomain}
              />
            )}
            {subdomains.length > 0 ? (
              <div data-help-key="dashboard.sites.list" data-tour-id="dashboard-subdomains-list">
                <SubdomainList subdomains={subdomains} />
              </div>
            ) : (
              <div className="text-center py-12" data-tour-id="dashboard-empty-state">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No subdomains yet</h3>
                <p className="text-muted-foreground mb-4">Get started by creating your first subdomain</p>
                <Button
                  onClick={() => router.push("/dashboard/create-subdomain")}
                  className="flex items-center gap-2"
                  data-help-key="dashboard.sites.create"
                  data-tour-id="dashboard-create-first-subdomain-button"
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
      case "branding":
        return <BrandingSettings selectedSubdomain={selectedSubdomain} />
      case "settings":
        return <SiteSettings selectedSubdomain={selectedSubdomain} />
      case "frontend":
        return <FrontendDeployment selectedSubdomain={selectedSubdomain} />
      case "analytics":
        return <Analytics subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
      case "credits":
        return <Credits />
      case "billing":
        return <Billing />
      case "mcp":
        return <McpIntegration selectedSubdomain={selectedSubdomain} />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">This section is currently being developed. Check back soon.</p>
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
