/**
 * Products API
 *
 * GET /api/products - List products with filtering and pagination
 * POST /api/products - Create a new product
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import type { ProductStatus, ProductType, Prisma } from '@prisma/client'

// GET - List products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') as ProductStatus | null
    const type = searchParams.get('type') as ProductType | null
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Includes
    const includeVariants = searchParams.get('includeVariants') === 'true'
    const includeImages = searchParams.get('includeImages') === 'true'
    const includeCategories = searchParams.get('includeCategories') === 'true'

    // Build where clause
    const where: Prisma.ProductWhereInput = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (featured !== null && featured !== undefined) {
      where.featured = featured === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categories = {
        some: { categoryId },
      }
    }

    // Build include clause
    const include: Prisma.ProductInclude = {}

    if (includeVariants) {
      include.variants = {
        include: {
          optionValues: {
            include: {
              optionValue: true,
            },
          },
          image: true,
        },
        orderBy: { createdAt: 'asc' },
      }
    }

    if (includeImages) {
      include.images = {
        include: { media: true },
        orderBy: { position: 'asc' },
      }
    }

    if (includeCategories) {
      include.categories = {
        include: { category: true },
      }
    }

    // Execute query
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List products error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list products' },
      { status: 500 }
    )
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      slug,
      description,
      descriptionHtml,
      basePrice = 0,
      compareAtPrice,
      status = 'DRAFT',
      featured = false,
      type = 'SIMPLE',
      sku,
      barcode,
      costPrice,
      taxable = true,
      taxCode,
      requiresShipping = true,
      weight,
      length,
      width,
      height,
      trackInventory = true,
      stock = 0,
      lowStockThreshold = 5,
      allowBackorder = false,
      subscriptionInterval,
      subscriptionIntervalCount,
      trialDays,
      bundleItems,
      bundlePriceMode,
      digitalAssetId,
      serviceDuration,
      serviceCapacity,
      metaTitle,
      metaDescription,
      categoryIds = [],
      variants = [],
      options = [],
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check for existing slug
    const existing = await prisma.product.findUnique({
      where: { slug: finalSlug },
    })

    if (existing) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 400 })
    }

    // Create product with related data
    const product = await prisma.product.create({
      data: {
        title,
        slug: finalSlug,
        description,
        descriptionHtml,
        basePrice,
        compareAtPrice,
        status,
        featured,
        type,
        sku,
        barcode,
        costPrice,
        taxable,
        taxCode,
        requiresShipping,
        weight,
        length,
        width,
        height,
        trackInventory,
        stock,
        lowStockThreshold,
        allowBackorder,
        subscriptionInterval,
        subscriptionIntervalCount,
        trialDays,
        bundleItems,
        bundlePriceMode,
        digitalAssetId,
        serviceDuration,
        serviceCapacity,
        metaTitle,
        metaDescription,
        // Create category connections
        categories: categoryIds.length > 0
          ? {
              create: categoryIds.map((categoryId: string) => ({
                categoryId,
              })),
            }
          : undefined,
        // Create options
        options: options.length > 0
          ? {
              create: options.map((option: { name: string; values: string[] }, index: number) => ({
                name: option.name,
                position: index,
                values: {
                  create: option.values.map((value: string, vIndex: number) => ({
                    value,
                    position: vIndex,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
        options: { include: { values: true } },
        images: { include: { media: true } },
      },
    })

    // Create variants if provided
    if (variants.length > 0) {
      await Promise.all(
        variants.map(async (variant: {
          sku?: string;
          barcode?: string;
          price: number;
          compareAtPrice?: number;
          costPrice?: number;
          stock?: number;
          lowStockThreshold?: number;
          allowBackorder?: boolean;
          weight?: number;
          length?: number;
          width?: number;
          height?: number;
          optionValues?: string[];
        }) => {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variant.sku,
              barcode: variant.barcode,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              costPrice: variant.costPrice,
              stock: variant.stock || 0,
              lowStockThreshold: variant.lowStockThreshold || 5,
              allowBackorder: variant.allowBackorder || false,
              weight: variant.weight,
              length: variant.length,
              width: variant.width,
              height: variant.height,
            },
          })
        })
      )
    }

    // Fetch complete product
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: { include: { category: true } },
        options: { include: { values: true } },
        variants: true,
        images: { include: { media: true } },
      },
    })

    return NextResponse.json(completeProduct, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    )
  }
}
