'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { SerializedProduct } from '@/lib/cms/block-editor/smart-blocks/commerce-data'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function ProductGrid({ block, data, className }: SmartBlockProps) {
  const products = (data.products as SerializedProduct[] | undefined) || []
  const columns = Number(block.attrs?.['data-columns']) || 4

  if (products.length === 0) {
    return (
      <div className={className || block.className || 'py-12 text-center text-gray-500'}>
        No products found
      </div>
    )
  }

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  const outer = className || block.className || `grid ${gridClass} gap-6`

  return (
    <div className={outer.includes('grid') ? outer : `grid ${gridClass} gap-6 ${outer}`}>
      {products.map((product) => {
        const image = product.images[0]
        const hasDiscount =
          product.compareAtPrice != null && product.compareAtPrice > product.basePrice

        return (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className="group block rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
              {image ? (
                <Image
                  src={image.url}
                  alt={image.alt || product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  Sale
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {product.title}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(product.basePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
