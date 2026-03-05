/**
 * Admin Customer Export API
 *
 * GET /api/cms/admin/customers/export - Export customers as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import {
  withPermission,
  type AuthContext,
} from '@/lib/cms/permissions/middleware'
import { PERMISSIONS } from '@/lib/cms/permissions'

export const dynamic = 'force-dynamic'

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export const GET = withPermission(
  PERMISSIONS.CUSTOMERS_EXPORT,
  async (_request: NextRequest, _context: AuthContext) => {
    try {
      const customers = await prisma.customer.findMany({
        include: {
          tenant: {
            select: {
              subdomain: true,
              tenantSettings: {
                select: {
                  siteName: true,
                  siteTitle: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const headers = [
        'ID',
        'Email',
        'First Name',
        'Last Name',
        'Phone',
        'Company',
        'Business',
        'Total Orders',
        'Total Spent',
        'Average Order',
        'Last Order',
        'Accepts Marketing',
        'Tags',
        'Created At',
      ]

      const rows = customers.map((customer) => {
        const businessName =
          customer.tenant?.tenantSettings?.siteName ||
          customer.tenant?.tenantSettings?.siteTitle ||
          customer.tenant?.subdomain ||
          ''

        return [
          customer.id,
          customer.email,
          customer.firstName || '',
          customer.lastName || '',
          customer.phone || '',
          customer.company || '',
          businessName,
          String(customer.totalOrders),
          (customer.totalSpent / 100).toFixed(2),
          (customer.averageOrder / 100).toFixed(2),
          customer.lastOrderAt?.toISOString() || '',
          customer.acceptsMarketing ? 'Yes' : 'No',
          customer.tags.join('; '),
          customer.createdAt.toISOString(),
        ].map(escapeCsvField)
      })

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
        '\n'
      )

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } catch (error) {
      console.error('Customer export error:', error)
      return NextResponse.json(
        { error: 'Failed to export customers' },
        { status: 500 }
      )
    }
  }
)
