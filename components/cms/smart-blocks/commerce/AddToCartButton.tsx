'use client'

import { useState, useCallback } from 'react'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'

export default function AddToCartButton({ block, className }: SmartBlockProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const productId = block.commerce?.handle || block.attrs?.['data-product-id'] || ''
  const variantId = block.attrs?.['data-variant-id'] || undefined
  const showQuantity = block.attrs?.['data-show-quantity'] !== 'false'
  const maxQty = Number(block.attrs?.['data-max-qty']) || 99

  const handleAdd = useCallback(async () => {
    if (!productId || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/cms/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity }),
      })
      if (res.ok) {
        setAdded(true)
        window.dispatchEvent(new CustomEvent('cart:updated'))
        setTimeout(() => setAdded(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }, [productId, variantId, quantity, loading])

  const outer = className || block.className || 'inline-flex items-center gap-2'

  return (
    <div className={outer}>
      {showQuantity && (
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            type="button"
            className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-2 py-1 text-sm font-medium min-w-[2rem] text-center">
            {quantity}
          </span>
          <button
            type="button"
            className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-40"
            disabled={quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      )}
      <button
        type="button"
        className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        disabled={loading || !productId}
        onClick={handleAdd}
      >
        {loading ? 'Adding...' : added ? 'Added!' : (block.textContent || 'Add to Cart')}
      </button>
    </div>
  )
}
