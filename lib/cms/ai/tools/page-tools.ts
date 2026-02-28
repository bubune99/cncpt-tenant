/**
 * Page CRUD Tools
 *
 * AI tools for creating, updating, deleting, duplicating, and publishing CMS pages.
 */

import { tool } from 'ai';
import { z } from 'zod';

async function getDb() {
  try {
    const { prisma } = await import('../../db');
    return prisma;
  } catch (error) {
    console.error('[PageTools] Failed to import database:', error);
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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniqueSlug(prisma: any, slug: string, excludeId?: string): Promise<string> {
  let candidate = slug;
  let suffix = 2;
  while (true) {
    const existing = await prisma.page.findUnique({ where: { slug: candidate } });
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
}

export const createPage = tool({
  description: 'Create a new CMS page. Auto-generates slug from title if not provided.',
  inputSchema: z.object({
    title: z.string().describe('Page title'),
    slug: z.string().optional().describe('URL slug (auto-generated from title if omitted)'),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT').describe('Page status'),
    template: z.string().optional().describe('Template name for the page'),
    parentId: z.string().optional().describe('Parent page ID for nested pages'),
  }),
  execute: async ({ title, slug, status, template, parentId }) => {
    try {
      const prisma = await getDb();

      const baseSlug = slug || generateSlug(title);
      const uniqueSlug = await ensureUniqueSlug(prisma, baseSlug);

      if (parentId) {
        const parent = await prisma.page.findUnique({ where: { id: parentId } });
        if (!parent) return { success: false, error: 'Parent page not found' };
      }

      const page = await withTimeout(
        prisma.page.create({
          data: {
            title,
            slug: uniqueSlug,
            status: status as any,
            content: template ? { root: { type: 'Root', props: { template } } } : undefined,
            parentId,
          },
          select: { id: true, title: true, slug: true, status: true },
        }),
        8000,
        'Create page timed out'
      );

      return {
        success: true,
        page: { ...page, adminUrl: `/admin/pages/${page.id}` },
        message: `Page "${page.title}" created successfully`,
      };
    } catch (error) {
      console.error('[PageTools] createPage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create page' };
    }
  },
});

export const updatePage = tool({
  description: 'Update an existing CMS page. Only provided fields are changed.',
  inputSchema: z.object({
    id: z.string().describe('Page ID'),
    title: z.string().optional().describe('New page title'),
    slug: z.string().optional().describe('New URL slug'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().describe('New status'),
    seoTitle: z.string().optional().describe('SEO meta title'),
    seoDescription: z.string().optional().describe('SEO meta description'),
    parentId: z.string().nullable().optional().describe('Parent page ID (null to remove parent)'),
  }),
  execute: async ({ id, title, slug, status, seoTitle, seoDescription, parentId }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.page.findUnique({ where: { id } });
      if (!existing) return { success: false, error: 'Page not found' };

      // Prevent circular parent references
      if (parentId !== undefined && parentId !== null) {
        if (parentId === id) return { success: false, error: 'A page cannot be its own parent' };
        // Check if the proposed parent is a descendant of this page
        let current = await prisma.page.findUnique({ where: { id: parentId } });
        while (current?.parentId) {
          if (current.parentId === id) return { success: false, error: 'Circular parent reference detected' };
          current = await prisma.page.findUnique({ where: { id: current.parentId } });
        }
      }

      let uniqueSlug: string | undefined;
      if (slug && slug !== existing.slug) {
        uniqueSlug = await ensureUniqueSlug(prisma, slug, id);
      }

      const data: Record<string, any> = {};
      if (title !== undefined) data.title = title;
      if (uniqueSlug !== undefined) data.slug = uniqueSlug;
      if (status !== undefined) data.status = status;
      if (seoTitle !== undefined) data.metaTitle = seoTitle;
      if (seoDescription !== undefined) data.metaDescription = seoDescription;
      if (parentId !== undefined) data.parentId = parentId;

      const page = await withTimeout(
        prisma.page.update({
          where: { id },
          data,
          select: { id: true, title: true, slug: true, status: true },
        }),
        8000,
        'Update page timed out'
      );

      return {
        success: true,
        page: { ...page, adminUrl: `/admin/pages/${page.id}` },
        message: `Page "${page.title}" updated successfully`,
      };
    } catch (error) {
      console.error('[PageTools] updatePage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update page' };
    }
  },
});

export const deletePage = tool({
  description: 'Delete a CMS page. Fails if the page has child pages.',
  inputSchema: z.object({
    id: z.string().describe('Page ID to delete'),
  }),
  execute: async ({ id }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.page.findUnique({
        where: { id },
        include: { children: { select: { id: true } } },
      });
      if (!existing) return { success: false, error: 'Page not found' };

      if (existing.children.length > 0) {
        return {
          success: false,
          error: `Cannot delete page "${existing.title}" — it has ${existing.children.length} child page(s). Delete or reassign them first.`,
        };
      }

      await withTimeout(
        prisma.page.delete({ where: { id } }),
        8000,
        'Delete page timed out'
      );

      return { success: true, message: `Page "${existing.title}" deleted successfully` };
    } catch (error) {
      console.error('[PageTools] deletePage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete page' };
    }
  },
});

export const duplicatePage = tool({
  description: 'Duplicate an existing CMS page with a new title and slug.',
  inputSchema: z.object({
    id: z.string().describe('Page ID to duplicate'),
    newTitle: z.string().optional().describe('Title for the duplicate (defaults to "Copy of ...")'),
  }),
  execute: async ({ id, newTitle }) => {
    try {
      const prisma = await getDb();

      const original = await prisma.page.findUnique({ where: { id } });
      if (!original) return { success: false, error: 'Page not found' };

      const title = newTitle || `Copy of ${original.title}`;
      const slug = await ensureUniqueSlug(prisma, generateSlug(title));

      const page = await withTimeout(
        prisma.page.create({
          data: {
            title,
            slug,
            status: 'DRAFT',
            content: original.content ?? undefined,
            parentId: original.parentId,
            metaTitle: original.metaTitle,
            metaDescription: original.metaDescription,
            headerMode: original.headerMode,
            footerMode: original.footerMode,
            customHeader: original.customHeader ?? undefined,
            customFooter: original.customFooter ?? undefined,
          },
          select: { id: true, title: true, slug: true, status: true },
        }),
        8000,
        'Duplicate page timed out'
      );

      return {
        success: true,
        page: { ...page, adminUrl: `/admin/pages/${page.id}` },
        message: `Page duplicated as "${page.title}"`,
      };
    } catch (error) {
      console.error('[PageTools] duplicatePage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to duplicate page' };
    }
  },
});

export const publishPage = tool({
  description: 'Publish or unpublish a CMS page.',
  inputSchema: z.object({
    id: z.string().describe('Page ID'),
    publish: z.boolean().describe('true to publish, false to revert to draft'),
  }),
  execute: async ({ id, publish }) => {
    try {
      const prisma = await getDb();

      const existing = await prisma.page.findUnique({ where: { id } });
      if (!existing) return { success: false, error: 'Page not found' };

      const page = await withTimeout(
        prisma.page.update({
          where: { id },
          data: { status: publish ? 'PUBLISHED' : 'DRAFT' },
          select: { id: true, title: true, slug: true, status: true },
        }),
        5000,
        'Publish page timed out'
      );

      return {
        success: true,
        page: { ...page, adminUrl: `/admin/pages/${page.id}` },
        message: `Page "${page.title}" ${publish ? 'published' : 'unpublished'} successfully`,
      };
    } catch (error) {
      console.error('[PageTools] publishPage error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to publish page' };
    }
  },
});

export const pageTools = { createPage, updatePage, deletePage, duplicatePage, publishPage };
