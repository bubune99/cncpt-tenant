'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { SerializedProduct } from '@/lib/cms/block-editor/smart-blocks/commerce-data'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function ProductDetail({ block, data, className }: SmartBlockProps) {
  const product = data.product as SerializedProduct | undefined
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  if (!product) {
    return (
      <div className={className || block.className || 'py-12 text-center text-gray-500'}>
        Product not found
      </div>
    )
  }

  // Build option groups from variants
  const optionGroups: Record<string, Set<string>> = {}
  for (const variant of product.variants) {
    for (const ov of variant.optionValues) {
      if (!optionGroups[ov.name]) optionGroups[ov.name] = new Set()
      optionGroups[ov.name].add(ov.value)
    }
  }

  // Find matching variant based on selected options
  const selectedVariant = product.variants.find((v) =>
    v.optionValues.every((ov) => selectedOptions[ov.name] === ov.value)
  )

  const currentPrice = selectedVariant?.price ?? product.basePrice
  const currentCompareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice
  const hasDiscount = currentCompareAt != null && currentCompareAt > currentPrice
  const inStock = selectedVariant ? selectedVariant.stock > 0 : true

  const handleAddToCart = useCallback(async () => {
    if (adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/cms/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity,
        }),
      })
      if (res.ok) {
        setAdded(true)
        window.dispatchEvent(new CustomEvent('cart:updated'))
        setTimeout(() => setAdded(false), 2000)
      }
    } finally {
      setAdding(false)
    }
  }, [adding, product.id, selectedVariant?.id, quantity])

  const images = product.images
  const selectedImage = images[selectedImageIdx]
  const outer = className || block.className || 'grid grid-cols-1 md:grid-cols-2 gap-8'

  return (
    <div className={outer}>
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {selectedImage ? (
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
              Sale
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImageIdx(idx)}
                className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  idx === selectedImageIdx ? 'border-black' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ''}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          {product.categories.length > 0 && (
            <p className="text-sm text-gray-500 mb-1">{product.categories[0].name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(currentCompareAt!)}
              </span>
            )}
          </div>
        </div>

        {product.description && (
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        )}

        {/* Options */}
        {Object.entries(optionGroups).map(([optionName, values]) => (
          <div key={optionName}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {optionName}
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from(values).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }))
                  }
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    selectedOptions[optionName] === value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-500'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Quantity & Add to Cart */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              type="button"
              className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="flex-1 bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            disabled={adding || !inStock}
            onClick={handleAddToCart}
          >
            {!inStock ? 'Out of Stock' : adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
          </button>
        </div>

        {selectedVariant?.sku && (
          <p className="text-xs text-gray-400">SKU: {selectedVariant.sku}</p>
        )}
      </div>
    </div>
  )
}
