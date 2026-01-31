/**
 * Route Configuration Utilities
 *
 * Handles fetching and resolving route configurations.
 */

import { prisma } from '../db'
import { cache } from 'react'

export type { RouteType } from '@prisma/client'

export interface ResolvedRoute {
  type: 'PUCK' | 'CUSTOM' | 'REDIRECT' | 'NOT_FOUND'
  // For PUCK
  pageId?: string
  pageContent?: unknown
  pageTitle?: string
  pageSlug?: string
  pageMetaTitle?: string | null
  pageMetaDescription?: string | null
  // For CUSTOM
  componentKey?: string
  // For REDIRECT
  redirectUrl?: string
  redirectCode?: number
}

/**
 * Get route configuration for a given slug
 * Cached per request using React cache
 */
export const getRouteConfig = cache(async (slug: string): Promise<ResolvedRoute> => {
  // Normalize slug
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`

  const routeConfig = await prisma.routeConfig.findFirst({
    where: { slug: normalizedSlug, tenantId: null },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          content: true,
          metaTitle: true,
          metaDescription: true,
        },
      },
    },
  })

  if (!routeConfig || !routeConfig.isActive) {
    return { type: 'NOT_FOUND' }
  }

  switch (routeConfig.type) {
    case 'PUCK':
      if (!routeConfig.page) {
        return { type: 'NOT_FOUND' }
      }
      // Only show published pages
      if (routeConfig.page.status !== 'PUBLISHED') {
        return { type: 'NOT_FOUND' }
      }
      return {
        type: 'PUCK',
        pageId: routeConfig.page.id,
        pageContent: routeConfig.page.content,
        pageTitle: routeConfig.page.title,
        pageSlug: routeConfig.page.slug,
        pageMetaTitle: routeConfig.page.metaTitle,
        pageMetaDescription: routeConfig.page.metaDescription,
      }

    case 'CUSTOM':
      if (!routeConfig.componentKey) {
        return { type: 'NOT_FOUND' }
      }
      return {
        type: 'CUSTOM',
        componentKey: routeConfig.componentKey,
      }

    case 'REDIRECT':
      if (!routeConfig.redirectUrl) {
        return { type: 'NOT_FOUND' }
      }
      return {
        type: 'REDIRECT',
        redirectUrl: routeConfig.redirectUrl,
        redirectCode: routeConfig.redirectCode || 307,
      }

    default:
      return { type: 'NOT_FOUND' }
  }
})

/**
 * Check if a slug is reserved by a route config
 */
export async function isSlugReserved(slug: string): Promise<boolean> {
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`

  const existing = await prisma.routeConfig.findFirst({
    where: { slug: normalizedSlug, tenantId: null },
    select: { id: true },
  })

  return !!existing
}

/**
 * Get all route configurations (for admin)
 */
export async function getAllRouteConfigs() {
  return prisma.routeConfig.findMany({
    include: {
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: { slug: 'asc' },
  })
}
