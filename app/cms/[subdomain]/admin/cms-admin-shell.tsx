"use client"

import { AdminShell } from "@/app/cms/admin/AdminShell"
import type { AdminShellConfig } from "@/app/cms/admin/AdminShell"
import { rootDomain, protocol } from "@/lib/cms/utils"
import { AccessProvider } from "./access-context"

// Role-based navigation configuration
const STORE_MANAGER_HIDDEN_GROUPS = ['System']
const STORE_MANAGER_HIDDEN_ITEMS = ['Order Workflows', 'Plugins', 'Workflows']

interface CMSAdminShellProps {
  children: React.ReactNode
  subdomain: string
  accessType: "owner" | "team" | null
  accessLevel: "view" | "edit" | "admin"
}

export function CMSAdminShell({
  children,
  subdomain,
  accessType,
  accessLevel,
}: CMSAdminShellProps) {
  // Build the site URL for "View Site" link
  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`

  // Determine user role label based on access type and level
  const isOwner = accessType === "owner"
  const isTeamAdmin = accessType === "team" && accessLevel === "admin"
  const userRoleLabel = isOwner ? "Site Owner" : isTeamAdmin ? "Team Admin" : "Store Manager"

  // Team members with non-admin access have restricted UI
  const hasRestrictedAccess = accessType === "team" && accessLevel !== "admin"

  // Configure AdminShell based on subdomain and access
  const config: AdminShellConfig = {
    basePath: `/cms/${subdomain}`,
    siteUrl,
    siteName: subdomain,
    userRole: userRoleLabel,
    hiddenGroups: hasRestrictedAccess ? STORE_MANAGER_HIDDEN_GROUPS : [],
    hiddenItems: hasRestrictedAccess ? STORE_MANAGER_HIDDEN_ITEMS : [],
    showChat: true,
  }

  return (
    <AccessProvider value={{ subdomain, accessType, accessLevel }}>
      <AdminShell config={config}>{children}</AdminShell>
    </AccessProvider>
  )
}
