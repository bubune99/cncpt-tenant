/**
 * Collection-Filtered Shop Page
 *
 * Renders the shop page filtered by a specific collection/category.
 * If a CMS page with a matching slug exists, renders that via the
 * block editor. Otherwise uses the FilterableProductGrid with the
 * collection pre-filtered.
 *
 * Route: /s/[subdomain]/shop/collection/[handle]
 */

import { prisma } from '@/lib/cms/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShopPageLayout } from '@/components/cms/shop/shop-page-layout';
import { getTenantContext } from '../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ subdomain: string; handle: string }>;
}

async function getCategory(slug: string, tenantId: number) {
  return prisma.category.findFirst({
    where: { slug, tenantId },
    include: {
      image: true,
      _count: { select: { products: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, handle } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Collection Not Found' };
  }

  const category = await getCategory(handle, tenantContext.id);

  if (!category) {
    return { title: 'Collection Not Found' };
  }

  return {
    title: category.name,
    description: category.description || `Browse ${category.name} products`,
    openGraph: {
      title: category.name,
      description: category.description || `Browse ${category.name} products`,
      type: 'website',
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { subdomain, handle } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    notFound();
  }

  const category = await getCategory(handle, tenantContext.id);

  if (!category) {
    notFound();
  }

  return (
    <ShopPageLayout
      title={category.name}
      description={category.description ?? undefined}
      collection={handle}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        { label: category.name },
      ]}
    />
  );
}
