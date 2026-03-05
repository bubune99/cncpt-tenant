'use client'

/**
 * ShopSection Smart Block
 *
 * A configurable "Shop Section" smart block that page builders can drop
 * into any CMS page. Renders an inline filterable product grid with
 * optional collection pre-filter, configurable product count, and
 * layout options.
 *
 * Unlike the full ShopPageLayout, this is designed to be embedded
 * within other page content (e.g., a homepage section, a landing page).
 */

import { useCallback, useEffect, useState } from 'react'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { CommerceProduct } from '@/lib/cms/commerce/types'
import type { PaginatedProducts, ProductSortKey } from '@/lib/cms/commerce/filters'
import { buildFilterParams } from '@/lib/cms/commerce/filters'
import { ProductCard } from '@/components/cms/shop/product-card'
import { cn } from '@/lib/utils'

export default function ShopSection({ block, data, className }: SmartBlockProps) {
  // Smart block data (server-rendered) can provide initial products
  const serverProducts = (data.products as CommerceProduct[] | undefined) || []

  // Config from block attributes/commerce
  const collection = block.commerce?.handle || block.attrs?.['data-collection'] || ''
  const maxProducts = (block.commerce?.limit ?? Number(block.attrs?.['data-max-products'])) || 12
  const showFilters = block.attrs?.['data-show-filters'] !== 'false'
  const columns = Number(block.attrs?.['data-columns']) || 4
  const heading = block.textContent || block.attrs?.['data-heading'] || ''
  const layout = block.attrs?.['data-layout'] || 'grid'

  // Client-side state for interactive filtering
  const [products, setProducts] = useState<CommerceProduct[]>(serverProducts)
  const [loading, setLoading] = useState(serverProducts.length === 0)
  const [activeSort, setActiveSort] = useState<ProductSortKey>('best-selling')

  // Fetch products client-side if no server data
  useEffect(() => {
    if (serverProducts.length > 0) return

    const params = buildFilterParams({
      collection: collection || undefined,
      limit: maxProducts,
      sort: activeSort,
    })

    setLoading(true)
    fetch(`/api/cms/shop/products?${params}`)
      .then((res) => res.json())
      .then((data: PaginatedProducts) => {
        setProducts(data.products)
        setLoading(false)
      })
      .catch((err) => {
        console.error('ShopSection fetch error:', err)
        setLoading(false)
      })
  }, [collection, maxProducts, activeSort, serverProducts.length])

  const handleSortChange = useCallback((sort: ProductSortKey) => {
    setActiveSort(sort)
    // Refetch with new sort
    const params = buildFilterParams({
      collection: collection || undefined,
      limit: maxProducts,
      sort,
    })

    setLoading(true)
    fetch(`/api/cms/shop/products?${params}`)
      .then((res) => res.json())
      .then((data: PaginatedProducts) => {
        setProducts(data.products)
        setLoading(false)
      })
      .catch((err) => {
        console.error('ShopSection fetch error:', err)
        setLoading(false)
      })
  }, [collection, maxProducts])

  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'

  const outer = className || block.className || 'py-8 sm:py-12'

  return (
    <section className={outer}>
      {/* Header with optional sort */}
      {(heading || showFilters) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          {heading && (
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {heading}
            </h2>
          )}
          {showFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <select
                value={activeSort}
                onChange={(e) => handleSortChange(e.target.value as ProductSortKey)}
                className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
              >
                <option value="best-selling">Best Selling</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Name: A-Z</option>
                <option value="title-desc">Name: Z-A</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className={cn('grid gap-4 sm:gap-6', gridClass)}>
          {Array.from({ length: Math.min(maxProducts, 8) }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden border border-border bg-card animate-pulse"
            >
              <div className="aspect-square bg-muted" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No products found
        </div>
      ) : (
        <div className={cn('grid gap-4 sm:gap-6', gridClass)}>
          {products.slice(0, maxProducts).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* View All link */}
      {products.length >= maxProducts && (
        <div className="mt-6 text-center">
          <a
            href={collection ? `/shop/collection/${collection}` : '/shop'}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All Products
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      )}
    </section>
  )
}
