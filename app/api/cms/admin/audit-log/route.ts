/**
 * Admin Audit Log API
 *
 * GET /api/admin/audit-log - List audit log entries with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS } from '@/lib/cms/permissions'
import type { Prisma } from '@prisma/client'
import { isSuperAdmin as isPlatformSuperAdmin } from '@/lib/super-admin'

export const GET = withPermission(
  PERMISSIONS.AUDIT_VIEW,
  async (request: NextRequest, context: AuthContext) => {
    // AuditLog has no site column yet, so its rows span every site: platform super admins only
    // until it does (card 6b361b6a). A site admin would otherwise read other sites' entries.
    if (!(await isPlatformSuperAdmin(context.user.stackAuthId))) {
      return NextResponse.json({ error: 'The audit log is not available for a single site yet' }, { status: 403 })
    }
    try {
      const { searchParams } = new URL(request.url)

      // Pagination
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')

      // Filters
      const action = searchParams.get('action')
      const entityType = searchParams.get('entityType')
      const userId = searchParams.get('userId')
      const userEmail = searchParams.get('userEmail')
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')
      const search = searchParams.get('search')

      // Build where clause
      const where: Prisma.AuditLogWhereInput = {}

      if (action) {
        where.action = action
      }

      if (entityType) {
        where.targetType = entityType
      }

      if (userId) {
        where.userId = userId
      }

      if (userEmail) {
        where.userEmail = { contains: userEmail, mode: 'insensitive' }
      }

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom)
        }
        if (dateTo) {
          // Set to end of day
          const endDate = new Date(dateTo)
          endDate.setHours(23, 59, 59, 999)
          where.createdAt.lte = endDate
        }
      }

      if (search) {
        where.OR = [
          { userEmail: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { targetType: { contains: search, mode: 'insensitive' } },
          { targetId: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [entries, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count({ where }),
      ])

      // Get distinct actions and entity types for filter dropdowns
      const [actions, entityTypes] = await Promise.all([
        prisma.auditLog.groupBy({
          by: ['action'],
          orderBy: { action: 'asc' },
        }),
        prisma.auditLog.groupBy({
          by: ['targetType'],
          where: { targetType: { not: null } },
          orderBy: { targetType: 'asc' },
        }),
      ])

      return NextResponse.json({
        entries: entries.map((entry) => ({
          id: entry.id,
          userId: entry.userId,
          userEmail: entry.userEmail,
          action: entry.action,
          entityType: entry.targetType,
          entityId: entry.targetId,
          details: entry.details,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: entry.createdAt,
        })),
        total,
        limit,
        offset,
        filters: {
          actions: actions.map((a) => a.action),
          entityTypes: entityTypes
            .map((e) => e.targetType)
            .filter(Boolean) as string[],
        },
      })
    } catch (error) {
      console.error('List audit log error:', error)
      return NextResponse.json(
        { error: 'Failed to list audit log entries' },
        { status: 500 }
      )
    }
  }
)
