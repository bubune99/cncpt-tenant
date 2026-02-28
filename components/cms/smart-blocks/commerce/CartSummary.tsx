'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'

interface CartData {
  items: { id: string; quantity: number; price: number; title: string }[]
  total: number
  itemCount: number
}

export default function CartSummary({ block, className }: SmartBlockProps) {
  const [cart, setCart] = useState<CartData | null>(null)
  const [open, setOpen] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/cart')
      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        const total = items.reduce(
          (sum: number, i: { quantity: number; price: number }) => sum + i.quantity * i.price,
          0
        )
        const itemCount = items.reduce(
          (sum: number, i: { quantity: number }) => sum + i.quantity,
          0
        )
        setCart({ items, total, itemCount })
      }
    } catch {
      // Silently fail — cart may not be available
    }
  }, [])

  useEffect(() => {
    fetchCart()
    const handler = () => fetchCart()
    window.addEventListener('cart:updated', handler)
    return () => window.removeEventListener('cart:updated', handler)
  }, [fetchCart])

  const outer = className || block.className || 'relative inline-block'
  const itemCount = cart?.itemCount ?? 0

  return (
    <div className={outer}>
      <button
        type="button"
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Shopping cart"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-5.98.286m5.98-.286h9m-9 0a3 3 0 01-5.98.286M17.25 14.25a3 3 0 005.98.286m-5.98-.286a3 3 0 015.98.286M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {open && cart && cart.items.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate flex-1 mr-2">
                  {item.title} x{item.quantity}
                </span>
                <span className="font-medium text-gray-900 whitespace-nowrap">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-medium">
            <span>Total</span>
            <span>${(cart.total / 100).toFixed(2)}</span>
          </div>
          <Link
            href="/cart"
            className="mt-3 block w-full text-center bg-black text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            View Cart
          </Link>
        </div>
      )}

      {open && cart && cart.items.length === 0 && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-sm text-gray-500">
          Your cart is empty
        </div>
      )}
    </div>
  )
}
