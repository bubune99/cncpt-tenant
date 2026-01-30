import { notFound } from "next/navigation"
import { getTenantData } from "@/lib/tenant"
import { StorefrontRouter } from "@cncpt/cms/storefront"

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
  // Pass tenantId to filter content by tenant
  return <StorefrontRouter subdomain={subdomain} path={[]} tenantId={tenantData.id} />
}
