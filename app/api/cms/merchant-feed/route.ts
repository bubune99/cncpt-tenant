/**
 * Google Merchant Center Product Feed
 *
 * GET /api/merchant-feed — Returns product catalog in Google's required format
 *
 * Outputs JSON feed compatible with Google Merchant Center Content API.
 * Products include all required fields: id, title, description, price,
 * availability, image, link, and optional GTIN/brand fields.
 *
 * Query params:
 *   format — "json" (default) or "xml" (RSS 2.0 with g: namespace)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { getBaseUrl } from '@/lib/cms/ucp/types';
import { withTenant } from '@/lib/cms/api/tenant';

export const dynamic = 'force-dynamic';

interface MerchantProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link?: string;
  additional_image_link?: string[];
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  price: string; // "29.99 USD"
  sale_price?: string;
  brand?: string;
  gtin?: string;
  mpn?: string;
  condition: 'new' | 'refurbished' | 'used';
  product_type?: string;
  google_product_category?: string;
}

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  const format = request.nextUrl.searchParams.get('format') || 'json';
  const baseUrl = getBaseUrl();

  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: {
      images: {
        include: { media: true },
        orderBy: { position: 'asc' },
      },
      categories: {
        include: { category: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const feedItems: MerchantProduct[] = products.map((product) => {
    const images = product.images
      .map((img) => img.media?.url)
      .filter((url): url is string => !!url);

    const availability: MerchantProduct['availability'] =
      product.stock > 0 || product.allowBackorder ? 'in_stock' : 'out_of_stock';

    // Format price as "29.99 USD"
    const priceStr = `${(product.basePrice / 100).toFixed(2)} USD`;
    const salePriceStr =
      product.compareAtPrice && product.compareAtPrice > product.basePrice
        ? `${(product.basePrice / 100).toFixed(2)} USD`
        : undefined;

    const categoryPath = product.categories
      .map((c) => c.category.name)
      .join(' > ');

    const item: MerchantProduct = {
      id: product.id,
      title: product.title,
      description: (product.description || product.title).substring(0, 5000),
      link: `${baseUrl}/products/${product.slug || product.id}`,
      image_link: images[0],
      additional_image_link: images.length > 1 ? images.slice(1, 10) : undefined,
      availability,
      price: salePriceStr
        ? `${(product.compareAtPrice! / 100).toFixed(2)} USD`
        : priceStr,
      sale_price: salePriceStr,
      condition: 'new',
      product_type: categoryPath || undefined,
      mpn: product.sku || undefined,
    };

    return item;
  });

  if (format === 'xml') {
    const xml = buildRssFeed(feedItems, baseUrl);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return NextResponse.json(
    {
      channel: {
        title: 'Product Feed',
        link: baseUrl,
        description: 'Google Merchant Center product feed',
      },
      items: feedItems,
      total: feedItems.length,
      generated_at: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRssFeed(items: MerchantProduct[], baseUrl: string): string {
  const itemsXml = items
    .map(
      (item) => `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${escapeXml(item.link)}</link>
      ${item.image_link ? `<g:image_link>${escapeXml(item.image_link)}</g:image_link>` : ''}
      ${(item.additional_image_link || []).map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${item.availability}</g:availability>
      <g:price>${escapeXml(item.price)}</g:price>
      ${item.sale_price ? `<g:sale_price>${escapeXml(item.sale_price)}</g:sale_price>` : ''}
      <g:condition>${item.condition}</g:condition>
      ${item.mpn ? `<g:mpn>${escapeXml(item.mpn)}</g:mpn>` : ''}
      ${item.product_type ? `<g:product_type>${escapeXml(item.product_type)}</g:product_type>` : ''}
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Google Merchant Center product feed</description>
${itemsXml}
  </channel>
</rss>`;
}
