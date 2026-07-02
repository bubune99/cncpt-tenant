import Link from 'next/link';
import { headers } from 'next/headers';
import { runWithTenant, prisma } from '@/lib/cms/db';
import { getTenantData } from '@/lib/tenant';
import { PageWrapper, getPageLayoutSettings } from '@/components/cms/page-wrapper';
import { BlockPageRenderer } from '@/components/cms/page-wrapper/block-page-renderer';
import {
  registerCommerceFetchers,
  registerDashboardFetchers,
  registerFormFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from '@/lib/cms/block-editor/smart-blocks';
import type { Block } from '@/lib/cms/block-editor/types';
// Side-effect: register smart-block DEFINITIONS in the server registry so
// resolveSmartBlockData can emit their data requirements.
import '@/components/cms/smart-blocks/commerce';
import '@/components/cms/smart-blocks/dashboard';
import '@/components/cms/smart-blocks/forms';

/**
 * Not Found page for subdomain routes.
 *
 * Catches notFound() calls within /s/[subdomain]/ — for example when a page
 * slug doesn't exist on a valid subdomain.
 *
 * Resolution order:
 *   1. If the tenant has a PUBLISHED `__system/not-found` Page row with
 *      block content, render it through the same BlockPageRenderer the
 *      storefront uses for any other CMS page (so all blocks/smart-blocks
 *      work).
 *   2. Otherwise, fall back to the platform default copy.
 *
 * Tenant resolution uses the request `host` header. We don't have access
 * to the `[subdomain]` URL param inside not-found, so we sniff it from the
 * Host (the same approach used by middleware and rootDomain matching).
 */

interface CustomNotFoundResult {
  blocks: Block[]
  smartBlockData: Record<string, Record<string, unknown>>
  pageSettings: ReturnType<typeof getPageLayoutSettings>
  metaTitle: string | null
}

/** Parse block editor v2 content into a Block[] array. */
function parseBlocks(content: unknown): Block[] {
  if (!content || typeof content !== 'object') return []
  const doc = content as Record<string, unknown>
  if (doc.version === '2.0' && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[]
  }
  return []
}

/** Extract subdomain (or null for apex) from a Host header. */
function subdomainFromHost(host: string | null): string | null {
  if (!host) return null
  const cleaned = host.split(':')[0].trim().toLowerCase()
  if (!cleaned) return null
  // Apex / single-label hosts (localhost, staging, ip) → null.
  const labels = cleaned.split('.')
  if (labels.length < 2) return null
  // We treat anything before the second-to-last label as subdomain.
  // Production: `bubune.cncptweb.com` → `bubune`.
  // Apex: `cncptweb.com` → null (only 2 labels).
  if (labels.length === 2) return null
  return labels[0]
}

/**
 * Try to resolve a tenant's custom not-found page. Returns null when:
 *   - host can't be mapped to a subdomain
 *   - tenant doesn't exist
 *   - tenant hasn't customised the page or it isn't published
 *   - the customised page has no usable block content
 */
async function loadCustomNotFound(): Promise<CustomNotFoundResult | null> {
  try {
    const headerList = await headers()
    const host = headerList.get('host')
    const subdomain = subdomainFromHost(host)
    if (!subdomain) return null

    const tenantData = await getTenantData(subdomain)
    if (!tenantData) return null

    // Run inside the tenant context so RLS + middleware scope the lookup.
    const page = await runWithTenant(tenantData.id, async () =>
      prisma.page.findFirst({
        where: {
          systemKey: 'NOT_FOUND',
          status: 'PUBLISHED',
        },
        include: { featuredImage: true },
      })
    )

    if (!page || !page.content) return null

    const blocks = parseBlocks(page.content)
    if (blocks.length === 0) return null

    registerCommerceFetchers()
    registerDashboardFetchers()
    registerFormFetchers()
    const dataMap = await runWithTenant(tenantData.id, () => resolveSmartBlockData(blocks))
    const smartBlockData = serializeSmartBlockData(dataMap)

    return {
      blocks,
      smartBlockData,
      pageSettings: getPageLayoutSettings(page),
      metaTitle: page.metaTitle ?? page.title,
    }
  } catch (error) {
    // Never let a 404 page error itself — fall back to default.
    console.error('Failed to load custom 404 page:', error)
    return null
  }
}

export default async function SubdomainNotFound() {
  const custom = await loadCustomNotFound()

  if (custom) {
    return (
      <PageWrapper pageSettings={custom.pageSettings}>
        <BlockPageRenderer
          blocks={custom.blocks}
          smartBlockData={custom.smartBlockData}
        />
      </PageWrapper>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="text-center max-w-md px-4">
        <p className="text-5xl sm:text-6xl font-bold text-gray-300 mb-3 sm:mb-4">404</p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 mb-2 sm:mb-3">
          Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
