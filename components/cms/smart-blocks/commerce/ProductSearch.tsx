'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { SerializedProduct } from '@/lib/cms/block-editor/smart-blocks/commerce-data'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function ProductSearch({ block, data, className }: SmartBlockProps) {
  const allProducts = (data.products as SerializedProduct[] | undefined) || []
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const placeholder = block.attrs?.placeholder || 'Search products...'

  // Client-side filtering
  const results = query.trim().length >= 2
    ? allProducts.filter((p) => {
        const q = query.toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
        )
      }).slice(0, 8)
    : []

  const showResults = focused && query.trim().length >= 2

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setFocused(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const outer = className || block.className || 'relative w-full max-w-md'

  return (
    <div ref={wrapperRef} className={outer}>
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No products found for &quot;{query}&quot;
            </div>
          ) : (
            results.map((product) => {
              const image = product.images[0]
              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setFocused(false)}
                >
                  <div className="relative w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt || product.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(product.basePrice)}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
