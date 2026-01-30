/**
 * Routes API
 *
 * GET /api/admin/routes - List all route configurations
 * POST /api/admin/routes - Create a new route configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import {
  withPermission,
  type AuthContext,
} from '../../../../lib/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '../../../../lib/permissions'
import { getAvailableCustomComponents } from '../../../../lib/routes/custom-components'

// GET - List all route configurations
export const GET = withPermission(
  PERMISSIONS.ROUTES_VIEW,
  async (_request: NextRequest, _context: AuthContext) => {
    try {
      const routes = await prisma.routeConfig.findMany({
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

      // Get available custom components
      const customComponents = getAvailableCustomComponents()

      return NextResponse.json({
        routes: routes.map((route) => ({
          id: route.id,
          slug: route.slug,
          type: route.type.toLowerCase(),
          pageId: route.pageId,
          page: route.page
            ? {
                ...route.page,
                status: route.page.status.toLowerCase(),
              }
            : null,
          componentKey: route.componentKey,
          redirectUrl: route.redirectUrl,
          redirectCode: route.redirectCode,
          isActive: route.isActive,
          description: route.description,
          createdAt: route.createdAt,
          updatedAt: route.updatedAt,
        })),
        customComponents,
      })
    } catch (error) {
      console.error('List routes error:', error)
      return NextResponse.json(
        { error: 'Failed to list routes' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a new route configuration
export const POST = withPermission(
  PERMISSIONS.ROUTES_CREATE,
  async (request: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json()

      // Validate required fields
      if (!body.slug) {
        return NextResponse.json(
          { error: 'Slug is required' },
          { status: 400 }
        )
      }

      if (!body.type) {
        return NextResponse.json(
          { error: 'Type is required' },
          { status: 400 }
        )
      }

      // Normalize slug
      let slug = body.slug.trim()
      if (!slug.startsWith('/')) {
        slug = '/' + slug
      }

      // Check for duplicate slug
      const existing = await prisma.routeConfig.findFirst({
        where: { slug, tenantId: null },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'A route with this slug already exists' },
          { status: 409 }
        )
      }

      // Validate type-specific fields
      const type = body.type.toUpperCase()
      if (!['PUCK', 'CUSTOM', 'REDIRECT'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be PUCK, CUSTOM, or REDIRECT' },
          { status: 400 }
        )
      }

      if (type === 'PUCK' && !body.pageId) {
        return NextResponse.json(
          { error: 'Page ID is required for PUCK type' },
          { status: 400 }
        )
      }

      if (type === 'CUSTOM' && !body.componentKey) {
        return NextResponse.json(
          { error: 'Component key is required for CUSTOM type' },
          { status: 400 }
        )
      }

      if (type === 'REDIRECT' && !body.redirectUrl) {
        return NextResponse.json(
          { error: 'Redirect URL is required for REDIRECT type' },
          { status: 400 }
        )
      }

      // Validate page exists if PUCK type
      if (type === 'PUCK') {
        const page = await prisma.page.findUnique({
          where: { id: body.pageId },
        })
        if (!page) {
          return NextResponse.json(
            { error: 'Page not found' },
            { status: 400 }
          )
        }

        // Check if this page is already assigned to a route
        const existingPageRoute = await prisma.routeConfig.findUnique({
          where: { pageId: body.pageId },
        })
        if (existingPageRoute) {
          return NextResponse.json(
            { error: 'This page is already assigned to another route' },
            { status: 409 }
          )
        }
      }

      // Create the route
      const route = await prisma.routeConfig.create({
        data: {
          slug,
          type,
          pageId: type === 'PUCK' ? body.pageId : null,
          componentKey: type === 'CUSTOM' ? body.componentKey : null,
          redirectUrl: type === 'REDIRECT' ? body.redirectUrl : null,
          redirectCode: type === 'REDIRECT' ? (body.redirectCode || 307) : null,
          isActive: body.isActive !== false,
          description: body.description || null,
        },
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
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'route.create',
        targetType: 'route',
        targetId: route.id,
        details: {
          slug: route.slug,
          type: route.type,
        },
      })

      return NextResponse.json({
        id: route.id,
        slug: route.slug,
        type: route.type.toLowerCase(),
        pageId: route.pageId,
        page: route.page
          ? {
              ...route.page,
              status: route.page.status.toLowerCase(),
            }
          : null,
        componentKey: route.componentKey,
        redirectUrl: route.redirectUrl,
        redirectCode: route.redirectCode,
        isActive: route.isActive,
        description: route.description,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      })
    } catch (error) {
      console.error('Create route error:', error)
      return NextResponse.json(
        { error: 'Failed to create route' },
        { status: 500 }
      )
    }
  }
)
