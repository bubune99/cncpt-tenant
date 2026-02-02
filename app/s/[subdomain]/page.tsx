import { notFound } from "next/navigation"
import { getTenantData } from "@/lib/tenant"
import { StorefrontRouter } from "@/components/cms/storefront"
import { prisma } from "@/lib/cms/db"
import type { Data } from "@puckeditor/core"
import { PageWrapper, getPageLayoutSettings } from "@/components/cms/page-wrapper"
import { PageRenderer } from "@/components/cms/page-wrapper/page-renderer"

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

/**
 * Recursively validate component data
 */
function isValidComponent(item: unknown, depth = 0): boolean {
  if (depth > 50) return false
  if (!item || typeof item !== "object") return false

  const component = item as Record<string, unknown>
  if (typeof component.type !== "string" || !component.type.trim()) {
    return false
  }

  if (component.props && typeof component.props === "object") {
    const props = component.props as Record<string, unknown>
    for (const [, value] of Object.entries(props)) {
      if (Array.isArray(value)) {
        for (const nestedItem of value) {
          if (nestedItem && typeof nestedItem === "object" && "type" in nestedItem) {
            if (!isValidComponent(nestedItem, depth + 1)) {
              return false
            }
          }
        }
      } else if (value && typeof value === "object" && "type" in value) {
        if (!isValidComponent(value, depth + 1)) {
          return false
        }
      }
    }
  }

  return true
}

/**
 * Validate Puck content data
 */
function validatePuckContent(content: unknown): Data | null {
  if (!content || typeof content !== "object") return null

  const data = content as Data
  if (!Array.isArray(data.content)) return null

  for (const item of data.content) {
    if (!isValidComponent(item)) {
      return null
    }
  }

  if (data.zones && typeof data.zones === "object") {
    for (const [, zoneContent] of Object.entries(data.zones)) {
      if (Array.isArray(zoneContent)) {
        for (const item of zoneContent) {
          if (!isValidComponent(item)) {
            return null
          }
        }
      }
    }
  }

  return data as Data
}

/**
 * Fetch home page (slug "/") for the tenant
 */
async function getHomePage(tenantId: number) {
  try {
    const page = await prisma.page.findFirst({
      where: {
        slug: "/",
        status: "PUBLISHED",
        tenantId: tenantId,
      },
      include: {
        featuredImage: true,
      },
    })
    return page
  } catch (error) {
    console.error("[Storefront] Error fetching home page:", error)
    return null
  }
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

  // Check if tenant has a home page with Puck content
  const homePage = await getHomePage(tenantData.id)

  if (homePage && homePage.content) {
    // Validate and render Puck content
    const validatedContent = validatePuckContent(homePage.content)

    if (validatedContent) {
      // Render the home page with Puck content
      return (
        <PageWrapper pageSettings={getPageLayoutSettings(homePage)}>
          <PageRenderer puckContent={validatedContent} />
        </PageWrapper>
      )
    }
  }

  // Fall back to the default StorefrontRouter
  return (
    <StorefrontRouter subdomain={subdomain} path={[]} tenantId={tenantData.id} />
  )
}
