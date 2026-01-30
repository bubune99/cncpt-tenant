import { notFound } from "next/navigation"
import { getTenantData } from "@/lib/tenant"
// Import directly from source to avoid bundling client hooks
import { StorefrontRouter } from "@cncpt/cms/src/components/storefront/StorefrontRouter"

export const dynamic = 'force-dynamic'

interface SubdomainPageProps {
  params: Promise<{ subdomain: string }>
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { subdomain } = await params

  // Verify the subdomain exists in our tenant database
  const tenantData = await getTenantData(subdomain)

  if (!tenantData) {
    console.log("[Storefront] No tenant found for subdomain:", subdomain)
    notFound()
  }

  // Use the CMS StorefrontRouter to render the home page
  return <StorefrontRouter subdomain={subdomain} path={[]} />
}
