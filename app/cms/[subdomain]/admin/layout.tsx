import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { AdminShell } from "./components/admin-shell"

export default async function CMSAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { subdomain: string }
}) {
  // Verify user has access to this subdomain's CMS
  const user = await stackServerApp.getUser()

  if (!user) {
    // Redirect to login - they'll come back after auth
    redirect(`/login?redirect=/cms/${params.subdomain}/admin`)
  }

  // TODO: Verify user has permission for this subdomain
  // - Site owner: full access
  // - Store manager: invited access only

  return <AdminShell>{children}</AdminShell>
}
