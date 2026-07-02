/**
 * Blog CRUD Tools
 *
 * AI tools for creating, updating, deleting, and publishing blog posts,
 * and managing blog categories and tags.
 */

import { tool } from 'ai';
import { z } from 'zod';

async function getDb() {
  try {
    const { prisma } = await import('../../db');
    return prisma;
  } catch (error) {
    console.error('[BlogTools] Failed to import database:', error);
    throw new Error('Database connection unavailable');
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniqueBlogSlug(prisma: any, slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let suffix = 2;
  while (true) {
    // BlogPost.slug is compound-unique with tenantId — findUnique on slug alone throws at runtime.
    const existing = await prisma.blogPost.findFirst({ where: { slug: candidate } });
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
}

export const createBlogPost = tool({
  description: 'Create a new blog post. Auto-generates slug from title if not provided.',
  inputSchema: z.object({
    title: z.string().describe('Blog post title'),
    slug: z.string().optional().describe('URL slug (auto-generated from title if omitted)'),
    excerpt: z.string().optional().describe('Short excerpt/summary'),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
    categoryIds: z.array(z.string()).optional().describe('Category IDs to assign'),
    tagIds: z.array(z.string()).optional().describe('Tag IDs to assign'),
    featured: z.boolean().optional().default(false).describe('Whether the post is featured'),
  }),
  execute: async ({ title, slug, excerpt, status, categoryIds, tagIds, featured }) => {
    try {
      const prisma = await getDb();

      const baseSlug = slug || generateSlug(title);
      const uniqueSlug = await ensureUniqueBlogSlug(prisma, baseSlug);

      const post = await withTimeout(
        prisma.blogPost.create({
          data: {
            title,
            slug: uniqueSlug,
            excerpt,
            status: status as any,
            featured,
            publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
            categories: categoryIds?.length
              ? { create: categoryIds.map((categoryId, i) => ({ categoryId, position: i })) }
              : undefined,
            tags: tagIds?.length
              ? { create: tagIds.map((tagId) => ({ tagId })) }
              : undefined,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            featured: true,
          },
        }),
        8000,
        'Create blog post timed out'
      );

      return {
        success: true,
        post: { ...post, adminUrl: `/admin/blog/${post.id}` },
        message: `Blog post "${post.title}" created successfully`,
      };
    } catch (error) {
      console.error('[BlogTools] createBlogPost error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create blog post' };
    }
  },
});

export const updateBlogPost = tool({
  description: 'Update an existing blog post. Only provided fields are changed.',
  inputSchema: z.object({
    id: z.string().describe('Blog post ID'),
    title: z.string().optional().describe('New title'),
    slug: z.string().optional().describe('New URL slug'),
    excerpt: z.string().optional().describe('New excerpt'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    categoryIds: z.array(z.string()).optional().describe('Replace category assignments'),
    tagIds: z.array(z.string()).optional().describe('Replace tag assignments'),
    featured: z.boolean().optional(),
    seoTitle: z.string().optional().describe('SEO meta title'),
    seoDescription: z.string().optional().describe('SEO meta description'),
  }),
  execute: async ({ id, title, slug, excerpt, status, categoryIds, tagIds, featured, seoTitle, seoDescription }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.blogPost.findUnique({ where: { id } });
      if (!existing) return { success: false, error: 'Blog post not found' };

      let uniqueSlug: string | undefined;
      if (slug && slug !== existing.slug) {
        uniqueSlug = await ensureUniqueBlogSlug(prisma, slug, id);
      }

      const data: Record<string, any> = {};
      if (title !== undefined) data.title = title;
      if (uniqueSlug !== undefined) data.slug = uniqueSlug;
      if (excerpt !== undefined) data.excerpt = excerpt;
      if (status !== undefined) {
        data.status = status;
        if (status === 'PUBLISHED' && !existing.publishedAt) {
          data.publishedAt = new Date();
        }
      }
      if (featured !== undefined) data.featured = featured;
      if (seoTitle !== undefined) data.metaTitle = seoTitle;
      if (seoDescription !== undefined) data.metaDescription = seoDescription;

      // Handle category replacements
      if (categoryIds !== undefined) {
        await prisma.blogPostCategory.deleteMany({ where: { postId: id } });
        if (categoryIds.length > 0) {
          await prisma.blogPostCategory.createMany({
            data: categoryIds.map((categoryId, i) => ({ postId: id, categoryId, position: i })),
          });
        }
      }

      // Handle tag replacements
      if (tagIds !== undefined) {
        await prisma.blogPostTag.deleteMany({ where: { postId: id } });
        if (tagIds.length > 0) {
          await prisma.blogPostTag.createMany({
            data: tagIds.map((tagId) => ({ postId: id, tagId })),
          });
        }
      }

      const post = await withTimeout(
        prisma.blogPost.update({
          where: { id },
          data,
          select: { id: true, title: true, slug: true, status: true, featured: true },
        }),
        8000,
        'Update blog post timed out'
      );

      return {
        success: true,
        post: { ...post, adminUrl: `/admin/blog/${post.id}` },
        message: `Blog post "${post.title}" updated successfully`,
      };
    } catch (error) {
      console.error('[BlogTools] updateBlogPost error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update blog post' };
    }
  },
});

export const deleteBlogPost = tool({
  description: 'Delete a blog post.',
  inputSchema: z.object({
    id: z.string().describe('Blog post ID to delete'),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, title: true } });
      if (!existing) return { success: false, error: 'Blog post not found' };

      await withTimeout(
        prisma.blogPost.delete({ where: { id } }),
        8000,
        'Delete blog post timed out'
      );

      return { success: true, message: `Blog post "${existing.title}" deleted successfully` };
    } catch (error) {
      console.error('[BlogTools] deleteBlogPost error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete blog post' };
    }
  },
});

