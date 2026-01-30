import { notFound } from "next/navigation"
import { getTenantData } from "@/lib/tenant"
import { StorefrontRouter } from "@cncpt/cms/storefront"

export const dynamic = 'force-dynamic'

interface SubdomainSlugPageProps {
  params: Promise<{ subdomain: string; slug: string[] }>
}

export default async function SubdomainSlugPage({ params }: SubdomainSlugPageProps) {
  const { subdomain, slug } = await params

  // Verify the subdomain exists in our tenant database
  const tenantData = await getTenantData(subdomain)

  if (!tenantData) {
    console.log("[Storefront] No tenant found for subdomain:", subdomain)
    notFound()
  }

  // Use the CMS StorefrontRouter to render the appropriate page
  return <StorefrontRouter subdomain={subdomain} path={slug} />
}
