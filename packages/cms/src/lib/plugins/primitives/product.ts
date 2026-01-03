/**
 * Product Primitives
 *
 * AI-callable primitives for product catalog operations.
 * These enable store owners to build custom product displays via Puck.
 */

import { CreatePrimitiveRequest } from '../types';

export const PRODUCT_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // PRODUCT LISTING
  // ============================================================================
  {
    name: 'product.list',
    description: 'List products with pagination, filtering, and sorting options',
    category: 'product',
    tags: ['product', 'catalog', 'list', 'storefront'],
    icon: 'Package',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (1-based)',
          default: 1,
          minimum: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        categoryId: {
          type: 'string',
          description: 'Filter by category ID',
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
        },
        featured: {
          type: 'boolean',
          description: 'Filter to featured products only',
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price filter',
          minimum: 0,
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price filter',
          minimum: 0,
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['name', 'price', 'createdAt', 'updatedAt'],
          default: 'createdAt',
        },
        sortOrder: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
        includeVariants: {
          type: 'boolean',
          description: 'Include product variants in response',
          default: false,
        },
      },
      required: [],
    },
    handler: `
      const { page = 1, limit = 20, categoryId, status, featured, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', includeVariants = false } = input;

      const where = { deletedAt: null };
      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;
      if (featured !== undefined) where.featured = featured;
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        if (minPrice !== undefined) where.basePrice.gte = minPrice;
        if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            variants: includeVariants ? {
              where: { deletedAt: null },
              select: { id: true, name: true, sku: true, price: true, stock: true, options: true }
            } : false,
            images: { select: { id: true, url: true, alt: true }, orderBy: { order: 'asc' }, take: 1 },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription || p.description?.substring(0, 200),
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          featured: p.featured,
          status: p.status,
          category: p.category,
          image: p.images[0] || null,
          variants: p.variants || [],
          variantCount: includeVariants ? p.variants?.length : undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `,
  },

  // ============================================================================
  // GET SINGLE PRODUCT
  // ============================================================================
  {
    name: 'product.get',
    description: 'Get detailed product information by ID or slug',
    category: 'product',
    tags: ['product', 'catalog', 'detail', 'storefront'],
    icon: 'PackageSearch',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        slug: {
          type: 'string',
          description: 'Product slug (alternative to ID)',
        },
        includeRelated: {
          type: 'boolean',
          description: 'Include related products',
          default: false,
        },
      },
      required: [],
    },
    handler: `
      const { productId, slug, includeRelated = false } = input;

      if (!productId && !slug) {
        throw new Error('Either productId or slug is required');
      }

      const where = productId ? { id: productId } : { slug };
      where.deletedAt = null;

      const product = await prisma.product.findFirst({
        where,
        include: {
          category: true,
          variants: {
            where: { deletedAt: null },
            include: {
              images: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
          images: { orderBy: { order: 'asc' } },
          reviews: {
            where: { status: 'APPROVED' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate average rating
      const reviewStats = await prisma.productReview.aggregate({
        where: { productId: product.id, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      let related = [];
      if (includeRelated && product.categoryId) {
        related = await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            images: { take: 1, orderBy: { order: 'asc' } },
          },
          take: 4,
        });
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        sku: product.sku,
        featured: product.featured,
        status: product.status,
        category: product.category,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          options: v.options,
          images: v.images,
        })),
        images: product.images,
        reviews: product.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          author: r.user?.name || 'Anonymous',
          createdAt: r.createdAt,
        })),
        rating: {
          average: reviewStats._avg.rating || 0,
          count: reviewStats._count.rating || 0,
        },
        related,
        metadata: product.metadata,
        seo: {
          title: product.seoTitle || product.name,
          description: product.seoDescription || product.shortDescription,
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    `,
  },

  // ============================================================================
  // SEARCH PRODUCTS
  // ============================================================================
  {
    name: 'product.search',
    description: 'Full-text search across products',
    category: 'product',
    tags: ['product', 'search', 'catalog', 'storefront'],
    icon: 'Search',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
          minLength: 2,
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
          minimum: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
          minimum: 1,
          maximum: 50,
        },
        categoryId: {
          type: 'string',
          description: 'Filter by category',
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price',
        },
      },
      required: ['query'],
    },
    handler: `
      const { query, page = 1, limit = 20, categoryId, minPrice, maxPrice } = input;

      const searchTerms = query.toLowerCase().split(/\\s+/).filter(t => t.length >= 2);

      const where = {
        status: 'ACTIVE',
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: searchTerms } },
        ],
      };

      if (categoryId) where.categoryId = categoryId;
      if (minPrice !== undefined) where.basePrice = { ...where.basePrice, gte: minPrice };
      if (maxPrice !== undefined) where.basePrice = { ...where.basePrice, lte: maxPrice };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { take: 1, orderBy: { order: 'asc' } },
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        query,
        results: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription || p.description?.substring(0, 150),
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          category: p.category,
          image: p.images[0] || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `,
  },

  // ============================================================================
  // GET BY CATEGORY
  // ============================================================================
  {
    name: 'product.getByCategory',
    description: 'Get products by category with optional subcategory traversal',
    category: 'product',
    tags: ['product', 'category', 'catalog', 'storefront'],
    icon: 'FolderTree',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'string',
          description: 'Category ID',
        },
        categorySlug: {
          type: 'string',
          description: 'Category slug (alternative to ID)',
        },
        includeSubcategories: {
          type: 'boolean',
          description: 'Include products from subcategories',
          default: true,
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['name', 'price', 'createdAt', 'featured'],
          default: 'createdAt',
        },
        sortOrder: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
      required: [],
    },
    handler: `
      const { categoryId, categorySlug, includeSubcategories = true, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = input;

      if (!categoryId && !categorySlug) {
        throw new Error('Either categoryId or categorySlug is required');
      }

      // Find category
      const category = await prisma.productCategory.findFirst({
        where: categoryId ? { id: categoryId } : { slug: categorySlug },
        include: {
          children: includeSubcategories ? { select: { id: true } } : false,
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      // Build category IDs list
      const categoryIds = [category.id];
      if (includeSubcategories && category.children) {
        categoryIds.push(...category.children.map(c => c.id));
      }

      const where = {
        categoryId: { in: categoryIds },
        status: 'ACTIVE',
        deletedAt: null,
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { take: 1, orderBy: { order: 'asc' } },
          },
          orderBy: sortBy === 'featured'
            ? [{ featured: 'desc' }, { createdAt: 'desc' }]
            : { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription,
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          featured: p.featured,
          category: p.category,
          image: p.images[0] || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    `,
  },

  // ============================================================================
  // GET VARIANTS
  // ============================================================================
  {
    name: 'product.getVariants',
    description: 'Get all variants for a product with pricing and stock info',
    category: 'product',
    tags: ['product', 'variants', 'catalog', 'storefront'],
    icon: 'Layers',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        productSlug: {
          type: 'string',
          description: 'Product slug (alternative to ID)',
        },
        inStockOnly: {
          type: 'boolean',
          description: 'Only return variants in stock',
          default: false,
        },
      },
      required: [],
    },
    handler: `
      const { productId, productSlug, inStockOnly = false } = input;

      if (!productId && !productSlug) {
        throw new Error('Either productId or productSlug is required');
      }

      // Find product
      const product = await prisma.product.findFirst({
        where: productId
          ? { id: productId, deletedAt: null }
          : { slug: productSlug, deletedAt: null },
        select: { id: true, name: true, slug: true, basePrice: true },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const where = {
        productId: product.id,
        deletedAt: null,
      };

      if (inStockOnly) {
        where.stock = { gt: 0 };
      }

      const variants = await prisma.productVariant.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { order: 'asc' },
      });

      // Extract unique option types
      const optionTypes = new Set();
      variants.forEach(v => {
        if (v.options && typeof v.options === 'object') {
          Object.keys(v.options).forEach(k => optionTypes.add(k));
        }
      });

      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          basePrice: product.basePrice,
        },
        variants: variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          inStock: v.stock > 0,
          lowStock: v.stock > 0 && v.stock <= (v.lowStockThreshold || 5),
          options: v.options,
          images: v.images,
          weight: v.weight,
          dimensions: v.dimensions,
        })),
        optionTypes: Array.from(optionTypes),
        totalVariants: variants.length,
        inStockCount: variants.filter(v => v.stock > 0).length,
      };
    `,
  },

  // ============================================================================
  // CHECK STOCK
  // ============================================================================
  {
    name: 'product.checkStock',
    description: 'Check stock availability for a product or variant',
    category: 'product',
    tags: ['product', 'stock', 'inventory', 'storefront'],
    icon: 'Package2',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID',
        },
        variantId: {
          type: 'string',
          description: 'Specific variant ID (optional)',
        },
        quantity: {
          type: 'number',
          description: 'Quantity to check availability for',
          default: 1,
          minimum: 1,
        },
      },
      required: ['productId'],
    },
    handler: `
      const { productId, variantId, quantity = 1 } = input;

      if (variantId) {
        // Check specific variant
        const variant = await prisma.productVariant.findFirst({
          where: { id: variantId, productId, deletedAt: null },
          include: {
            product: { select: { id: true, name: true, status: true } },
          },
        });

        if (!variant) {
          throw new Error('Variant not found');
        }

        if (variant.product.status !== 'ACTIVE') {
          return {
            available: false,
            reason: 'Product is not available',
            productId,
            variantId,
            requestedQuantity: quantity,
          };
        }

        const available = variant.stock >= quantity;

        return {
          available,
          reason: available ? null : 'Insufficient stock',
          productId,
          variantId,
          variantName: variant.name,
          sku: variant.sku,
          requestedQuantity: quantity,
          currentStock: variant.stock,
          lowStock: variant.stock > 0 && variant.stock <= (variant.lowStockThreshold || 5),
        };
      } else {
        // Check all variants for product
        const product = await prisma.product.findFirst({
          where: { id: productId, deletedAt: null },
          include: {
            variants: {
              where: { deletedAt: null, stock: { gte: quantity } },
              select: { id: true, name: true, sku: true, stock: true, price: true },
            },
          },
        });

        if (!product) {
          throw new Error('Product not found');
        }

        if (product.status !== 'ACTIVE') {
          return {
            available: false,
            reason: 'Product is not available',
            productId,
            requestedQuantity: quantity,
            availableVariants: [],
          };
        }

        return {
          available: product.variants.length > 0,
          reason: product.variants.length > 0 ? null : 'No variants with sufficient stock',
          productId,
          productName: product.name,
          requestedQuantity: quantity,
          availableVariants: product.variants.map(v => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock: v.stock,
            price: v.price,
          })),
          totalAvailableVariants: product.variants.length,
        };
      }
    `,
  },

  // ============================================================================
  // GET CATEGORIES
  // ============================================================================
  {
    name: 'product.getCategories',
    description: 'Get product categories with optional hierarchy',
    category: 'product',
    tags: ['product', 'category', 'catalog', 'navigation'],
    icon: 'FolderOpen',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'Parent category ID (null for root categories)',
        },
        includeProductCount: {
          type: 'boolean',
          description: 'Include product count per category',
          default: true,
        },
        includeChildren: {
          type: 'boolean',
          description: 'Include child categories',
          default: true,
        },
        activeOnly: {
          type: 'boolean',
          description: 'Only return categories with active products',
          default: false,
        },
      },
      required: [],
    },
    handler: `
      const { parentId, includeProductCount = true, includeChildren = true, activeOnly = false } = input;

      const where = {};
      if (parentId === null || parentId === undefined) {
        where.parentId = null;
      } else if (parentId) {
        where.parentId = parentId;
      }

      const categories = await prisma.productCategory.findMany({
        where,
        include: {
          children: includeChildren ? {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              _count: includeProductCount ? {
                select: { products: { where: { status: 'ACTIVE', deletedAt: null } } }
              } : false,
            },
            orderBy: { order: 'asc' },
          } : false,
          _count: includeProductCount ? {
            select: { products: { where: { status: 'ACTIVE', deletedAt: null } } }
          } : false,
        },
        orderBy: { order: 'asc' },
      });

      let result = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        productCount: c._count?.products || 0,
        children: c.children?.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          image: child.image,
          productCount: child._count?.products || 0,
        })) || [],
      }));

      if (activeOnly) {
        result = result.filter(c => c.productCount > 0 || c.children.some(ch => ch.productCount > 0));
      }

      return {
        categories: result,
        total: result.length,
      };
    `,
  },

  // ============================================================================
  // GET FEATURED PRODUCTS
  // ============================================================================
  {
    name: 'product.getFeatured',
    description: 'Get featured products for homepage or promotional displays',
    category: 'product',
    tags: ['product', 'featured', 'homepage', 'storefront'],
    icon: 'Star',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of products to return',
          default: 8,
          minimum: 1,
          maximum: 24,
        },
        categoryId: {
          type: 'string',
          description: 'Filter by category',
        },
      },
      required: [],
    },
    handler: `
      const { limit = 8, categoryId } = input;

      const where = {
        featured: true,
        status: 'ACTIVE',
        deletedAt: null,
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 1, orderBy: { order: 'asc' } },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: limit,
      });

      return {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.shortDescription,
          price: p.basePrice,
          compareAtPrice: p.compareAtPrice,
          category: p.category,
          image: p.images[0] || null,
        })),
        total: products.length,
      };
    `,
  },
];
