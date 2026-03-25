'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface CartItem {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  title: string
  variantTitle: string | null
  price: number
  imageUrl: string | null
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  discountTotal: number
  total: number
  discountCode: {
    code: string
    type: string
    value: number
  } | null
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/cart')
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
      }
    } catch {
      // Cart fetch failed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const updateQuantity = async (itemId: string, quantity: number) => {
    setUpdating(itemId)
    try {
      if (quantity <= 0) {
        const res = await fetch(`/api/cms/cart/items/${itemId}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          const data = await res.json()
          setCart(data.cart)
          window.dispatchEvent(new CustomEvent('cart:updated'))
        }
      } else {
        const res = await fetch(`/api/cms/cart/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        })
        if (res.ok) {
          const data = await res.json()
          setCart(data.cart)
          window.dispatchEvent(new CustomEvent('cart:updated'))
        }
      }
    } catch {
      // Update failed
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const res = await fetch(`/api/cms/cart/items/${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
        window.dispatchEvent(new CustomEvent('cart:updated'))
      }
    } catch {
      // Remove failed
    } finally {
      setUpdating(null)
    }
  }

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/cms/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
      }
    } catch {
      // Checkout failed
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8">Shopping Cart</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Shopping Cart</h1>
          <p className="text-muted-foreground mb-8">Your cart is empty.</p>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Shopping Cart</h1>

        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 border rounded-lg bg-card"
            >
              {/* Image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.title}</h3>
                {item.variantTitle && (
                  <p className="text-sm text-muted-foreground">{item.variantTitle}</p>
                )}
                <p className="text-sm font-medium mt-1">
                  ${(item.price / 100).toFixed(2)}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center border rounded-md text-sm hover:bg-muted disabled:opacity-40"
                    disabled={updating === item.id}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center border rounded-md text-sm hover:bg-muted disabled:opacity-40"
                    disabled={updating === item.id}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-sm text-destructive hover:underline disabled:opacity-40"
                    disabled={updating === item.id}
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right flex-shrink-0">
                <p className="font-medium">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${((cart?.subtotal ?? 0) / 100).toFixed(2)}</span>
          </div>
          {cart?.discountTotal && cart.discountTotal > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Discount{cart.discountCode ? ` (${cart.discountCode.code})` : ''}
              </span>
              <span className="text-green-600">
                -${(cart.discountTotal / 100).toFixed(2)}
              </span>
            </div>
          ) : null}
          <Separator />
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>${((cart?.total ?? 0) / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Redirecting...' : 'Proceed to Checkout'}
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
