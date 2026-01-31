import { notFound } from "next/navigation"
import { getTenantData } from "@/lib/tenant"
import { StorefrontRouter } from "@/components/cms/storefront"

export const dynamic = "force-dynamic"

interface SubdomainPageProps {
  params: Promise<{ subdomain: string }>
}

// Error component for database issues
function DatabaseError({ subdomain }: { subdomain: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Site Temporarily Unavailable
        </h1>
        <p className="text-gray-600 mb-4">
          We&apos;re having trouble loading <strong>{subdomain}</strong>. Please
          try again in a moment.
        </p>
        <p className="text-sm text-gray-500">
          If this problem persists, please contact the site administrator.
        </p>
      </div>
    </div>
  )
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { subdomain } = await params

  // Verify the subdomain exists in our tenant database
  let tenantData
  try {
    tenantData = await getTenantData(subdomain)
  } catch (error) {
    console.error("[Storefront] Database error for subdomain:", subdomain, error)
    return <DatabaseError subdomain={subdomain} />
  }

  if (!tenantData) {
    console.log("[Storefront] No tenant found for subdomain:", subdomain)
    notFound()
  }

  // Use the CMS StorefrontRouter to render the home page
  // Pass tenantId to filter content by tenant
  return (
    <StorefrontRouter subdomain={subdomain} path={[]} tenantId={tenantData.id} />
  )
}
