/**
 * Default Page Templates
 *
 * Returns Block[] arrays for shop pages when no CMS page template exists.
 * Each block has a unique ID, valid tag, and className fields.
 */

import type { Block } from '../types'

let counter = 0
function uid(): string {
  return `tmpl-${Date.now().toString(36)}-${(counter++).toString(36)}`
}

// ---------------------------------------------------------------------------
// Shop Listing Page — Hero + CategoryNav + ProductGrid
// ---------------------------------------------------------------------------

export function defaultShopPageBlocks(): Block[] {
  return [
    {
      id: uid(),
      tag: 'section',
      className: 'bg-gradient-to-b from-muted/50 to-background py-16 px-4 text-center',
      children: [
        {
          id: uid(),
          tag: 'h1',
          className: 'text-4xl md:text-5xl font-bold tracking-tight mb-4',
          textContent: 'Shop',
        },
        {
          id: uid(),
          tag: 'p',
          className: 'text-lg text-muted-foreground max-w-2xl mx-auto',
          textContent: 'Browse our collection of products',
        },
      ],
    },
    {
      id: uid(),
      tag: 'div',
      className: 'container mx-auto px-4 py-8',
      componentName: 'CategoryNav',
    },
    {
      id: uid(),
      tag: 'div',
      className: 'container mx-auto px-4 py-8',
      componentName: 'ProductGrid',
      commerce: {
        type: 'collection',
        limit: 12,
        sortKey: 'CREATED_AT',
        reverse: true,
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Product Detail Page — ProductDetail component
// ---------------------------------------------------------------------------

export function defaultProductDetailBlocks(productSlug: string): Block[] {
  return [
    {
      id: uid(),
      tag: 'div',
      className: 'container mx-auto px-4 py-12',
      componentName: 'ProductDetail',
      commerce: {
        type: 'product',
        handle: productSlug,
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Category Page — CategoryNav (active) + ProductGrid filtered by category
// ---------------------------------------------------------------------------

export function defaultCategoryPageBlocks(categorySlug: string): Block[] {
  return [
    {
      id: uid(),
      tag: 'div',
      className: 'container mx-auto px-4 py-8',
      componentName: 'CategoryNav',
      attrs: { 'data-active-slug': categorySlug },
    },
    {
      id: uid(),
      tag: 'div',
      className: 'container mx-auto px-4 py-8',
      componentName: 'ProductGrid',
      commerce: {
        type: 'collection',
        handle: categorySlug,
        limit: 12,
        sortKey: 'CREATED_AT',
        reverse: true,
      },
    },
  ]
}
