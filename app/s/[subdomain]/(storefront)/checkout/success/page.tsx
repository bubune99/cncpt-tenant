'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface OrderSummary {
  orderId: string
  orderNumber: string
  total: number
  itemCount: number
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<OrderSummary | null>(null)

  useEffect(() => {
    // Clear the cart on the client side after successful checkout
    window.dispatchEvent(new CustomEvent('cart:updated'))
  }, [])

  useEffect(() => {
    if (!orderId) return
    // Optionally fetch order details for display
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/cms/ucp/checkout/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder({
            orderId: data.order?.id || orderId!,
            orderNumber: data.order?.orderNumber || '',
            total: data.order?.total || 0,
            itemCount: data.order?.items?.length || 0,
          })
        }
      } catch {
        // Order fetch failed — still show success
      }
    }
    fetchOrder()
  }, [orderId])

  return (
    <div className="container mx-auto px-4 py-12 sm:py-20">
      <div className="max-w-lg mx-auto text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-green-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          Thank you for your order!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your order has been placed successfully. We&apos;ll send you a
          confirmation email with your order details.
        </p>

        {order && (
          <div className="bg-muted/50 rounded-lg p-4 mb-8 text-sm space-y-2">
            {order.orderNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
            )}
            {order.itemCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{order.itemCount}</span>
              </div>
            )}
            {order.total > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  ${(order.total / 100).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {order?.orderNumber && (
            <Button asChild variant="outline">
              <Link href={`/track/${order.orderNumber}`}>Track Order</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
