'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-20">
      <div className="max-w-lg mx-auto text-center">
        {/* Cancel Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-muted-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          Checkout Cancelled
        </h1>
        <p className="text-muted-foreground mb-8">
          Your order was not completed. Don&apos;t worry &mdash; your cart items
          are still saved and you can return to checkout at any time.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/cart">Return to Cart</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