export const publishBlogPost = tool({
  description: 'Publish a blog post immediately, or schedule it for a future date.',
  inputSchema: z.object({
    id: z.string().describe('Blog post ID'),
    scheduledAt: z.string().optional().describe('ISO date string to schedule publication (omit for immediate publish)'),
  }),
  execute: async ({ id, scheduledAt }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.blogPost.findUnique({ where: { id } });
      if (!existing) return { success: false, error: 'Blog post not found' };

      const data: Record<string, any> = {};
      if (scheduledAt) {
        const scheduleDate = new Date(scheduledAt);
        if (isNaN(scheduleDate.getTime())) return { success: false, error: 'Invalid date format' };
        data.status = 'SCHEDULED';
        data.scheduledAt = scheduleDate;
      } else {
        data.status = 'PUBLISHED';
        data.publishedAt = new Date();
      }

      const post = await withTimeout(
        prisma.blogPost.update({
          where: { id },
          data,
          select: { id: true, title: true, slug: true, status: true, publishedAt: true, scheduledAt: true },
        }),
        5000,
        'Publish blog post timed out'
      );

      const action = scheduledAt ? `scheduled for ${post.scheduledAt?.toISOString()}` : 'published';
      return {
        success: true,
        post: { ...post, adminUrl: `/admin/blog/${post.id}` },
        message: `Blog post "${post.title}" ${action} successfully`,
      };
    } catch (error) {
      console.error('[BlogTools] publishBlogPost error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to publish blog post' };
    }
  },
});

