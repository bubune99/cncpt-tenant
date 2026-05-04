/**
 * Admin Customers API Routes
 *
 * GET  /api/cms/admin/customers - List customers with filters
 * POST /api/cms/admin/customers - Create a new customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS } from '@/lib/cms/permissions'
import { stackServerApp } from '@/stack'
import { isSuperAdmin } from '@/lib/super-admin'

export const dynamic = 'force-dynamic'

const DEFAULT_STORAGE_LIMIT = 500 * 1024 * 1024 // 500 MB
const PREMIUM_STORAGE_LIMIT = 2 * 1024 * 1024 * 1024 // 2 GB

// GET - List all customers with optional filters
export const GET = withPermission(
  PERMISSIONS.CUSTOMERS_VIEW,
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const clientBusinessOwnerId = searchParams.get('businessOwnerId')
      const status = searchParams.get('status')
      const accessLevel = searchParams.get('accessLevel')

      const where: Record<string, unknown> = {}

      // Derive tenantId from x-subdomain header instead of trusting client param
      const subdomain = request.headers.get('x-subdomain')

      if (subdomain) {
        const tenant = await prisma.subdomain.findUnique({
          where: { subdomain },
          select: { id: true },
        })

        if (tenant) {
          where.tenantId = tenant.id
        } else {
          return NextResponse.json(
            { error: 'Tenant not found for subdomain' },
            { status: 404 }
          )
        }
      } else if (clientBusinessOwnerId) {
        // Only allow client-provided businessOwnerId for super admins
        const stackUser = await stackServerApp.getUser()
        if (stackUser && await isSuperAdmin(stackUser.id)) {
          where.tenantId = parseInt(clientBusinessOwnerId)
        } else {
          // Non-super-admin without subdomain context — reject
          return NextResponse.json(
            { error: 'Tenant context required. Provide x-subdomain header.' },
            { status: 400 }
          )
        }
      }

      if (status === 'active') {
        // Active = has placed an order or was created recently (last 90 days)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        where.OR = [
          { lastOrderAt: { not: null } },
          { createdAt: { gte: ninetyDaysAgo } },
        ]
      } else if (status === 'inactive') {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        where.AND = [
          { lastOrderAt: null },
          { createdAt: { lt: ninetyDaysAgo } },
        ]
      }

      if (accessLevel && accessLevel !== 'all') {
        where.tags = { has: `access:${accessLevel}` }
      }

      const customers = await prisma.customer.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              subdomain: true,
              tenantSettings: {
                select: {
                  siteName: true,
                  siteTitle: true,
                },
              },
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const result = customers.map((customer) => {
        const accessTag = customer.tags.find((t) => t.startsWith('access:'))
        const customerAccessLevel = accessTag ? accessTag.replace('access:', '') : 'standard'

        const isActive = !!(
          customer.lastOrderAt ||
          customer.createdAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        )

        const businessName =
          customer.tenant?.tenantSettings?.siteName ||
          customer.tenant?.tenantSettings?.siteTitle ||
          customer.tenant?.subdomain ||
          'Unknown'

        return {
          id: customer.id,
          name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email,
          email: customer.email,
          businessOwner: {
            id: String(customer.tenantId || 0),
            businessName,
          },
          stackAuthUserId: customer.userId || undefined,
          accessLevel: customerAccessLevel,
          storageUsed: 0, // No per-customer storage tracking yet
          storageLimit:
            customerAccessLevel === 'premium'
              ? PREMIUM_STORAGE_LIMIT
              : DEFAULT_STORAGE_LIMIT,
          designCount: customer._count.orders,
          lastActivityAt: customer.lastOrderAt?.toISOString() || null,
          isActive,
          createdAt: customer.createdAt.toISOString(),
        }
      })

      return NextResponse.json({ customers: result })
    } catch (error) {
      console.error('List customers error:', error)
      return NextResponse.json(
        { error: 'Failed to list customers' },
        { status: 500 }
      )
    }
  }
)

// POST - Create a new customer
export const POST = withPermission(
  PERMISSIONS.CUSTOMERS_CREATE,
  async (request: NextRequest, _context: AuthContext) => {
    try {
      const body = await request.json()

      if (!body.email?.trim()) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }

      // SECURITY: Derive tenantId from x-subdomain header (set by middleware
      // from the verified hostname), not from client-supplied businessOwnerId.
      // Otherwise a tenant admin could create customers in someone else's tenant
      // by passing a different businessOwnerId in the request body.
      // Super admins are an exception: they may create customers in any tenant
      // via the body (they explicitly target a businessOwnerId from the picker).
      const subdomain = request.headers.get('x-subdomain')
      let tenantId: number

      if (subdomain) {
        const tenant = await prisma.subdomain.findUnique({
          where: { subdomain },
          select: { id: true },
        })
        if (!tenant) {
          return NextResponse.json(
            { error: 'Tenant not found for subdomain' },
            { status: 404 }
          )
        }
        tenantId = tenant.id
      } else {
        // No subdomain context — only super admins can specify a target tenant
        const stackUser = await stackServerApp.getUser()
        if (!stackUser || !(await isSuperAdmin(stackUser.id))) {
          return NextResponse.json(
            { error: 'Tenant context required. Provide x-subdomain header.' },
            { status: 400 }
          )
        }
        if (!body.businessOwnerId) {
          return NextResponse.json(
            { error: 'Business owner is required' },
            { status: 400 }
          )
        }
        const parsed = parseInt(body.businessOwnerId)
        if (!Number.isInteger(parsed) || parsed <= 0) {
          return NextResponse.json(
            { error: 'Invalid business owner id' },
            { status: 400 }
          )
        }
        const tenant = await prisma.subdomain.findUnique({
          where: { id: parsed },
        })
        if (!tenant) {
          return NextResponse.json(
            { error: 'Business owner not found' },
            { status: 404 }
          )
        }
        tenantId = parsed
      }

      // Check for duplicate email within this tenant
      const existing = await prisma.customer.findFirst({
        where: { email: body.email.trim(), tenantId },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A customer with this email already exists for this business' },
          { status: 409 }
        )
      }

      // Parse name into first/last
      const nameParts = (body.name || '').trim().split(' ')
      const firstName = nameParts[0] || null
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

      // Build tags array with access level
      const tags: string[] = []
      if (body.accessLevel && body.accessLevel !== 'standard') {
        tags.push(`access:${body.accessLevel}`)
      }

      const customer = await prisma.customer.create({
        data: {
          email: body.email.trim(),
          firstName,
          lastName,
          tenantId,
          tags,
        },
      })

      return NextResponse.json(
        { success: true, customer },
        { status: 201 }
      )
    } catch (error) {
      console.error('Create customer error:', error)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }
  }
)
