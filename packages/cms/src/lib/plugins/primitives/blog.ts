/**
 * Blog/CMS Primitives
 *
 * AI-callable primitives for blog and content management.
 * These enable store owners to build custom blog displays via Puck.
 */

import { CreatePrimitiveRequest } from '../types';

export const BLOG_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // GET POSTS
  // ============================================================================
  {
    name: 'blog.getPosts',
    description: 'Get blog posts with pagination, filtering, and sorting',
    category: 'blog',
    tags: ['blog', 'cms', 'content', 'posts'],
    icon: 'FileText',
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
          default: 10,
          minimum: 1,
          maximum: 50,
        },
        categoryId: {
          type: 'string',
          description: 'Filter by category ID',
        },
        categorySlug: {
          type: 'string',
          description: 'Filter by category slug',
        },
        tagId: {
          type: 'string',
          description: 'Filter by tag ID',
        },
        tagSlug: {
          type: 'string',
          description: 'Filter by tag slug',
        },
        authorId: {
          type: 'string',
          description: 'Filter by author ID',
        },
        featured: {
          type: 'boolean',
          description: 'Filter to featured posts only',
        },
        status: {
          type: 'string',
          description: 'Filter by status (admin only)',
          enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'],
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['publishedAt', 'createdAt', 'title', 'views'],
          default: 'publishedAt',
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
      const { page = 1, limit = 10, categoryId, categorySlug, tagId, tagSlug, authorId, featured, status, sortBy = 'publishedAt', sortOrder = 'desc' } = input;

      const where = { deletedAt: null };

      // Default to published only unless admin
      where.status = status || 'PUBLISHED';
      if (!status) {
        where.publishedAt = { lte: new Date() };
      }

      if (categoryId) where.categoryId = categoryId;
      if (categorySlug) {
        const cat = await prisma.blogCategory.findFirst({ where: { slug: categorySlug } });
        if (cat) where.categoryId = cat.id;
      }
      if (tagId || tagSlug) {
        where.tags = {
          some: tagId ? { id: tagId } : { slug: tagSlug },
        };
      }
      if (authorId) where.authorId = authorId;
      if (featured !== undefined) where.featured = featured;

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, email: true } },
            category: { select: { id: true, name: true, slug: true } },
            tags: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return {
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          featuredImage: p.featuredImage,
          author: p.author,
          category: p.category,
          tags: p.tags,
          featured: p.featured,
          publishedAt: p.publishedAt,
          readingTime: p.readingTime,
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
  // GET SINGLE POST
  // ============================================================================
  {
    name: 'blog.getPost',
    description: 'Get a single blog post by ID or slug with full content',
    category: 'blog',
    tags: ['blog', 'cms', 'content', 'post'],
    icon: 'FileText',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        postId: {
          type: 'string',
          description: 'Post ID',
        },
        slug: {
          type: 'string',
          description: 'Post slug (alternative to ID)',
        },
        incrementViews: {
          type: 'boolean',
          description: 'Increment view count',
          default: true,
        },
      },
      required: [],
    },
    handler: `
      const { postId, slug, incrementViews = true } = input;

      if (!postId && !slug) {
        throw new Error('Either postId or slug is required');
      }

      const where = postId ? { id: postId } : { slug };
      where.deletedAt = null;

      const post = await prisma.blogPost.findFirst({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          category: true,
          tags: true,
        },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Only show published posts to public
      if (post.status !== 'PUBLISHED' || post.publishedAt > new Date()) {
        throw new Error('Post not found');
      }

      // Increment view count
      if (incrementViews) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { views: { increment: 1 } },
        });
      }

      // Get related posts
      const related = await prisma.blogPost.findMany({
        where: {
          categoryId: post.categoryId,
          id: { not: post.id },
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          publishedAt: true,
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      });

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        puckContent: post.puckContent,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        author: post.author,
        category: post.category,
        tags: post.tags,
        featured: post.featured,
        views: post.views + (incrementViews ? 1 : 0),
        publishedAt: post.publishedAt,
        readingTime: post.readingTime,
        seo: {
          title: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt,
          keywords: post.seoKeywords,
        },
        related,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    `,
  },

  // ============================================================================
  // GET CATEGORIES
  // ============================================================================
  {
    name: 'blog.getCategories',
    description: 'Get all blog categories with post counts',
    category: 'blog',
    tags: ['blog', 'cms', 'categories'],
    icon: 'FolderOpen',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        includePostCount: {
          type: 'boolean',
          description: 'Include post count per category',
          default: true,
        },
        activeOnly: {
          type: 'boolean',
          description: 'Only return categories with published posts',
          default: false,
        },
      },
      required: [],
    },
    handler: `
      const { includePostCount = true, activeOnly = false } = input;

      const categories = await prisma.blogCategory.findMany({
        include: {
          _count: includePostCount ? {
            select: {
              posts: {
                where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, deletedAt: null },
              },
            },
          } : false,
        },
        orderBy: { name: 'asc' },
      });

      let result = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        postCount: c._count?.posts || 0,
      }));

      if (activeOnly) {
        result = result.filter(c => c.postCount > 0);
      }

      return {
        categories: result,
        total: result.length,
      };
    `,
  },

  // ============================================================================
  // GET TAGS
  // ============================================================================
  {
    name: 'blog.getTags',
    description: 'Get all blog tags with post counts',
    category: 'blog',
    tags: ['blog', 'cms', 'tags'],
    icon: 'Tag',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        includePostCount: {
          type: 'boolean',
          description: 'Include post count per tag',
          default: true,
        },
        limit: {
          type: 'number',
          description: 'Max tags to return (for tag clouds)',
          minimum: 1,
          maximum: 100,
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['name', 'postCount'],
          default: 'name',
        },
      },
      required: [],
    },
    handler: `
      const { includePostCount = true, limit, sortBy = 'name' } = input;

      const tags = await prisma.blogTag.findMany({
        include: {
          _count: includePostCount ? {
            select: {
              posts: {
                where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, deletedAt: null },
              },
            },
          } : false,
        },
      });

      let result = tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        postCount: t._count?.posts || 0,
      }));

      // Sort
      if (sortBy === 'postCount') {
        result.sort((a, b) => b.postCount - a.postCount);
      } else {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Limit
      if (limit) {
        result = result.slice(0, limit);
      }

      return {
        tags: result,
        total: result.length,
      };
    `,
  },

  // ============================================================================
  // SEARCH POSTS
  // ============================================================================
  {
    name: 'blog.search',
    description: 'Search blog posts by keyword',
    category: 'blog',
    tags: ['blog', 'cms', 'search'],
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
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 10,
        },
      },
      required: ['query'],
    },
    handler: `
      const { query, page = 1, limit = 10 } = input;

      const where = {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ],
      };

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return {
        query,
        results: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          featuredImage: p.featuredImage,
          author: p.author,
          category: p.category,
          publishedAt: p.publishedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `,
  },

  // ============================================================================
  // GET PAGES
  // ============================================================================
  {
    name: 'blog.getPages',
    description: 'Get CMS pages (about, contact, etc.)',
    category: 'blog',
    tags: ['cms', 'pages', 'content'],
    icon: 'Layout',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['DRAFT', 'PUBLISHED'],
        },
        includeContent: {
          type: 'boolean',
          description: 'Include full page content',
          default: false,
        },
      },
      required: [],
    },
    handler: `
      const { status = 'PUBLISHED', includeContent = false } = input;

      const pages = await prisma.page.findMany({
        where: { status, deletedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          template: true,
          content: includeContent,
          puckContent: includeContent,
          order: true,
          showInNav: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { order: 'asc' },
      });

      return {
        pages,
        total: pages.length,
      };
    `,
  },

  // ============================================================================
  // GET SINGLE PAGE
  // ============================================================================
  {
    name: 'blog.getPage',
    description: 'Get a single CMS page by slug',
    category: 'blog',
    tags: ['cms', 'pages', 'content'],
    icon: 'Layout',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Page slug',
        },
        pageId: {
          type: 'string',
          description: 'Page ID (alternative to slug)',
        },
      },
      required: [],
    },
    handler: `
      const { slug, pageId } = input;

      if (!slug && !pageId) {
        throw new Error('Either slug or pageId is required');
      }

      const where = pageId ? { id: pageId } : { slug };
      where.status = 'PUBLISHED';
      where.deletedAt = null;

      const page = await prisma.page.findFirst({ where });

      if (!page) {
        throw new Error('Page not found');
      }

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        content: page.content,
        puckContent: page.puckContent,
        template: page.template,
        seo: {
          title: page.seoTitle || page.title,
          description: page.seoDescription || page.description,
        },
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      };
    `,
  },
];
