/**
 * UCP Catalog — List Products
 *
 * GET /api/ucp/catalog/products — List active products in UCP format
 *
 * Query params:
 *   search   — filter by title (case-insensitive contains)
 *   category — filter by category ID
 *   limit    — max results (1–100, default 20)
 *   offset   — pagination offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/cms/db';
import { withTenant } from '@/lib/cms/api/tenant';
import {
  ucpEnvelope,
  type UcpCatalogProduct,
  type UcpCatalogVariant,
} from '@/lib/cms/ucp/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenant(request, async () => {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get('search') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const where: Record<string, unknown> = { status: 'ACTIVE' as const };

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  if (category) {
    where.categories = { some: { categoryId: category } };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: {
          include: { media: true },
          orderBy: { position: 'asc' },
          take: 1,
        },
        variants: {
          where: { enabled: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where }),
  ]);

  const items: UcpCatalogProduct[] = products.map((p) => {
    const firstImage = p.images[0]?.media?.url ?? undefined;

    const variants: UcpCatalogVariant[] = p.variants.map((v) => ({
      id: v.id,
      title: v.sku ?? undefined,
      price: v.price,
      sku: v.sku ?? undefined,
      in_stock: v.stock > 0 || v.allowBackorder,
      stock: v.stock,
    }));

    return {
      id: p.id,
      title: p.title,
      description: p.description ?? undefined,
      price: p.basePrice,
      currency: 'USD',
      image_url: firstImage,
      in_stock: p.stock > 0 || p.allowBackorder,
      variants: variants.length > 0 ? variants : undefined,
      sku: p.sku ?? undefined,
      type: p.type,
    };
  });

  return NextResponse.json(
    {
      ucp: ucpEnvelope(),
      products: items,
      total,
      limit,
      offset,
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
  })
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
