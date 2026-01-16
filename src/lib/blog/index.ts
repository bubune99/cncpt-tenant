/**
 * Blog Library
 *
 * Core functions for blog post, category, and tag management
 */

import { prisma } from '../db'
import type { Prisma, PostVisibility } from '@prisma/client'

// ============ SLUG UTILITIES ============

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function ensureUniqueSlug(
  slug: string,
  type: 'post' | 'category' | 'tag',
  excludeId?: string
): Promise<string> {
  let uniqueSlug = slug
  let counter = 1

  while (true) {
    const existing = await (type === 'post'
      ? prisma.blogPost.findUnique({ where: { slug: uniqueSlug } })
      : type === 'category'
      ? prisma.blogCategory.findUnique({ where: { slug: uniqueSlug } })
      : prisma.blogTag.findUnique({ where: { slug: uniqueSlug } }))

    if (!existing || existing.id === excludeId) {
      return uniqueSlug
    }

    uniqueSlug = `${slug}-${counter}`
    counter++
  }
}

// ============ BLOG POSTS ============

export interface CreatePostInput {
  title: string
  slug?: string
  excerpt?: string
  content?: object
  contentHtml?: string
  authorId?: string
  featuredImageId?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  visibility?: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED' | 'MEMBERS_ONLY'
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  noIndex?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImageId?: string
  publishedAt?: Date
  scheduledAt?: Date
  allowComments?: boolean
  featured?: boolean
  pinned?: boolean
  categoryIds?: string[]
  tagIds?: string[]
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

export interface ListPostsOptions {
  status?: string
  visibility?: string
  authorId?: string
  categoryId?: string
  tagId?: string
  featured?: boolean
  search?: string
  limit?: number
  offset?: number
  orderBy?: 'createdAt' | 'publishedAt' | 'title' | 'viewCount'
  orderDir?: 'asc' | 'desc'
}

export async function createPost(input: CreatePostInput) {
  const slug = input.slug || generateSlug(input.title)
  const uniqueSlug = await ensureUniqueSlug(slug, 'post')

  // Calculate word count from HTML content
  const wordCount = input.contentHtml
    ? input.contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    : 0

  // Estimate reading time (200 words per minute)
  const readingTime = Math.ceil(wordCount / 200)

  const post = await prisma.blogPost.create({
    data: {
      title: input.title,
      slug: uniqueSlug,
      excerpt: input.excerpt,
      content: input.content as Prisma.InputJsonValue,
      contentHtml: input.contentHtml,
      authorId: input.authorId,
      featuredImageId: input.featuredImageId,
      status: input.status ?? 'DRAFT',
      visibility: (input.visibility ?? 'PUBLIC') as PostVisibility,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      noIndex: input.noIndex ?? false,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageId: input.ogImageId,
      publishedAt: input.status === 'PUBLISHED' ? input.publishedAt ?? new Date() : input.publishedAt,
      scheduledAt: input.scheduledAt,
      wordCount,
      readingTime,
      allowComments: input.allowComments ?? true,
      featured: input.featured ?? false,
      pinned: input.pinned ?? false,
      categories: input.categoryIds?.length
        ? {
            create: input.categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          }
        : undefined,
      tags: input.tagIds?.length
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      featuredImage: true,
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  })

  return post
}

export async function getPost(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      featuredImage: true,
      ogImage: true,
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
      _count: {
        select: { comments: true },
      },
    },
  })
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      featuredImage: true,
      ogImage: true,
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
      _count: {
        select: { comments: true },
      },
    },
  })
}

export async function listPosts(options: ListPostsOptions = {}) {
  const {
    status,
    visibility,
    authorId,
    categoryId,
    tagId,
    featured,
    search,
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    orderDir = 'desc',
  } = options

  const where: Prisma.BlogPostWhereInput = {}

  if (status) {
    where.status = status as any
  }
  if (visibility) {
    where.visibility = visibility as any
  }
  if (authorId) {
    where.authorId = authorId
  }
  if (featured !== undefined) {
    where.featured = featured
  }
  if (categoryId) {
    where.categories = {
      some: { categoryId },
    }
  }
  if (tagId) {
    where.tags = {
      some: { tagId },
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [orderBy]: orderDir },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        featuredImage: {
          select: { id: true, url: true, alt: true },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.blogPost.count({ where }),
  ])

  return { posts, total, limit, offset }
}

