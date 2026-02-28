/**
 * UCP Catalog — Product Detail
 *
 * GET /api/ucp/catalog/products/:id — Get a single product in UCP format
 *
 * Returns full product details including all images, variants, and categories.
 * Returns 404 if the product does not exist or is not ACTIVE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import {
  ucpEnvelope,
  type UcpCatalogProduct,
  type UcpCatalogVariant,
} from '@/lib/cms/ucp/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        include: { media: true },
        orderBy: { position: 'asc' },
      },
      variants: {
        where: { enabled: true },
      },
      categories: {
        include: { category: true },
      },
    },
  });

  if (!product || product.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const images = product.images
    .map((img) => img.media?.url)
    .filter((url): url is string => !!url);

  const variants: UcpCatalogVariant[] = product.variants.map((v) => ({
    id: v.id,
    title: v.sku ?? undefined,
    price: v.price,
    sku: v.sku ?? undefined,
    in_stock: v.stock > 0 || v.allowBackorder,
    stock: v.stock,
  }));

  const categoryNames = product.categories.map((pc) => pc.category.name);

  const item: UcpCatalogProduct = {
    id: product.id,
    title: product.title,
    description: product.description ?? undefined,
    price: product.basePrice,
    currency: 'USD',
    image_url: images[0] ?? undefined,
    images: images.length > 0 ? images : undefined,
    in_stock: product.stock > 0 || product.allowBackorder,
    variants: variants.length > 0 ? variants : undefined,
    categories: categoryNames.length > 0 ? categoryNames : undefined,
    sku: product.sku ?? undefined,
    type: product.type,
  };

  return NextResponse.json(
    {
      ucp: ucpEnvelope(),
      product: item,
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, UCP-Agent',
    },
  });
}
