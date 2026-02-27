/**
 * Shop Listing Page
 *
 * Renders the main shop page. If a CMS page with slug 'shop' or '/shop'
 * exists and is PUBLISHED, renders that. Otherwise uses default template blocks.
 *
 * Route: /s/[subdomain]/shop
 */

import { prisma } from '@/lib/cms/db';
import type { Metadata } from 'next';
import { BlockPageRenderer } from '@/components/cms/page-wrapper/block-page-renderer';
import type { Block } from '@/lib/cms/block-editor/types';
import {
  registerCommerceFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from '@/lib/cms/block-editor/smart-blocks';
import { defaultShopPageBlocks } from '@/lib/cms/block-editor/smart-blocks/default-templates';
import { getTenantContext } from '../../lib/tenant-context';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

async function getShopPage(tenantId: number) {
  return prisma.page.findFirst({
    where: {
      OR: [{ slug: 'shop' }, { slug: '/shop' }],
      status: 'PUBLISHED',
      tenantId,
    },
    include: { featuredImage: true },
  });
}

function parseBlocks(content: unknown): Block[] {
  if (!content || typeof content !== 'object') return [];
  const doc = content as Record<string, unknown>;
  if (doc.version === '2.0' && Array.isArray(doc.blocks)) {
    return doc.blocks as Block[];
  }
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Shop' };
  }

  const page = await getShopPage(tenantContext.id);

  if (page) {
    return {
      title: page.metaTitle || page.title,
      description: page.metaDescription || 'Browse our products',
      openGraph: {
        title: page.metaTitle || page.title,
        description: page.metaDescription || 'Browse our products',
        type: 'website',
        images: page.featuredImage?.url ? [{ url: page.featuredImage.url }] : undefined,
      },
    };
  }

  return {
    title: 'Shop',
    description: 'Browse our products',
  };
}

export default async function ShopPage({ params }: PageProps) {
  const { subdomain } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return <div className="py-12 text-center text-gray-500">Site not found</div>;
  }

  const page = await getShopPage(tenantContext.id);
  const blocks = page ? parseBlocks(page.content) : [];
  const useDefault = blocks.length === 0;
  const finalBlocks = useDefault ? defaultShopPageBlocks() : blocks;

  registerCommerceFetchers();
  const dataMap = await resolveSmartBlockData(finalBlocks);
  const smartBlockData = serializeSmartBlockData(dataMap);

  return <BlockPageRenderer blocks={finalBlocks} smartBlockData={smartBlockData} />;
}
