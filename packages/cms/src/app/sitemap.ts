/**
 * Dynamic Sitemap Generator
 *
 * Generates sitemap.xml with all public pages, products, categories, and blog posts
 */

import { MetadataRoute } from 'next'
import { prisma } from '../lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  entries.push(
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }
  )

  // Dynamic pages from CMS
  try {
    const pages = await prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    })

    for (const page of pages) {
      entries.push({
        url: `${BASE_URL}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('Error fetching pages for sitemap:', error)
  }

  // Products
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    })

    for (const product of products) {
      entries.push({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  // Product Categories
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    })

    for (const category of categories) {
      entries.push({
        url: `${BASE_URL}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error)
  }

  // Blog Posts
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        noIndex: false,
      },
      select: { slug: true, updatedAt: true, publishedAt: true },
    })

    for (const post of posts) {
      entries.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  // Blog Categories
  try {
    const blogCategories = await prisma.blogCategory.findMany({
      select: { slug: true, updatedAt: true },
    })

    for (const category of blogCategories) {
      entries.push({
        url: `${BASE_URL}/blog/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch (error) {
    console.error('Error fetching blog categories for sitemap:', error)
  }

  // Blog Tags
  try {
    const blogTags = await prisma.blogTag.findMany({
      select: { slug: true, updatedAt: true },
    })

    for (const tag of blogTags) {
      entries.push({
        url: `${BASE_URL}/blog/tag/${tag.slug}`,
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
