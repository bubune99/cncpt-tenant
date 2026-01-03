/**
 * Customer Stripe Sync API
 *
 * POST /api/customers/[id]/sync-stripe - Sync customer to Stripe
 * GET /api/customers/[id]/sync-stripe - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  syncCustomerToStripe,
  getCustomerSyncStatus,
} from '@/lib/stripe/customer-sync'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { forceUpdate = false } = body

    // Get customer with addresses
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { addresses: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Sync to Stripe
    const result = await syncCustomerToStripe(customer, forceUpdate)

    return NextResponse.json({
      success: true,
      stripeCustomerId: result.stripeCustomerId,
      stripeSyncedAt: result.syncedAt,
    })
  } catch (error) {
    console.error('Customer Stripe sync error:', error)

    // Update customer with sync error
    const { id } = await params
    await prisma.customer
      .update({
        where: { id },
        data: {
          stripeSyncError:
            error instanceof Error ? error.message : 'Sync failed',
        },
      })
      .catch(() => {})

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to sync with Stripe',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const status = await getCustomerSyncStatus(id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('Get customer sync status error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get sync status',
      },
      { status: 500 }
    )
  }
}
