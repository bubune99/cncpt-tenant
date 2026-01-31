import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '../../../../lib/db'
import { getCustomerProgressView } from '../../../../lib/order-workflows/progress'
import { OrderTracker } from './OrderTracker'

interface PageProps {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ email?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Track Order ${orderNumber}`,
    description: `Track the status of your order ${orderNumber}`,
  }
}

export default async function OrderTrackingPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params
  const { email } = await searchParams

  // Find order by order number
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber.toUpperCase(),
    },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      status: true,
      total: true,
      createdAt: true,
      workflowId: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      shipments: {
        select: {
          id: true,
          trackingNumber: true,
          carrier: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!order) {
    notFound()
  }

  // Get progress view
  const progress = await getCustomerProgressView(order.id)

  // Calculate order summary
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <OrderTracker
          orderNumber={order.orderNumber}
          orderEmail={order.email}
          orderStatus={order.status}
          orderTotal={order.total}
          orderDate={order.createdAt.toISOString()}
          itemCount={itemCount}
          shipment={order.shipments[0] || null}
          progress={progress}
          requiresEmailVerification={!email}
          providedEmail={email}
        />
      </div>
    </div>
  )
}
