import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { canAccessSubdomain } from "@/lib/cms/team-auth"
import { CMSAdminShell } from "./cms-admin-shell"

export default async function CMSAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect(`/login?redirect=/cms/${subdomain}/admin`)
  }

  // Verify subdomain access - requires "edit" level for CMS admin
  const access = await canAccessSubdomain(user.id, subdomain, "edit")

  if (!access.hasAccess) {
    redirect("/dashboard/teams?error=no-subdomain-access")
  }

  return (
    <CMSAdminShell
      subdomain={subdomain}
      accessType={access.accessType}
      accessLevel={access.accessLevel || "admin"}
    >
      {children}
    </CMSAdminShell>
  )
}
