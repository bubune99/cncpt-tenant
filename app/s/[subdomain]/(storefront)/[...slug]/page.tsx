/**
 * Catch-All CMS Page Route
 *
 * Renders CMS pages at any URL (e.g., /home, /about, /pricing).
 * Looks up the page by slug in the database scoped to the tenant.
 * If no page is found, returns 404.
 *
 * Route: /[...slug] (catch-all within storefront layout)
 */

import { prisma } from '@/lib/cms/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageWrapper, getPageLayoutSettings } from '@/components/cms/page-wrapper';
import { BlockPageRenderer } from '@/components/cms/page-wrapper/block-page-renderer';
import type { Block } from '@/lib/cms/block-editor/types';
import {
  registerCommerceFetchers,
  registerDashboardFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from '@/lib/cms/block-editor/smart-blocks';
import { getTenantContext } from '../../lib/tenant-context';

export const dynamic = 'force-dynamic';

/** Parse block editor v2 content */
function parseBlocks(content: unknown): Block[] {
  if (!content || typeof content !== 'object') return [];
  const doc = content as Record<string, unknown>;
  if (doc.version === '2.0' && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[];
  }
  return [];
}

interface PageProps {
  params: Promise<{ subdomain: string; slug: string[] }>;
}

/**
 * Fetch page by slug with tenant filtering
 */
async function getPage(slugParts: string[], tenantId: number) {
  const withSlash = '/' + slugParts.join('/');
  const withoutSlash = slugParts.join('/');

  const page = await prisma.page.findFirst({
    where: {
      OR: [{ slug: withSlash }, { slug: withoutSlash }],
      status: 'PUBLISHED',
      tenantId,
    },
    include: {
      featuredImage: true,
    },
  });

  return page;
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Site Not Found' };
  }
  const page = await getPage(slug, tenantContext.id);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      type: 'website',
      images: page.featuredImage?.url
        ? [{ url: page.featuredImage.url }]
        : undefined,
    },
  };
}

/**
 * Render the CMS page
 */
export default async function CatchAllPage({ params }: PageProps) {
  const { subdomain, slug } = await params;

  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    notFound();
  }

  const page = await getPage(slug, tenantContext.id);

  if (!page) {
    notFound();
  }

  // No content — show placeholder
  if (!page.content) {
    return (
      <PageWrapper pageSettings={getPageLayoutSettings(page)}>
        <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
          <header className="max-w-3xl mx-auto mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{page.title}</h1>
          </header>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm sm:text-base text-muted-foreground">
              This page has no content yet. Open it in the editor to add blocks.
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Parse block editor v2 content
  const blocks = parseBlocks(page.content);

  if (blocks.length > 0) {
    registerCommerceFetchers();
    registerDashboardFetchers();
    const dataMap = await resolveSmartBlockData(blocks);
    const smartBlockData = serializeSmartBlockData(dataMap);

    return (
      <PageWrapper pageSettings={getPageLayoutSettings(page)}>
        <BlockPageRenderer blocks={blocks} smartBlockData={smartBlockData} />
      </PageWrapper>
    );
  }

  // Empty blocks — show placeholder
  return (
    <PageWrapper pageSettings={getPageLayoutSettings(page)}>
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <header className="max-w-3xl mx-auto mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{page.title}</h1>
        </header>
        <div className="max-w-3xl mx-auto">
          <p className="text-sm sm:text-base text-muted-foreground">
            This page has no content yet. Open it in the editor to add blocks.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