export async function updatePost(id: string, input: UpdatePostInput) {
  // Get existing post
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      categories: true,
      tags: true,
    },
  })

  if (!existing) {
    throw new Error('Post not found')
  }

  // Handle slug update
  let slug = existing.slug
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, 'post', id)
  }

  // Calculate word count if content changed
  let wordCount = existing.wordCount
  let readingTime = existing.readingTime
  if (input.contentHtml !== undefined) {
    wordCount = input.contentHtml
      ? input.contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
      : 0
    readingTime = Math.ceil(wordCount / 200)
  }

  // Handle category updates
  if (input.categoryIds !== undefined) {
    // Delete existing categories
    await prisma.blogPostCategory.deleteMany({
      where: { postId: id },
    })
  }

  // Handle tag updates
  if (input.tagIds !== undefined) {
    // Delete existing tags
    await prisma.blogPostTag.deleteMany({
      where: { postId: id },
    })
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content as Prisma.InputJsonValue,
      contentHtml: input.contentHtml,
      authorId: input.authorId,
      featuredImageId: input.featuredImageId,
      status: input.status,
      visibility: input.visibility as PostVisibility | undefined,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      noIndex: input.noIndex,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageId: input.ogImageId,
      publishedAt:
        input.status === 'PUBLISHED' && !existing.publishedAt
          ? new Date()
          : input.publishedAt,
      scheduledAt: input.scheduledAt,
      wordCount,
      readingTime,
      allowComments: input.allowComments,
      featured: input.featured,
      pinned: input.pinned,
      categories: input.categoryIds?.length
        ? {
            create: input.categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          }
        : undefined,
      tags: input.tagIds?.length
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      featuredImage: true,
      categories: {
        include: { category: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  })

  return post
}

export async function deletePost(id: string) {
  // Delete related records first
  await prisma.blogPostCategory.deleteMany({ where: { postId: id } })
  await prisma.blogPostTag.deleteMany({ where: { postId: id } })
  await prisma.blogComment.deleteMany({ where: { postId: id } })

  return prisma.blogPost.delete({ where: { id } })
}

export async function incrementPostViews(id: string) {
  return prisma.blogPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })
}

// ============ BLOG CATEGORIES ============

export interface CreateCategoryInput {
  name: string
  slug?: string
  description?: string
  parentId?: string
  imageId?: string
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug || generateSlug(input.name)
  const uniqueSlug = await ensureUniqueSlug(slug, 'category')

  return prisma.blogCategory.create({
    data: {
      name: input.name,
      slug: uniqueSlug,
      description: input.description,
      parentId: input.parentId,
      imageId: input.imageId,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function getCategory(id: string) {
  return prisma.blogCategory.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      image: true,
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function getCategoryBySlug(slug: string) {
  return prisma.blogCategory.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
      image: true,
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function listCategories(options: {
  parentId?: string | null
  search?: string
  limit?: number
  offset?: number
} = {}) {
  const { parentId, search, limit = 100, offset = 0 } = options

  const where: Prisma.BlogCategoryWhereInput = {}

  if (parentId !== undefined) {
    where.parentId = parentId
  }
  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  const [categories, total] = await Promise.all([
    prisma.blogCategory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.blogCategory.count({ where }),
  ])

  return { categories, total, limit, offset }
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.blogCategory.findUnique({ where: { id } })
  if (!existing) {
    throw new Error('Category not found')
  }

  let slug = existing.slug
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, 'category', id)
  }

  return prisma.blogCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description,
      parentId: input.parentId,
      imageId: input.imageId,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
    include: {
      parent: true,
      children: true,
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function deleteCategory(id: string) {
  // Check for child categories
  const children = await prisma.blogCategory.count({ where: { parentId: id } })
  if (children > 0) {
    throw new Error('Cannot delete category with child categories')
  }

  // Delete post associations
  await prisma.blogPostCategory.deleteMany({ where: { categoryId: id } })

  return prisma.blogCategory.delete({ where: { id } })
}

// ============ BLOG TAGS ============

export interface CreateTagInput {
  name: string
  slug?: string
  description?: string
}

export interface UpdateTagInput extends Partial<CreateTagInput> {}

export async function createTag(input: CreateTagInput) {
  const slug = input.slug || generateSlug(input.name)
  const uniqueSlug = await ensureUniqueSlug(slug, 'tag')

  return prisma.blogTag.create({
    data: {
      name: input.name,
      slug: uniqueSlug,
      description: input.description,
    },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function getTag(id: string) {
  return prisma.blogTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function getTagBySlug(slug: string) {
  return prisma.blogTag.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function listTags(options: {
  search?: string
  limit?: number
  offset?: number
} = {}) {
  const { search, limit = 100, offset = 0 } = options

  const where: Prisma.BlogTagWhereInput = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  const [tags, total] = await Promise.all([
    prisma.blogTag.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.blogTag.count({ where }),
  ])

  return { tags, total, limit, offset }
}

export async function updateTag(id: string, input: UpdateTagInput) {
  const existing = await prisma.blogTag.findUnique({ where: { id } })
  if (!existing) {
    throw new Error('Tag not found')
  }

  let slug = existing.slug
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, 'tag', id)
  }

  return prisma.blogTag.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description,
    },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })
}

export async function deleteTag(id: string) {
  // Delete post associations
  await prisma.blogPostTag.deleteMany({ where: { tagId: id } })

  return prisma.blogTag.delete({ where: { id } })
}
