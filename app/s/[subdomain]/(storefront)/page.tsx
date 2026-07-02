/**
 * Storefront Home (converged)
 *
 * Lives inside the (storefront) route group so it inherits the shared storefront
 * chrome — StorefrontChrome / StorefrontFooter / AnnouncementBar — from
 * (storefront)/layout.tsx. This makes the homepage honor the same
 * CMS-configurable header/footer/announcement as the rest of the storefront.
 *
 * Renders the tenant's published home page (block editor v2) when present,
 * otherwise the default StorefrontRouter home in `embedded` mode (its own
 * header/footer suppressed so only the shared chrome shows).
 */

import { notFound } from 'next/navigation';
import { getTenantData } from '@/lib/tenant';
import { prisma } from '@/lib/cms/db';
import { runWithTenant } from '@/lib/cms/db/tenant-context';
import { StorefrontRouter } from '@/components/cms/storefront';
import { BlockPageRenderer } from '@/components/cms/page-wrapper/block-page-renderer';
import type { Block } from '@/lib/cms/block-editor/types';
import {
  registerCommerceFetchers,
  registerDashboardFetchers,
  registerFormFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from '@/lib/cms/block-editor/smart-blocks';
// Side-effect: register smart-block DEFINITIONS in the server registry so
// resolveSmartBlockData can emit their data requirements (see shop/[slug]).
import '@/components/cms/smart-blocks/commerce';
import '@/components/cms/smart-blocks/dashboard';
import '@/components/cms/smart-blocks/forms';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

function parseBlocks(content: unknown): Block[] {
  if (!content || typeof content !== 'object') return [];
  const doc = content as Record<string, unknown>;
  if (doc.version === '2.0' && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[];
  }
  return [];
}

async function getHomePage(tenantId: number) {
  return prisma.page.findFirst({
    where: {
      OR: [{ slug: '/' }, { slug: 'home' }, { slug: '/home' }],
      status: 'PUBLISHED',
      tenantId,
    },
    include: { featuredImage: true },
  });
}

export default async function StorefrontHome({ params }: PageProps) {
  const { subdomain } = await params;

  const tenantData = await getTenantData(subdomain).catch(() => null);
  if (!tenantData) {
    notFound();
  }

  // Published home page (block editor) takes precedence.
  const homePage = await getHomePage(tenantData.id);
  const blocks = homePage ? parseBlocks(homePage.content) : [];

  if (blocks.length > 0) {
    registerCommerceFetchers();
    registerDashboardFetchers();
    registerFormFetchers();
    // Resolve smart-block data inside the tenant context so commerce fetchers
    // are scoped to this tenant (otherwise products etc. don't resolve).
    const dataMap = await runWithTenant(tenantData.id, () => resolveSmartBlockData(blocks));
    const smartBlockData = serializeSmartBlockData(dataMap);
    return <BlockPageRenderer blocks={blocks} smartBlockData={smartBlockData} />;
  }

  // Default home content — embedded so the shared chrome supplies header/footer.
  return <StorefrontRouter subdomain={subdomain} path={[]} tenantId={tenantData.id} embedded />;
}
