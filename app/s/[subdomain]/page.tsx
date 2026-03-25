import { notFound } from "next/navigation"
import { getTenantData } from "@/lib/tenant"
import { StorefrontRouter } from "@/components/cms/storefront"
import { prisma } from "@/lib/cms/db"
import { PageWrapper, getPageLayoutSettings } from "@/components/cms/page-wrapper"
import { BlockPageRenderer } from "@/components/cms/page-wrapper/block-page-renderer"
import type { Block } from "@/lib/cms/block-editor/types"
import {
  registerCommerceFetchers,
  registerDashboardFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from "@/lib/cms/block-editor/smart-blocks"

/** Page content data shape */
interface Data {
  content: Array<{ type: string; props: Record<string, unknown>; [key: string]: unknown }>;
  root?: { props?: Record<string, unknown> };
  zones?: Record<string, unknown[]>;
}

/** Parse block editor v2 content */
function parseBlocks(content: unknown): Block[] {
  if (!content || typeof content !== "object") return []
  const doc = content as Record<string, unknown>
  if (doc.version === "2.0" && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[]
  }
  return []
}

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
 * Validate page content data
 */
function validatePageContent(content: unknown): Data | null {
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
 * Fetch home page for the tenant.
 * Checks multiple slug formats: "/", "home", "/home"
 */
async function getHomePage(tenantId: number) {
  try {
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { slug: "/" },
          { slug: "home" },
          { slug: "/home" },
        ],
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

  // Check if tenant has a home page with content
  const homePage = await getHomePage(tenantData.id)

  if (homePage && homePage.content) {
    // Try block editor v2 format first
    const blocks = parseBlocks(homePage.content)

    if (blocks.length > 0) {
      registerCommerceFetchers()
      registerDashboardFetchers()
      const dataMap = await resolveSmartBlockData(blocks)
      const smartBlockData = serializeSmartBlockData(dataMap)

      return (
        <PageWrapper pageSettings={getPageLayoutSettings(homePage)}>
          <BlockPageRenderer blocks={blocks} smartBlockData={smartBlockData} />
        </PageWrapper>
      )
    }

    // Fall back to legacy validation
    const validatedContent = validatePageContent(homePage.content)
    if (validatedContent) {
      return (
        <PageWrapper pageSettings={getPageLayoutSettings(homePage)}>
          <BlockPageRenderer blocks={[]} smartBlockData={{}} />
        </PageWrapper>
      )
    }
  }

  // Fall back to the default StorefrontRouter
  return (
    <StorefrontRouter subdomain={subdomain} path={[]} tenantId={tenantData.id} />
  )
}
