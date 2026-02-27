/**
 * Product Detail Page
 *
 * Renders a single product. If a CMS page template with slug 'product-detail'
 * exists, uses that template and injects the product slug into the ProductDetail
 * block's commerce.handle. Otherwise uses default template blocks.
 *
 * Route: /s/[subdomain]/shop/[slug]
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
import { defaultProductDetailBlocks } from '@/lib/cms/block-editor/smart-blocks/default-templates';
import { getTenantContext } from '../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

async function getProduct(slug: string, tenantId: number) {
  return prisma.product.findFirst({
    where: { slug, status: 'ACTIVE', tenantId },
    include: {
      images: {
        orderBy: { position: 'asc' },
        include: { media: true },
      },
    },
  });
}

async function getTemplate(tenantId: number) {
  return prisma.page.findFirst({
    where: {
      OR: [{ slug: 'product-detail' }, { slug: '/product-detail' }],
      status: 'PUBLISHED',
      tenantId,
    },
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

/** Inject the product slug into ProductDetail blocks in the template */
function injectProductSlug(blocks: Block[], productSlug: string): Block[] {
  return blocks.map((block) => {
    const updated = { ...block };
    if (updated.componentName === 'ProductDetail') {
      updated.commerce = {
        ...updated.commerce,
        type: 'product',
        handle: productSlug,
      };
    }
    if (updated.children) {
      updated.children = injectProductSlug(updated.children, productSlug);
    }
    return updated;
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    return { title: 'Product Not Found' };
  }

  const product = await getProduct(slug, tenantContext.id);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const firstImage = product.images?.[0];
  const imageUrl = (firstImage as { media?: { url?: string } } | undefined)?.media?.url;

  return {
    title: product.title,
    description: product.description || `Shop ${product.title}`,
    openGraph: {
      title: product.title,
      description: product.description || `Shop ${product.title}`,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { subdomain, slug } = await params;
  const tenantContext = await getTenantContext(subdomain);
  if (!tenantContext) {
    notFound();
  }

  const product = await getProduct(slug, tenantContext.id);

  if (!product) {
    notFound();
  }

  // Check for a CMS page template
  const template = await getTemplate(tenantContext.id);
  const templateBlocks = template ? parseBlocks(template.content) : [];

  let finalBlocks: Block[];
  if (templateBlocks.length > 0) {
    finalBlocks = injectProductSlug(templateBlocks, slug);
  } else {
    finalBlocks = defaultProductDetailBlocks(slug);
  }

  registerCommerceFetchers();
  const dataMap = await resolveSmartBlockData(finalBlocks);
  const smartBlockData = serializeSmartBlockData(dataMap);

  return <BlockPageRenderer blocks={finalBlocks} smartBlockData={smartBlockData} />;
}
