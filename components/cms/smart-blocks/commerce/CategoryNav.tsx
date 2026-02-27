'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { SerializedCategory } from '@/lib/cms/block-editor/smart-blocks/commerce-data'

type Layout = 'horizontal' | 'vertical' | 'dropdown'

export default function CategoryNav({ block, data, className }: SmartBlockProps) {
  const categories = (data.categories as SerializedCategory[] | undefined) || []
  const layout = (block.attrs?.['data-layout'] as Layout) || 'horizontal'
  const showCount = block.attrs?.['data-show-count'] !== 'false'
  const activeSlug = block.attrs?.['data-active-slug'] || ''
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (categories.length === 0) {
    return null
  }

  const outer = className || block.className || ''

  if (layout === 'dropdown') {
    const active = categories.find((c) => c.slug === activeSlug)
    return (
      <div className={outer || 'relative inline-block'}>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-gray-500 transition-colors"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          {active?.name || 'All Categories'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            <Link
              href="/shop"
              className={`block px-4 py-2 text-sm hover:bg-gray-50 ${!activeSlug ? 'font-medium text-gray-900' : 'text-gray-600'}`}
              onClick={() => setDropdownOpen(false)}
            >
              All Categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/category/${cat.slug}`}
                className={`block px-4 py-2 text-sm hover:bg-gray-50 ${cat.slug === activeSlug ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                onClick={() => setDropdownOpen(false)}
              >
                {cat.name}
                {showCount && (
                  <span className="text-gray-400 ml-1">({cat.productCount})</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (layout === 'vertical') {
    return (
      <nav className={outer || 'space-y-1'}>
        <Link
          href="/shop"
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${!activeSlug ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop/category/${cat.slug}`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${cat.slug === activeSlug ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {cat.name}
            {showCount && (
              <span className="text-gray-400 ml-1">({cat.productCount})</span>
            )}
          </Link>
        ))}
      </nav>
    )
  }

  // horizontal (default)
  return (
    <nav className={outer || 'flex flex-wrap items-center gap-2'}>
      <Link
        href="/shop"
        className={`px-4 py-2 rounded-full text-sm transition-colors ${!activeSlug ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/shop/category/${cat.slug}`}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${cat.slug === activeSlug ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {cat.name}
          {showCount && (
            <span className="ml-1 opacity-60">({cat.productCount})</span>
          )}
        </Link>
      ))}
    </nav>
  )
}
