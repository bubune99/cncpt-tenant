/**
 * Single Route API
 *
 * GET /api/admin/routes/[id] - Get route details
 * PUT /api/admin/routes/[id] - Update route
 * DELETE /api/admin/routes/[id] - Delete route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/permissions/middleware'
import { PERMISSIONS, logAuditEvent } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get route details
export const GET = withPermission(
  PERMISSIONS.ROUTES_VIEW,
  async (_request: NextRequest, _context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const route = await prisma.routeConfig.findUnique({
        where: { id },
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

      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        )
      }

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
      console.error('Get route error:', error)
      return NextResponse.json(
        { error: 'Failed to get route' },
        { status: 500 }
      )
    }
  }
)

// PUT - Update route
export const PUT = withPermission(
  PERMISSIONS.ROUTES_EDIT,
  async (request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params
      const body = await request.json()

      const route = await prisma.routeConfig.findUnique({
        where: { id },
      })

      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        )
      }

      const updateData: Record<string, unknown> = {}

      // Handle slug
      if (body.slug !== undefined) {
        let slug = body.slug.trim()
        if (!slug) {
          return NextResponse.json(
            { error: 'Slug cannot be empty' },
            { status: 400 }
          )
        }
        if (!slug.startsWith('/')) {
          slug = '/' + slug
        }

        // Check for duplicate slug (excluding current route)
        if (slug !== route.slug) {
          const existing = await prisma.routeConfig.findFirst({
            where: {
              slug,
              id: { not: id },
            },
          })
          if (existing) {
            return NextResponse.json(
              { error: 'A route with this slug already exists' },
              { status: 409 }
            )
          }
        }
        updateData.slug = slug
      }

      // Handle type change
      if (body.type !== undefined) {
        const type = body.type.toUpperCase()
        if (!['PUCK', 'CUSTOM', 'REDIRECT'].includes(type)) {
          return NextResponse.json(
            { error: 'Invalid type. Must be PUCK, CUSTOM, or REDIRECT' },
            { status: 400 }
          )
        }
        updateData.type = type

        // Clear fields not relevant to new type
        if (type !== 'PUCK') {
          updateData.pageId = null
        }
        if (type !== 'CUSTOM') {
          updateData.componentKey = null
        }
        if (type !== 'REDIRECT') {
          updateData.redirectUrl = null
          updateData.redirectCode = null
        }
      }

      // Handle pageId
      if (body.pageId !== undefined) {
        if (body.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: body.pageId },
          })
          if (!page) {
            return NextResponse.json(
              { error: 'Page not found' },
              { status: 400 }
            )
          }

          // Check if this page is already assigned to another route
          const existingPageRoute = await prisma.routeConfig.findFirst({
            where: {
              pageId: body.pageId,
              id: { not: id },
            },
          })
          if (existingPageRoute) {
            return NextResponse.json(
              { error: 'This page is already assigned to another route' },
              { status: 409 }
            )
          }
        }
        updateData.pageId = body.pageId || null
      }

      // Handle componentKey
      if (body.componentKey !== undefined) {
        updateData.componentKey = body.componentKey || null
      }

      // Handle redirect fields
      if (body.redirectUrl !== undefined) {
        updateData.redirectUrl = body.redirectUrl || null
      }
      if (body.redirectCode !== undefined) {
        updateData.redirectCode = body.redirectCode || null
      }

      // Handle isActive
      if (body.isActive !== undefined) {
        updateData.isActive = Boolean(body.isActive)
      }

      // Handle description
      if (body.description !== undefined) {
        updateData.description = body.description || null
      }

      const updatedRoute = await prisma.routeConfig.update({
        where: { id },
        data: updateData,
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
        action: 'route.update',
        targetType: 'route',
        targetId: route.id,
        details: {
          previous: {
            slug: route.slug,
            type: route.type,
          },
          updated: updateData,
        },
      })

      return NextResponse.json({
        id: updatedRoute.id,
        slug: updatedRoute.slug,
        type: updatedRoute.type.toLowerCase(),
        pageId: updatedRoute.pageId,
        page: updatedRoute.page
          ? {
              ...updatedRoute.page,
              status: updatedRoute.page.status.toLowerCase(),
            }
          : null,
        componentKey: updatedRoute.componentKey,
        redirectUrl: updatedRoute.redirectUrl,
        redirectCode: updatedRoute.redirectCode,
        isActive: updatedRoute.isActive,
        description: updatedRoute.description,
        createdAt: updatedRoute.createdAt,
        updatedAt: updatedRoute.updatedAt,
      })
    } catch (error) {
      console.error('Update route error:', error)
      return NextResponse.json(
        { error: 'Failed to update route' },
        { status: 500 }
      )
    }
  }
)

// DELETE - Delete route
export const DELETE = withPermission(
  PERMISSIONS.ROUTES_DELETE,
  async (_request: NextRequest, context: AuthContext, { params }: RouteParams) => {
    try {
      const { id } = await params

      const route = await prisma.routeConfig.findUnique({
        where: { id },
      })

      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        )
      }

      await prisma.routeConfig.delete({
        where: { id },
      })

      // Log the action
      await logAuditEvent({
        userId: context.user.id,
        userEmail: context.user.email,
        action: 'route.delete',
        targetType: 'route',
        targetId: id,
        details: {
          slug: route.slug,
          type: route.type,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete route error:', error)
      return NextResponse.json(
        { error: 'Failed to delete route' },
        { status: 500 }
      )
    }
  }
)
