"use client"

import { ReactNode } from "react"
import { TenantProvider, TenantProviderProps } from "../contexts/tenant-context"
import { AdminShell } from "../app/admin/AdminShell"

export interface CMSAdminShellProps extends Omit<TenantProviderProps, "children"> {
  children: ReactNode
}

/**
 * CMS Admin Shell with tenant context
 * Wraps the admin pages with sidebar navigation and tenant context
 */
export function CMSAdminShell({
  children,
  subdomain,
  tenantId,
  accessLevel = "admin",
  basePath = "/admin",
}: CMSAdminShellProps) {
  return (
    <TenantProvider
      subdomain={subdomain}
      tenantId={tenantId}
      accessLevel={accessLevel}
      basePath={basePath}
    >
      <AdminShell>{children}</AdminShell>
    </TenantProvider>
  )
}

export { AdminShell }
