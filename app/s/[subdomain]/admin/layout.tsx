import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { canAccessSubdomain } from "@/lib/team-auth"
import { CMSAdminShell } from "@cncpt/cms/admin-shell"
import { getTenantData } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function SubdomainAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const user = await stackServerApp.getUser()

  if (!user) {
    // Redirect to root domain login with return URL
    const returnUrl = encodeURIComponent(`/s/${subdomain}/admin`)
    redirect(`/login?redirect=${returnUrl}`)
  }

  // Verify subdomain access
  const access = await canAccessSubdomain(user.id, subdomain, "edit")

  if (!access.hasAccess) {
    redirect("/dashboard/teams?error=no-subdomain-access")
  }

  // Get tenant ID for the subdomain
  const tenantData = await getTenantData(subdomain)
  const tenantId = tenantData?.id ?? null

  return (
    <CMSAdminShell
      subdomain={subdomain}
      tenantId={tenantId}
      accessLevel={access.accessLevel || "admin"}
      basePath={`/s/${subdomain}/admin`}
    >
      {children}
    </CMSAdminShell>
  )
}
