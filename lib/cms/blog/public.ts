/**
 * Public Blog Library
 *
 * Tenant-scoped read helpers for the public storefront blog ("/blog"). Kept
 * separate from lib/cms/blog/index.ts (which powers the admin CRUD surface) so
 * the public path has a single, consistent definition of "what a visitor may
 * see" and never leaks drafts, private posts, or another tenant's content.
 *
 * Every query here threads tenantId and uses `findFirst` because BlogPost /
 * BlogCategory / BlogTag are uniquely keyed on the compound (tenantId, slug).
 *
 * Scheduled publishing (no external cron):
 *   Posts with status SCHEDULED and scheduledAt <= now are treated as live by
 *   `publicPostWhere`, so they surface the instant their time passes without any
 *   background job. `publishDueScheduledPosts` additionally persists that
 *   transition (SCHEDULED -> PUBLISHED) on demand so admin lists, denormalized
 *   counts, and the sitemap eventually agree with what visitors already see.
 *   Tradeoff: promotion only runs when a public route calls it (we call it from
 *   the blog index). A post is *visible* immediately via the OR condition
 *   regardless; only the stored status lags until the index is next requested.
 */

import { prisma } from '../db'
import type { Prisma } from '@prisma/client'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

// ============ VISIBILITY ============

/**
 * Where-clause fragment describing every post a visitor is allowed to see for a
 * tenant: PUBLIC visibility and either already PUBLISHED or a SCHEDULED post
 * whose time has arrived. Compose additional filters (slug, category, tag) at
 * the top level — they AND with this.
 */
export function publicPostWhere(
  tenantId: number,
  at: Date = new Date()
): Prisma.BlogPostWhereInput {
  return {
    tenantId,
    visibility: 'PUBLIC',
    OR: [
      { status: 'PUBLISHED' },
      { status: 'SCHEDULED', scheduledAt: { lte: at } },
    ],
  }
}

/**
 * Persist any due SCHEDULED posts as PUBLISHED, preserving their scheduled time
 * as the publish time. Best-effort and idempotent. Returns how many were
 * promoted. Callers should not block rendering on the result.
 */
export async function publishDueScheduledPosts(tenantId: number): Promise<number> {
  const at = new Date()
  const due = await prisma.blogPost.findMany({
    where: { tenantId, status: 'SCHEDULED', scheduledAt: { lte: at } },
    select: { id: true, scheduledAt: true },
  })

  if (due.length === 0) return 0

  await prisma.$transaction(
    due.map((post) =>
      prisma.blogPost.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED', publishedAt: post.scheduledAt ?? at },
      })
    )
  )

  return due.length
}

// ============ INCLUDES / TYPES ============

export const blogCardInclude = {
  author: { select: { id: true, name: true, email: true } },
  featuredImage: { select: { id: true, url: true, alt: true } },
  categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.BlogPostInclude

export type BlogCardPost = Prisma.BlogPostGetPayload<{ include: typeof blogCardInclude }>

export const blogDetailInclude = {
  author: { select: { id: true, name: true, email: true } },
  featuredImage: true,
  ogImage: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.BlogPostInclude

export type BlogDetailPost = Prisma.BlogPostGetPayload<{ include: typeof blogDetailInclude }>

// Latest-first, pinned posts floated to the top.
const publicOrderBy: Prisma.BlogPostOrderByWithRelationInput[] = [
  { pinned: 'desc' },
  { publishedAt: 'desc' },
  { createdAt: 'desc' },
]

// ============ LIST / PAGINATION ============

export interface PublishedPostsResult {
  posts: BlogCardPost[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getPublishedPosts(opts: {
  tenantId: number
  page?: number
  pageSize?: number
  categorySlug?: string
  tagSlug?: string
}): Promise<PublishedPostsResult> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 9))

  const where = publicPostWhere(opts.tenantId)
  if (opts.categorySlug) {
    where.categories = { some: { category: { slug: opts.categorySlug } } }
  }
  if (opts.tagSlug) {
    where.tags = { some: { tag: { slug: opts.tagSlug } } }
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: blogCardInclude,
      orderBy: publicOrderBy,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.blogPost.count({ where }),
  ])

  return {
    posts,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getFeaturedPost(tenantId: number): Promise<BlogCardPost | null> {
  return prisma.blogPost.findFirst({
    where: { ...publicPostWhere(tenantId), featured: true },
    include: blogCardInclude,
    orderBy: publicOrderBy,
  })
}

// ============ DETAIL ============

export async function getPublishedPostBySlug(
  slug: string,
  tenantId: number
): Promise<BlogDetailPost | null> {
  return prisma.blogPost.findFirst({
    where: { ...publicPostWhere(tenantId), slug },
    include: blogDetailInclude,
  })
}

export async function getRelatedPublishedPosts(
  postId: string,
  categoryIds: string[],
  tenantId: number,
  take = 3
): Promise<BlogCardPost[]> {
  if (categoryIds.length === 0) return []

  return prisma.blogPost.findMany({
    where: {
      ...publicPostWhere(tenantId),
      id: { not: postId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: blogCardInclude,
    orderBy: publicOrderBy,
    take,
  })
}

export function incrementViewCount(postId: string): void {
  // Fire-and-forget; a lost view increment is never worth a failed render.
  prisma.blogPost
    .update({ where: { id: postId }, data: { viewCount: { increment: 1 } } })
    .catch(() => {})
}

// ============ TAXONOMY ============

export async function getBlogCategoriesWithCounts(tenantId: number, take = 20) {
  return prisma.blogCategory.findMany({
    where: { tenantId },
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
    take,
  })
}

export async function getBlogCategory(slug: string, tenantId: number) {
  return prisma.blogCategory.findFirst({ where: { slug, tenantId } })
}

export async function getBlogTag(slug: string, tenantId: number) {
  return prisma.blogTag.findFirst({ where: { slug, tenantId } })
}

// ============ RSS / TEXT HELPERS ============

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Prefer an authored excerpt; otherwise derive one from rendered content. */
export function postExcerpt(
  post: { excerpt: string | null; contentHtml: string | null },
  max = 200
): string {
  if (post.excerpt) return post.excerpt
  const text = post.contentHtml ? stripHtml(post.contentHtml) : ''
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

export function readingTimeLabel(post: { readingTime: number | null }): string | null {
  return post.readingTime ? `${post.readingTime} min read` : null
}

export async function getFeedPosts(tenantId: number, limit = 20) {
  return prisma.blogPost.findMany({
    where: { ...publicPostWhere(tenantId), noIndex: false },
    orderBy: publicOrderBy,
    take: limit,
    include: {
      author: { select: { name: true } },
      categories: { include: { category: { select: { name: true } } } },
    },
  })
}

/** Absolute origin for a tenant, e.g. https://acme.example.com. */
export function tenantBaseUrl(subdomain: string): string {
  const protocol = ROOT_DOMAIN.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${subdomain}.${ROOT_DOMAIN}`
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
