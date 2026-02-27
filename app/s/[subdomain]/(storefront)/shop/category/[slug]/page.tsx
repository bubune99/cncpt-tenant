/**
 * Category Filtered Shop Page
 *
 * Renders shop products filtered by category. If a CMS page with a matching
 * slug exists, uses that. Otherwise uses default template blocks with
 * CategoryNav and ProductGrid filtered by category.
 *
 * Route: /s/[subdomain]/shop/category/[slug]
 */

import { prisma } from '@/lib/cms/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlockPageRenderer } from '@/components/cms/page-wrapper/block-page-renderer';
import type { Block } from '@/lib/cms/block-editor/types';
import {
  registerCommerceFetchers,
  resolveSmartBlockData,
  serializeSmartBlockData,
} from '@/lib/cms/block-editor/smart-blocks';
import { defaultCategoryPageBlocks } from '@/lib/cms/block-editor/smart-blocks/default-templates';
import { getTenantContext } from '../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

async function getCategory(slug: string, tenantId: number) {
  return prisma.category.findFirst({
    where: { slug, tenantId },
  });
}

async function getCategoryPage(slug: string, tenantId: number) {
  return prisma.page.findFirst({
    where: {
      OR: [
        { slug: `shop/category/${slug}` },
        { slug: `/shop/category/${slug}` },
      ],
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
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Category Not Found' };
  }

  const category = await getCategory(slug, tenantContext.id);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - Shop`,
    description: category.description || `Browse ${category.name} products`,
    openGraph: {
      title: `${category.name} - Shop`,
      description: category.description || `Browse ${category.name} products`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    notFound();
  }

  const category = await getCategory(slug, tenantContext.id);

  if (!category) {
    notFound();
  }

  // Check for a CMS page override
  const page = await getCategoryPage(slug, tenantContext.id);
  const pageBlocks = page ? parseBlocks(page.content) : [];

  const finalBlocks = pageBlocks.length > 0
    ? pageBlocks
    : defaultCategoryPageBlocks(slug);

  registerCommerceFetchers();
  const dataMap = await resolveSmartBlockData(finalBlocks);
  const smartBlockData = serializeSmartBlockData(dataMap);

  return <BlockPageRenderer blocks={finalBlocks} smartBlockData={smartBlockData} />;
}
