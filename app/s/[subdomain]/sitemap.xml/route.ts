/**
 * Dynamic Sitemap.xml Route Handler (Tenant-Scoped)
 *
 * Generates a sitemap for the current subdomain/tenant only.
 */

import { prisma, runWithTenant } from '@/lib/cms/db'
import { getTenantContext } from '../lib/tenant-context'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: string
  priority: number
}

interface SitemapRouteProps {
  params: Promise<{ subdomain: string }>
}

async function generateSitemapEntries(tenantId: number, baseUrl: string): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []

  // Static pages
  entries.push(
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }
  )

  // Dynamic pages from CMS (tenant-scoped)
  try {
    const pages = await prisma.page.findMany({
      where: { status: 'PUBLISHED', tenantId },
      select: { slug: true, updatedAt: true },
    })

    for (const page of pages) {
      entries.push({
        url: `${baseUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('Error fetching pages for sitemap:', error)
  }

  // Products (tenant-scoped)
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', tenantId },
      select: { slug: true, updatedAt: true },
    })

    for (const product of products) {
      entries.push({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  // Product Categories (tenant-scoped)
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: { slug: true, updatedAt: true },
    })

    for (const category of categories) {
      entries.push({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error)
  }

  // Blog Posts (tenant-scoped)
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        noIndex: false,
        tenantId,
      },
      select: { slug: true, updatedAt: true, publishedAt: true },
    })

    for (const post of posts) {
      entries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  // Blog Categories (tenant-scoped)
  try {
    const blogCategories = await prisma.blogCategory.findMany({
      where: { tenantId },
      select: { slug: true, updatedAt: true },
    })

    for (const category of blogCategories) {
      entries.push({
        url: `${baseUrl}/blog/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch (error) {
    console.error('Error fetching blog categories for sitemap:', error)
  }

  // Blog Tags (tenant-scoped)
  try {
    const blogTags = await prisma.blogTag.findMany({
      where: { tenantId },
      select: { slug: true, updatedAt: true },
    })

    for (const tag of blogTags) {
      entries.push({
        url: `${baseUrl}/blog/tag/${tag.slug}`,
        lastModified: tag.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.4,
      })
    }
  } catch (error) {
    console.error('Error fetching blog tags for sitemap:', error)
  }

  return entries
}

export async function GET(_request: Request, { params }: SitemapRouteProps) {
  const { subdomain } = await params
  const tenantContext = await getTenantContext(subdomain)

  if (!tenantContext) {
    return new Response('Tenant not found', { status: 404 })
  }

  // Build base URL for this tenant
  const protocol = ROOT_DOMAIN.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${subdomain}.${ROOT_DOMAIN}`

  const entries = await runWithTenant(tenantContext.id, () =>
    generateSitemapEntries(tenantContext.id, baseUrl)
  )

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
