import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"
import { canAccessSubdomain } from "@/lib/team-auth"
import { CMSAdminShell } from "@/admin-pages/shell"
import { getTenantData } from "@/lib/tenant"

export const dynamic = "force-dynamic"

// Error component to show when database is unavailable
function DatabaseError({ subdomain }: { subdomain: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-xl font-bold text-red-600 mb-4">
          Database Connection Error
        </h1>
        <p className="text-gray-600 mb-4">
          Unable to connect to the database for subdomain{" "}
          <strong>{subdomain}</strong>. This is likely a configuration issue.
        </p>
        <p className="text-sm text-gray-500">
          Please ensure DATABASE_URL is properly configured in your environment
          variables.
        </p>
      </div>
    </div>
  )
}

export default async function SubdomainAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  // Check auth first (this doesn't require database)
  let user
  try {
    user = await stackServerApp.getUser()
  } catch (error) {
    console.error("[admin-layout] Auth error:", error)
    redirect("/login")
  }

  if (!user) {
    // Redirect to root domain login with return URL
    const returnUrl = encodeURIComponent(`/s/${subdomain}/admin`)
    redirect(`/login?redirect=${returnUrl}`)
  }

  // Verify subdomain access - this uses the neon client
  let access
  try {
    access = await canAccessSubdomain(user.id, subdomain, "edit")
  } catch (error) {
    console.error("[admin-layout] Error checking subdomain access:", error)
    return <DatabaseError subdomain={subdomain} />
  }

  if (!access.hasAccess) {
    redirect("/dashboard/teams?error=no-subdomain-access")
  }

  // Get tenant ID for the subdomain - this uses Prisma
  let tenantData
  let tenantId = null
  try {
    tenantData = await getTenantData(subdomain)
    tenantId = tenantData?.id ?? null
  } catch (error) {
    console.error("[admin-layout] Error getting tenant data:", error)
    return <DatabaseError subdomain={subdomain} />
  }

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
