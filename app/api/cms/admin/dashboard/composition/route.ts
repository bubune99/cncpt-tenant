/**
 * Admin Dashboard Composition API
 *
 * GET /api/cms/admin/dashboard/composition
 *
 * Returns segmented breakdowns powering the dashboard composition cards:
 *   - orderPipeline: count of orders by status (PENDING/PROCESSING/SHIPPED/DELIVERED)
 *   - productCatalog: count of products by status (ACTIVE/DRAFT/ARCHIVED)
 *
 * Both shapes include a `total` and `segments` array suitable for direct
 * consumption by <CompositionBarCard />.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/cms/db'
import { withAuth } from '@/lib/cms/permissions/middleware'

export const dynamic = 'force-dynamic'

type SegmentColor = 'success' | 'warning' | 'destructive' | 'muted'

interface Segment {
  label: string
  value: number
  color: SegmentColor
}

interface Composition {
  label: string
  total: number
  segments: Segment[]
  headlineMetric?: {
    value: string
    subtitle: string
  }
}

/** Pure: format a percentage with a single decimal. */
function formatPct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0%'
  const pct = (numerator / denominator) * 100
  return `${Math.round(pct * 10) / 10}%`
}

export const GET = withAuth(async () => {
  try {
    // Order pipeline — group active (non-final) statuses on the bar so the
    // bar reads as "in flight" volume; cancelled/refunded excluded.
    const [pending, processing, shipped, delivered] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
    ])

    const orderPipelineTotal = pending + processing + shipped + delivered
    const orderPipelineInFlight = pending + processing + shipped

    const orderPipeline: Composition = {
      label: 'Order Pipeline',
      total: orderPipelineTotal,
      segments: [
        { label: 'Pending', value: pending, color: 'warning' },
        { label: 'Processing', value: processing, color: 'muted' },
        { label: 'Shipped', value: shipped, color: 'success' },
        { label: 'Delivered', value: delivered, color: 'success' },
      ],
      headlineMetric: {
        value: formatPct(orderPipelineInFlight, orderPipelineTotal),
        subtitle: 'In Flight',
      },
    }

    // Product catalog — ACTIVE / DRAFT / ARCHIVED.
    const [active, draft, archived] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
      prisma.product.count({ where: { status: 'ARCHIVED' } }),
    ])

    const productTotal = active + draft + archived

    const productCatalog: Composition = {
      label: 'Product Catalog',
      total: productTotal,
      segments: [
        { label: 'Active', value: active, color: 'success' },
        { label: 'Draft', value: draft, color: 'warning' },
        { label: 'Archived', value: archived, color: 'muted' },
      ],
      headlineMetric: {
        value: formatPct(active, productTotal),
        subtitle: 'Published',
      },
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      compositions: {
        orderPipeline,
        productCatalog,
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard composition:', error)
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        compositions: {
          orderPipeline: {
            label: 'Order Pipeline',
            total: 0,
            segments: [],
          },
          productCatalog: {
            label: 'Product Catalog',
            total: 0,
            segments: [],
          },
        },
      },
      { status: 200 },
    )
  }
})
