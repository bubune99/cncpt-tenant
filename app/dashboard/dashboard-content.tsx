"use client"

import { CreateSubdomainCard } from "./create-subdomain-card"
import { SubdomainList } from "./subdomain-list"
import { DomainManagement } from "./domain-management"
import { SiteSettings } from "./site-settings"
import { DeveloperTools } from "./developer-tools"
import { Analytics } from "./analytics"
import { Billing } from "./billing"
import { RepositoryManagement } from "./repository-management"

interface DashboardContentProps {
  user: any
  subdomains: any[]
  activeSection: string
  selectedSubdomain: string | null
  isDeveloperMode: boolean
}

export function DashboardContent({
  user,
  subdomains,
  activeSection,
  selectedSubdomain,
  isDeveloperMode,
}: DashboardContentProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-balance mb-2">Welcome back, {user.name}</h1>
              <p className="text-muted-foreground">Manage your subdomains and create new ones</p>
            </div>
            <CreateSubdomainCard />
            <SubdomainList subdomains={subdomains} />
          </div>
        )
      case "domains":
        return <DomainManagement subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
      case "repositories":
        return <RepositoryManagement user={user} subdomains={subdomains} selectedSubdomain={selectedSubdomain} />
      case "settings":
        return <SiteSettings selectedSubdomain={selectedSubdomain} />
      case "appearance":
        return <SiteSettings selectedSubdomain={selectedSubdomain} activeTab="appearance" />
      case "security":
        return <SiteSettings selectedSubdomain={selectedSubdomain} activeTab="security" />
      case "developer":
        return <DeveloperTools selectedSubdomain={selectedSubdomain} />
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
