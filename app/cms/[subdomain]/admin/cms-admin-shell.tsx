"use client"

import { AdminShell } from "@cncpt/cms/admin"
import type { AdminShellConfig } from "@cncpt/cms/admin"
import { rootDomain, protocol } from "@/lib/utils"

// Role-based navigation configuration
const STORE_MANAGER_HIDDEN_GROUPS = ['System']
const STORE_MANAGER_HIDDEN_ITEMS = ['Order Workflows', 'Plugins', 'Workflows']

interface CMSAdminShellProps {
  children: React.ReactNode
  subdomain: string
  userRole?: 'owner' | 'manager'
}

export function CMSAdminShell({
  children,
  subdomain,
  userRole = 'owner',
}: CMSAdminShellProps) {
  // Build the site URL for "View Site" link
  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`

  // Configure AdminShell based on subdomain and role
  const config: AdminShellConfig = {
    basePath: `/cms/${subdomain}`,
    siteUrl,
    siteName: subdomain,
    userRole: userRole === 'owner' ? 'Site Owner' : 'Store Manager',
    hiddenGroups: userRole === 'manager' ? STORE_MANAGER_HIDDEN_GROUPS : [],
    hiddenItems: userRole === 'manager' ? STORE_MANAGER_HIDDEN_ITEMS : [],
    showChat: true,
  }

  return <AdminShell config={config}>{children}</AdminShell>
}
