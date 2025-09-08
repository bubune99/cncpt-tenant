"use client"

import { useState } from "react"
import { CreateSubdomainCard } from "./create-subdomain-card"
import { SubdomainList } from "./subdomain-list"
import { DomainManagement } from "./domain-management"
import { SiteSettings } from "./site-settings"
import { DeveloperTools } from "./developer-tools"
import { Analytics } from "./analytics"

interface DashboardContentProps {
  user: any
  subdomains: any[]
}

export function DashboardContent({ user, subdomains }: DashboardContentProps) {
  const [activeSection, setActiveSection] = useState("overview")

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
        return <DomainManagement subdomains={subdomains} />
      case "settings":
        return <SiteSettings />
      case "developer":
        return <DeveloperTools />
      case "analytics":
        return <Analytics subdomains={subdomains} />
      default:
        return <div>Content for {activeSection}</div>
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-6 py-8">{renderContent()}</main>
    </div>
  )
}
