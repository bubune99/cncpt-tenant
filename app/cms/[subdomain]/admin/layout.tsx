import { Suspense } from "react"
import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"

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

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        {children}
      </Suspense>
    </div>
  )
}
