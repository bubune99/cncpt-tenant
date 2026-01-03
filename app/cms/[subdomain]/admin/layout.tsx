import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { CMSAdminShell } from "./cms-admin-shell"

export default async function CMSAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { subdomain: string }
}) {
  // Server-side auth check
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect(`/login?redirect=/cms/${params.subdomain}/admin`)
  }

  // TODO: Verify user has permission for this subdomain
  // - Site owner: full access
  // - Store manager: invited access only

  return (
    <CMSAdminShell subdomain={params.subdomain}>
      {children}
    </CMSAdminShell>
  )
}