export const manageBlogCategory = tool({
  description: 'Create, update, or delete a blog category.',
  inputSchema: z.object({
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    id: z.string().optional().describe('Category ID (required for update/delete)'),
    name: z.string().optional().describe('Category name (required for create)'),
    slug: z.string().optional().describe('URL slug (auto-generated from name if omitted)'),
    description: z.string().optional().describe('Category description'),
  }),
  execute: async ({ action, id, name, slug, description }) => {
    try {
      const prisma = await getDb();

      if (action === 'create') {
        if (!name) return { success: false, error: 'Name is required to create a category' };

        const baseSlug = slug || generateSlug(name);
        let candidate = baseSlug;
        let suffix = 2;
        while (await prisma.blogCategory.findFirst({ where: { slug: candidate } })) {
          candidate = `${baseSlug}-${suffix}`;
          suffix++;
        }

        const category = await withTimeout(
          prisma.blogCategory.create({
            data: { name, slug: candidate, description },
            select: { id: true, name: true, slug: true },
          }),
          5000,
          'Create category timed out'
        );

        return { success: true, category, message: `Category "${category.name}" created` };
      }

      if (action === 'update') {
        if (!id) return { success: false, error: 'ID is required to update a category' };

        const existing = await prisma.blogCategory.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Category not found' };

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (slug !== undefined) data.slug = slug;
        if (description !== undefined) data.description = description;

        const category = await withTimeout(
          prisma.blogCategory.update({
            where: { id },
            data,
            select: { id: true, name: true, slug: true },
          }),
          5000,
          'Update category timed out'
        );

        return { success: true, category, message: `Category "${category.name}" updated` };
      }

      if (action === 'delete') {
        if (!id) return { success: false, error: 'ID is required to delete a category' };

        const existing = await prisma.blogCategory.findUnique({ where: { id }, select: { id: true, name: true } });
        if (!existing) return { success: false, error: 'Category not found' };

        await withTimeout(
          prisma.blogCategory.delete({ where: { id } }),
          5000,
          'Delete category timed out'
        );

        return { success: true, message: `Category "${existing.name}" deleted` };
      }

      return { success: false, error: 'Invalid action' };
    } catch (error) {
      console.error('[BlogTools] manageBlogCategory error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to manage category' };
    }
  },
});

export const manageBlogTag = tool({
  description: 'Create, update, or delete a blog tag.',
  inputSchema: z.object({
    action: z.enum(['create', 'update', 'delete']).describe('Action to perform'),
    id: z.string().optional().describe('Tag ID (required for update/delete)'),
    name: z.string().optional().describe('Tag name (required for create)'),
    slug: z.string().optional().describe('URL slug (auto-generated from name if omitted)'),
  }),
  execute: async ({ action, id, name, slug }) => {
    try {
      const prisma = await getDb();

      if (action === 'create') {
        if (!name) return { success: false, error: 'Name is required to create a tag' };

        const baseSlug = slug || generateSlug(name);
        let candidate = baseSlug;
        let suffix = 2;
        while (await prisma.blogTag.findFirst({ where: { slug: candidate } })) {
          candidate = `${baseSlug}-${suffix}`;
          suffix++;
        }

        const tag = await withTimeout(
          prisma.blogTag.create({
            data: { name, slug: candidate },
            select: { id: true, name: true, slug: true },
          }),
          5000,
          'Create tag timed out'
        );

        return { success: true, tag, message: `Tag "${tag.name}" created` };
      }

      if (action === 'update') {
        if (!id) return { success: false, error: 'ID is required to update a tag' };

        const existing = await prisma.blogTag.findUnique({ where: { id } });
        if (!existing) return { success: false, error: 'Tag not found' };

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (slug !== undefined) data.slug = slug;

        const tag = await withTimeout(
          prisma.blogTag.update({
            where: { id },
            data,
            select: { id: true, name: true, slug: true },
          }),
          5000,
          'Update tag timed out'
        );

        return { success: true, tag, message: `Tag "${tag.name}" updated` };
      }

      if (action === 'delete') {
        if (!id) return { success: false, error: 'ID is required to delete a tag' };

        const existing = await prisma.blogTag.findUnique({ where: { id }, select: { id: true, name: true } });
        if (!existing) return { success: false, error: 'Tag not found' };

        await withTimeout(
          prisma.blogTag.delete({ where: { id } }),
          5000,
          'Delete tag timed out'
        );

        return { success: true, message: `Tag "${existing.name}" deleted` };
      }

      return { success: false, error: 'Invalid action' };
    } catch (error) {
      console.error('[BlogTools] manageBlogTag error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to manage tag' };
    }
  },
});

export const blogTools = {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  publishBlogPost,
  manageBlogCategory,
  manageBlogTag,
};
